import { readdir } from 'fs/promises';
import path from 'path';
import { FileNode } from '@marky/shared';

export async function buildTree(dir: string, rootDir: string): Promise<FileNode[]> {
  // IMPORTANT: Do NOT use { recursive: true, withFileTypes: true } together — known Node.js bug #48858
  const entries = await readdir(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    // Skip hidden files (dot-prefixed: .git, .env, etc.)
    if (entry.name.startsWith('.')) continue;
    const absPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, absPath);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'dir',
        path: relPath,
        children: await buildTree(absPath, rootDir),
      });
    } else {
      nodes.push({ name: entry.name, type: 'file', path: relPath });
    }
  }
  return nodes;
}
