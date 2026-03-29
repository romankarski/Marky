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
console.log('1. Push tag v' + version + ' and wait for release-cli workflow to publish marky-' + version + '.tgz');
console.log('2. Update packaging/homebrew/marky.rb sha256 with the release tarball digest.');
console.log('3. Publish the formula in the tap repository or use `brew install --formula ./packaging/homebrew/marky.rb` for a local check.');
console.log('4. Create a temporary notes folder with at least one markdown file.');
console.log('5. Run `marky` and confirm the browser opens to http://127.0.0.1:<port>.');
console.log('6. Re-run with `marky --no-open` and confirm the URL prints without opening the browser.');
console.log('7. Re-run with `marky --port 4310` and confirm explicit-port behavior is clear.');
console.log('8. Type `approved` in the GSD session only after the install flow works end to end.');
