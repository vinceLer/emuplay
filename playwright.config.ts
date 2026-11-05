import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import deviceConfigs from './devices-config.json' with { type: 'json' };
import process from 'node:process';
import path from 'node:path';
import { existsSync } from 'node:fs';

interface DeviceConfig {
  deviceSource: string;
  userAgent: string;
  isMobile: boolean;
  channel?: 'chrome' | 'msedge' | 'firefox' | 'webkit';
}

const typedDeviceConfigs = deviceConfigs as Record<string, DeviceConfig>;

let targetProjects: string[] = [];

if (process.env.MULTI_PROJECTS) {
  try {
    targetProjects = JSON.parse(process.env.MULTI_PROJECTS);
  } catch (e) {}
}

let multiSessionMap: Record<string, string> = {};
if (process.env.MULTI_STORAGE_STATE_MAP) {
  try {
    multiSessionMap = JSON.parse(process.env.MULTI_STORAGE_STATE_MAP);
    if (targetProjects.length === 0) {
      targetProjects = Object.keys(multiSessionMap);
    }
  } catch (e) {}
}

if (targetProjects.length === 0) {
  targetProjects = Object.keys(typedDeviceConfigs);
}

const projects = targetProjects.map((projectName) => {
  const baseName = projectName.includes('__') ? projectName.split('__')[0] : projectName;
  const config = typedDeviceConfigs[baseName];

  if (!config) return null;

  const baseDevice = devices[config.deviceSource] || {};
  let storageState: string | undefined = undefined;

  const sessionKey = multiSessionMap[projectName] !== undefined ? projectName : baseName;
  const targetStatePath = multiSessionMap[sessionKey] || process.env.STORAGE_STATE;

  if (targetStatePath) {
    const resolvedStatePath = path.resolve(targetStatePath);
    const authDirResolved = path.resolve(process.cwd(), 'auth');
    if (resolvedStatePath.startsWith(authDirResolved) && existsSync(resolvedStatePath)) {
      storageState = resolvedStatePath;
    }
  }

  return {
    name: projectName,
    use: {
      ...baseDevice,
      ...(config.channel ? { channel: config.channel } : {}),
      userAgent: config.userAgent,
      ...(storageState ? { storageState } : {}),
    },
  };
}).filter((p): p is NonNullable<typeof p> => p !== null); 

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: '<target-url>',
    trace: 'on-first-retry',
  },
  projects: projects as PlaywrightTestConfig['projects'], 
}) as PlaywrightTestConfig;