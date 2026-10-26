/** The part of the Kaneo REST API this plugin uses. Auth: `Authorization: Bearer <API key>`. */

export const KANEO_PRIORITIES = ['no-priority', 'low', 'medium', 'high', 'urgent'] as const;
export type KaneoPriority = (typeof KANEO_PRIORITIES)[number];

export interface KaneoTask {
	id: string;
	projectId: string;
	number: number | null;
	title: string;
	description: string | null;
	/** Slug of the column the task is in. */
	status: string;
	priority: KaneoPriority;
	workspaceId?: string;
}

export interface KaneoComment {
	id: string;
	taskId: string;
	userId: string;
	content: string;
	createdAt: string;
	user?: { name?: string | null } | null;
}

export interface KaneoProject {
	id: string;
	name: string;
	slug: string;
	workspaceId: string;
}

export interface KaneoColumn {
	id: string;
	name: string;
	slug: string;
	isFinal: boolean;
}

export class KaneoError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

export class Kaneo {
	private readonly base: string;

	constructor(
		url: string,
		private readonly apiKey: string,
		private readonly fetchFn: typeof fetch = fetch
	) {
		this.base = url.replace(/\/+$/, '');
	}

	/**
	 * Kaneo allows a fixed number of requests per window for each API key (100 a
	 * minute) and sends what is left. Calls go one at a time, and wait for the next
	 * window when the budget is used, so a backfill never stalls on 429 backoff.
	 */
	private queue: Promise<unknown> = Promise.resolve();
	private remaining = Infinity;
	private resetAt = 0;

	private call<T>(method: string, path: string, body?: unknown): Promise<T> {
		const run = this.queue.then(() => this.send<T>(method, path, body));
		this.queue = run.catch(() => undefined);
		return run;
	}

	private async waitForBudget(): Promise<void> {
		if (this.remaining > 1) return;
		const wait = this.resetAt - Date.now();
		if (wait > 0) await Bun.sleep(Math.min(wait + 500, 120_000));
		this.remaining = Infinity;
	}

	private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
		let res: Response;
		for (let attempt = 0; ; attempt++) {
			await this.waitForBudget();
			res = await this.fetchFn(`${this.base}/api${path}`, {
				method,
				headers: {
					authorization: `Bearer ${this.apiKey}`,
					...(body !== undefined ? { 'content-type': 'application/json' } : {})
				},
				body: body !== undefined ? JSON.stringify(body) : undefined
			});
			const left = Number(res.headers.get('x-ratelimit-remaining'));
			const reset = Number(res.headers.get('x-ratelimit-reset'));
			if (res.headers.has('x-ratelimit-remaining') && Number.isFinite(left)) this.remaining = left;
			if (reset > 0) this.resetAt = reset * 1000;
			if (res.status !== 429 || attempt >= 4) break;
			const after = Number(res.headers.get('retry-after'));
			if (after > 0) this.resetAt = Math.max(this.resetAt, Date.now() + after * 1000);
			else if (!(reset > 0)) this.resetAt = Date.now() + 2 ** attempt * 2000;
			this.remaining = 0;
		}
		const text = await res.text();
		if (!res.ok) throw new KaneoError(res.status, `Kaneo ${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
		return (text ? JSON.parse(text) : null) as T;
	}

	/** Browser link to a task. */
	taskUrl(task: Pick<KaneoTask, 'id' | 'projectId'>, workspaceId: string): string {
		return `${this.base}/dashboard/workspace/${workspaceId}/project/${task.projectId}/task/${task.id}`;
	}

	workspaces() {
		return this.call<{ id: string; name: string }[]>('GET', '/workspace');
	}

	projects(workspaceId: string) {
		return this.call<KaneoProject[]>('GET', `/project?workspaceId=${encodeURIComponent(workspaceId)}`);
	}

	private projectCache = new Map<string, Promise<KaneoProject>>();

	/** A project does not move between workspaces often: one read per run. */
	project(id: string) {
		let p = this.projectCache.get(id);
		if (!p) {
			p = this.call<KaneoProject>('GET', `/project/${encodeURIComponent(id)}`);
			p.catch(() => this.projectCache.delete(id));
			this.projectCache.set(id, p);
		}
		return p;
	}

	columns(projectId: string) {
		return this.call<KaneoColumn[]>('GET', `/column/${encodeURIComponent(projectId)}`);
	}

	task(id: string) {
		return this.call<KaneoTask>('GET', `/task/${encodeURIComponent(id)}`);
	}

	createTask(projectId: string, t: { title: string; description: string; priority: KaneoPriority; status: string }) {
		return this.call<KaneoTask>('POST', `/task/${encodeURIComponent(projectId)}`, t);
	}

	setStatus(id: string, status: string) {
		return this.call<KaneoTask>('PUT', `/task/status/${encodeURIComponent(id)}`, { status });
	}

	setTitle(id: string, title: string) {
		return this.call<KaneoTask>('PUT', `/task/title/${encodeURIComponent(id)}`, { title });
	}

	setPriority(id: string, priority: KaneoPriority) {
		return this.call<KaneoTask>('PUT', `/task/priority/${encodeURIComponent(id)}`, { priority });
	}

	setDescription(id: string, description: string) {
		return this.call<KaneoTask>('PUT', `/task/description/${encodeURIComponent(id)}`, { description });
	}

	/** Every task of a project (board, planned and archived), by id. */
	async board(projectId: string): Promise<Map<string, KaneoTask>> {
		type Page = {
			data: { columns?: { tasks?: KaneoTask[] }[]; plannedTasks?: KaneoTask[]; archivedTasks?: KaneoTask[] };
			pagination?: { totalPages?: number };
		};
		const out = new Map<string, KaneoTask>();
		for (let page = 1; ; page++) {
			const p = await this.call<Page>('GET', `/task/tasks/${encodeURIComponent(projectId)}?page=${page}&limit=100`);
			const all = [...(p.data.columns ?? []).flatMap((c) => c.tasks ?? []), ...(p.data.plannedTasks ?? []), ...(p.data.archivedTasks ?? [])];
			for (const t of all) out.set(t.id, t);
			if (page >= (p.pagination?.totalPages ?? 1)) return out;
		}
	}

	/** Recent activity of a workspace, newest first. */
	activity(workspaceId: string) {
		return this.call<{ id: string; type: string; createdAt: string; taskId: string }[]>(
			'GET',
			`/activity/workspace/${encodeURIComponent(workspaceId)}`
		);
	}

	comments(taskId: string) {
		return this.call<KaneoComment[]>('GET', `/comment/${encodeURIComponent(taskId)}`);
	}

	addComment(taskId: string, content: string) {
		return this.call<KaneoComment>('POST', `/comment/${encodeURIComponent(taskId)}`, { content });
	}

	/** Create or replace the project's outgoing webhook. */
	setWebhook(projectId: string, webhookUrl: string, secret: string) {
		return this.call<unknown>('POST', `/generic-webhook-integration/project/${encodeURIComponent(projectId)}`, {
			webhookUrl,
			secret,
			events: {
				taskStatusChanged: true,
				taskPriorityChanged: true,
				taskTitleChanged: true,
				taskCommentCreated: true,
				taskDeleted: true
			}
		});
	}
}
