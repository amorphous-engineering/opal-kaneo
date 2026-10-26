/**
 * Issue and work order sync. OPAL owns its rules: a Kaneo change that OPAL
 * refuses is undone on the Kaneo task, with a comment that says why.
 *
 * Every pass compares each side with `pushed` (the fields as the plugin last saw
 * them on both sides). A side that differs from `pushed` changed since; OPAL wins
 * when both changed.
 */
import type { Client, contracts, ExecutionComment, ExecutionRow, Issue, IssueComment } from '@opal/shared';
import { KaneoError, type Kaneo, type KaneoPriority, type KaneoTask } from './kaneo.ts';
import { emptyMeta, type Kind, type Pushed, type State, type TaskRow } from './state.ts';

type Api = Client<typeof contracts>;

export interface Config {
	/** Kaneo project that gets every OPAL issue. Null: issues do not sync. */
	issueProject: string | null;
	/** Kaneo project that gets every OPAL work order. Null: work orders do not sync. */
	workOrderProject: string | null;
	issueColumns: Record<IssueState, string>;
	workOrderColumns: Record<WoState, string>;
	/** Base URL people use to open OPAL, for the resource link on each task. */
	publicUrl: string | null;
}

export type IssueState = 'pending' | 'in_work' | 'in_review' | 'done' | 'void';
export type WoState = 'cut' | 'in_work' | 'completed' | 'aborted';

export const DEFAULT_ISSUE_COLUMNS: Record<IssueState, string> = {
	pending: 'to-do',
	in_work: 'in-progress',
	in_review: 'in-review',
	done: 'done',
	void: 'done'
};
export const DEFAULT_WO_COLUMNS: Record<WoState, string> = {
	cut: 'to-do',
	in_work: 'in-progress',
	completed: 'done',
	aborted: 'done'
};

const TO_KANEO_PRIORITY: Record<string, KaneoPriority> = {
	low: 'low',
	medium: 'medium',
	high: 'high',
	critical: 'urgent',
	normal: 'medium',
	urgent: 'urgent'
};
const TO_OPAL_PRIORITY: Partial<Record<KaneoPriority, Issue['priority']>> = {
	low: 'low',
	medium: 'medium',
	high: 'high',
	urgent: 'critical'
};

/** Labels the plugin sets. A template number (T-0003) gets the grey default. */
export const LABELS = { held: 'Held', issues: 'Issues', execution: 'Execution' } as const;
const LABEL_COLORS: Record<string, string> = { Held: '#ef4444', Issues: '#f59e0b', Execution: '#3b82f6' };
const labelColor = (name: string) => LABEL_COLORS[name] ?? '#6b7280';

/** First line of a comment the plugin writes. Comments with it are never copied back. */
const MARK = /^\*\*[^*\n]+\*\* · (OPAL|Kaneo)\n/;
const marked = (who: string, from: 'OPAL' | 'Kaneo', body: string) => `**${who}** · ${from}\n\n${body}`;

const issueState = (i: Issue): IssueState => (i.status === 'void' ? 'void' : i.ticketState);

/** Fields that only go from OPAL to Kaneo. */
export interface Extras {
	labels: string[];
	/** The work order whose task this one is a subtask of. */
	parentWo: number | null;
	resource: { url: string; title: string } | null;
	/** Null: the plugin does not manage the description. */
	description: string | null;
	due: string | null;
}

interface Want {
	pushed: Pushed;
	extras: Extras;
}

export class Sync {
	/** One pass per record at a time: events, webhooks and the poll can overlap. */
	private locks = new Map<string, Promise<unknown>>();
	/** Template number of each work order. It does not change. */
	private templates = new Map<number, string>();
	private running: Promise<void> | null = null;

	constructor(
		private api: Api,
		private kaneo: Kaneo,
		private state: State,
		private config: Config,
		private pluginUserId: number,
		private log: (...a: unknown[]) => void
	) {}

	private locked<T>(key: string, fn: () => Promise<T>): Promise<T> {
		const prev = this.locks.get(key) ?? Promise.resolve();
		const run = prev.then(fn, fn);
		const tail = run.catch(() => undefined);
		this.locks.set(key, tail);
		void tail.then(() => {
			if (this.locks.get(key) === tail) this.locks.delete(key);
		});
		return run;
	}

	private opalLink(path: string): string | null {
		return this.config.publicUrl ? `${this.config.publicUrl.replace(/\/+$/, '')}${path}` : null;
	}

