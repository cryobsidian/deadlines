import { addDays, startOfDay } from '@/domain/workload';
import type { Commitment } from '@/types/commitment';

function atHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export function createMockCommitments(now = new Date()): Commitment[] {
  const today = startOfDay(now);

  return [
    {
      id: 'database',
      title: 'Database schema',
      startAt: addDays(today, -2).toISOString(),
      dueAt: atHour(addDays(today, 3), 18).toISOString(),
      difficulty: 3,
      priority: 'high',
      flexibility: 'flexible',
      category: 'university',
    },
    {
      id: 'prototype',
      title: 'Prototype build',
      startAt: addDays(today, -1).toISOString(),
      dueAt: atHour(addDays(today, 4), 16).toISOString(),
      difficulty: 3,
      priority: 'critical',
      flexibility: 'flexible',
      category: 'university',
    },
    {
      id: 'exam',
      title: 'Exam revision',
      startAt: atHour(today, 10).toISOString(),
      dueAt: atHour(addDays(today, 4), 20).toISOString(),
      difficulty: 2,
      priority: 'critical',
      flexibility: 'fixed',
      category: 'university',
    },
    {
      id: 'journal',
      title: 'Journal scan',
      startAt: addDays(today, 2).toISOString(),
      dueAt: atHour(addDays(today, 5), 12).toISOString(),
      difficulty: 1,
      priority: 'medium',
      flexibility: 'droppable',
      category: 'personal',
    },
    {
      id: 'pitch',
      title: 'Pitch outline',
      startAt: addDays(today, 3).toISOString(),
      dueAt: atHour(addDays(today, 5), 18).toISOString(),
      difficulty: 2,
      priority: 'high',
      flexibility: 'flexible',
      category: 'university',
    },
    {
      id: 'market',
      title: 'Market study',
      startAt: addDays(today, 6).toISOString(),
      dueAt: atHour(addDays(today, 12), 12).toISOString(),
      difficulty: 2,
      priority: 'medium',
      flexibility: 'flexible',
      category: 'university',
    },
  ];
}

export const mockCommitments = createMockCommitments();
