#!/usr/bin/env node
/**
 * djwida 최적화 스크립트
 * - 빌드 실행 후 dist 번들 크기 보고
 * - 최적화 팁 출력
 */

import { readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function getFileSizes(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await getFileSizes(full, base)));
    } else {
      const s = await stat(full);
      const rel = full.slice(base.length).replace(/\\/g, '/').replace(/^\//, '');
      files.push({ path: rel || e.name, size: s.size });
    }
  }
  return files;
}

async function main() {
  const runBuild = process.argv.includes('--build');
  if (runBuild) {
    console.log('빌드 실행 중...\n');
    const { spawn } = await import('child_process');
    await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'build'], {
        cwd: root,
        stdio: 'inherit',
        shell: true,
      });
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build exited ${code}`))));
    });
  }

  try {
    const files = await getFileSizes(distDir);
    const total = files.reduce((acc, f) => acc + f.size, 0);
    const byExt = {};
    files.forEach((f) => {
      const ext = f.path.includes('.') ? f.path.split('.').pop() : 'no-ext';
      if (!byExt[ext]) byExt[ext] = { count: 0, size: 0 };
      byExt[ext].count++;
      byExt[ext].size += f.size;
    });

    console.log('=== 번들 크기 보고 ===\n');
    files
      .filter((f) => /\.(js|css)$/.test(f.path))
      .sort((a, b) => b.size - a.size)
      .forEach((f) => {
        console.log(`  ${f.path.padEnd(45)} ${formatBytes(f.size)}`);
      });
    console.log('\n  총 크기:', formatBytes(total));
    console.log('\n=== 최적화 팁 ===');
    console.log(`
  1. 프레임 안정화: src/utils/frameStabilizer.ts로 고정 타임스텝(60 tick/s) 적용됨. useGame 게임 루프에서 누적 시간 기반으로 로직 틱만 실행해 고주사율/저사양에서도 동작이 일정합니다.
  2. 게임 플레이: GameCanvas에 gameStateRef를 전달하면 RAF로 매 프레임 그리기되어 렌더는 디스플레이 주사율에 맞춰지고, 로직은 60 tick/s로 고정됩니다.
  3. 번들: vite.config.ts의 manualChunks로 react/ui 벤더 분리되어 있습니다.
  4. 더 쪼개려면: 라우트/모달별 lazy loading (React.lazy) 적용을 고려하세요.
  5. 프로덕션: npm run build 후 preview로 실제 체감 성능을 확인하세요.
`);
  } catch (err) {
    if (err.code === 'ENOENT' && err.path === distDir) {
      console.log('dist 폴더가 없습니다. --build 옵션으로 먼저 빌드하세요.');
      console.log('  예: node scripts/optimize.mjs --build');
      process.exit(1);
    }
    throw err;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