	private resource(path: string, number: string): Extras['resource'] {
		const url = this.opalLink(path);
		return url ? { url, title: `${number} in OPAL` } : null;
	}

	private async template(executionId: number): Promise<string | null> {
		let t = this.templates.get(executionId);
		if (!t) {
			t = (await this.api.execution.get({ id: executionId })).procedureNumber;
			this.templates.set(executionId, t);
		}
		return t;
	}

	issueWant(i: Issue, template: string | null): Want {
		return {
			pushed: {
				title: `${i.issueNumber} ${i.title}`,
				priority: TO_KANEO_PRIORITY[i.priority] ?? 'medium',
				status: this.config.issueColumns[issueState(i)]
			},
			extras: {
				labels: i.executionId ? [LABELS.execution, ...(template ? [template] : [])] : [],
				parentWo: this.config.workOrderProject ? i.executionId : null,
				resource: this.resource(`/issues/${i.id}`, i.issueNumber),
				description: i.description ?? '',
				due: null
			}
		};
	}

	woWant(w: ExecutionRow, openIssues: number): Want {
		return {
			pushed: {
				title: `${w.woNumber} ${w.procedureName}`,
				priority: TO_KANEO_PRIORITY[w.priority] ?? 'medium',
				status: this.config.workOrderColumns[w.status]
			},
			extras: {
				labels: [...(w.heldBy.length ? [LABELS.held] : []), ...(openIssues ? [LABELS.issues] : [])],
				parentWo: null,
				resource: this.resource(`/executions/${w.id}`, w.woNumber),
				description: null,
				due: w.targetCompletionAt ? w.targetCompletionAt.slice(0, 10) : null
			}
		};
	}

	/** The task, or null when it is gone from Kaneo. */
	private async readTask(row: TaskRow): Promise<KaneoTask | null> {
		try {
			return await this.kaneo.task(row.taskId);
		} catch (e) {
			if (e instanceof KaneoError && e.status === 404) return null;
			throw e;
		}
	}

	/** A task deleted in Kaneo: drop it here, so the record gets a new task. OPAL is the source. */
	private async forget(row: TaskRow): Promise<void> {
		this.state.drop(row.kind, row.opalId);
		await this.api.plugins.links.remove({
			entityType: row.kind === 'issue' ? 'issue' : 'execution',
			entityId: row.opalId,
			externalId: row.taskId
		});
		this.log(`task ${row.taskId} is gone from Kaneo: ${row.kind} ${row.opalId} gets a new one`);
	}

	// ------------------------------------------------------------------ issues

	/** `fromPoll`: the poll syncs work orders itself, so the issue does not start one. */
	issue(id: number, fromPoll = false): Promise<void> {
		return this.locked(`issue:${id}`, () => this.issuePass(id, fromPoll));
	}

	private async issuePass(id: number, fromPoll: boolean): Promise<void> {
		const issue = await this.api.issues.get({ id });
		const projectId = this.config.issueProject;
		const template = issue.executionId ? await this.template(issue.executionId) : null;
		let row = this.state.get('issue', id);
		const task = row ? await this.readTask(row) : null;
		if (row && !task) {
			await this.forget(row);
			row = undefined;
		}
		if (!row || !task) {
			if (!projectId || issue.status === 'void') return;
			const want = this.issueWant(issue, template);
			row = await this.createTask('issue', id, projectId, want, issue.issueNumber);
			// A task made just now has nothing from Kaneo to read back.
			await this.comments(row, true);
			await this.extras(row, want.extras);
		} else {
			await this.pullIssue(row, issue, task);
			const want = this.issueWant(await this.api.issues.get({ id }), template);
			await this.push(row, want.pushed);
			await this.extras(row, want.extras);
			await this.comments(row);
		}
		// The work order's Issues label counts this issue.
		if (!fromPoll && issue.executionId && this.config.workOrderProject) await this.workOrder(issue.executionId);
	}

