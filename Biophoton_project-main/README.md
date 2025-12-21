# Biophoton system – Project overview

## Introduction

The **Biophoton System** is a diagnostic and therapeutic device designed for professional use in integrative and bioenergetic medicine. It analyzes the electromagnetic state of the human body using optical sensors and delivers targeted light-based feedback through specialized fiber-optic channels. The system integrates biophoton signal processing with Electroacupuncture (EAV) testing and visual session control.

This repository contains all core software modules for the system, including the Electron-based touchscreen interface, Flask backend services, Teensy firmware, and scripts for Raspberry Pi deployment.

## Key Features

- Real-time session visualization and control  
- Optical signal measurement via fiber-connected hand, foot, and SPIN interfaces  
- EAV point testing and resistance-based analysis  
- Programmable feedback filters and frequency delivery  
- Session logging and structured remedy response assessment  

## Architecture

- **Electron UI**: Touch-based control panel running on Raspberry Pi 5  
- **Flask Backend**: Manages session state, signal routing, and database interactions  
- **Teensy MCU**: Handles real-time hardware communication (USB serial)  
- **SQLite**: Local database for logging sessions and managing configuration  
- **Bash Scripts**: Setup and deployment utilities for kiosk mode operation  

## Intended Use

The system is designed for trained practitioners operating in clinical, wellness, or research environments. It supports precise EAV testing workflows, biophoton measurement via SPIN devices, and light-feedback-based treatment tailored to patient responses.

## License

This is a **private, closed-source project**. All software, hardware schematics, and documentation are strictly confidential and the intellectual property of the client.

See [LICENSE](./biophoton_system/LICENSE.md) for legal terms.
