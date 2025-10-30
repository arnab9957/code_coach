⚙️ Step 1 — Check Extension Setup

Open Chrome → chrome://extensions/

Turn on Developer mode (top-right corner).

Click Reload on your extension.

Click:

Inspect background page (for Manifest V2), or

Service Worker (for Manifest V3)

In that console, run:

chrome.runtime.sendMessage({ action: 'test' }, r => console.log(r));


✅ If you see logs or a response → background script loaded correctly.
❌ If nothing → move to Step 2.

🧾 Step 2 — Verify manifest.json
For Manifest V3
{
  "manifest_version": 3,
  "name": "Genini Nano AI",
  "version": "1.0",
  "background": { "service_worker": "background.js" },
  "permissions": ["storage", "alarms"]
}

For Manifest V2
{
  "manifest_version": 2,
  "name": "Genini Nano AI",
  "version": "1.0",
  "background": { "scripts": ["background.js"], "persistent": true },
  "permissions": ["storage"]
}


Tip: If you’re on MV3 (most likely), background.js runs as a service worker — meaning no always-on background execution.

⏰ Step 3 — Replace setInterval with Chrome Alarms (MV3)

If you had:

setInterval(saveSession, 5 * 60 * 1000);


Replace it with:

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('autosaveSession', { periodInMinutes: 5 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('autosaveSession', { periodInMinutes: 5 });
});
chrome.alarms.onAlarm.addListener(a => {
  if (a.name === 'autosaveSession') saveSession();
});


✅ Works even when the background service worker sleeps.

💬 Step 4 — Fix onMessage Handling

Always return true when responding asynchronously.

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  console.log('Message:', req);

  if (req.action === 'test') {
    sendResponse('Background active ✅');
    return; // synchronous OK
  }

  if (req.action === 'getSessionData') {
    chrome.storage.local.get(['sessionData'], res => {
      sendResponse(res.sessionData || {});
    });
    return true; // keeps the channel open
  }

  if (req.action === 'analyzeCode') {
    const result = analyzeCode(req.title, req.code);
    sendResponse(result);
    return true;
  }
});

🧩 Step 5 — Improve analyzeCode Logic

Replace the weak checks with better ones:

function countKeyword(code, kw) {
  return (code.match(new RegExp('\\b' + kw + '\\b', 'g')) || []).length;
}

function analyzeCode(title, code) {
  if (!code || !code.trim()) return '⚠️ No code provided.';

  const c = code.toLowerCase();
  let report = `🔍 Analysis for "${title}":\n\n`;

  const forCount = countKeyword(c, 'for');
  if (forCount >= 2) report += '⚠️ Nested loops (possible O(n²) complexity).\n\n';
  if (!/\breturn\b/.test(c)) report += '❌ Missing "return" statement.\n\n';
  if (c.includes('sort')) report += '📊 Sorting detected → O(n log n).\n\n';

  if (title.toLowerCase().includes('two sum')) {
    if (c.includes('map') || c.includes('dict') || c.includes('{}')) {
      report += '✅ HashMap used — optimal approach.\n\n';
    } else if (forCount >= 2) {
      report += '💡 Suggest using a HashMap for O(n) time.\n\n';
    }
  }

  return report + '---\n**Next steps:** test edge cases & time complexity.';
}

💾 Step 6 — Reliable Session Save
let sessionData = { currentProblem: null, chatHistory: [] };

function saveSession() {
  chrome.storage.local.set({ sessionData });
}

// Load session when background starts
chrome.storage.local.get(['sessionData'], res => {
  if (res.sessionData) sessionData = { ...sessionData, ...res.sessionData };
});

🧪 Step 7 — Testing Commands

Run these in your background console:

chrome.runtime.sendMessage({ action: 'test' }, console.log);
chrome.runtime.sendMessage({ action: 'getSessionData' }, console.log);
chrome.runtime.sendMessage({
  action: 'analyzeCode',
  title: 'Two Sum',
  code: 'function twoSum(nums,target){for(let i=0;i<nums.length;i++){for(let j=i+1;j<nums.length;j++){if(nums[i]+nums[j]==target)return [i,j];}}}'
}, console.log);


✅ Expect responses in the console with analysis or logs.

🐞 Step 8 — Common Errors & Fixes
Error	Meaning	Fix
Unchecked runtime.lastError	Message channel closed before sendResponse	Add return true
No logs appear	Background not loaded	Check manifest paths and reload
setInterval not firing	MV3 service worker slept	Use chrome.alarms
Data not saved	Missing "storage" permission	Add to manifest
✅ Step 9 — Verify Everything Works

Reload the extension.

Open the service worker console.

Trigger a few messages (test, analyzeCode).

See logs and response output.

Watch the alarm auto-save trigger every 5 minutes.