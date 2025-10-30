console.log('CodeMentor AI v1.0 - Phase 4 with Gemini Nano');

// Session management
let sessionData = {
    currentProblem: null,
    chatHistory: [],
    userPreferences: {
        hintLevel: 'medium',
        explanationStyle: 'step-by-step',
        theme: 'default'
    },
    problemsSolved: [],
    totalHintsUsed: 0,
    totalExplanationsViewed: 0
};

// Load session data on startup
chrome.storage.local.get(['sessionData'], (result) => {
    if (result.sessionData) {
        sessionData = { ...sessionData, ...result.sessionData };
        console.log('Session loaded');
    }
});

// Save session data
function saveSession() {
    chrome.storage.local.set({ sessionData }, () => {
        console.log('Session saved');
    });
}

// Setup auto-save with alarms (MV3 compatible)
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('autosaveSession', { periodInMinutes: 5 });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create('autosaveSession', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autosaveSession') {
        saveSession();
    }
});

// Gemini Nano AI Integration
let aiAvailable = false;

// Initialize AI in content script context
async function initializeAI(tabId) {
    try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'initAI' });
        aiAvailable = response.available;
        console.log('AI availability:', aiAvailable);
        return aiAvailable;
    } catch (error) {
        console.log('AI initialization failed:', error);
        aiAvailable = false;
        return false;
    }
}

// AI Prompt via content script
async function promptAI(message, tabId) {
    if (!aiAvailable) {
        return null;
    }
    try {
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'promptAI',
            message: message
        });
        if (response && response.error) {
            console.error('Gemini Nano prompt error:', response.error);
            aiAvailable = false; // will trigger re-initialization on next query
            return null;
        }
        return response.result;
    } catch (error) {
        console.error('AI prompt error:', error);
        aiAvailable = false;
        return null;
    }
}

// Enhanced hint generation with AI fallback
async function generateHint(title, difficulty = 'medium', tabId = null) {
    // Try AI first if available
    if (aiAvailable && tabId) {
        const aiHint = await promptAI(`Give a subtle hint for this LeetCode problem: "${title}". Keep it brief and don't give away the solution.`, tabId);
        if (aiHint) {
            return `🤖 AI Hint: ${aiHint}`;
        }
    }
    
    // Fallback to hardcoded hints
    const text = title.toLowerCase();
    
    if (text.includes('two sum')) {
        return '💡 Hint: What if you could remember every number you\'ve seen? Think about O(1) lookups.';
    }
    if (text.includes('valid parentheses')) {
        return '💡 Hint: Last opened bracket should be first to close. What data structure follows this pattern?';
    }
    if (text.includes('merge') && text.includes('sorted')) {
        return '💡 Hint: Compare the smallest unused elements from both arrays.';
    }
    
    return '💡 Hint: Break the problem into smaller parts. What pattern do you recognize?';
}

// Enhanced approach explanation with AI
async function explainApproach(title, tabId = null) {
    // Try AI first if available
    if (aiAvailable && tabId) {
        const aiExplanation = await promptAI(`Explain the optimal approach to solve this LeetCode problem: "${title}". Include algorithm steps and time complexity.`, tabId);
        if (aiExplanation) {
            return `🤖 AI Explanation: ${aiExplanation}`;
        }
    }
    
    // Fallback explanations
    const text = title.toLowerCase();
    
    if (text.includes('two sum')) {
        return `📋 Step-by-Step Approach for "${title}":

**Algorithm: Hash Map (One Pass)**
1. Create empty hash map: {value → index}
2. For each number at index i:
   • Calculate complement = target - nums[i]
   • If complement exists in map: return [map[complement], i]
   • Store nums[i] → i in map
3. Return result

**Time Complexity:** O(n)
**Space Complexity:** O(n)
**Key Insight:** Trade space for time using hash map`;
    }
    
    return `📋 General Approach for "${title}":

**Problem Analysis:**
1. Identify input/output requirements
2. Find constraints and edge cases
3. Recognize algorithmic patterns

**Solution Strategy:**
1. Start with brute force approach
2. Identify bottlenecks
3. Optimize using appropriate data structures
4. Verify time/space complexity`;
}

