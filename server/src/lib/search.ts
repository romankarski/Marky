import MiniSearch from 'minisearch';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

export const MINISEARCH_OPTIONS = {
  fields: ['name', 'text'],
  storeFields: ['name', 'path', 'text', 'tags'],
};

export interface SearchDoc {
  id: string;
  name: string;
  path: string;
  text: string;
  tags: string[];
}

export interface SearchIndexPayload {
  index: object;
  tags: string[];
  tagMap: Record<string, string[]>;
}

export interface TagGraphNodePayload {
  id: string;
  path: string;
  label: string;
  tags: string[];
  tagCount: number;
}

export interface TagGraphLinkPayload {
  source: string;
  target: string;
  sharedTags: string[];
  weight: number;
}

export interface TagGraphPayload {
  nodes: TagGraphNodePayload[];
  links: TagGraphLinkPayload[];
}

function normaliseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

async function collectMdFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectMdFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

export class SearchService {
  private index: MiniSearch;
  private docs: Map<string, SearchDoc>;

  constructor() {
    this.index = new MiniSearch(MINISEARCH_OPTIONS);
    this.docs = new Map();
  }

  async buildFromDir(rootDir: string): Promise<void> {
    const filePaths = await collectMdFiles(rootDir);
    for (const fullPath of filePaths) {
      const relPath = path.relative(rootDir, fullPath);
      const doc = await this._readDoc(rootDir, relPath);
      this.docs.set(relPath, doc);
      this.index.add(doc);
    }
  }

  private async _readDoc(rootDir: string, relPath: string): Promise<SearchDoc> {
    const fullPath = path.join(rootDir, relPath);
    const raw = await fs.readFile(fullPath, 'utf-8');
    const parsed = matter(raw);
    const name = path.basename(relPath, '.md');
    const text = parsed.content.trim().slice(0, 500);
    const tags = normaliseTags(parsed.data.tags);
    return { id: relPath, name, path: relPath, text, tags };
  }

  getIndexJSON(): object {
    return JSON.parse(JSON.stringify(this.index));
  }

  getAllTags(): string[] {
    const tagSet = new Set<string>();
    for (const doc of this.docs.values()) {
      for (const tag of doc.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }

  getTagMap(): Record<string, string[]> {
    const tagMap: Record<string, string[]> = {};
    for (const doc of this.docs.values()) {
      for (const tag of doc.tags) {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(doc.path);
      }
    }
    return tagMap;
  }

  getTagGraphPayload(): TagGraphPayload {
    const nodes = Array.from(this.docs.values())
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((doc) => ({
        id: doc.path,
        path: doc.path,
        label: path.basename(doc.path, '.md'),
        tags: [...doc.tags],
        tagCount: doc.tags.length,
      }));

    const tagOrder = new Map<string, number>();
    const tagBuckets = new Map<string, string[]>();

    for (const node of nodes) {
      for (const tag of node.tags) {
        if (!tagOrder.has(tag)) {
          tagOrder.set(tag, tagOrder.size);
        }
        const bucket = tagBuckets.get(tag);
        if (bucket) {
          bucket.push(node.path);
        } else {
          tagBuckets.set(tag, [node.path]);
        }
      }
    }

    const linkMap = new Map<string, { source: string; target: string; sharedTags: string[] }>();

    for (const [tag, bucket] of tagBuckets.entries()) {
      const sortedBucket = [...bucket].sort((a, b) => a.localeCompare(b));
      for (let sourceIndex = 0; sourceIndex < sortedBucket.length; sourceIndex += 1) {
        for (let targetIndex = sourceIndex + 1; targetIndex < sortedBucket.length; targetIndex += 1) {
          const source = sortedBucket[sourceIndex];
          const target = sortedBucket[targetIndex];
          const key = `${source}::${target}`;
          const existing = linkMap.get(key);

          if (existing) {
            existing.sharedTags.push(tag);
          } else {
            linkMap.set(key, { source, target, sharedTags: [tag] });
          }
        }
      }
    }

    const links = Array.from(linkMap.values())
      .map((link) => {
        const sharedTags = [...link.sharedTags].sort(
          (left, right) => (tagOrder.get(left) ?? Number.MAX_SAFE_INTEGER)
            - (tagOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
        );

        return {
          source: link.source,
          target: link.target,
          sharedTags,
          weight: sharedTags.length,
        };
      })
      .sort((a, b) => {
        const sourceCompare = a.source.localeCompare(b.source);
        if (sourceCompare !== 0) return sourceCompare;
        return a.target.localeCompare(b.target);
      });

    return { nodes, links };
  }

  async updateDoc(rootDir: string, relPath: string): Promise<void> {
    const doc = await this._readDoc(rootDir, relPath);
    if (this.docs.has(relPath)) {
      this.index.replace(doc);
    } else {
      this.index.add(doc);
    }
    this.docs.set(relPath, doc);
  }

  removeDoc(relPath: string): void {
    if (this.docs.has(relPath)) {
      this.index.discard(relPath);
      this.docs.delete(relPath);
    }
  }
}
