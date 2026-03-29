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
