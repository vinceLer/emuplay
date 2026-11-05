import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import deviceConfigs from '../devices-config.json' with { type: 'json' };

const devicesList = Object.keys(deviceConfigs);

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

  console.log('\n\x1b[36m=============================================\x1b[0m');
  console.log('\x1b[36m🚀 EMUPLAY - MULTI-DEVICE EMULATION SELECTOR\x1b[0m');
  console.log('\x1b[36m=============================================\x1b[0m');

  devicesList.forEach((dev, index) => {
    console.log(`   \x1b[33m[${index + 1}]\x1b[0m ${dev}`);
  });
  console.log('\x1b[36m---------------------------------------------\x1b[0m');

  let selectedProjectsRaw = [];

  while (selectedProjectsRaw.length === 0) {
    const deviceAnswer = await rl.question('\x1b[32m👉 Choose one or more numbers (e.g., 1 1 3 for duplicates): \x1b[0m');

    const rawInputs = deviceAnswer.trim().split(/\s+/);
    const indices = rawInputs
      .map(n => parseInt(n, 10) - 1)
      .filter(n => !isNaN(n));

    const validIndices = indices.filter(i => i >= 0 && i < devicesList.length);
    const invalidInputs = rawInputs.filter((_, idx) => {
      const parsed = parseInt(rawInputs[idx], 10);
      return isNaN(parsed) || parsed < 1 || parsed > devicesList.length;
    });

    if (invalidInputs.length > 0) {
      console.log(`\n\x1b[33m⚠️ Invalid entry/entries detected: ${invalidInputs.join(', ')}\x1b[0m`);
      const actionAnswer = await rl.question('\x1b[32m👉 Do you want to [i]gnore them and continue, or [r]etry selection? (i/r): \x1b[0m');

      if (actionAnswer.trim().toLowerCase() === 'r') {
        console.log('\n\x1b[33m🔄 Let\'s try again.\x1b[0m\n');
        continue;
      }
    }

    selectedProjectsRaw = validIndices.map(i => devicesList[i]);

    if (selectedProjectsRaw.length === 0) {
      console.log('\n\x1b[31m❌ No valid devices selected. Please try again.\x1b[0m\n');
    }
  }

  const projectInstanceCounts = {};
  const selectedProjects = selectedProjectsRaw.map(proj => {
    projectInstanceCounts[proj] = (projectInstanceCounts[proj] || 0) + 1;
    const count = projectInstanceCounts[proj];
    return count === 1 ? proj : `${proj}__${count}`;
  });

  let selectedAuth = '';
  const authFiles = await getAvailableAuthFiles();

  const useAuthAnswer = await rl.question('\x1b[32m🔐 Load an authenticated session for all selected? (y/N): \x1b[0m');

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
          console.log(`\n\x1b[32m✅ Selected session: ${path.basename(selectedAuth)}\x1b[0m`);
        } else {
          console.log('\n\x1b[31m❌ Unsecure session path detected. Launching without session.\x1b[0m');
        }
      } else {
        console.log('\n\x1b[33m⚠️ Invalid choice, launching without a session.\x1b[0m');
      }
    }
  }

  rl.close();

  const displayNames = selectedProjects.map(p => p.includes('__') ? `${p.split('__')[0]} (#${p.split('__')[1]})` : p);
  console.log(`\n\x1b[32m✨ Launching environments: ${displayNames.join(', ')}\x1b[0m`);
  if (selectedAuth) {
    console.log(`\x1b[32m🔒 With session: ${path.basename(selectedAuth)}\n\x1b[0m`);
  } else {
    console.log('\x1b[33m🔓 Without session (anonymous)\n\x1b[0m');
  }

  const env = { ...process.env };
  if (selectedAuth) {
    env.STORAGE_STATE = selectedAuth;
  }
  env.MULTI_PROJECTS = JSON.stringify(selectedProjects);

  const args = ['exec', 'playwright', 'test'];
  selectedProjects.forEach(proj => {
    args.push('--project', proj);
  });
  args.push('--headed');

  const child = spawn('pnpm', args, { stdio: 'inherit', env, shell: false });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main();