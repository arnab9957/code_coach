CodeMentor AI Chrome Extension — Step-by-Step Build Guide
1. Project Initialization
Install Prerequisites

Update Chrome to the latest version (138+)

Install Node.js (for local builds, if needed)

Enable Gemini Nano in Chrome

Go to chrome://flags/#prompt-api-for-gemini-nano-multimodal-input

Set the flag to "Enabled", then restart Chrome

Create Project Directory

bash
mkdir codementor-ai
cd codementor-ai
mkdir extension
cd extension
2. Extension Setup
Create File Structure

text
extension/
├── manifest.json
├── popup.html
├── popup.js
├── content-script.js
├── background.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
Setup manifest.json (Manifest V3)

Set extension permissions:

"activeTab", "scripting", "storage", "tabs"

"host_permissions": [ "https://leetcode.com/*" ]

Register content scripts, popup, and background script (service worker)

Add icons

3. Building The User Interface
Create popup.html

Basic HTML for the popup UI

Include buttons: Get Hint, Explain Approach, Analyze Code, (optional) Screenshot/Voice

Design UI in styles.css

Modern, clean look for popup

Responsive layout for all screen sizes

Write popup.js

Handles UI events

Communicates with background.js and content-script.js

4. Content Script: LeetCode Integration
Develop content-script.js

Extracts problem title, description, difficulty, tags, and user code from LeetCode

Sends extracted data to popup or background script on request

5. Core AI Integration
Implement AI Session in background.js

Use Chrome's Prompt API to create a Gemini Nano model session

Store/reuse a session for efficient token management

Add Core AI Features

Generate a hint (nudge, not spoiler) on request

Provide step-by-step solution explanation (with complexity)

Analyze user code for bugs, optimizations, and style

Handle messaging between popup, background, and content scripts

6. Multimodal (Image, Audio) Features
Enable Screenshot Support

Add "tabCapture" permission in manifest.json

Use Chrome API to capture and send code window screenshot for AI analysis

Enable Voice Query (Optional)

Use Web APIs (MediaRecorder) to capture voice

Send audio blob to background for Gemini Nano processing (if API supports)

7. Hybrid AI & Personalization (Optional Advanced)
Integrate Firebase AI Logic

Create firebase-config.js with keys from Firebase Console

Use hybrid AI strategy for (optional) cloud-based progress analytics

Implement Learning Tracker

Track user’s problem patterns, wins, and weak topics

Periodically generate personalized recommendations

8. Testing & Debugging
Load The Extension In Chrome
