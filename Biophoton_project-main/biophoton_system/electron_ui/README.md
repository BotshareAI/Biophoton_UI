# biophoton

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Structure

```
Biophoton_project/
└─ biophoton_system/
   └─ electron_ui/
      ├─ src/
      │  ├─ main/                 # Electron main process (lifecycle, window creation, IPC)
      │  │  ├─ index.ts
      │  │  ├─ data/              # Initial seed data
      │  │  ├─ db/                # Database connection & queries (better-sqlite3)
      │  │  └─ ipc/               # IPC handlers
      │  ├─ preload/              # Secure Electron preload scripts (contextBridge APIs)
      │  └─ renderer/
      │     └─ src/               # React renderer (UI) — TS + Tailwind + shadcn/ui
      │        ├─ components/     # Reusable UI components
      │        ├─ pages/          # Main screens (Session, Settings, etc.)
      │        ├─ store/          # Zustand stores (sessions, remedies, etc.)
      │        ├─ assets/         # Static assets (images, fonts, icons)
      │        ├─ locales/        # i18n localization files (English, Spanish)
      │        ├─ styles/         # Global CSS/Tailwind styles
      │        ├─ constants/      # Fixed values (points, preload rules, etc.)
      │        ├─ utils/          # Helper functions
      │        ├─ hooks/          # Custom hooks
      │        └─ main.tsx        # App entrypoint
      ├─ shared/                  # Shared types/interfaces between main & renderer
      ├─ resources/
      │  ├─ js/                   # JavaScript workers (serial reader and mock script)
      │  └─ db/                   # SQL migrations and schema definitions (better-sqlite3)
      ├─ package.json
      └─ electron-builder.yml     # Electron Builder configuration (packaging targets)
```

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
$ npm run build:linux:arm64
```

### Run app

```bash
$ cd dist
$ ./biophoton-1.0.0-arm64.AppImage
```
