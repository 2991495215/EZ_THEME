import { expect, test } from 'vitest';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

test('release guard accepts recorded live files and blocks unmerged changes or missing assets', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'ez-theme-guard-'));
  const template = path.join(directory, 'dashboard.blade.php');
  const metadata = path.join(directory, 'release.json');
  const check = () => spawnSync(process.execPath, ['scripts/check-release.mjs', '--live-only'], {
    encoding: 'utf8', env: { ...process.env, LIVE_THEME_DIR: directory }
  });
  try {
    writeFileSync(template, 'verified template');
    writeFileSync(metadata, JSON.stringify({ files: { 'dashboard.blade.php':
      createHash('sha256').update('verified template').digest('hex') } }));
    expect(check().status).toBe(0);
    writeFileSync(template, 'unmerged live customization');
    const changed = check();
    expect(changed.status).not.toBe(0);
    expect(changed.stderr).toContain('线上文件已变化');
    unlinkSync(template);
    const missing = check();
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain('live file missing');
  } finally {
    if (existsSync(template)) unlinkSync(template);
    unlinkSync(metadata);
    rmdirSync(directory);
  }
});
