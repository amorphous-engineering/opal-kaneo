/**
 * Issue and work order sync. OPAL owns its rules: a Kaneo change that OPAL
 * refuses is undone on the Kaneo task, with a comment that says why.
 *
 * Every pass compares each side with `pushed` (the fields as the plugin last saw
 * them on both sides). A side that differs from `pushed` changed since; OPAL wins
 * when both changed.
 */
import type { Client, contracts, Issue, IssueComment, ExecutionComment } from '@opal/shared';
import type { Kaneo, KaneoPriority, KaneoTask } from './kaneo.ts';
import type { Kind, Pushed, State, TaskRow } from './state.ts';

type Api = Client<typeof contracts>;

export interface Config {
	/** Kaneo project that gets every OPAL issue. Null: issues do not sync. */
	issueProject: string | null;
	/** Kaneo project that gets every OPAL work order. Null: work orders do not sync. */
	workOrderProject: string | null;
	issueColumns: Record<IssueState, string>;
	workOrderColumns: Record<WoState, string>;
	/** Base URL people use to open OPAL, for links in task descriptions. */
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

/** First line of a comment the plugin writes. Comments with it are never copied back. */
const MARK = /^\*\*[^*\n]+\*\* · (OPAL|Kaneo)\n/;
const marked = (who: string, from: 'OPAL' | 'Kaneo', body: string) => `**${who}** · ${from}\n\n${body}`;

const issueState = (i: Issue): IssueState => (i.status === 'void' ? 'void' : i.ticketState);

export class Sync {
	/** One pass per record at a time: events, webhooks and the poll can overlap. */
	private locks = new Map<string, Promise<unknown>>();

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

	private opalLink(path: string): string {
		return this.config.publicUrl ? `${this.config.publicUrl.replace(/\/+$/, '')}${path}` : '';
	}

	// ------------------------------------------------------------------ issues

	issue(id: number): Promise<void> {
		return this.locked(`issue:${id}`, () => this.issuePass(id));
	}

	private async issuePass(id: number): Promise<void> {
		const issue = await this.api.issues.get({ id });
		const projectId = this.config.issueProject;
		let row = this.state.get('issue', id);
		if (!row) {
			if (!projectId || issue.status === 'void') return;
			row = await this.createTask('issue', id, projectId, {
				title: `${issue.issueNumber} ${issue.title}`,
				priority: TO_KANEO_PRIORITY[issue.priority] ?? 'medium',
				status: this.config.issueColumns[issueState(issue)],
				description: this.describe(issue.description, `/issues/${id}`),
				label: issue.issueNumber
			});
		}
		await this.pullIssue(row, issue);
		await this.pushIssue(row, await this.api.issues.get({ id }));
		await this.comments(row);
	}

