# biophoton

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## User Interface Overview

Biophoton is electroacupuncture and treatment device.

---

### Authentication

- **Login Screen**
  - Default credentials: `admin / admin`

---

### Main Dashboard

The dashboard includes a sidebar with the following sections:

1. **Start a Session**
2. **New Client**
3. **New Remedy**
4. **Settings**

---

### Start a Session

- Select an existing client or use **Skip Client** to start a session without a client
- Choose session type:
  - Session
  - Inversion
  - Medbed
- Client actions (via menu icon):
  - Edit client
  - View client profile
  - View previous sessions
  - Delete client

---

### New Client

- Create a new client profile
- Optional samples:
  - Blood
  - Saliva
  - Photo
- Client photo is imported from USB and stored locally

---

### New Remedy

- Create a new remedy entry
- After entering remedy details, the practitioner places the physical sample on the plate
- Remedy frequency is retrieved using **Mode 4**

---

### Settings

Settings are organized into tabs:

#### General
- Change language
- Adjust screen brightness
- Enable / disable sound
- Control sound volume

#### Remedies
- View all remedies
- Update or delete existing remedies

#### Clients
- View all client profiles

---

## Session Flow

A standard session consists of **four steps**:

1. **Pre Session**
2. **Handrod Session**
3. **Footplate Session**
4. **Post Session**

### Kid Session
- Reduced flow with two steps:
  - Pre Session
  - Handrod Session

---

### Measurement

- **Mode 1** starts automatically
- Acupuncture point measurements are:
  - Displayed on a real-time chart
  - Represented with audio feedback
- Interpretation:
  - Values **above 50%** → balanced
  - Values **below 50%** → dropping point indicate need for treatment

---

### Programs & Treatment

- Practitioner can start predefined programs (Mode 2):
  - Pain
  - Biofield
  - Scar
  - etc.
- Practioner selects remedies for handrod and footplate programs
- Symptoms can be recorded via a popup next to the client profile

---

### Handrod Session Details

- Select **active** or **passive** handrod
  - Default is stored in client profile
- Select up to **10 remedies** → starts **Mode 3**
- During Mode 3:
  - Measurement and treatment occur simultaneously
  - Chart reflects whether remedies are improving weak points

#### Remedy Selection
- Filter by:
  - Category
  - Subcategory
  - Meridian
  - Name search
- Remedy details popup (can be disabled via eye icon)
- Remedy scanning by category/subcategory is supported

---

### Recording Points

- Practitioner can record dropping points (red indicators)
- Points can be recorded:
  - Before Handrod Session
  - After Handrod Session

---

### Session Progression

- Navigation controls:
  - End session
  - Go back
  - Proceed to next step
- On proceeding from Handrod Session:
  - Practitioner can enter up to **4 treated meridians**
  - Option to skip or save before continuing

---

### Footplate & Post Session

- Footplate Session automatically populates remedies based on:
  - Treated meridians
  - Remedies used in Handrod Session
- Post Session allows repeating Handrod Session if needed

---

### Session Summary

- Displays:
  - Programs used
  - Remedies applied
  - Symptoms
  - Focused meridians
  - Recorded dropping points before and after handrod session
- Practitioner can add recommendations
- Session is stored locally on save


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

### Env variables

Behavior is configured via environment variables.
All values are optional — defaults are used if not provided.

Create a `.env` file (see `.env.example`) to override defaults.

GSR_MOCK - use mock GSR data instead of serial input, default: false

MEAN - baseline (mean) resistance value, default: 100

NOISE_THRESHOLD - filter noise threshold, default: 0

SERIAL_PATH - serial port path, default: /dev/ttyACM0

SERIAL_BAUD - serial baud rate, default: 115200

SERIAL_OPEN_DELAY_MS - delay before opening serial port (ms), default: 2000

MAX_RESISTANCE - maximum resistance value, default: 2500

CURVE_K - logistic curve steepness, default: 2

ENABLE_BLEND - blend upper values, default: true

SMOOTHING_ALPHA - Smoothing (EWMA) for high values, default: 0.5

SMOOTHING_ENABLED - enable EWMA smoothing, default: false

CURSOR_HIDDEN - hide cursor, default: true

SAMPLE_INTERVAL_MS - sampling interval (Mode 1), default: 50
