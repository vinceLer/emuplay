# emuplay

A lightweight, rapid browser and device emulation setup using [Playwright](https://playwright.dev/) and `pnpm` to test compatibility and behavior across various desktop and mobile platforms.

---

## 🚀 Quick Start

1. **Install dependencies:**

```bash
pnpm install

```

2. **Install Playwright browsers:**

```bash
pnpm exec playwright install

```

---

## 🔐 Authentication & Storage State

You can generate and save authenticated session states (cookies, local storage, etc.) to securely test protected routes using the `--save-storage` flag:

```bash
pnpm exec playwright codegen <your-login-url> --save-storage=auth/admin.json

```

> **Note:** For security and proper integration with the test config, your storage state files must be saved inside the `auth/` directory. You can then load them by setting the `STORAGE_STATE` environment variable.

---

## 💻 Terminal Commands

### Desktop Browsers

```bash
pnpm emu:chrome

```

```bash
pnpm emu:firefox

```

```bash
pnpm emu:safari

```

```bash
pnpm emu:edge

```

```bash
pnpm emu:linux

```

---

### Mobile & Tablet Devices (iOS / Android)

```bash
pnpm emu:iphone

```

```bash
pnpm emu:iphone15

```

```bash
pnpm emu:iphone-chrome

```

```bash
pnpm emu:ipad

```

```bash
pnpm emu:ipad-pro

```

```bash
pnpm emu:pixel

```

```bash
pnpm emu:galaxy

```

```bash
pnpm emu:galaxy24

```

---

### Interactive Selectors & UI Mode

* **Interactive Terminal Selector (Multi-device selection):**

```bash
pnpm emu

```

* **Playwright UI Mode:**

```bash
pnpm emu:ui

```