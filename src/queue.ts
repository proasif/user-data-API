import { User, mockUsers } from './mockData';

type Job = {
  id: string;
  resolve: (user: User | undefined) => void;
  reject: (err: Error) => void;
};

const queue: Job[] = [];
let processing = false;

export const pendingFetches = new Map<string, Promise<User | undefined>>();

function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const job = queue.shift()!;
  setTimeout(() => {
    try {
      const user = mockUsers[Number(job.id)];
      job.resolve(user);
    } catch (err) {
      job.reject(err as Error);
    } finally {
      processing = false;
      processQueue();
    }
  }, 200);
}

export function fetchUser(id: string): Promise<User | undefined> {
  if (pendingFetches.has(id)) {
    return pendingFetches.get(id)!;
  }
  const promise = new Promise<User | undefined>((resolve, reject) => {
    queue.push({ id, resolve, reject });
    processQueue();
  }).finally(() => {
    pendingFetches.delete(id);
  });
  pendingFetches.set(id, promise);
  return promise;
}
