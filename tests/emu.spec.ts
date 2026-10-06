import { test } from '@playwright/test';

test('Emulated environment with interactive pause', async ({ page }, testInfo) => {
  await page.goto('/');

  const projectName = testInfo.project.name;
  const viewport = page.viewportSize();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const isMobile = testInfo.project.use.isMobile || false;

  const logBlock = [
    `\n\x1b[36m=============================================\x1b[0m`,
    `\x1b[36m> [${projectName}] EMULATION ACTIVE\x1b[0m`,
    `\x1b[36m=============================================\x1b[0m`,
    `\x1b[32m* Project Name :\x1b[0m ${projectName}`,
    `\x1b[32m* Device Type  :\x1b[0m ${isMobile ? 'Mobile / Tablet' : 'Desktop'}`,
    `\x1b[32m* Viewport     :\x1b[0m ${viewport ? `${viewport.width}x${viewport.height}` : 'N/A'}`,
    `\x1b[32m* User-Agent   :\x1b[0m ${userAgent}`,
    `\x1b[36m---------------------------------------------\x1b[0m`,
    `\x1b[33m> Browser opened. Use the Playwright Inspector.\x1b[0m`,
    `\x1b[36m=============================================\n\x1b[0m`
  ].join('\n');

  console.log(logBlock);

  await page.pause();
});