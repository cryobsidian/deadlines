import type { Commitment, CommitmentStatus, TimeRange, WorkloadBand } from '@/types/commitment';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const difficultyWeights: Record<Commitment['difficulty'], number> = {
  1: 1,
  2: 2,
  3: 3,
};

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getVisibleWindow(range: TimeRange, now = new Date()) {
  const start = new Date(now);
  const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
  return {
    start,
    end: addDays(start, days),
  };
}

export function getCommitmentStatus(commitment: Commitment, at = new Date()): CommitmentStatus {
  if (commitment.completedAt) {
    return 'completed';
  }

  const start = new Date(commitment.startAt).getTime();
  const due = new Date(commitment.dueAt).getTime();
  const current = at.getTime();

  if (current > due) {
    return 'overdue';
  }

  if (current < start) {
    return 'future';
  }

  return 'active';
}

export function isCommitmentActiveOn(commitment: Commitment, date: Date) {
  if (commitment.completedAt) {
    return false;
  }

  const time = date.getTime();
  return time >= new Date(commitment.startAt).getTime() && time <= new Date(commitment.dueAt).getTime();
}

export function calculateWorkloadScore(commitments: Commitment[], date: Date) {
  return commitments.reduce((score, commitment) => {
    if (!isCommitmentActiveOn(commitment, date)) {
      return score;
    }

    return score + difficultyWeights[commitment.difficulty];
  }, 0);
}

export function getWorkloadBand(score: number): WorkloadBand {
  if (score >= 10) {
    return 'overloaded';
  }

  if (score >= 7) {
    return 'strained';
  }

  if (score >= 4) {
    return 'busy';
  }

  return 'manageable';
}

export type OverloadPeriod = {
  start: Date;
  end: Date;
  score: number;
};

export function identifyOverloadPeriods(
  commitments: Commitment[],
  windowStart: Date,
  windowEnd: Date,
  threshold = 7,
): OverloadPeriod[] {
  const periods: OverloadPeriod[] = [];
  let openPeriod: OverloadPeriod | null = null;
  const totalMs = windowEnd.getTime() - windowStart.getTime();
  const stepMs = Math.max(DAY_MS / 2, totalMs / 48);

  for (let time = windowStart.getTime(); time <= windowEnd.getTime(); time += stepMs) {
    const date = new Date(time);
    const score = calculateWorkloadScore(commitments, date);

    if (score >= threshold && !openPeriod) {
      openPeriod = { start: date, end: date, score };
    } else if (score >= threshold && openPeriod) {
      openPeriod.end = date;
      openPeriod.score = Math.max(openPeriod.score, score);
    } else if (openPeriod) {
      periods.push(openPeriod);
      openPeriod = null;
    }
  }

  if (openPeriod) {
    periods.push(openPeriod);
  }

  return periods;
}

export function getTimePosition(date: Date, windowStart: Date, windowEnd: Date) {
  const span = windowEnd.getTime() - windowStart.getTime();
  if (span <= 0) {
    return 0;
  }

  const raw = (date.getTime() - windowStart.getTime()) / span;
  return Math.min(1, Math.max(0, raw));
}

export function getVisibleDateTicks(range: TimeRange, windowStart: Date) {
  if (range === 'day') {
    return [0, 6, 12, 18, 24].map((hourOffset) => addHours(windowStart, hourOffset));
  }

  const count = range === 'week' ? 7 : 6;
  const step = range === 'week' ? 1 : 5;
  return Array.from({ length: count }, (_, index) => addDays(windowStart, index * step));
}
