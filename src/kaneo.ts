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

	private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
		let res: Response;
		// Kaneo limits the request rate: wait and try again, up to four times.
		for (let attempt = 0; ; attempt++) {
			res = await this.fetchFn(`${this.base}/api${path}`, {
				method,
				headers: {
					authorization: `Bearer ${this.apiKey}`,
					...(body !== undefined ? { 'content-type': 'application/json' } : {})
				},
				body: body !== undefined ? JSON.stringify(body) : undefined
			});
			if (res.status !== 429 || attempt >= 4) break;
			const after = Number(res.headers.get('retry-after'));
			await Bun.sleep((after > 0 ? after : 2 ** attempt * 2) * 1000);
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

	project(id: string) {
		return this.call<KaneoProject>('GET', `/project/${encodeURIComponent(id)}`);
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
