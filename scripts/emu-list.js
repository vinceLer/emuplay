import { readFile } from 'node:fs/promises';

async function main() {
  try {
    const packageJsonData = await readFile(new URL('../package.json', import.meta.url), 'utf-8');
    const pkg = JSON.parse(packageJsonData);

    const scripts = pkg.scripts || {};

    console.log('\n\x1b[35m=============================================\x1b[0m');
    console.log('\x1b[35m📖 EMULATOR CLI COMMANDS (emuplay)\x1b[0m');
    console.log('\x1b[35m=============================================\x1b[0m');

    for (const [name, command] of Object.entries(scripts)) {
      if (name.startsWith('emu') || name === 'test') {
        console.log(` \x1b[32m• pnpm ${name}\x1b[0m`);
        console.log(`   \x1b[90m└─ Command: ${command}\x1b[0m`);
      }
    }

    console.log('\x1b[35m---------------------------------------------\x1b[0m');
    console.log('\x1b[33m💡 Tip: Run "pnpm emu" for the interactive multi-device selector.\x1b[0m');
    console.log('\x1b[35m=============================================\n\x1b[0m');

  } catch (error) {
    console.error('\x1b[31m❌ Error reading package.json:\x1b[0m', error.message);
  }
}

main();