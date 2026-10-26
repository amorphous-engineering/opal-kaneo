import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { KaneoComment, KaneoTask } from '../src/kaneo.ts';
import { State } from '../src/state.ts';
import { DEFAULT_ISSUE_COLUMNS, DEFAULT_WO_COLUMNS, Sync, type Config } from '../src/sync.ts';

const PLUGIN_USER = 99;

/** In-memory Kaneo with the methods Sync calls. */
function fakeKaneo() {
	const tasks = new Map<string, KaneoTask>();
	const notes = new Map<string, KaneoComment[]>();
	let n = 0;
	const k = {
		tasks,
		notes,
		taskUrl: (t: { id: string }) => `https://kaneo.test/task/${t.id}`,
		project: async (id: string) => ({ id, name: 'Test', slug: 'TST', workspaceId: 'ws' }),
		taskReads: 0,
		task: async (id: string) => {
			k.taskReads++;
			return { ...tasks.get(id)! };
		},
		board: async (projectId: string) => new Map([...tasks].filter(([, t]) => t.projectId === projectId).map(([id, t]) => [id, { ...t }])),
		activity: async () => [] as { id: string; type: string; createdAt: string; taskId: string }[],
		createTask: async (projectId: string, t: { title: string; description: string; priority: string; status: string }) => {
			const task = { id: `t${++n}`, projectId, number: n, title: t.title, description: t.description, status: t.status, priority: t.priority } as KaneoTask;
			tasks.set(task.id, task);
			notes.set(task.id, []);
			return { ...task };
		},
		setStatus: async (id: string, status: string) => Object.assign(tasks.get(id)!, { status }),
		setTitle: async (id: string, title: string) => Object.assign(tasks.get(id)!, { title }),
		setPriority: async (id: string, priority: string) => Object.assign(tasks.get(id)!, { priority }),
		comments: async (id: string) => [...notes.get(id)!],
		addComment: async (taskId: string, content: string) => {
			const c = { id: `c${++n}`, taskId, userId: 'u', content, createdAt: '', user: { name: 'Key Owner' } };
			notes.get(taskId)!.push(c);
			return c;
		}
	};
	return k;
}

/** In-memory OPAL with one issue and one work order, and the transition rules Sync relies on. */
function fakeOpal() {
	const issue = {
		id: 4,
		issueNumber: 'IT-0004',
		projectCode: 'MOJ',
		title: 'Leak at flange',
		description: 'Seen at OP 6.',
		status: 'open' as 'open' | 'closed' | 'void',
		ticketState: 'pending' as 'pending' | 'in_work' | 'in_review' | 'done',
		priority: 'high' as string
	};
	const wo = { id: 2, woNumber: 'WO-0002', projectCode: 'MOJ', procedureName: 'Assembly', status: 'in_work', priority: 'normal' };
	const issueComments: { id: number; issueId: number; user: { id: number; name: string } | null; body: string; createdAt: string }[] = [];
	const woComments: { id: number; executionId: number; author: { id: number; name: string } | null; body: string; createdAt: string }[] = [];
	let cid = 0;
	const calls: string[] = [];
	const api = {
		issues: {
			get: async () => ({ ...issue }),
			list: async () => ({ items: [{ ...issue }], next: null }),
			update: async (i: { title?: string; priority?: string }) => {
				calls.push(`update ${JSON.stringify(i)}`);
				Object.assign(issue, i);
			},
			start: async () => {
				calls.push('start');
				issue.ticketState = 'in_work';
			},
			review: async () => {
				calls.push('review');
				issue.ticketState = 'in_review';
			},
			returnFromReview: async () => {
				calls.push('return');
				issue.ticketState = 'in_work';
			},
			listComments: async () => [...issueComments],
			addComment: async ({ body }: { body: string }) => {
				const c = { id: ++cid, issueId: 4, user: { id: PLUGIN_USER, name: 'Kaneo' }, body, createdAt: '' };
				issueComments.push(c);
				return c;
			}
		},
		execution: {
			get: async () => ({ ...wo }),
			list: async () => ({ items: [{ ...wo }], next: null }),
			listComments: async () => [...woComments],
			addComment: async ({ body }: { body: string }) => {
				const c = { id: ++cid, executionId: 2, author: { id: PLUGIN_USER, name: 'Kaneo' }, body, createdAt: '' };
				woComments.push(c);
				return c;
			}
		},
		plugins: { links: { set: async (l: unknown) => void calls.push(`link ${JSON.stringify(l)}`) } },
		org: { projects: { list: async () => ({ items: [{ id: 1, code: 'MOJ' }], next: null }) } }
	};
	const personComment = (body: string) => issueComments.push({ id: ++cid, issueId: 4, user: { id: 1, name: 'Abby' }, body, createdAt: '' });
	const personWoComment = (body: string) => woComments.push({ id: ++cid, executionId: 2, author: { id: 1, name: 'Abby' }, body, createdAt: '' });
	return { api, issue, wo, calls, issueComments, woComments, personComment, personWoComment };
}