	/**
	 * Apply Kaneo changes to OPAL. Afterwards `pushed` holds what Kaneo shows now,
	 * so the push writes back every value OPAL did not take.
	 */
	private async pullIssue(row: TaskRow, issue: Issue, task: KaneoTask): Promise<void> {
		const prefix = `${issue.issueNumber} `;
		if (task.title !== row.pushed.title) {
			const title = task.title.startsWith(prefix) ? task.title.slice(prefix.length).trim() : task.title.trim();
			if (title && title !== issue.title) await this.api.issues.update({ id: issue.id, title });
		}
		if (task.priority !== row.pushed.priority) {
			// no-priority has no OPAL value: OPAL's priority goes back.
			const p = TO_OPAL_PRIORITY[task.priority];
			if (p && p !== issue.priority) await this.api.issues.update({ id: issue.id, priority: p });
		}
		if (task.status !== row.pushed.status) {
			const refused = await this.moveIssue(issue, task);
			if (refused) await this.kaneo.addComment(row.taskId, marked('OPAL', 'OPAL', refused));
		}
		row.pushed = { title: task.title, priority: task.priority, status: task.status };
		this.save(row);
	}

	/** Do the OPAL transition a Kaneo column move asks for. Returns why not, or null. */
	private async moveIssue(issue: Issue, task: KaneoTask): Promise<string | null> {
		const target = (Object.entries(this.config.issueColumns) as [IssueState, string][]).find(
			([state, col]) => col === task.status && state !== 'void'
		)?.[0];
		const from = issueState(issue);
		if (!target || target === from) return null;
		try {
			if (from === 'pending' && target === 'in_work') await this.api.issues.start({ id: issue.id });
			else if (from === 'in_work' && target === 'in_review') await this.api.issues.review({ id: issue.id });
			else if (from === 'in_review' && target === 'in_work')
				await this.api.issues.returnFromReview({ id: issue.id, comment: 'Moved back to work in Kaneo.' });
			else if (target === 'done') return `${issue.issueNumber} closes in OPAL only: sign-off needs a person.`;
			else return `${issue.issueNumber} cannot move from ${from} to ${target}.`;
			return null;
		} catch (e) {
			return `${issue.issueNumber} did not move: ${(e as Error).message}`;
		}
	}

	// -------------------------------------------------------------- work orders

	workOrder(id: number): Promise<void> {
		return this.locked(`wo:${id}`, () => this.woPass(id));
	}

	private async woPass(id: number, open?: number): Promise<void> {
		const wo = await this.api.execution.get({ id });
		this.templates.set(id, wo.procedureNumber);
		const openIssues = open ?? (await this.api.issues.list({ executionId: id, status: 'open', limit: 1 })).total;
		const want = this.woWant(wo, openIssues);
		const projectId = this.config.workOrderProject;
		let row = this.state.get('wo', id);
		const task = row ? await this.readTask(row) : null;
		if (row && !task) {
			await this.forget(row);
			row = undefined;
		}
		if (!row || !task) {
			if (!projectId) return;
			row = await this.createTask('wo', id, projectId, want, wo.woNumber);
			await this.comments(row, true);
		} else {
			// OPAL drives work order fields: a Kaneo edit is written back over.
			row.pushed = { title: task.title, priority: task.priority, status: task.status };
			await this.push(row, want.pushed);
			await this.comments(row);
		}
		await this.extras(row, want.extras);
	}

	// ----------------------------------------------------------------- shared

	private async createTask(kind: Kind, opalId: number, projectId: string, want: Want, number: string): Promise<TaskRow> {
		const project = await this.kaneo.project(projectId);
		const description = want.extras.description ?? '';
		const task = await this.kaneo.createTask(projectId, {
			title: want.pushed.title,
			description,
			priority: want.pushed.priority as KaneoPriority,
			status: want.pushed.status
		});
		const url = this.kaneo.taskUrl(task, project.workspaceId);
		const row: TaskRow = {
			kind,
			opalId,
			taskId: task.id,
			projectId,
			workspaceId: project.workspaceId,
			url,
			pushed: { title: task.title, priority: task.priority, status: task.status },
			lastOpalComment: 0,
			syncedAt: new Date().toISOString(),
			meta: { ...emptyMeta(), description: want.extras.description === null ? null : description }
		};
		this.save(row);
		await this.api.plugins.links.set({
			entityType: kind === 'issue' ? 'issue' : 'execution',
			entityId: opalId,
			externalId: task.id,
			url,
			label: task.number != null ? `${project.slug}-${task.number}` : project.name
		});
		this.log(`created task ${task.id} for ${kind} ${number}`);
		return row;
	}

	private async push(row: TaskRow, want: Pushed): Promise<void> {
		if (want.title !== row.pushed.title) await this.kaneo.setTitle(row.taskId, want.title);
		if (want.priority !== row.pushed.priority) await this.kaneo.setPriority(row.taskId, want.priority as KaneoPriority);
		if (want.status !== row.pushed.status) await this.kaneo.setStatus(row.taskId, want.status);
		row.pushed = want;
		this.save(row);
	}

