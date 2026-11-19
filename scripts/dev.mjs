import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

const api = spawn(process.execPath, [resolve(rootDir, 'server/server.mjs')], {
  cwd: rootDir,
  stdio: 'inherit',
});

const app = spawn(
  isWin ? 'npx.cmd' : 'npx',
  ['ng', 'serve', '--port', '4200', '--proxy-config', '../proxy.conf.json'],
  {
    cwd: resolve(rootDir, 'app'),
    stdio: 'inherit',
    shell: isWin,
  }
);

function shutdown() {
  api.kill();
  app.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
