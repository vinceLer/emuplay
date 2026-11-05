import { defineConfig, devices } from '@playwright/test';
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

const projects = Object.entries(typedDeviceConfigs).map(([name, config]) => {
  const baseDevice = devices[config.deviceSource] || {};
 
  // Strict validation of the STORAGE_STATE environment variable
  let storageState: string | undefined = undefined;
  if (process.env.STORAGE_STATE) {
    const resolvedStatePath = path.resolve(process.env.STORAGE_STATE);
    const authDirResolved = path.resolve(process.cwd(), 'auth');
   
    // Verify that the file exists and is safely located inside the auth/ directory
    if (resolvedStatePath.startsWith(authDirResolved) && existsSync(resolvedStatePath)) {
      storageState = resolvedStatePath;
    }
  }

  return {
    name,
    use: {
      ...baseDevice,
      ...(config.channel ? { channel: config.channel } : {}),
      userAgent: config.userAgent,
      ...(storageState ? { storageState } : {}),
    },
  };
});

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  use: {
    // Target application base URL
    baseURL: '<target-url>',
    
    // Retain trace on test retry if needed
    trace: 'on-first-retry',
  },
  projects,
});