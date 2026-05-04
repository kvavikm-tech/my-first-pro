# Testing the Mobile App with Expo Go (No Xcode)

This guide explains how to run and test the mobile app using Expo Go.
It does not require Xcode.

## Prerequisites

- Node.js installed
- npm installed
- A phone with the Expo Go app installed
  - iOS: install Expo Go from the App Store
  - Android: install Expo Go from Google Play
- Your phone and computer on the same Wi-Fi network

## 1. Install mobile dependencies

From the project root:

npm run mobile:install

## 2. Start the Expo development server

From the project root:

npm run mobile:start

This runs:

cd ui/mobile && npm start

## 3. Open the app in Expo Go

After the server starts, Expo shows a QR code in the terminal.

- iOS:
  - Open the Camera app
  - Scan the QR code
  - Tap the Expo Go link
- Android:
  - Open Expo Go
  - Tap "Scan QR Code"
  - Scan the QR code from the terminal

The app should load on your phone.

## 4. Test your changes

- Edit files in ui/mobile/src
- Save the file
- Expo Go should reload automatically

If it does not reload, shake the phone and choose Reload.

## Optional scripts in this project

These scripts exist in package.json:

- npm run mobile:start
- npm run mobile:web
- npm run mobile:tunnel
- npm run mobile:android
- npm run mobile:ios

For Expo Go testing, use mobile:start. You do not need mobile:ios (Xcode simulator).

## Troubleshooting

### QR code does not open the app

- Make sure the phone and computer are on the same Wi-Fi
- Restart Expo server and rescan the QR code
- In Expo terminal UI, switch connection mode from LAN to Tunnel

### Unknown error: Could not connect to server (exp://...:8081)

If Expo Go shows this error, start in Tunnel mode:

npm run mobile:tunnel

Then scan the new QR code.

If it still fails:

- Sign in to Expo Go on your phone and sign in in terminal if prompted
- Turn off VPN on both phone and computer
- Allow Node.js through Windows Firewall on Private network
- Check the exp URL shown in terminal. It must have 4 number blocks (for example: 192.168.1.20:8081)
- Restart with clean cache in tunnel mode:

npx expo start -c --tunnel

### Metro bundler cache issues

In ui/mobile, run:

npx expo start -c

### Port already in use

Stop other Expo/Metro processes and run mobile:start again.

## Quick command summary

From project root:

npm run mobile:install
npm run mobile:start
npm run mobile:tunnel
