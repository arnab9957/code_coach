console.log('CodeMentor AI v1.0 - Advanced Features Loaded');

// Session management
let sessionData = {
    currentProblem: null,
    chatHistory: [],
    userPreferences: {
        hintLevel: 'medium', // subtle, medium, detailed
        explanationStyle: 'step-by-step', // concise, step-by-step, detailed
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
        console.log('Session data loaded:', sessionData);
    }
});

// Save session data
function saveSession() {
    chrome.storage.local.set({ sessionData }, () => {
        console.log('Session saved');
    });
}

// Enhanced hint generation with personalization
function getPersonalizedHint(title, userLevel = 'medium') {
    const text = title.toLowerCase();
    const hintsUsed = sessionData.totalHintsUsed;

    // Adaptive hint based on user experience
    const isExperienced = hintsUsed > 10;
    const hintPrefix = isExperienced ? '🎯 Advanced Hint' : '💡 Helpful Hint';

    if (text.includes('two sum')) {
        const hints = {
            subtle: `${hintPrefix}: Think about what you need to find for each number...`,
            medium: `${hintPrefix}: Use a hash map to store numbers you've seen. For each new number, check if its complement exists.`,
            detailed: `${hintPrefix}: 
1. Create a hash map to store {value: index}
2. For each number, calculate complement = target - current
3. If complement exists in map, return both indices
4. Otherwise, store current number
Time: O(n), Space: O(n)`
        };
        return hints[userLevel] || hints.medium;
    }

    if (text.includes('valid parentheses')) {
        const hints = {
            subtle: `${hintPrefix}: What data structure is perfect for matching pairs?`,
            medium: `${hintPrefix}: Use a stack! Push opening brackets, pop when you find matching closing ones.`,
            detailed: `${hintPrefix}:
1. Initialize empty stack
2. For each character:
   - Opening bracket ('(', '[', '{'): push to stack
   - Closing bracket: check if it matches stack top
   - If matches: pop stack, else return false
3. Return stack.isEmpty()
Time: O(n), Space: O(n)`
        };
        return hints[userLevel] || hints.medium;
    }

    if (text.includes('median')) {
        return `${hintPrefix}: This is a Hard problem! Think binary search on the smaller array. You need to partition both arrays so that left side has equal elements as right side.`;
    }

    return `${hintPrefix}: Break down the problem step by step. Consider what data structure would be most efficient for this type of operation.`;
}

// Enhanced approach explanation
function getDetailedApproach(title) {
    const text = title.toLowerCase();
    const explanationsViewed = sessionData.totalExplanationsViewed;
    const isExperienced = explanationsViewed > 5;

    if (text.includes('two sum')) {
        return `📋 Complete Solution Strategy for "${title}":

**🔍 Problem Analysis:**
• Input: Array of integers + target sum
• Output: Indices of two numbers that add up to target
• Constraint: Exactly one solution exists

**⚡ Optimal Algorithm (Hash Map Approach):**
1. **Initialize**: Create empty hash map {value: index}
2. **Iterate**: For each number at index i:
   - Calculate complement = target - nums[i]
   - If complement exists in map: return [map[complement], i]
   - Store nums[i] with index i in map
3. **Complexity**: Time O(n), Space O(n)

**🚀 Implementation Template:**
\`\`\`python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
\`\`\`

**🎯 Key Insights:**
• One-pass solution possible
• Hash map provides O(1) lookup
• Store index, not just the value
${isExperienced ? '\n• Consider follow-up: What if array is sorted?' : ''}`;
    }

    if (text.includes('valid parentheses')) {
        return `📋 Complete Solution Strategy for "${title}":

**🔍 Problem Analysis:**
• Input: String containing '()', '[]', '{}'
• Output: Boolean - true if valid, false otherwise
• Rules: Open brackets must be closed in correct order

**⚡ Optimal Algorithm (Stack Approach):**
1. **Initialize**: Create empty stack
2. **Process**: For each character:
   - Opening bracket: push to stack
   - Closing bracket: check if matches stack top
   - If matches: pop stack, else return false
3. **Validate**: Return stack.isEmpty()
4. **Complexity**: Time O(n), Space O(n)

**🚀 Implementation Template:**
\`\`\`python
def isValid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    
    return not stack
\`\`\`

**🎯 Key Insights:**
• Stack perfect for matching pairs
• Use mapping for bracket pairs
• Empty stack at end means valid
${isExperienced ? '\n• Consider: What about nested brackets?' : ''}`;
    }

    return `📋 General Problem-Solving Framework for "${title}":

**🔍 Analysis Phase:**
1. Understand input/output requirements
2. Identify constraints and edge cases
3. Recognize problem patterns

**⚡ Solution Design:**
1. Start with brute force approach
2. Identify bottlenecks
3. Choose optimal data structures
4. Optimize algorithm complexity

**🚀 Implementation:**
1. Write clean, readable code
2. Handle edge cases
3. Test with examples
4. Verify complexity requirements`;
}

