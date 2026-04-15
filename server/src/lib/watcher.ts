import { watch, FSWatcher } from 'chokidar';

export type WatchEvent = { type: 'change' | 'add' | 'unlink'; path: string };
type Subscriber = (event: WatchEvent) => void;

export interface FileWatcherLike {
  subscribe(cb: Subscriber): () => void;
  lock(filePath: string, ttlMs?: number): void;
  ready(): Promise<void>;
  close(): Promise<void>;
}

export interface FileWatcherOptions {
  usePolling?: boolean;
  interval?: number;
}

export class NoopFileWatcherService implements FileWatcherLike {
  subscribe(_cb: Subscriber): () => void {
    return () => {};
  }

  lock(_filePath: string, _ttlMs = 500): void {}

  async ready(): Promise<void> {}

  async close(): Promise<void> {}
}

export class FileWatcherService implements FileWatcherLike {
  private watcher: FSWatcher;
  private subscribers = new Set<Subscriber>();
  private locked = new Set<string>();
  private readyPromise: Promise<void>;

  constructor(rootDir: string, options: FileWatcherOptions = {}) {
    this.watcher = watch(rootDir, {
      ignoreInitial: true,
      ignored: /(^|[/\\])(\.git|node_modules|\.planning)[/\\]/,
      usePolling: options.usePolling,
      interval: options.interval,
    });
    this.readyPromise = new Promise((resolve) => {
      this.watcher.once('ready', resolve);
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

  lock(filePath: string, ttlMs = 500): void {
    this.locked.add(filePath);
    setTimeout(() => this.locked.delete(filePath), ttlMs);
  }

  async ready(): Promise<void> {
    await this.readyPromise;
  }

  async close(): Promise<void> {
    await this.watcher.close();
  }
}
