/**
 * What the plugin remembers between runs, in <OPAL_PLUGIN_DATA>/kaneo.db: which
 * Kaneo task belongs to which OPAL record, what the plugin last wrote to it, and
 * which comments it already copied.
 */
import { Database } from 'bun:sqlite';
import { join } from 'node:path';

export type Kind = 'issue' | 'wo';

export interface Pushed {
	title: string;
	priority: string;
	status: string;
}

export interface TaskRow {
	kind: Kind;
	opalId: number;
	taskId: string;
	projectId: string;
	workspaceId: string;
	url: string;
	/** The fields as the plugin last saw them on both sides. */
	pushed: Pushed;
	/** Newest OPAL comment id already copied to Kaneo (or written by this plugin). */
	lastOpalComment: number;
	syncedAt: string;
	/** What the plugin last wrote that only goes from OPAL to Kaneo. */
	meta: Meta;
}

/** One-way fields, as written to Kaneo. */
export interface Meta {
	/** Label name → Kaneo label id. Kaneo labels belong to one task each. */
	labels: Record<string, string>;
	/** The work order task this task is a subtask of, and the Kaneo relation. */
	parent: { taskId: string; relationId: string } | null;
	/** OPAL link added as a resource. */
	resource: string | null;
	description: string | null;
	due: string | null;
}

export const emptyMeta = (): Meta => ({ labels: {}, parent: null, resource: null, description: null, due: null });

interface RawRow {
	kind: Kind;
	opal_id: number;
	task_id: string;
	project_id: string;
	workspace_id: string;
	url: string;
	pushed: string;
	last_opal_comment: number;
	synced_at: string;
	meta: string | null;
}

const fromRaw = (r: RawRow): TaskRow => ({
	kind: r.kind,
	opalId: r.opal_id,
	taskId: r.task_id,
	projectId: r.project_id,
	workspaceId: r.workspace_id,
	url: r.url,
	pushed: JSON.parse(r.pushed) as Pushed,
	lastOpalComment: r.last_opal_comment,
	syncedAt: r.synced_at,
	meta: { ...emptyMeta(), ...(r.meta ? (JSON.parse(r.meta) as Partial<Meta>) : {}) }
});

export class State {
	private db: Database;

	constructor(dir: string) {
		this.db = new Database(join(dir, 'kaneo.db'), { create: true, strict: true });
		this.db.run('PRAGMA journal_mode = WAL');
		this.db.run(`CREATE TABLE IF NOT EXISTS task (
			kind TEXT NOT NULL, opal_id INTEGER NOT NULL, task_id TEXT NOT NULL UNIQUE,
			project_id TEXT NOT NULL, workspace_id TEXT NOT NULL, url TEXT NOT NULL,
			pushed TEXT NOT NULL, last_opal_comment INTEGER NOT NULL DEFAULT 0, synced_at TEXT NOT NULL,
			PRIMARY KEY (kind, opal_id))`);
		// Added in 0.4.0: tasks made earlier start with an empty meta and get it on their next pass.
		const cols = this.db.query<{ name: string }, []>('PRAGMA table_info(task)').all();
		if (!cols.some((c) => c.name === 'meta')) this.db.run('ALTER TABLE task ADD COLUMN meta TEXT');
		this.db.run(`CREATE TABLE IF NOT EXISTS seen_comment (
			task_id TEXT NOT NULL, comment_id TEXT NOT NULL, PRIMARY KEY (task_id, comment_id))`);
	}

	get(kind: Kind, opalId: number): TaskRow | undefined {
		const r = this.db.query<RawRow, [Kind, number]>('SELECT * FROM task WHERE kind = ? AND opal_id = ?').get(kind, opalId);
		return r ? fromRaw(r) : undefined;
	}

	byTask(taskId: string): TaskRow | undefined {
		const r = this.db.query<RawRow, [string]>('SELECT * FROM task WHERE task_id = ?').get(taskId);
		return r ? fromRaw(r) : undefined;
	}

	all(kind?: Kind): TaskRow[] {
		const rows = kind
			? this.db.query<RawRow, [Kind]>('SELECT * FROM task WHERE kind = ?').all(kind)
			: this.db.query<RawRow, []>('SELECT * FROM task').all();
		return rows.map(fromRaw);
	}

	save(row: TaskRow): void {
		this.db
			.query(
				`INSERT INTO task (kind, opal_id, task_id, project_id, workspace_id, url, pushed, last_opal_comment, synced_at, meta)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT (kind, opal_id) DO UPDATE SET task_id = excluded.task_id, project_id = excluded.project_id,
				 workspace_id = excluded.workspace_id, url = excluded.url, pushed = excluded.pushed,
				 last_opal_comment = excluded.last_opal_comment, synced_at = excluded.synced_at, meta = excluded.meta`
			)
			.run(
				row.kind,
				row.opalId,
				row.taskId,
				row.projectId,
				row.workspaceId,
				row.url,
				JSON.stringify(row.pushed),
				row.lastOpalComment,
				row.syncedAt,
				JSON.stringify(row.meta)
			);
	}

	drop(kind: Kind, opalId: number): void {
		this.db.query('DELETE FROM task WHERE kind = ? AND opal_id = ?').run(kind, opalId);
	}

	seen(taskId: string, commentId: string): boolean {
		return !!this.db.query('SELECT 1 FROM seen_comment WHERE task_id = ? AND comment_id = ?').get(taskId, commentId);
	}

	markSeen(taskId: string, commentId: string): void {
		this.db.query('INSERT OR IGNORE INTO seen_comment (task_id, comment_id) VALUES (?, ?)').run(taskId, commentId);
	}
}
