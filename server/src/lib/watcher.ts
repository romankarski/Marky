import { watch, FSWatcher } from 'chokidar';

export type WatchEvent = { type: 'change' | 'add'; path: string };
type Subscriber = (event: WatchEvent) => void;

export class FileWatcherService {
  private watcher: FSWatcher;
  private subscribers = new Set<Subscriber>();
  private locked = new Set<string>();

  constructor(rootDir: string) {
    this.watcher = watch(rootDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
    });

    this.watcher.on('change', (absPath: string) => {
      const relativePath = absPath.replace(rootDir + '/', '');
      if (this.locked.has(relativePath)) return;
      const event: WatchEvent = { type: 'change', path: relativePath };
      this.subscribers.forEach((cb) => cb(event));
    });

    this.watcher.on('add', (absPath: string) => {
      const relativePath = absPath.replace(rootDir + '/', '');
      if (this.locked.has(relativePath)) return;
      const event: WatchEvent = { type: 'add', path: relativePath };
      this.subscribers.forEach((cb) => cb(event));
    });
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  lock(filePath: string, ttlMs = 200): void {
    this.locked.add(filePath);
    setTimeout(() => this.locked.delete(filePath), ttlMs);
  }

  async close(): Promise<void> {
    await this.watcher.close();
  }
}