	/** Kaneo task of a work order, made first when it has none. */
	private async woTask(id: number): Promise<string | null> {
		const have = this.state.get('wo', id);
		if (have) return have.taskId;
		await this.workOrder(id);
		return this.state.get('wo', id)?.taskId ?? null;
	}

	/** Write the one-way fields that differ from what the plugin last wrote. */
	private async extras(row: TaskRow, e: Extras): Promise<void> {
		const m = row.meta;
		for (const name of e.labels) {
			if (m.labels[name]) continue;
			m.labels[name] = (await this.kaneo.addLabel(row.workspaceId, row.taskId, name, labelColor(name))).id;
			this.save(row);
		}
		for (const [name, id] of Object.entries(m.labels)) {
			if (e.labels.includes(name)) continue;
			await gone(this.kaneo.deleteLabel(id));
			delete m.labels[name];
			this.save(row);
		}
		const parent = e.parentWo ? await this.woTask(e.parentWo) : null;
		if ((m.parent?.taskId ?? null) !== parent) {
			if (m.parent) await gone(this.kaneo.deleteRelation(m.parent.relationId));
			m.parent = parent ? { taskId: parent, relationId: (await this.kaneo.addSubtask(parent, row.taskId)).id } : null;
			this.save(row);
		}
		if (e.resource && m.resource !== e.resource.url) {
			await this.kaneo.addResource(row.taskId, e.resource.url, e.resource.title);
			m.resource = e.resource.url;
			this.save(row);
		}
		if (e.description !== null && m.description !== e.description) {
			await this.kaneo.setDescription(row.taskId, e.description);
			m.description = e.description;
			this.save(row);
		}
		if (e.due && m.due !== e.due) {
			await this.kaneo.setDueDate(row.taskId, e.due);
			m.due = e.due;
			this.save(row);
		}
	}

	/** True when the one-way fields differ from what the plugin last wrote. */
	private extrasStale(row: TaskRow, e: Extras): boolean {
		const m = row.meta;
		const labels = Object.keys(m.labels);
		if (labels.length !== e.labels.length || e.labels.some((l) => !m.labels[l])) return true;
		const parent = e.parentWo ? (this.state.get('wo', e.parentWo)?.taskId ?? 'missing') : null;
		if ((m.parent?.taskId ?? null) !== parent) return true;
		if (e.resource && m.resource !== e.resource.url) return true;
		if (e.description !== null && m.description !== e.description) return true;
		return !!e.due && m.due !== e.due;
	}

	/** Copy new comments both ways. Comments this plugin wrote carry MARK and stay put. */
	private async comments(row: TaskRow, fresh = false): Promise<void> {
		const opal: (IssueComment | ExecutionComment)[] =
			row.kind === 'issue'
				? await this.api.issues.listComments({ id: row.opalId })
				: await this.api.execution.listComments({ id: row.opalId });
		for (const c of opal) {
			if (c.id <= row.lastOpalComment) continue;
			const author = 'user' in c ? c.user : c.author;
			if (author?.id !== this.pluginUserId && !MARK.test(c.body)) {
				const sent = await this.kaneo.addComment(row.taskId, marked(author?.name ?? 'OPAL', 'OPAL', c.body));
				this.state.markSeen(row.taskId, sent.id);
			}
			row.lastOpalComment = c.id;
			this.save(row);
		}
		if (fresh) return;
		for (const k of await this.kaneo.comments(row.taskId)) {
			if (this.state.seen(row.taskId, k.id)) continue;
			this.state.markSeen(row.taskId, k.id);
			if (MARK.test(k.content)) continue;
			const body = marked(k.user?.name ?? 'Kaneo', 'Kaneo', k.content);
			const made =
				row.kind === 'issue'
					? await this.api.issues.addComment({ id: row.opalId, body })
					: await this.api.execution.addComment({ id: row.opalId, body });
			// The plugin wrote it: never copy it back.
			row.lastOpalComment = Math.max(row.lastOpalComment, made.id);
			this.save(row);
		}
	}

	private save(row: TaskRow): void {
		row.syncedAt = new Date().toISOString();
		this.state.save(row);
	}

	/** A webhook names a task: sync the record it belongs to. */
	async task(taskId: string): Promise<void> {
		const row = this.state.byTask(taskId);
		if (!row) return;
		await (row.kind === 'issue' ? this.issue(row.opalId) : this.workOrder(row.opalId));
	}

