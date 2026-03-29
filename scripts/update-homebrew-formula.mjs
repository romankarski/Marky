import fs from 'node:fs/promises';

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || !value) {
      throw new Error(`Invalid argument pair starting at ${key ?? '<missing>'}`);
    }
    args.set(key.slice(2), value);
  }

  const formula = args.get('formula');
  const repo = args.get('repo');
  const version = args.get('version');
  const sha = args.get('sha');

  if (!formula || !repo || !version || !sha) {
    throw new Error('Usage: node update-homebrew-formula.mjs --formula <path> --repo <owner/repo> --version <version> --sha <sha256>');
  }

  return { formula, repo, version, sha };
}

function replaceExactlyOnce(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`Expected exactly one ${label} entry in formula`);
  }
  return source.replace(pattern, replacement);
}

const { formula, repo, version, sha } = parseArgs(process.argv.slice(2));
const releaseUrl = `https://github.com/${repo}/releases/download/v${version}/marky-${version}.tgz`;

let content = await fs.readFile(formula, 'utf8');
content = replaceExactlyOnce(content, /^  version ".*"$/m, `  version "${version}"`, 'version');
content = replaceExactlyOnce(content, /^  url ".*"$/m, `  url "${releaseUrl}"`, 'url');
content = replaceExactlyOnce(content, /^  sha256 ".*"$/m, `  sha256 "${sha}"`, 'sha256');

await fs.writeFile(formula, content);
