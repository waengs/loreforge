# CreateInk

Private fanfiction and worldbuilding studio for mobile. Build characters, relationships, plot seeds, and world rules, then write stories yourself or generate scenes with a **local [Ollama](https://ollama.com)** instance.

## Stack

- **Expo SDK 56** + **React Native**
- **Expo Router** (file-based navigation)
- **Zustand** + **AsyncStorage** (offline-first, on-device storage)
- **React Native Paper** + custom literary dark theme (Cinzel / Lora)
- **Ollama** HTTP API for local AI generation

## Quick start

```bash
npm install --legacy-peer-deps
npm start
```

- Scan the QR code with **Expo Go** on your phone, or
- Press `a` for Android emulator / `i` for iOS simulator / `w` for web

Copy `.env.example` to `.env` if you want default Ollama host/model values for device testing.

## Ollama setup

1. Install Ollama on your PC from [ollama.com](https://ollama.com) and keep it running.

2. Pull a model:

   ```powershell
   ollama pull llama3
   ```

3. In CreateInk → **Settings** (gear on Home):
   - Tap **Test connection**, you should see a green connected state.
   - Choose your model (e.g. `llama3`).
   - **Physical phone**: use your PC's Wi‑Fi IP (Settings can suggest one from Expo).
   - **Android emulator**: use `10.0.2.2`.
   - **Same machine / iOS simulator**: use `localhost`.

4. **Windows firewall**: allow inbound TCP **11434** on private networks if the phone cannot connect.

5. Verify on PC: open `http://localhost:11434`, you should see "Ollama is running".

## App screens

| Tab / route | Purpose |
|-------------|---------|
| **Home** | Greeting, quick actions, latest story |
| **Characters** | Character grid, portraits, relationships graph |
| **World** | World rules and plot seeds (two tabs) |
| **Library** | Past stories, write manually or open story details |
| **GENERATE +** (FAB) | New AI generation flow (title, cast, plot, tags, rules) |
| **Generate** (hidden tab) | Same generator screen, opened from FAB or Library |
| **Settings** (hidden tab) | Ollama URL/model, auto-save, world export |

### Story flows

- **GENERATE +** → blank generator form → AI writes a new scene.
- **Continue generating** (from a saved story) → pre-fills cast/plot/tags/rules/title; existing text shows under "Your story so far".
- **Add story → Write yourself** → manual editor with optional **Continue with AI**.

Data stays on the device (AsyncStorage). No accounts or cloud sync.

## Project layout

```
createink/
├── app/                    # Expo Router screens
│   ├── _layout.js          # Root layout (Paper, fonts, stack)
│   ├── index.js            # Splash / hydration gate
│   └── (tabs)/             # Home, Characters, World, Library, Generate, Settings
├── assets/                 # App icon, favicon, CreateInk logo
├── components/             # UI (home, library, world, characters, shared)
├── constants/              # theme, fonts, greetings, relationship types
├── services/               # Ollama client, relationship PDF export
├── store/                  # Zustand stores (lore, settings, generate draft)
├── utils/                  # tags, timeAgo, graph geometry
├── app.json                # Expo config
├── app.config.js           # Expo plugins (fonts, image picker, cleartext)
├── babel.config.js
├── package.json
└── .gitignore
```

### Required assets (`assets/`)

| File | Used for |
|------|----------|
| `CreateInk_logo.png` | In-app logo, splash screen, web favicon |
| `CreateInk_launcher.png` | APK / home screen icon (padded `CreateInk_logo`, won't crop) |

### Generated at runtime (do not commit)

- `node_modules/`, run `npm install` after clone
- `.expo/`, local Expo cache

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npm run web` | Open in browser |

## Android APK (EAS Build)

One-time setup:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Build a sideloadable APK:

```bash
eas build -p android --profile preview
```

When the build finishes, open the link in the terminal (or Expo dashboard) on your phone to download and install the APK. Point **Settings → Ollama URL** at your PC's Wi‑Fi IP (`http://192.168.x.x:11434`).
