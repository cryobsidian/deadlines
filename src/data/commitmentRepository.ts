import type { Commitment } from '@/types/commitment';
import { supabaseConfigured, supabaseRest } from '@/lib/supabaseRest';

type CommitmentRow = {
  id: string;
  title: string;
  start_at: string;
  due_at: string;
  difficulty: Commitment['difficulty'];
  priority: Commitment['priority'];
  flexibility: Commitment['flexibility'];
  category: Commitment['category'];
  completed_at: string | null;
};

function fromRow(row: CommitmentRow): Commitment {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    dueAt: row.due_at,
    difficulty: row.difficulty,
    priority: row.priority ?? undefined,
    flexibility: row.flexibility ?? undefined,
    category: row.category ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

function toRow(commitment: Commitment): CommitmentRow {
  return {
    id: commitment.id,
    title: commitment.title,
    start_at: commitment.startAt,
    due_at: commitment.dueAt,
    difficulty: commitment.difficulty,
    priority: commitment.priority ?? null,
    flexibility: commitment.flexibility ?? null,
    category: commitment.category ?? null,
    completed_at: commitment.completedAt ?? null,
  } as CommitmentRow;
}

export const commitmentRepository = {
  isConfigured: supabaseConfigured,

  async list(): Promise<Commitment[]> {
    const rows = await supabaseRest<CommitmentRow[]>(
      'commitments?select=*&order=due_at.asc',
      { method: 'GET' },
    );
    return rows.map(fromRow);
  },

  async create(commitment: Commitment): Promise<Commitment> {
    const rows = await supabaseRest<CommitmentRow[]>('commitments', {
      method: 'POST',
      body: JSON.stringify(toRow(commitment)),
    });
    return fromRow(rows[0]);
  },

  async update(id: string, patch: Partial<Commitment>): Promise<Commitment> {
    const rowPatch: Partial<CommitmentRow> = {};
    if (patch.title !== undefined) rowPatch.title = patch.title;
    if (patch.startAt !== undefined) rowPatch.start_at = patch.startAt;
    if (patch.dueAt !== undefined) rowPatch.due_at = patch.dueAt;
    if (patch.difficulty !== undefined) rowPatch.difficulty = patch.difficulty;
    if (patch.priority !== undefined) rowPatch.priority = patch.priority;
    if (patch.flexibility !== undefined) rowPatch.flexibility = patch.flexibility;
    if (patch.category !== undefined) rowPatch.category = patch.category;
    if (patch.completedAt !== undefined) rowPatch.completed_at = patch.completedAt;

    const rows = await supabaseRest<CommitmentRow[]>(
      `commitments?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(rowPatch) },
    );
    return fromRow(rows[0]);
  },
};
