import { defineConfig, devices } from '@playwright/test';
import deviceConfigs from './devices-config.json' with { type: 'json' };

// Define the device configuration structure
interface DeviceConfig {
  deviceSource: string;
  userAgent: string;
  isMobile: boolean;
  channel?: 'chrome' | 'msedge' | 'firefox' | 'webkit'; // Optional property
}

// Explicitly type the imported JSON
const typedDeviceConfigs = deviceConfigs as Record<string, DeviceConfig>;

const projects = Object.entries(typedDeviceConfigs).map(([name, config]) => {
  const baseDevice = devices[config.deviceSource] || {};
  return {
    name,
    use: {
      ...baseDevice,
      ...(config.channel ? { channel: config.channel } : {}),
      userAgent: config.userAgent,
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