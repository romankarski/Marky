import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const packageJson = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const version = packageJson.version;
const releaseUrl = `https://github.com/romankarski/Marky/releases/download/v${version}/marky-${version}.tgz`;
const formulaPath = path.join(repoRoot, 'packaging', 'homebrew', 'marky.rb');

await fs.access(formulaPath);

console.log('Marky Homebrew verification checklist');
console.log('');
console.log(`Expected release artifact: ${releaseUrl}`);
console.log(`Formula file: ${formulaPath}`);
console.log('');
console.log('1. Push tag v' + version + ' and wait for release-cli to publish marky-' + version + '.tgz.');
console.log('   If the release already exists without assets, rerun the release-cli workflow manually with tag v' + version + '.');
console.log('2. Update packaging/homebrew/marky.rb sha256 with the release tarball digest.');
console.log('3. Publish or update the formula in the Homebrew tap repository, then `brew tap` and `brew install marky`.');
console.log('4. Create a temporary notes folder with at least one markdown file.');
console.log('5. Run `marky` and confirm the browser opens to http://127.0.0.1:<port>.');
console.log('6. Re-run with `marky --no-open` and confirm the URL prints without opening the browser.');
console.log('7. Re-run with `marky --port 4310` and confirm explicit-port behavior is clear.');
console.log('8. Type `approved` in the GSD session only after the install flow works end to end.');
