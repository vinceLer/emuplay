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
    console.log('\x1b[36m🚀 EMUPLAY - MULTI-SESSION MULTI-DEVICE LAUNCHER\x1b[0m');
    console.log('\x1b[36m=============================================\x1b[0m');

    devicesList.forEach((dev, index) => {
        console.log(`   \x1b[33m[${index + 1}]\x1b[0m ${dev}`);
    });
    console.log('\x1b[36m---------------------------------------------\x1b[0m');

    let selectedProjectsRaw = [];

    while (selectedProjectsRaw.length === 0) {
        const deviceAnswer = await rl.question('\x1b[32m👉 Choose devices to run (e.g., 1 1 3 for duplicates): \x1b[0m');

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

    const authFiles = await getAvailableAuthFiles();
    const deviceSessionMap = {};

    console.log('\n\x1b[35m--- Configure Sessions per Device Instance ---\x1b[0m');
    console.log('\x1b[90m(For each instance, choose an auth session file or press Enter for anonymous)\x1b[0m\n');

    if (authFiles.length > 0) {
        console.log('\x1b[35mAvailable Sessions:\x1b[0m');
        authFiles.forEach((file, index) => {
            console.log(`   \x1b[33m[${index + 1}]\x1b[0m ${path.basename(file)}`);
        });
        console.log('   \x1b[33m[0 / Enter]\x1b[0m None (Anonymous)');
        console.log('\x1b[35m-------------------------------------\x1b[0m');
    } else {
        console.log('\x1b[33m⚠️ No session files found in the /auth directory. All will run anonymously.\x1b[0m\n');
    }

    for (const projectInstance of selectedProjects) {
        const displayName = projectInstance.includes('__') 
            ? `${projectInstance.split('__')[0]} (Instance ${projectInstance.split('__')[1]})` 
            : projectInstance;

        if (authFiles.length === 0) {
            deviceSessionMap[projectInstance] = '';
            continue;
        }

        const sessionAnswer = await rl.question(`\x1b[32m👉 Session for \x1b[33m[${displayName}]\x1b[32m (number): \x1b[0m`);
        const trimmedInput = sessionAnswer.trim();

        if (trimmedInput === '' || trimmedInput === '0') {
            deviceSessionMap[projectInstance] = '';
            continue;
        }

        const sessionIndex = parseInt(trimmedInput, 10) - 1;

        if (sessionIndex >= 0 && sessionIndex < authFiles.length) {
            const resolvedPath = path.resolve(process.cwd(), authFiles[sessionIndex]);
            const authDirResolved = path.resolve(process.cwd(), 'auth');

            if (resolvedPath.startsWith(authDirResolved) && existsSync(resolvedPath)) {
                deviceSessionMap[projectInstance] = resolvedPath;
            } else {
                console.log(`\n\x1b[31m❌ Unsecure path for [${displayName}]. Switching to anonymous.\x1b[0m`);
                deviceSessionMap[projectInstance] = '';
            }
        } else {
            console.log(`\n\x1b[33m⚠️ Invalid choice for [${displayName}]. Assigning default anonymous session.\x1b[0m`);
            deviceSessionMap[projectInstance] = '';
        }
    }

    rl.close();

    console.log('\n\x1b[32m✨ Launch Summary:\x1b[0m');
    for (const [projInst, sess] of Object.entries(deviceSessionMap)) {
        const displayName = projInst.includes('__') ? `${projInst.split('__')[0]} (#${projInst.split('__')[1]})` : projInst;
        const sessionName = sess ? path.basename(sess) : 'Anonymous (No session)';
        console.log(` • \x1b[36m${displayName}\x1b[0m ➔ \x1b[33m${sessionName}\x1b[0m`);
    }
    console.log('');

    const env = { ...process.env };
    env.MULTI_STORAGE_STATE_MAP = JSON.stringify(deviceSessionMap);
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