	/** Start of the previous poll. Null: the next poll does a full pass. */
	private lastPoll: string | null = null;

	/**
	 * Every issue and work order. New records get a task. A record gets a pass
	 * only when OPAL, the Kaneo board or Kaneo comments changed, so a poll costs
	 * a few Kaneo calls, not some for each task. `full` passes every record.
	 * A poll that starts while one runs waits for it.
	 */
	all(full = false): Promise<void> {
		if (this.running) return this.running;
		if (full) this.lastPoll = null;
		this.running = this.poll().finally(() => (this.running = null));
		return this.running;
	}

	/** True while a poll or a full sync runs. */
	get busy(): boolean {
		return this.running !== null;
	}

	private async poll(): Promise<void> {
		const since = this.lastPoll;
		this.lastPoll = new Date().toISOString();
		const kaneoIds = new Set([this.config.issueProject, this.config.workOrderProject].filter((p): p is string => !!p));
		const board = new Map<string, KaneoTask>();
		const workspaces = new Set<string>();
		for (const id of kaneoIds) {
			for (const [taskId, t] of await this.kaneo.board(id)) board.set(taskId, t);
			workspaces.add((await this.kaneo.project(id)).workspaceId);
		}
		const commented = new Set<string>();
		if (since)
			for (const ws of workspaces)
				for (const a of await this.kaneo.activity(ws))
					if (a.type === 'comment' && a.createdAt > since) commented.add(a.taskId);

		const stale = (row: TaskRow, want: Want) => {
			if (!since) return true;
			const t = board.get(row.taskId);
			// Gone from its board: the pass sees the 404 and makes a new task.
			if (!t && kaneoIds.has(row.projectId)) return true;
			const same = (a: Pushed, b: Pushed) => a.title === b.title && a.priority === b.priority && a.status === b.status;
			return (
				commented.has(row.taskId) ||
				!same(want.pushed, row.pushed) ||
				(t !== undefined && !same(t, row.pushed)) ||
				this.extrasStale(row, want.extras)
			);
		};

		// OPAL lists first: work order labels count open issues, issue labels name templates.
		const wos: ExecutionRow[] = [];
		for await (const w of pages((cursor) => this.api.execution.list({ cursor, limit: 200 }))) wos.push(w);
		const issues: Issue[] = [];
		for await (const i of pages((cursor) => this.api.issues.list({ cursor, limit: 200 }))) issues.push(i);
		for (const w of wos) this.templates.set(w.id, w.procedureNumber);
		const open = new Map<number, number>();
		for (const i of issues)
			if (i.status === 'open' && i.executionId) open.set(i.executionId, (open.get(i.executionId) ?? 0) + 1);

		let synced = 0;
		// Work orders first, so issues find their parent task.
		if (this.config.workOrderProject)
			for (const w of wos) {
				const row = this.state.get('wo', w.id);
				const want = this.woWant(w, open.get(w.id) ?? 0);
				if (row && !stale(row, want)) continue;
				synced++;
				await this.guard(`work order ${w.woNumber}`, () =>
					this.locked(`wo:${w.id}`, () => this.woPass(w.id, open.get(w.id) ?? 0))
				);
			}
		if (this.config.issueProject)
			for (const i of issues) {
				const row = this.state.get('issue', i.id);
				const want = this.issueWant(i, i.executionId ? (this.templates.get(i.executionId) ?? null) : null);
				if (row ? !stale(row, want) : i.status === 'void') continue;
				synced++;
				await this.guard(`issue ${i.issueNumber}`, () => this.issue(i.id, true));
			}
		this.log(`${since ? 'poll' : 'full sync'}: ${synced} synced, ${board.size} Kaneo tasks read`);
	}

	async guard(what: string, fn: () => Promise<void>): Promise<void> {
		try {
			await fn();
		} catch (e) {
			this.log(`${what}: ${(e as Error).message}`);
		}
	}
}

/** Delete calls: a thing already gone is fine. */
async function gone(p: Promise<unknown>): Promise<void> {
	try {
		await p;
	} catch (e) {
		if (!(e instanceof KaneoError && e.status === 404)) throw e;
	}
}

async function* pages<T>(
	get: (cursor: string | undefined) => Promise<{ items: T[]; next: string | null }>
): AsyncGenerator<T> {
	let cursor: string | undefined;
	do {
		const page = await get(cursor);
		yield* page.items;
		cursor = page.next ?? undefined;
	} while (cursor);
}
