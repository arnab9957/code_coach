# CodeMentor AI (Chrome Extension)

CodeMentor AI is a privacy-friendly coding assistant for LeetCode and NeetCode. It provides subtle hints, detailed approaches, and quick code analysis directly on problem pages. When supported, it uses on-device AI (Gemini Nano) for low-latency, offline-friendly help, and falls back gracefully when AI is unavailable.

## Features
- Smart hints and detailed solution approaches
- Code analysis of your current editor content (Monaco/CodeMirror)
- Voice commands (hint, explain, analyze, screenshot, open settings)
- Real-time code monitoring (optional)
- Progress tracking: hints, explanations, problems explored
- On-device AI via Gemini Nano when available

## Requirements
- Google Chrome (or Chromium-based) with Manifest V3 support
- Optional: Gemini Nano availability in the browser (`window.ai.languageModel`)

## Installation (Developer Mode)
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" (top-right toggle).
4. Click "Load unpacked" and select the `extension/` folder.
5. Pin the extension to your toolbar for quick access.

## Permissions Used (Why)
- `activeTab`, `tabs`, `scripting`: Inject and communicate with content scripts
- `storage`: Persist your session and preferences locally
- `alarms`: Auto-save your session every 5 minutes
- `tabCapture`: Capture screenshots (for the Smart Capture feature)
- `host_permissions`: Restricted to `leetcode.com` and `neetcode.io`

## Quick Start
1. Open a LeetCode or NeetCode problem.
2. Click the CodeMentor AI icon to open the popup.
3. Use one of the main actions:
   - Smart Hint: subtle guidance tailored to the problem
   - Detailed Approach: step-by-step solution strategy
   - Code Analysis: review the code currently in your editor
4. Try the mic button for voice commands if your browser allows microphone access.

## Voice Commands (Examples)
- "Give me a hint"
- "Explain the approach"
- "Analyze my code"
- "Take a screenshot"
- "Open settings"

## Settings
- Hint Level: subtle, medium, detailed
- Explanation Style: concise, step-by-step, detailed
- Toggle: voice commands, code monitoring
- Clear session data

## How It Works
- `content-script.js` parses the problem page (title, difficulty, description, examples, constraints) and extracts code from Monaco/CodeMirror.
- `background.js` manages session persistence (via `chrome.storage.local`), autosave (via `chrome.alarms`), and orchestrates on-device AI prompts by messaging the content script.
- `popup.html`, `popup.js`, `styles.css` power the UI and interactions.

## Gemini Nano Integration
- Checks `window.ai.languageModel.capabilities()` in page context.
- If available, creates a session to generate hints, explanations, and code feedback.
- If not available, uses robust non-AI fallbacks.

## Troubleshooting
- "Please navigate to a LeetCode problem page": open a problem page before using the popup.
- Voice errors:
  - `not-allowed`: allow microphone access in the browser address bar
  - `no-speech` / `audio-capture`: check mic/OS audio settings
- AI unavailable:
  - You’ll see a friendly error; the extension falls back automatically
  - Ensure your Chrome supports on-device AI (Gemini Nano) and it’s enabled
- "No code detected":
  - Ensure code exists in the editor; if live extraction fails, cached code is used when available.

## Development
- Load the `extension/` folder via "Load unpacked" in Chrome.
- Key files:
  - `manifest.json` – MV3 manifest and permissions
  - `content-script.js` – page parsing, code extraction, AI session
  - `background.js` – session, autosave, messaging, AI orchestration
  - `popup.html`, `popup.js`, `styles.css` – UI and interactions
- Use Chrome DevTools → Applications → Service Workers to view background logs.

## Tech Stack
- Languages: JavaScript (ES6+), HTML, CSS
- Platform: Chrome Extension (Manifest V3)
- Browser APIs: `chrome.runtime`, `chrome.tabs`, `chrome.scripting`, `chrome.storage`, `chrome.alarms`, `chrome.tabCapture`
- AI: Gemini Nano Prompt API (`window.ai.languageModel`)
- Editors: Monaco, CodeMirror (DOM-based extraction)

## Roadmap
- Deeper code understanding: test case generation, complexity checks
- Personalized learning paths with adaptive difficulty
- Multi-language support and richer templates
- Optional cloud sync of session data
- Support beyond LeetCode/NeetCode

## License
MIT