function setup() {
	const kaneo = fakeKaneo();
	const opal = fakeOpal();
	const config: Config = {
		issueProjects: { MOJ: 'kp1' },
		workOrderProjects: { MOJ: 'kp2' },
		issueColumns: DEFAULT_ISSUE_COLUMNS,
		workOrderColumns: DEFAULT_WO_COLUMNS,
		publicUrl: 'https://opal.test'
	};
	const state = new State(mkdtempSync(join(tmpdir(), 'kaneo-')));
	const logs: string[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sync = new Sync(opal.api as any, kaneo as any, state, config, PLUGIN_USER, (...a) => logs.push(a.join(' ')));
	const only = () => [...kaneo.tasks.values()][0]!;
	return { kaneo, opal, state, sync, only, logs };
}

describe('issues', () => {
	test('an issue in a mapped project gets a task, a link, and a description that links back', async () => {
		const s = setup();
		await s.sync.issue(4);
		const t = s.only();
		expect(t).toMatchObject({ projectId: 'kp1', title: 'IT-0004 Leak at flange', status: 'to-do', priority: 'high' });
		expect(t.description).toContain('[Open in OPAL](https://opal.test/issues/4)');
		expect(s.opal.calls.some((c) => c.startsWith('link') && c.includes('"externalId":"t1"'))).toBe(true);
	});

	test('a move to In Progress in Kaneo starts the issue in OPAL', async () => {
		const s = setup();
		await s.sync.issue(4);
		s.only().status = 'in-progress';
		await s.sync.issue(4);
		expect(s.opal.calls).toContain('start');
		expect(s.opal.issue.ticketState).toBe('in_work');
		expect(s.only().status).toBe('in-progress');
	});

	test('a move to Done in Kaneo is refused, undone, and explained in a comment', async () => {
		const s = setup();
		await s.sync.issue(4);
		s.only().status = 'done';
		await s.sync.issue(4);
		expect(s.opal.issue.ticketState).toBe('pending');
		expect(s.only().status).toBe('to-do');
		const note = s.kaneo.notes.get(s.only().id)!.at(-1)!.content;
		expect(note).toContain('sign-off needs a person');
		// The explanation is the plugin's own comment: it does not come back to OPAL.
		expect(s.opal.issueComments).toHaveLength(0);
	});

	test('an OPAL change wins over the old Kaneo value', async () => {
		const s = setup();
		await s.sync.issue(4);
		s.opal.issue.title = 'Leak at inlet flange';
		s.opal.issue.priority = 'critical';
		await s.sync.issue(4);
		expect(s.only()).toMatchObject({ title: 'IT-0004 Leak at inlet flange', priority: 'urgent' });
	});

	test('a title edit in Kaneo renames the OPAL issue without the number prefix', async () => {
		const s = setup();
		await s.sync.issue(4);
		s.only().title = 'IT-0004 Leak at outlet flange';
		await s.sync.issue(4);
		expect(s.opal.issue.title).toBe('Leak at outlet flange');
	});

	test('comments copy both ways once and never echo', async () => {
		const s = setup();
		await s.sync.issue(4);
		s.opal.personComment('Torque checked.');
		await s.kaneo.addComment(s.only().id, 'Parts ordered.');
		await s.sync.issue(4);
		await s.sync.issue(4);
		const kaneoSide = s.kaneo.notes.get(s.only().id)!.map((c) => c.content);
		expect(kaneoSide.filter((c) => c.includes('Torque checked.'))).toEqual(['**Abby** · OPAL\n\nTorque checked.']);
		const opalSide = s.opal.issueComments.map((c) => c.body);
		expect(opalSide.filter((c) => c.includes('Parts ordered.'))).toEqual(['**Key Owner** · Kaneo\n\nParts ordered.']);
		expect(kaneoSide).toHaveLength(2);
		expect(opalSide).toHaveLength(2);
	});

	test('an issue in a project with no mapping gets no task', async () => {
		const s = setup();
		s.opal.issue.projectCode = 'OTHER';
		await s.sync.issue(4);
		expect(s.kaneo.tasks.size).toBe(0);
	});
});

describe('work orders', () => {
	test('a work order gets a task in the work order project, and OPAL drives its column', async () => {
		const s = setup();
		await s.sync.workOrder(2);
		expect(s.only()).toMatchObject({ projectId: 'kp2', title: 'WO-0002 Assembly', status: 'in-progress' });
		s.only().status = 'done';
		await s.sync.workOrder(2);
		expect(s.only().status).toBe('in-progress');
	});

	test('work order comments copy both ways', async () => {
		const s = setup();
		await s.sync.workOrder(2);
		s.opal.personWoComment('OP 6 done.');
		await s.kaneo.addComment(s.only().id, 'Ship Friday.');
		await s.sync.workOrder(2);
		await s.sync.workOrder(2);
		expect(s.kaneo.notes.get(s.only().id)!.map((c) => c.content)).toContain('**Abby** · OPAL\n\nOP 6 done.');
		expect(s.opal.woComments.map((c) => c.body)).toContain('**Key Owner** · Kaneo\n\nShip Friday.');
		expect(s.kaneo.notes.get(s.only().id)).toHaveLength(2);
		expect(s.opal.woComments).toHaveLength(2);
	});
});

describe('poll', () => {
	test('a poll with no change on either side reads no task', async () => {
		const s = setup();
		await s.sync.all();
		expect(s.kaneo.tasks.size).toBe(2);
		const reads = s.kaneo.taskReads;
		await s.sync.all();
		expect(s.kaneo.taskReads).toBe(reads);
	});

	test('a poll syncs the record whose Kaneo task changed on the board', async () => {
		const s = setup();
		await s.sync.all();
		await s.sync.all();
		const issueTask = [...s.kaneo.tasks.values()].find((t) => t.projectId === 'kp1')!;
		issueTask.status = 'in-progress';
		await s.sync.all();
		expect(s.opal.issue.ticketState).toBe('in_work');
	});
});
