export type TimeRange = 'day' | 'week' | 'month';

export type CommitmentDifficulty = 1 | 2 | 3;

export type CommitmentStatus = 'future' | 'active' | 'completed' | 'overdue';

export type WorkloadBand = 'manageable' | 'busy' | 'strained' | 'overloaded';

export type Commitment = {
  id: string;
  title: string;
  startAt: string;
  dueAt: string;
  difficulty: CommitmentDifficulty;
  completedAt?: string;
};
