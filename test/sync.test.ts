import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KaneoError, type KaneoComment, type KaneoTask } from '../src/kaneo.ts';
import { State } from '../src/state.ts';
import { DEFAULT_ISSUE_COLUMNS, DEFAULT_WO_COLUMNS, Sync, type Config } from '../src/sync.ts';

const PLUGIN_USER = 99;

/** In-memory Kaneo with the methods Sync calls. */
function fakeKaneo() {
	const tasks = new Map<string, KaneoTask>();
	const notes = new Map<string, KaneoComment[]>();
	/** Label id → { taskId, name }. */
	const labels = new Map<string, { taskId: string; name: string }>();
	/** Relation id → [parent, child]. */
	const relations = new Map<string, [string, string]>();
	const resources: { taskId: string; url: string; title: string }[] = [];
	let n = 0;
	const k = {
		tasks,
		notes,
		labels,
		relations,
		resources,
		labelsOf: (taskId: string) => [...labels.values()].filter((l) => l.taskId === taskId).map((l) => l.name).sort(),
		taskUrl: (t: { id: string }) => `https://kaneo.test/task/${t.id}`,
		project: async (id: string) => ({ id, name: 'Test', slug: 'TST', workspaceId: 'ws' }),
		taskReads: 0,
		task: async (id: string) => {
			k.taskReads++;
			const t = tasks.get(id);
			if (!t) throw new KaneoError(404, 'not found');
			return { ...t };
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
		setDescription: async (id: string, description: string) => Object.assign(tasks.get(id)!, { description }),
		setDueDate: async (id: string, dueDate: string) => Object.assign(tasks.get(id)!, { dueDate }),
		addLabel: async (_ws: string, taskId: string, name: string) => {
			const id = `l${++n}`;
			labels.set(id, { taskId, name });
			return { id };
		},
		deleteLabel: async (id: string) => void labels.delete(id),
		addSubtask: async (parent: string, child: string) => {
			const id = `r${++n}`;
			relations.set(id, [parent, child]);
			return { id };
		},
		deleteRelation: async (id: string) => void relations.delete(id),
		addResource: async (taskId: string, url: string, title: string) => {
			resources.push({ taskId, url, title });
			return { id: `x${++n}` };
		},
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
		executionId: null as number | null,
		issueNumber: 'IT-0004',
		projectCode: 'MOJ',
		title: 'Leak at flange',
		description: 'Seen at OP 6.',
		status: 'open' as 'open' | 'closed' | 'void',
		ticketState: 'pending' as 'pending' | 'in_work' | 'in_review' | 'done',
		priority: 'high' as string
	};
	const wo = {
		id: 2,
		woNumber: 'WO-0002',
		projectCode: 'MOJ',
		procedureName: 'Assembly',
		procedureNumber: 'T-0003',
		status: 'in_work',
		priority: 'normal',
		heldBy: [] as string[],
		targetCompletionAt: null as string | null
	};
	const issueComments: { id: number; issueId: number; user: { id: number; name: string } | null; body: string; createdAt: string }[] = [];
	const woComments: { id: number; executionId: number; author: { id: number; name: string } | null; body: string; createdAt: string }[] = [];
	let cid = 0;
	const calls: string[] = [];
	const api = {
		issues: {
			get: async () => ({ ...issue }),
			list: async (q: { executionId?: number; status?: string } = {}) => {
				const items = [{ ...issue }].filter(
					(i) => (q.executionId === undefined || i.executionId === q.executionId) && (!q.status || i.status === q.status)
				);
				return { items, next: null, total: items.length };
			},
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
		plugins: {
			links: {
				set: async (l: unknown) => void calls.push(`link ${JSON.stringify(l)}`),
				remove: async (l: unknown) => void calls.push(`unlink ${JSON.stringify(l)}`)
			}
		}

	};
	const personComment = (body: string) => issueComments.push({ id: ++cid, issueId: 4, user: { id: 1, name: 'Abby' }, body, createdAt: '' });
	const personWoComment = (body: string) => woComments.push({ id: ++cid, executionId: 2, author: { id: 1, name: 'Abby' }, body, createdAt: '' });
	return { api, issue, wo, calls, issueComments, woComments, personComment, personWoComment };
}

function setup(over: Partial<Config> = {}) {
	const kaneo = fakeKaneo();
	const opal = fakeOpal();
	const config: Config = {
		issueProject: 'kp1',
		workOrderProject: 'kp2',
		issueColumns: DEFAULT_ISSUE_COLUMNS,
		workOrderColumns: DEFAULT_WO_COLUMNS,
		publicUrl: 'https://opal.test',
		...over
	};
	const state = new State(mkdtempSync(join(tmpdir(), 'kaneo-')));
	const logs: string[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sync = new Sync(opal.api as any, kaneo as any, state, config, PLUGIN_USER, (...a) => logs.push(a.join(' ')));
	const only = () => [...kaneo.tasks.values()][0]!;
	return { kaneo, opal, state, sync, only, logs };
}

describe('issues', () => {
	test('an issue gets a task, an OPAL link, and its OPAL page as a resource', async () => {
		const s = setup();
		await s.sync.issue(4);
		const t = s.only();
		expect(t).toMatchObject({ projectId: 'kp1', title: 'IT-0004 Leak at flange', status: 'to-do', priority: 'high' });
		expect(t.description).toBe('Seen at OP 6.');
		expect(s.kaneo.resources).toEqual([{ taskId: t.id, url: 'https://opal.test/issues/4', title: 'IT-0004 in OPAL' }]);
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

	test('issues from every OPAL project go to the one Kaneo project', async () => {
		const s = setup();
		s.opal.issue.projectCode = 'OTHER';
		await s.sync.issue(4);
		expect(s.only().projectId).toBe('kp1');
	});

	test('with no issue project set, issues get no task', async () => {
		const s = setup({ issueProject: null });
		await s.sync.issue(4);
		await s.sync.all();
		expect([...s.kaneo.tasks.values()].filter((t) => t.projectId === 'kp1')).toHaveLength(0);
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

describe('labels, subtasks and one-way fields', () => {
	const byProject = (s: ReturnType<typeof setup>, p: string) => [...s.kaneo.tasks.values()].find((t) => t.projectId === p)!;

	test('an issue on a work order is a subtask of its task, labelled Execution and the template number', async () => {
		const s = setup();
		s.opal.issue.executionId = 2;
		await s.sync.issue(4);
		const wo = byProject(s, 'kp2');
		const it = byProject(s, 'kp1');
		expect([...s.kaneo.relations.values()]).toEqual([[wo.id, it.id]]);
		expect(s.kaneo.labelsOf(it.id)).toEqual(['Execution', 'T-0003']);
	});

	test('a work order is labelled Issues while it has an open issue, and Held while an issue holds it', async () => {
		const s = setup();
		s.opal.issue.executionId = 2;
		s.opal.wo.heldBy = ['IT-0004'];
		await s.sync.issue(4);
		const wo = byProject(s, 'kp2');
		expect(s.kaneo.labelsOf(wo.id)).toEqual(['Held', 'Issues']);
		s.opal.wo.heldBy = [];
		s.opal.issue.status = 'closed';
		await s.sync.workOrder(2);
		expect(s.kaneo.labelsOf(wo.id)).toEqual([]);
	});

	test('a poll finds a new hold and labels the work order', async () => {
		const s = setup();
		await s.sync.all();
		await s.sync.all();
		s.opal.wo.heldBy = ['IT-0004'];
		await s.sync.all();
		expect(s.kaneo.labelsOf(byProject(s, 'kp2').id)).toEqual(['Held']);
	});

	test('an issue that leaves its work order stops being its subtask and loses the labels', async () => {
		const s = setup();
		s.opal.issue.executionId = 2;
		await s.sync.issue(4);
		s.opal.issue.executionId = null;
		await s.sync.issue(4);
		expect(s.kaneo.relations.size).toBe(0);
		expect(s.kaneo.labelsOf(byProject(s, 'kp1').id)).toEqual([]);
	});

	test('the work order target date becomes the due date, and an OPAL description edit reaches Kaneo', async () => {
		const s = setup();
		s.opal.wo.targetCompletionAt = '2026-11-02T00:00:00.000Z';
		await s.sync.workOrder(2);
		expect((byProject(s, 'kp2') as unknown as { dueDate: string }).dueDate).toBe('2026-11-02');
		await s.sync.issue(4);
		s.opal.issue.description = 'Seen at OP 6 and OP 7.';
		await s.sync.issue(4);
		expect(byProject(s, 'kp1').description).toBe('Seen at OP 6 and OP 7.');
	});

	test('a task deleted in Kaneo is made again, and the old link goes', async () => {
		const s = setup();
		await s.sync.issue(4);
		const first = s.only().id;
		s.kaneo.tasks.delete(first);
		await s.sync.issue(4);
		expect(s.kaneo.tasks.size).toBe(1);
		expect(s.only().id).not.toBe(first);
		expect(s.opal.calls.some((c) => c.startsWith('unlink') && c.includes(first))).toBe(true);
	});

	test('without an OPAL public URL, tasks get no resource', async () => {
		const s = setup({ publicUrl: null });
		await s.sync.issue(4);
		expect(s.kaneo.resources).toEqual([]);
	});

	test('a full sync passes every record; a second poll right after passes none', async () => {
		const s = setup();
		await s.sync.all();
		const reads = s.kaneo.taskReads;
		await s.sync.all(true);
		expect(s.kaneo.taskReads).toBe(reads + 2);
		await s.sync.all();
		expect(s.kaneo.taskReads).toBe(reads + 2);
	});
});