// Screenshot capture functionality
async function captureScreenshot() {
    try {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 90
        });
        return dataUrl;
    } catch (error) {
        console.error('Screenshot capture failed:', error);
        return null;
    }
}

// Progress tracking
function updateProgress(action, problemTitle) {
    if (action === 'generateHint') {
        sessionData.totalHintsUsed++;
    } else if (action === 'explainApproach') {
        sessionData.totalExplanationsViewed++;
    }

    // Track problem interaction
    if (!sessionData.problemsSolved.includes(problemTitle)) {
        sessionData.chatHistory.push({
            problem: problemTitle,
            action: action,
            timestamp: new Date().toISOString()
        });
    }

    saveSession();
}

// Message handler with advanced features
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);

    if (request.action === 'test') {
        sendResponse('Background connected - Advanced Features Ready');
        return;
    }

    if (request.action === 'getSessionData') {
        sendResponse(sessionData);
        return;
    }

    if (request.action === 'updatePreferences') {
        sessionData.userPreferences = { ...sessionData.userPreferences, ...request.preferences };
        saveSession();
        sendResponse('Preferences updated');
        return;
    }

    if (request.action === 'captureScreen') {
        captureScreenshot().then(dataUrl => {
            sendResponse({ success: !!dataUrl, dataUrl });
        });
        return true;
    }

    if (request.action === 'generateHint') {
        updateProgress('generateHint', request.title);
        const hint = getPersonalizedHint(request.title, sessionData.userPreferences.hintLevel);
        sendResponse(hint);
        return;
    }

    if (request.action === 'explainApproach') {
        updateProgress('explainApproach', request.title);
        const approach = getDetailedApproach(request.title);
        sendResponse(approach);
        return;
    }

    if (request.action === 'analyzeCode') {
        sendResponse(`🔧 Advanced Code Analysis for "${request.title}":

**📊 Analysis Results:**
• Feature coming soon with AI integration
• Will analyze: syntax, logic, optimization opportunities
• Will provide: complexity analysis, best practices

**🎯 Current Capabilities:**
• Problem-specific hints
• Detailed solution approaches
• Progress tracking
• Session management

**💡 Tip:** Use Get Hint and Explain Approach for comprehensive guidance!

**📈 Your Progress:**
• Hints used: ${sessionData.totalHintsUsed}
• Explanations viewed: ${sessionData.totalExplanationsViewed}
• Problems explored: ${sessionData.chatHistory.length}`);
        return;
    }

    if (request.action === 'clearSession') {
        sessionData = {
            currentProblem: null,
            chatHistory: [],
            userPreferences: sessionData.userPreferences, // Keep preferences
            problemsSolved: [],
            totalHintsUsed: 0,
            totalExplanationsViewed: 0
        };
        saveSession();
        sendResponse('Session cleared');
        return;
    }
});

// Auto-save session every 5 minutes
setInterval(saveSession, 5 * 60 * 1000);
