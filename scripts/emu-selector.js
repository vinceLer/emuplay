import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import deviceConfigs from '../devices-config.json' with { type: 'json' };

const devicesList = Object.keys(deviceConfigs);

async function main() {
  const rl = createInterface({ input, output });

  console.log('\n\x1b[36m=============================================\x1b[0m');
  console.log('\x1b[36m🚀 EMUPLAY - MULTI-DEVICE EMULATION SELECTOR\x1b[0m');
  console.log('\x1b[36m=============================================\x1b[0m');
  
  devicesList.forEach((dev, index) => {
    console.log(`   \x1b[33m[${index + 1}]\x1b[0m ${dev}`);
  });
  console.log('\x1b[36m---------------------------------------------\x1b[0m');
  
  const answer = await rl.question('\x1b[32m👉 Choose one or more numbers separated by spaces (e.g., 1 3 8): \x1b[0m');
  rl.close();

  const indices = answer
    .trim()
    .split(/\s+/)
    .map(n => parseInt(n, 10) - 1)
    .filter(n => !isNaN(n));

  const selectedProjects = indices
    .filter(i => i >= 0 && i < devicesList.length)
    .map(i => devicesList[i]);

  if (selectedProjects.length === 0) {
    console.log('\n\x1b[31m❌ No valid devices selected. Please enter numbers corresponding to the list.\x1b[0m');
    return;
  }

  console.log(`\n\x1b[32m✨ Launching environments: ${selectedProjects.join(', ')}\n\x1b[0m`);

  const commandParts = ['pnpm', 'playwright', 'test'];
  selectedProjects.forEach(proj => {
    commandParts.push('--project', `"${proj}"`);
  });
  commandParts.push('--headed');

  const child = spawn(commandParts.join(' '), { stdio: 'inherit', shell: true });

  child.on('close', (code) => {
    process.exit(code);
  });
}

main();