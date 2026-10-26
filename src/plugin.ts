/**
 * Kaneo plugin: OPAL issues ↔ Kaneo tasks, OPAL work orders → Kaneo tasks, and
 * comments both ways. OPAL events and Kaneo webhooks start a sync of one record.
 * The poll catches anything an event or webhook missed.
 */
import { definePlugin, html, panelPage, verifyHmac, type Context, type PluginContext } from '@opal/plugin-sdk';
import { Kaneo } from './kaneo.ts';
import { State } from './state.ts';
import { DEFAULT_ISSUE_COLUMNS, DEFAULT_WO_COLUMNS, Sync, type Config } from './sync.ts';

let sync: Sync | null = null;
let state: State | null = null;
let kaneo: Kaneo | null = null;

function json<T>(v: unknown, fallback: T): T {
	if (v == null || v === '') return fallback;
	if (typeof v === 'object') return v as T;
	try {
		return JSON.parse(String(v)) as T;
	} catch {
		return fallback;
	}
}

function configOf(s: Record<string, unknown>): Config {
	const columns = json<{ issue?: Partial<Config['issueColumns']>; workOrder?: Partial<Config['workOrderColumns']> }>(
		s.statusColumns,
		{}
	);
	return {
		issueProject: typeof s.issueProject === 'string' && s.issueProject ? s.issueProject : null,
		workOrderProject: typeof s.workOrderProject === 'string' && s.workOrderProject ? s.workOrderProject : null,
		issueColumns: { ...DEFAULT_ISSUE_COLUMNS, ...columns.issue },
		workOrderColumns: { ...DEFAULT_WO_COLUMNS, ...columns.workOrder },
		publicUrl: typeof s.publicUrl === 'string' && s.publicUrl ? s.publicUrl : null
	};
}

/** Point each mapped Kaneo project's webhook at this plugin. Needs a public OPAL URL and a secret. */
async function registerWebhooks(ctx: PluginContext, config: Config): Promise<void> {
	const secret = ctx.settings.webhookSecret;
	if (!config.publicUrl || typeof secret !== 'string' || !secret || !kaneo) return;
	const url = `${config.publicUrl.replace(/\/+$/, '')}/hooks/${ctx.id}/task`;
	const projects = new Set([config.issueProject, config.workOrderProject].filter((p): p is string => !!p));
	for (const p of projects) {
		try {
			await kaneo.setWebhook(p, url, secret);
			ctx.log(`webhook set on Kaneo project ${p}`);
		} catch (e) {
			ctx.log(`webhook on Kaneo project ${p}: ${(e as Error).message}`);
		}
	}
}

const ISSUE_ENTITIES = new Set(['issue', 'issue_comment']);
const WO_ENTITIES = new Set(['execution', 'execution_comment']);

export default definePlugin({
	async start(ctx) {
		const config = configOf(ctx.settings);
		kaneo = new Kaneo(String(ctx.settings.url), String(ctx.settings.apiKey));
		state = new State(ctx.dataDir);
		const me = await ctx.api.auth.me({});
		sync = new Sync(ctx.api, kaneo, state, config, me.id, ctx.log);
		await registerWebhooks(ctx, config);
	},

	events: {
		async record_changed(event) {
			const d = event.data as { entity?: string; id?: number; refs?: Record<string, number> };
			if (!sync || !d.entity || !d.id) return;
			if (ISSUE_ENTITIES.has(d.entity)) {
				const id = d.entity === 'issue' ? d.id : d.refs?.issueId;
				if (id) await sync.guard(`issue ${id}`, () => sync!.issue(id));
			} else if (WO_ENTITIES.has(d.entity)) {
				const id = d.entity === 'execution' ? d.id : d.refs?.executionId;
				if (id) await sync.guard(`work order ${id}`, () => sync!.workOrder(id));
			}
		}
	},

	reconcile: {
		everyMinutes: 5,
		async run() {
			await sync?.all();
		}
	},

	routes(app, ctx) {
		app.post('/hooks/task', async (c) => {
			const secret = ctx.settings.webhookSecret;
			const body = await c.req.text();
			if (typeof secret !== 'string' || !secret || !verifyHmac(secret, body, c.req.header('x-kaneo-signature'))) {
				return c.json({ error: 'bad signature' }, 401);
			}
			const taskId = (JSON.parse(body) as { task?: { id?: string } }).task?.id;
			if (taskId && sync) void sync.guard(`task ${taskId}`, () => sync!.task(taskId));
			return c.json({ ok: true });
		});

		const panel = (kind: 'issue' | 'wo', param: string) => async (c: Context) => {
			const id = Number(c.req.query(param));
			const theme = c.req.query('theme');
			const row = state?.get(kind, id);
			const body = row
				? html`<table>
						<tr><th>Task</th><td><a class="mono" href="${row.url}" target="_blank" rel="noopener">${row.pushed.title}</a></td></tr>
						<tr><th>Column</th><td class="mono">${row.pushed.status}</td></tr>
						<tr><th>Priority</th><td class="mono">${row.pushed.priority}</td></tr>
						<tr><th>Synced</th><td class="mono">${row.syncedAt.slice(0, 16).replace('T', ' ')} UTC</td></tr>
					</table>
					<p><button id="sync">SYNC</button></p>`
				: html`<p class="muted">No task.</p><p><button id="sync">SYNC</button></p>`;
			const script = html`<script>
				document.getElementById('sync').onclick = async (e) => {
					e.target.disabled = true;
					await window.opal.fetch('/sync?${param}=${String(id)}', { method: 'POST' });
					location.reload();
				};
			</script>`;
			return c.html(panelPage({ title: 'Kaneo', theme, body: html`${body}${script}` }));
		};
		app.get('/panel/issue', panel('issue', 'issue'));
		app.get('/panel/execution', panel('wo', 'execution'));

		// The settings form offers these in its project dropdowns. Kept for 5 minutes:
		// the form can ask while the first poll uses up Kaneo's request rate.
		let cached: { at: number; items: { value: string; label: string }[] } | null = null;
		app.get('/options/projects', async (c) => {
			if (!kaneo) return c.json({ error: 'not started' }, 503);
			if (!cached || Date.now() - cached.at > 300_000) {
				try {
					const spaces = await kaneo.workspaces();
					const items: { value: string; label: string }[] = [];
					for (const w of spaces)
						for (const p of await kaneo.projects(w.id))
							items.push({ value: p.id, label: `${spaces.length > 1 ? `${w.name} / ` : ''}${p.name} (${p.slug})` });
					items.sort((a, b) => a.label.localeCompare(b.label));
					cached = { at: Date.now(), items };
				} catch (e) {
					ctx.log(`project options: ${(e as Error).message}`);
					if (!cached) return c.json({ error: 'Kaneo did not answer' }, 502);
				}
			}
			return c.json({ items: cached.items });
		});

		app.post('/sync', async (c) => {
			if (!sync) return c.json({ error: 'not started' }, 503);
			const issue = Number(c.req.query('issue'));
			const wo = Number(c.req.query('execution'));
			if (issue) await sync.guard(`issue ${issue}`, () => sync!.issue(issue));
			if (wo) await sync.guard(`work order ${wo}`, () => sync!.workOrder(wo));
			return c.json({ ok: true });
		});
	}
});