// Enhanced code analysis
function countKeyword(code, keyword) {
    return (code.match(new RegExp('\\b' + keyword + '\\b', 'g')) || []).length;
}

async function analyzeCode(title, code, tabId = null) {
    if (!code || code.trim().length === 0) {
        return '🔧 Code Analysis: No code detected. Please write some code first, then try again.';
    }
    
    // Try AI analysis first
    if (aiAvailable && tabId) {
        const aiAnalysis = await promptAI(`Analyze this code for LeetCode problem "${title}": ${code}. Provide feedback on correctness, efficiency, and improvements.`, tabId);
        if (aiAnalysis) {
            return `🤖 AI Code Analysis: ${aiAnalysis}`;
        }
    }
    
    // Fallback analysis
    const c = code.toLowerCase();
    let report = `🔍 Analysis for "${title}":\n\n`;
    
    const forCount = countKeyword(c, 'for');
    if (forCount >= 2) report += '⚠️ Nested loops detected (possible O(n²) complexity).\n\n';
    if (!/\breturn\b/.test(c)) report += '❌ Missing "return" statement.\n\n';
    if (c.includes('sort')) report += '📊 Sorting detected → O(n log n) complexity.\n\n';
    
    if (title.toLowerCase().includes('two sum')) {
        if (c.includes('map') || c.includes('dict') || c.includes('{}')) {
            report += '✅ HashMap used — optimal approach!\n\n';
        } else if (forCount >= 2) {
            report += '💡 Suggest using a HashMap for O(n) time complexity.\n\n';
        }
    }
    
    return report + '**Next Steps:**\n• Test with edge cases\n• Verify time complexity\n• Check for off-by-one errors';
}

// Update progress tracking
function updateProgress(action, problemTitle) {
    if (action === 'generateHint') {
        sessionData.totalHintsUsed++;
    } else if (action === 'explainApproach') {
        sessionData.totalExplanationsViewed++;
    }
    
    sessionData.chatHistory.push({
        problem: problemTitle,
        action: action,
        timestamp: new Date().toISOString()
    });
    
    saveSession();
}

// Message handler with proper async handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);

    if (request.action === 'test') {
        sendResponse(`Background active ✅ - AI ${aiAvailable ? 'Ready' : 'Not Available'}`);
        return;
    }

    if (request.action === 'generateHint') {
        updateProgress('generateHint', request.title);
        
        generateHint(request.title, request.difficulty, sender.tab?.id).then(hint => {
            sendResponse(hint);
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'explainApproach') {
        updateProgress('explainApproach', request.title);
        
        explainApproach(request.title, sender.tab?.id).then(explanation => {
            sendResponse(explanation);
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'analyzeCode') {
        updateProgress('analyzeCode', request.title);
        
        analyzeCode(request.title, request.code, sender.tab?.id).then(analysis => {
            sendResponse(analysis);
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'getSessionData') {
        chrome.storage.local.get(['sessionData'], (result) => {
            sendResponse(result.sessionData || sessionData);
        });
        return true;
    }

    if (request.action === 'clearSession') {
        sessionData = {
            currentProblem: null,
            chatHistory: [],
            userPreferences: sessionData.userPreferences,
            problemsSolved: [],
            totalHintsUsed: 0,
            totalExplanationsViewed: 0
        };
        saveSession();
        sendResponse('Session cleared');
        return;
    }

    if (request.action === 'initializeAI') {
        initializeAI(sender.tab?.id).then(available => {
            sendResponse({ available });
        });
        return true;
    }

    if (request.action === 'updatePreferences') {
        // Update preferences inside sessionData
        sessionData.userPreferences = {
            ...sessionData.userPreferences,
            ...(request.preferences || {})
        };
        saveSession();
        sendResponse({ success: true, preferences: sessionData.userPreferences });
        return;
    }

    if (request.action === 'captureScreen') {
        // service_worker: can't use chrome.tabs.captureVisibleTab unless host_permissions allow
        if (chrome.tabs && chrome.tabs.captureVisibleTab) {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    sendResponse({ success: false, error: chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Unknown error' });
                } else {
                    sendResponse({ success: true, dataUrl });
                }
            });
            return true; // async response
        } else {
            sendResponse({ success: false, error: 'captureVisibleTab not available in this context.' });
            return;
        }
    }
});
