import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskQueue } from './task-queue';

describe('TaskQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no work when empty', () => {
    const q = new TaskQueue(3000);
    expect(q.hasTask()).toBe(false);
  });

  it('runs a queued task and becomes idle', async () => {
    const q = new TaskQueue(0);
    let ran = false;
    q.addTask(async () => {
      ran = true;
    });
    await vi.runAllTimersAsync();
    expect(ran).toBe(true);
    expect(q.hasTask()).toBe(false);
  });

  it('clearQueue drops pending work', () => {
    const q = new TaskQueue(3000);
    q.addTask(async () => {});
    q.addTask(async () => {});
    q.clearQueue();
    expect(q.hasTask()).toBe(false);
  });

  it('runs tasks sequentially and resolves waitForCompletion', async () => {
    const q = new TaskQueue(10);
    const order: number[] = [];

    q.addTask(async () => {
      order.push(1);
    });
    q.addTask(async () => {
      order.push(2);
    });

    let resolved = false;
    const done = q.waitForCompletion().then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    await vi.runAllTimersAsync();
    await done;
    expect(resolved).toBe(true);
    expect(order).toEqual([1, 2]);
  });

  it('continues after a task throws and still completes remaining tasks', async () => {
    const q = new TaskQueue(5);
    const order: string[] = [];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    q.addTask(async () => {
      order.push('a');
      throw new Error('fail');
    });
    q.addTask(async () => {
      order.push('b');
    });

    await vi.runAllTimersAsync();

    expect(order).toEqual(['a', 'b']);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
