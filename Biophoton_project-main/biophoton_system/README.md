# Project structure

## biophoton_system/    
- Project root directory for the Biophoton System. Contains all submodules including UI, backend, firmware, and deployment logic.

### ├── electron_ui/    
- Electron-based frontend for Raspberry Pi touchscreen UI.    
- **│ ├── public/**    – Static files (images, CSS, assets)    
- │ │ └── .gitkeep    – Placeholder to preserve empty directory in Git    
- **│ ├── src/**    – Source code for the UI    
- │ │ ├── main/    – Electron main process script (entry point)    
- │ │ │ └── main.js    – Initializes and manages the Electron app window    
- │ │ ├── renderer/    – Renderer process (UI components and views)    
- │ │ │ ├── components/    – Reusable UI components/widgets    
- │ │ │ │ └── .gitkeep    – Placeholder file    
- │ │ │ ├── pages/    – Screen-specific UI layouts (e.g., dashboard, control)    
- │ │ │ │ └── .gitkeep    – Placeholder file    
- │ │ │ └── renderer.js    – Entry point for UI logic    
- │ │ └── preload.js    – IPC bridge between main and renderer processes    
- **│ ├── package.json**    – NPM package file with scripts and dependencies    
- │ └── electron-builder.json    – Configuration for packaging and deployment    

### ├── flask_backend/    
- Flask-based Python backend server responsible for session control, data routing, and device communication.    
- **│ ├── app/**    – Application code for the backend    
- │ │ ├── init.py    – Initializes the Flask application instance    
- │ │ ├── routes/    – HTTP routes for API endpoints    
- │ │ │ ├── init.py    – Routes module initializer    
- │ │ │ └── sensors.py    – API for reading sensor data and control commands    
- │ │ ├── models/    – Database access and models    
- │ │ │ └── database.py    – SQLite connection and schema logic    
- │ │ ├── services/    – Service logic for hardware communication    
- │ │ │ └── teensy_service.py    – Serial communication handler for Teensy MCU    
- │ │ └── utils/    – Utility functions and logging helpers    
- │ │ └── logger.py    – Logging configuration and session logs    
- **│ ├── run.py**    – Main entry point for starting the Flask server    
- │ └── requirements.txt    – Python package requirements    

### ├── teensy_firmware/    
- Embedded firmware written for the Teensy board. Handles sensor reading and USB serial communication.    
- **│ ├── src/**    – C++ source code for Teensy firmware    
- │ │ └── main.cpp    – Main logic for sensor readings and communication    
- **│ ├── include/**    – Optional headers for modular firmware    
- │ │ └── .gitkeep    – Placeholder to keep folder in repo    
- │ └── README.md    – Build and flashing instructions for Teensy    

### ├── database/    
- Contains database schema and optional sample datasets.    
- │ ├── schema.sql    – SQL script for initializing database structure    
- │ └── sample.db    – Example SQLite database for testing    

### ├── config/    
- Configuration files shared between backend and UI.    
- │ ├── app_config.json    – Application settings (UI behavior, version)    
- │ └── serial_config.json    – Serial communication settings (port, baudrate)    

### ├── scripts/    
- Helper and deployment scripts for Raspberry Pi or development setup.    
- │ ├── setup_kiosk.sh    – Script to launch Electron app at boot in kiosk mode    
- │ ├── install_dependencies.sh    – Installer for Python and Node dependencies    
- │ └── flash_teensy.sh    – Helper for uploading firmware to Teensy via CLI    

- ├── README.md    – Project documentation and developer instructions    
- └── **LICENSE**    – Legal ownership and usage restrictions for private client project
