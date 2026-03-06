import path from 'path';
import fs from 'fs/promises';

export async function resolveSafePath(userPath: string, rootDir?: string): Promise<string> {
  const root = rootDir ?? process.env.ROOT_DIR!;
  // Decode URL encoding first
  const decoded = decodeURIComponent(userPath);
  // Resolve to absolute path relative to root
  const resolved = path.resolve(root, decoded);
  // macOS: /var is a symlink to /private/var — must realpath BOTH sides
  const realRoot = await fs.realpath(root);
  // For the resolved path, realpath only works if it exists; use catch for new files
  const realResolved = await fs.realpath(resolved).catch(() => resolved);
  // Assert the resolved path is within root
  if (!realResolved.startsWith(realRoot + path.sep) && realResolved !== realRoot) {
    throw new Error(`Path traversal detected: "${userPath}"`);
  }
  return resolved;
}
