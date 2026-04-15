import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

const WIKI_LINK = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MD_LINK   = /\[(?:[^\]]*)\]\(([^)]+\.md)\)/g;

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

export class BacklinkService {
  private reverse = new Map<string, Set<string>>();
  private forward = new Map<string, Set<string>>();

  async buildFromDir(rootDir: string): Promise<void> {
    const filePaths = await collectMdFiles(rootDir);
    for (const fullPath of filePaths) {
      const relPath = path.relative(rootDir, fullPath);
      await this.updateDoc(rootDir, relPath);
    }
  }

  async updateDoc(rootDir: string, relPath: string): Promise<void> {
    // Must remove stale links FIRST before re-parsing
    this._removeFileLinks(relPath);

    const targets = await this._extractTargets(rootDir, relPath);
    const forwardSet = new Set<string>(targets);
    this.forward.set(relPath, forwardSet);

    for (const target of forwardSet) {
      if (!this.reverse.has(target)) {
        this.reverse.set(target, new Set());
      }
      this.reverse.get(target)!.add(relPath);
    }
  }

  removeDoc(relPath: string): void {
    this._removeFileLinks(relPath);
    this.forward.delete(relPath);
    // Also remove relPath as a target from reverse index
    this.reverse.delete(relPath.toLowerCase());
  }

  getBacklinks(targetPath: string): string[] {
    const key = targetPath.toLowerCase();
    const set = this.reverse.get(key);
    if (!set) return [];
    return Array.from(set);
  }

  /** All forward file-to-file edges (source path → target path). Targets are lowercased. */
  getAllForwardLinks(): { source: string; target: string }[] {
    const edges: { source: string; target: string }[] = [];
    for (const [source, targets] of this.forward.entries()) {
      for (const target of targets) {
        edges.push({ source, target });
      }
    }
    return edges;
  }

  private _removeFileLinks(relPath: string): void {
    const prevTargets = this.forward.get(relPath);
    if (!prevTargets) return;
    for (const target of prevTargets) {
      const reverseSet = this.reverse.get(target);
      if (reverseSet) {
        reverseSet.delete(relPath);
        if (reverseSet.size === 0) {
          this.reverse.delete(target);
        }
      }
    }
    this.forward.delete(relPath);
  }

  private async _extractTargets(rootDir: string, relPath: string): Promise<string[]> {
    const fullPath = path.join(rootDir, relPath);
    let raw: string;
    try {
      raw = await fs.readFile(fullPath, 'utf-8');
    } catch {
      return [];
    }

    // Strip frontmatter before scanning for links
    const parsed = matter(raw);
    const content = parsed.content;
    const fileDir = path.dirname(relPath);

    const targets: string[] = [];

    // Reset regex lastIndex
    WIKI_LINK.lastIndex = 0;
    MD_LINK.lastIndex = 0;

    // Extract wikilinks: [[Target]] or [[Target|Alias]]
    let match: RegExpExecArray | null;
    while ((match = WIKI_LINK.exec(content)) !== null) {
      const stem = match[1].trim().toLowerCase();
      // Add .md if not already present (no double extension)
      const target = stem.endsWith('.md') ? stem : `${stem}.md`;
      targets.push(target);
    }

    // Extract standard markdown links: [label](./path/to/file.md)
    while ((match = MD_LINK.exec(content)) !== null) {
      const href = match[1];
      // Resolve relative to the file's directory within rootDir
      const absolute = path.resolve(path.join(rootDir, fileDir), href);
      const relative = path.relative(rootDir, absolute).toLowerCase();
      targets.push(relative);
    }

    return targets;
  }
}
