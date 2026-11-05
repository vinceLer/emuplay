import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const projectName = process.argv[2];

if (!projectName) {
  console.error('\n\x1b[31m❌ Error: No project specified.\x1b[0m');
  process.exit(1);
}

async function getAvailableAuthFiles() {
  const authDir = path.resolve(process.cwd(), 'auth');
  if (!existsSync(authDir)) return [];
  try {
    const files = await readdir(authDir);
    return files
      .filter(file => file.endsWith('.json') && !file.includes('/') && !file.includes('\\'))
      .map(file => path.join('auth', file));
  } catch {
    return [];
  }
}

async function main() {
  const rl = createInterface({ input, output });

  console.log(`\n\x1b[36m=============================================\x1b[0m`);
  console.log(`\x1b[36m🚀 EMUPLAY - LAUNCHING: ${projectName.toUpperCase()}\x1b[0m`);
  console.log(`\x1b[36m=============================================\x1b[0m`);

  let selectedAuth = '';
  const authFiles = await getAvailableAuthFiles();

  const useAuthAnswer = await rl.question('\x1b[32m🔐 Load an authenticated session? (y/N) : \x1b[0m');

  if (useAuthAnswer.trim().toLowerCase() === 'y' || useAuthAnswer.trim().toLowerCase() === 'yes') {
    if (authFiles.length === 0) {
      console.log('\n\x1b[33m⚠️ No session files found in the /auth directory.\x1b[0m');
      console.log('\x1b[90mLaunching without authentication...\x1b[0m');
    } else {
      console.log('\n\x1b[35m--- Available Sessions ---\x1b[0m');
      authFiles.forEach((file, index) => {
        console.log(`   \x1b[33m[${index + 1}]\x1b[0m ${path.basename(file)}`);
      });
      console.log('\x1b[35m----------------------------\x1b[0m');

      const authIndexAnswer = await rl.question('\x1b[32m👉 Choose the number of the session to use: \x1b[0m');
      const authIndex = parseInt(authIndexAnswer.trim(), 10) - 1;

      if (authIndex >= 0 && authIndex < authFiles.length) {
        const resolvedPath = path.resolve(process.cwd(), authFiles[authIndex]);
        const authDirResolved = path.resolve(process.cwd(), 'auth');
        
        if (resolvedPath.startsWith(authDirResolved) && existsSync(resolvedPath)) {
          selectedAuth = resolvedPath;
        } else {
          console.log('\n\x1b[31m❌ Unsecure session path detected.\x1b[0m');
        }
      } else {
        console.log('\n\x1b[33m⚠️ Invalid choice, launching without a session.\x1b[0m');
      }
    }
  }

  rl.close();

  const env = { ...process.env };
  env.MULTI_PROJECTS = JSON.stringify([projectName]);
  if (selectedAuth) {
    env.STORAGE_STATE = selectedAuth;
    console.log(`\n\x1b[32m✅ Selected session: ${path.basename(selectedAuth)}\x1b[0m`);
  } else {
    console.log('\n\x1b[33m🔓 Without session (anonymous)\n\x1b[0m');
  }

  const args = ['exec', 'playwright', 'test', '--project', projectName, '--headed'];
  const child = spawn('pnpm', args, { stdio: 'inherit', env, shell: false });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main();