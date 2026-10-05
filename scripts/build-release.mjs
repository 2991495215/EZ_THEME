import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
const builtAt = new Date().toISOString();
const output = 'build/' + builtAt.replace(/[:.]/g, '-') + '-' + revision.slice(0, 8);
if (existsSync(output)) throw new Error('Release directory already exists: ' + output);
run('npm', ['test']);
mkdirSync(output, { recursive: true });
run('npm', ['run', 'build', '--', '--outDir', output, '--emptyOutDir', 'false']);
for (const file of ['index.html', 'dashboard.blade.php', '.vite/manifest.json']) {
  if (!existsSync(path.join(output, file))) throw new Error('Missing release file: ' + file);
}
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const files = {};
const visit = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Release symlinks are not supported: ' + file);
    if (entry.isDirectory()) visit(file);
    else files[path.relative(output, file)] = sha256(file);
  }
};
visit(output);
writeFileSync(path.join(output, 'release.json'), JSON.stringify({
  revision, dirty, builtAt, node: process.version,
  lockfileSha256: sha256('package-lock.json'), files
}, null, 2) + '\n');
console.log('Validated release: ' + output + (dirty ? ' (uncommitted source; not a production release)' : ''));