	/**
	 * Apply Kaneo changes to OPAL. Afterwards `pushed` holds what Kaneo shows now,
	 * so the push writes back every value OPAL did not take.
	 */
	private async pullIssue(row: TaskRow, issue: Issue): Promise<void> {
		const task = await this.kaneo.task(row.taskId);
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

	/** Write OPAL's values to Kaneo where they differ from what Kaneo has. */
	private async pushIssue(row: TaskRow, issue: Issue): Promise<void> {
		const want: Pushed = {
			title: `${issue.issueNumber} ${issue.title}`,
			priority: TO_KANEO_PRIORITY[issue.priority] ?? 'medium',
			status: this.config.issueColumns[issueState(issue)]
		};
		await this.push(row, want);
	}

	// -------------------------------------------------------------- work orders

	workOrder(id: number): Promise<void> {
		return this.locked(`wo:${id}`, () => this.woPass(id));
	}

	private async woPass(id: number): Promise<void> {
		const wo = await this.api.execution.get({ id });
		const projectId = this.config.workOrderProject;
		const number = wo.woNumber;
		const want: Pushed = {
			title: `${number} ${wo.procedureName}`,
			priority: TO_KANEO_PRIORITY[wo.priority] ?? 'medium',
			status: this.config.workOrderColumns[wo.status]
		};
		let row = this.state.get('wo', id);
		if (!row) {
			if (!projectId) return;
			row = await this.createTask('wo', id, projectId, {
				...want,
				description: this.describe(null, `/executions/${number}`),
				label: number
			});
		}
		// OPAL drives work order fields: a Kaneo edit is written back over.
		const task = await this.kaneo.task(row.taskId);
		row.pushed = { title: task.title, priority: task.priority, status: task.status };
		await this.push(row, want);
		await this.comments(row);
	}

	// ----------------------------------------------------------------- shared

	private describe(body: string | null, path: string): string {
		const link = this.opalLink(path);
		return [body ?? '', link ? `[Open in OPAL](${link})` : ''].filter(Boolean).join('\n\n');
	}

	private async createTask(
		kind: Kind,
		opalId: number,
		projectId: string,
		t: Pushed & { description: string; label: string }
	): Promise<TaskRow> {
		const project = await this.kaneo.project(projectId);
		const task = await this.kaneo.createTask(projectId, {
			title: t.title,
			description: t.description,
			priority: t.priority as KaneoPriority,
			status: t.status
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
			syncedAt: new Date().toISOString()
		};
		this.save(row);
		await this.api.plugins.links.set({
			entityType: kind === 'issue' ? 'issue' : 'execution',
			entityId: opalId,
			externalId: task.id,
			url,
			label: task.number != null ? `${project.slug}-${task.number}` : project.name
		});
		this.log(`created task ${task.id} for ${kind} ${t.label}`);
		return row;
	}

	private async push(row: TaskRow, want: Pushed): Promise<void> {
		if (want.title !== row.pushed.title) await this.kaneo.setTitle(row.taskId, want.title);
		if (want.priority !== row.pushed.priority) await this.kaneo.setPriority(row.taskId, want.priority as KaneoPriority);
		if (want.status !== row.pushed.status) await this.kaneo.setStatus(row.taskId, want.status);
		row.pushed = want;
		this.save(row);
	}

	/** Copy new comments both ways. Comments this plugin wrote carry MARK and stay put. */
	private async comments(row: TaskRow): Promise<void> {
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

	/** Start of the previous poll. Null: the first poll after start does a full pass. */
	private lastPoll: string | null = null;

	/**
	 * Every issue and work order. New records get a task. A record gets a pass
	 * only when OPAL, the Kaneo board or Kaneo comments changed, so a poll costs
	 * a few Kaneo calls, not some for each task.
	 */
	async all(): Promise<void> {
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

		const stale = (row: TaskRow | undefined, want: Pushed) => {
			if (!row || !since) return true;
			const t = board.get(row.taskId);
			const same = (a: Pushed, b: Pushed) => a.title === b.title && a.priority === b.priority && a.status === b.status;
			return commented.has(row.taskId) || !same(want, row.pushed) || (t !== undefined && !same(t, row.pushed));
		};

		let synced = 0;
		if (this.config.issueProject)
			for await (const i of pages((cursor) => this.api.issues.list({ cursor, limit: 200 }))) {
				const row = this.state.get('issue', i.id);
				const want: Pushed = {
					title: `${i.issueNumber} ${i.title}`,
					priority: TO_KANEO_PRIORITY[i.priority] ?? 'medium',
					status: this.config.issueColumns[issueState(i)]
				};
				if (row ? stale(row, want) : i.status !== 'void') {
					synced++;
					await this.guard(`issue ${i.issueNumber}`, () => this.issue(i.id));
				}
			}
		if (this.config.workOrderProject)
			for await (const w of pages((cursor) => this.api.execution.list({ cursor, limit: 200 }))) {
				const want: Pushed = {
					title: `${w.woNumber} ${w.procedureName}`,
					priority: TO_KANEO_PRIORITY[w.priority] ?? 'medium',
					status: this.config.workOrderColumns[w.status]
				};
				if (stale(this.state.get('wo', w.id), want)) {
					synced++;
					await this.guard(`work order ${w.woNumber}`, () => this.workOrder(w.id));
				}
			}
		this.log(`poll: ${synced} synced, ${board.size} Kaneo tasks read`);
	}

	async guard(what: string, fn: () => Promise<void>): Promise<void> {
		try {
			await fn();
		} catch (e) {
			this.log(`${what}: ${(e as Error).message}`);
		}
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
