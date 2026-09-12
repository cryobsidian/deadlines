export type TimeRange = 'day' | 'week' | 'month';

export type CommitmentDifficulty = 1 | 2 | 3;

export type CommitmentStatus = 'future' | 'active' | 'completed' | 'overdue';

export type WorkloadBand = 'manageable' | 'busy' | 'strained' | 'overloaded';

export type CommitmentPriority = 'critical' | 'high' | 'medium' | 'low';

export type CommitmentFlexibility = 'fixed' | 'flexible' | 'droppable';

export type CommitmentCategory = 'university' | 'work' | 'health' | 'personal' | 'social';

export type Commitment = {
  id: string;
  title: string;
  startAt: string;
  dueAt: string;
  difficulty: CommitmentDifficulty;
  priority?: CommitmentPriority;
  flexibility?: CommitmentFlexibility;
  category?: CommitmentCategory;
  completedAt?: string;
};
