import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: {
    ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=768'
  } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
const builtAt = new Date().toISOString();
const output = 'build/' + builtAt.replace(/[:.]/g, '-') + '-' + revision.slice(0, 8);
if (existsSync(output)) throw new Error('Release directory already exists: ' + output);
// Capture dirty/untracked inputs too; a concurrent source edit must invalidate this package.
const sourceDigest = () => {
  const hash = createHash('sha256');
  const inputs = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .split('\0').filter(Boolean);
  for (const file of [...new Set(inputs)].sort()) {
    hash.update(file + '\0');
    if (existsSync(file)) hash.update(readFileSync(file));
    hash.update('\0');
  }
  for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    if (existsSync(file)) hash.update(file + '\0').update(readFileSync(file));
  }
  return hash.digest('hex');
};
const sourceSha256 = sourceDigest();
run(process.execPath, ['scripts/check-release.mjs', '--live-only']);
run('npm', ['test']);
mkdirSync(output, { recursive: true });
run('npm', ['run', 'build', '--', '--outDir', output, '--emptyOutDir', 'false']);
for (const file of ['index.html', 'dashboard.blade.php', '.vite/manifest.json']) {
  if (!existsSync(path.join(output, file))) throw new Error('Missing release file: ' + file);
}
run(process.execPath, ['scripts/check-release.mjs', output]);
if (sourceDigest() !== sourceSha256) throw new Error('Source changed during validation; rebuild before publishing');
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
  revision, dirty, builtAt, node: process.version, sourceSha256, browserRegression: 'passed',
  lockfileSha256: sha256('package-lock.json'), files
}, null, 2) + '\n');
console.log('Validated release: ' + output + (dirty ? ' (uncommitted source; not a production release)' : ''));
