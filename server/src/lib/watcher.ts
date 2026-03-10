import { watch, FSWatcher } from 'chokidar';

export type WatchEvent = { type: 'change' | 'add' | 'unlink'; path: string };
type Subscriber = (event: WatchEvent) => void;

export class FileWatcherService {
  private watcher: FSWatcher;
  private subscribers = new Set<Subscriber>();
  private locked = new Set<string>();

  constructor(rootDir: string) {
    this.watcher = watch(rootDir, {
      ignoreInitial: true,
      ignored: /(^|[/\\])(\.git|node_modules|\.planning)[/\\]/,
    });

    const emit = (type: 'change' | 'add' | 'unlink', absPath: string) => {
      if (!absPath.endsWith('.md')) return;
      const relativePath = absPath.replace(rootDir + '/', '');
      if (this.locked.has(relativePath)) return;
      this.subscribers.forEach((cb) => cb({ type, path: relativePath }));
    };

    this.watcher.on('change', (absPath: string) => emit('change', absPath));
    this.watcher.on('add', (absPath: string) => emit('add', absPath));
    this.watcher.on('unlink', (absPath: string) => emit('unlink', absPath));
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
