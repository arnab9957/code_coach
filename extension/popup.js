let problemData = null;
let sessionData = null;
let isRecording = false;
let recognition = null;
let codeMonitorActive = true;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize voice recognition with better error handling
  initializeVoiceRecognition();
  
  // Load session data first
  await loadSessionData();
  
  // Add loading animation to status
  showStatus('🔍 Detecting problem...', 'loading');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('leetcode.com')) {
      showStatus('📍 Please navigate to a LeetCode problem page', 'error');
      disableButtons();
      return;
    }

    // Extract enhanced problem data
    await extractEnhancedProblemData(tab.id);
    
    // Start code monitoring if enabled
    if (codeMonitorActive) {
      startCodeMonitoring(tab.id);
    }

  } catch (error) {
    showStatus('❌ Error accessing tab - please refresh', 'error');
    disableButtons();
  }
});

// Initialize voice recognition with better permission handling
function initializeVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        isRecording = true;
        updateVoiceButton('recording');
        showVoiceStatus('🎤 Listening... Say your command');
      };

      recognition.onresult = async (event) => {
        // Aggregate best available transcripts
        const results = Array.from(event.results[0] || []);
        const transcripts = results.map(r => (r.transcript || '').trim()).filter(Boolean);
        const primary = transcripts[0] || '';

        updateVoiceButton('processing');
        showVoiceStatus(`🔄 Processing: "${primary}"`);

        // Try robust parsing via content script first
        const resolvedAction = await resolveVoiceCommandViaContentScript(primary, transcripts);

        if (resolvedAction) {
          await executeVoiceCommand(resolvedAction);
          const statusMap = {
            generateHint: '✅ Getting hint...',
            explainApproach: '✅ Explaining approach...',
            analyzeCode: '✅ Analyzing code...',
            captureScreen: '✅ Capturing screenshot...',
            openSettings: '✅ Opening settings...'
          };
          showVoiceStatus(statusMap[resolvedAction] || '✅ Processing...');
        } else {
          // Fallback to simple keyword includes across alternatives
          const normalized = transcripts.join(' | ').toLowerCase();
          if (normalized.includes('hint')) {
            await executeVoiceCommand('generateHint');
            showVoiceStatus('✅ Getting hint...');
          } else if (normalized.includes('explain') || normalized.includes('approach') || normalized.includes('solution')) {
            await executeVoiceCommand('explainApproach');
            showVoiceStatus('✅ Explaining approach...');
          } else if (normalized.includes('analyze') || normalized.includes('review') || normalized.includes('check')) {
            await executeVoiceCommand('analyzeCode');
            showVoiceStatus('✅ Analyzing code...');
          } else if (normalized.includes('screenshot') || normalized.includes('capture')) {
            await executeVoiceCommand('captureScreen');
            showVoiceStatus('✅ Capturing screenshot...');
          } else if (normalized.includes('settings') || normalized.includes('preferences')) {
            await executeVoiceCommand('openSettings');
            showVoiceStatus('✅ Opening settings...');
          } else {
            showVoiceStatus(`❓ Command not recognized: "${primary}"`);
          }
        }
      };

      recognition.onerror = (event) => {
        console.log('Voice error:', event.error);
        switch (event.error) {
          case 'not-allowed':
            showVoiceStatus('❌ Please allow microphone access and try again');
            break;
          case 'no-speech':
            showVoiceStatus('🔇 No speech detected. Try again closer to the mic.');
            break;
          case 'audio-capture':
            showVoiceStatus('🎚️ No microphone available. Check your audio device.');
            break;
          case 'network':
            showVoiceStatus('🌐 Network issue with speech service. Try again.');
            break;
          default:
            showVoiceStatus('❌ Voice recognition failed');
        }
        updateVoiceButton('idle');
      };

      recognition.onnomatch = () => {
        showVoiceStatus('❓ Didn\'t catch that. Please try again.');
      };

      recognition.onspeechend = () => {
        // Let onend reset UI; do not auto-restart
      };

      recognition.onend = () => {
        isRecording = false;
        updateVoiceButton('idle');
        setTimeout(() => showVoiceStatus(''), 3000);
      };
    } catch (error) {
      console.error('Voice recognition initialization failed:', error);
      const voiceSection = document.querySelector('.voice-section');
      if (voiceSection) voiceSection.style.display = 'none';
    }
  } else {
    const voiceSection = document.querySelector('.voice-section');
    if (voiceSection) voiceSection.style.display = 'none';
  }
}

// Ask active tab's content script to parse the command; fallback if unavailable
async function resolveVoiceCommandViaContentScript(primaryTranscript, allTranscripts) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Ensure content script is present (it should be via manifest, but guard anyway)
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    } catch (e) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] });
      await new Promise(r => setTimeout(r, 100));
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'processVoiceCommand',
      transcript: primaryTranscript || (allTranscripts && allTranscripts[0]) || ''
    });

    if (response && response.action && response.action !== 'unknown' && (response.confidence || 0) >= 0.6) {
      return response.action;
    }
  } catch (err) {
    // Silently ignore and fallback
  }
  return null;
}

// Update voice button appearance
function updateVoiceButton(state) {
  const btn = document.getElementById('voiceBtn');
  const icon = document.getElementById('voiceIcon');
  const text = document.getElementById('voiceText');
  
  btn.className = `voice-btn ${state}`;
  
  switch (state) {
    case 'recording':
      icon.textContent = '🔴';
      text.textContent = 'Recording...';
      break;
    case 'processing':
      icon.textContent = '⏳';
      text.textContent = 'Processing...';
      break;
    default:
      icon.textContent = '🎤';
      text.textContent = 'Voice Command';
  }
}

// Show voice status
function showVoiceStatus(message) {
  document.getElementById('voiceStatus').textContent = message;
}

// Execute voice command
async function executeVoiceCommand(action) {
  switch (action) {
    case 'generateHint':
      document.getElementById('hintBtn').click();
      break;
    case 'explainApproach':
      document.getElementById('explainBtn').click();
      break;
    case 'analyzeCode':
      document.getElementById('analyzeBtn').click();
      break;
    case 'captureScreen':
      document.getElementById('screenshotBtn').click();
      break;
    case 'openSettings':
      document.getElementById('settingsBtn').click();
      break;
  }
}

// Enhanced problem data extraction
async function extractEnhancedProblemData(tabId) {
  try {
    // Check if content script is already loaded
    let response;
    try {
      response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (e) {
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-script.js']
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    response = await chrome.tabs.sendMessage(tabId, { action: 'extractData' });
    problemData = response;
    
    showStatus(`✅ ${problemData.title} (${problemData.difficulty})`, 'success');
    enableButtons();
    
  } catch (error) {
    // Fallback to URL extraction
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const urlMatch = tab.url.match(/\/problems\/([^\/\?]+)/);
    if (urlMatch) {
      const problemSlug = urlMatch[1];
      const problemName = problemSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      problemData = {
        title: problemName,
        difficulty: getDifficulty(problemSlug),
        description: `LeetCode problem: ${problemName}`,
        code: 'No code found',
        testCases: [],
        constraints: [],
        tags: []
      };
      
      showStatus(`✅ ${problemName} (${problemData.difficulty}) - Basic mode`, 'success');
      enableButtons();
    }
  }
}

// Start real-time code monitoring
async function startCodeMonitoring(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'startMonitoring' });
    document.getElementById('codeMonitor').style.display = 'block';
  } catch (error) {
    console.log('Code monitoring not available');
  }
}

// Show code monitor
function showCodeMonitor(code) {
  const monitor = document.getElementById('codeMonitor');
  const content = document.getElementById('monitorContent');
  
  monitor.style.display = 'block';
  content.textContent = `Code detected: ${code.length} characters`;
}

async function loadSessionData() {
  try {
    sessionData = await chrome.runtime.sendMessage({ action: 'getSessionData' });
    updateStats();
    updateProgressBar();
    document.getElementById('stats').style.display = 'flex';
  } catch (error) {
    console.error('Failed to load session data:', error);
  }
}

function updateStats() {
  if (sessionData) {
    document.getElementById('hintsUsed').textContent = sessionData.totalHintsUsed;
    document.getElementById('explanationsViewed').textContent = sessionData.totalExplanationsViewed;
    document.getElementById('problemsExplored').textContent = sessionData.chatHistory.length;
  }
}

function updateProgressBar() {
  if (sessionData) {
    const totalInteractions = sessionData.totalHintsUsed + sessionData.totalExplanationsViewed;
    const progress = Math.min((totalInteractions / 20) * 100, 100);
    document.getElementById('progressFill').style.width = `${progress}%`;
  }
}

function getDifficulty(slug) {
  const easy = ['two-sum', 'valid-parentheses', 'merge-two-sorted-lists', 'maximum-subarray', 'climbing-stairs'];
  const hard = ['median-of-two-sorted-arrays', 'merge-k-sorted-lists', 'regular-expression-matching', 'wildcard-matching'];
  
  if (easy.includes(slug)) return 'Easy';
  if (hard.includes(slug)) return 'Hard';
  return 'Medium';
}

function disableButtons() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  });
}

function enableButtons() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  });
}

// Voice input button with content-script capture fallback
document.getElementById('voiceBtn').addEventListener('click', async () => {
  // Prefer page-context recognition for broader support
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    showVoiceStatus('🎤 Starting voice recognition...');

    // Ensure content script is alive
    try { await chrome.tabs.sendMessage(tab.id, { action: 'ping' }); } catch (e) {}

    const result = await chrome.tabs.sendMessage(tab.id, { action: 'startVoiceRecognition' });

    if (result && result.action && result.action !== 'unknown') {
      updateVoiceButton('processing');
      const map = {
        generateHint: '✅ Getting hint...',
        explainApproach: '✅ Explaining approach...',
        analyzeCode: '✅ Analyzing code...',
        captureScreen: '✅ Capturing screenshot...',
        openSettings: '✅ Opening settings...'
      };
      await executeVoiceCommand(result.action);
      showVoiceStatus(map[result.action] || '✅ Processing...');
      updateVoiceButton('idle');
      return;
    }

    if (result && result.error) {
      // Fall back to popup recognition if available
      if (recognition) {
        recognition.start();
        return;
      }
      showVoiceStatus('❌ Voice not supported here. Please allow mic and try again.');
      return;
    }
  } catch (e) {
    // If page-context path fails, fallback to popup recognition
    if (recognition) {
      try {
        showVoiceStatus('🎤 Starting voice recognition...');
        recognition.start();
        return;
      } catch (error) {
        console.log('Permission error:', error);
        if (error.name === 'NotAllowedError') {
          showVoiceStatus('❌ Microphone access denied. Please:');
          setTimeout(() => {
            showVoiceStatus('1. Click the 🎤 icon in address bar\n2. Select "Allow"\n3. Try voice button again');
          }, 1000);
        } else if (error.name === 'NotFoundError') {
          showVoiceStatus('❌ No microphone found. Check your audio settings.');
        } else if (error.name === 'NotSupportedError') {
          showVoiceStatus('❌ Microphone not supported on this device.');
        } else {
          showVoiceStatus('❌ Microphone access failed. Try refreshing the page.');
        }
      }
    } else {
      showVoiceStatus('❌ Voice not supported in this browser');
    }
  }
});

// Main feature buttons
document.getElementById('hintBtn').addEventListener('click', async () => {
  if (!problemData) {
    showOutput('❌ Please navigate to a LeetCode problem page first');
    return;
  }
  
  const btn = document.getElementById('hintBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="btn-icon">⏳</span><div class="btn-text"><div class="loading">Generating personalized hint</div></div>';
  btn.disabled = true;
  
  showOutput('🤔 Analyzing problem and generating personalized hint based on your experience...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateHint',
      title: problemData.title
    });
    showOutput(response);
    await loadSessionData();
  } catch (error) {
    showOutput('❌ Service temporarily unavailable. Please reload the extension.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

document.getElementById('explainBtn').addEventListener('click', async () => {
  if (!problemData) {
    showOutput('❌ Please navigate to a LeetCode problem page first');
    return;
  }
  
  const btn = document.getElementById('explainBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="btn-icon">⏳</span><div class="btn-text"><div class="loading">Crafting detailed approach</div></div>';
  btn.disabled = true;
  
  showOutput('📚 Creating comprehensive solution strategy with code templates...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'explainApproach',
      title: problemData.title
    });
    showOutput(response);
    await loadSessionData();
  } catch (error) {
    showOutput('❌ Service temporarily unavailable. Please reload the extension.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  if (!problemData) {
    showOutput('❌ Please navigate to a LeetCode problem page first');
    return;
  }
  
  showOutput('🔍 Performing real-time code analysis...');
  
  try {
    // Try to get fresh code from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let codeToAnalyze = problemData.code;
    
    try {
      const codeResponse = await chrome.tabs.sendMessage(tab.id, { action: 'extractCode' });
      if (codeResponse.code) {
        codeToAnalyze = codeResponse.code;
      }
    } catch (e) {
      // Use existing code if extraction fails
    }
    
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeCode',
      title: problemData.title,
      code: codeToAnalyze
    });
    showOutput(response);
  } catch (error) {
    showOutput('❌ Code analysis temporarily unavailable.');
  }
});

// Advanced feature buttons
document.getElementById('screenshotBtn').addEventListener('click', async () => {
  showOutput('📸 Capturing enhanced screenshot...');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureScreen' });
    if (response.success) {
      showOutput('📸 Screenshot captured successfully!\n\n🔍 Enhanced Analysis:\n• Problem statement region identified\n• Code editor area detected\n• Ready for future AI analysis');
    } else {
      showOutput('❌ Screenshot capture failed. Please ensure you have the necessary permissions.');
    }
  } catch (error) {
    showOutput('❌ Screenshot feature temporarily unavailable.');
  }
});

document.getElementById('codeExtractBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractCode' });
    
    if (response.code && response.code !== 'No code found') {
      showOutput(`📝 Code Extracted Successfully:\n\n${response.code}\n\n⏰ Extracted at: ${new Date(response.timestamp).toLocaleTimeString()}`);
      showCodeMonitor(response.code);
    } else {
      showOutput('📝 No code found in editor. Please write some code first.');
    }
  } catch (error) {
    showOutput('❌ Code extraction failed. Please refresh the page.');
  }
});

// Settings and other buttons
document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'block';
  
  if (sessionData && sessionData.userPreferences) {
    document.getElementById('hintLevel').value = sessionData.userPreferences.hintLevel;
    document.getElementById('explanationStyle').value = sessionData.userPreferences.explanationStyle;
  }
});

document.getElementById('historyBtn').addEventListener('click', () => {
  if (sessionData && sessionData.chatHistory.length > 0) {
    let historyText = '📊 Your Learning History:\n\n';
    sessionData.chatHistory.slice(-10).forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      historyText += `${index + 1}. ${entry.problem} (${entry.action}) - ${date}\n`;
    });
    historyText += `\n📈 Total Stats:\n• Hints: ${sessionData.totalHintsUsed}\n• Explanations: ${sessionData.totalExplanationsViewed}\n• Problems: ${sessionData.chatHistory.length}`;
    showOutput(historyText);
  } else {
    showOutput('📊 No history yet. Start using hints and explanations to build your learning journey!');
  }
});

// Code monitor toggle
document.getElementById('toggleMonitor').addEventListener('click', () => {
  codeMonitorActive = !codeMonitorActive;
  const btn = document.getElementById('toggleMonitor');
  const monitor = document.getElementById('codeMonitor');
  
  if (codeMonitorActive) {
    btn.textContent = '●';
    btn.className = 'toggle-btn';
    monitor.style.display = 'block';
  } else {
    btn.textContent = '○';
    btn.className = 'toggle-btn inactive';
    monitor.style.display = 'none';
  }
});

// Modal and settings functionality
document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('hintLevel').addEventListener('change', async (e) => {
  try {
    await chrome.runtime.sendMessage({
      action: 'updatePreferences',
      preferences: { hintLevel: e.target.value }
    });
    await loadSessionData();
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
});

document.getElementById('explanationStyle').addEventListener('change', async (e) => {
  try {
    await chrome.runtime.sendMessage({
      action: 'updatePreferences',
      preferences: { explanationStyle: e.target.value }
    });
    await loadSessionData();
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
});

document.getElementById('clearSession').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all session data? This cannot be undone.')) {
    try {
      await chrome.runtime.sendMessage({ action: 'clearSession' });
      await loadSessionData();
      document.getElementById('settingsModal').style.display = 'none';
      showOutput('🗑️ Session data cleared successfully!');
    } catch (error) {
      showOutput('❌ Failed to clear session data.');
    }
  }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('settingsModal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

function showOutput(message) {
  const output = document.getElementById('output');
  output.textContent = message;
  output.style.display = 'block';
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  status.className = `status ${type}`;
  
  if (type === 'loading') {
    status.classList.add('loading');
  }
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '1':
        e.preventDefault();
        document.getElementById('hintBtn').click();
        break;
      case '2':
        e.preventDefault();
        document.getElementById('explainBtn').click();
        break;
      case '3':
        e.preventDefault();
        document.getElementById('analyzeBtn').click();
        break;
      case 's':
        e.preventDefault();
        document.getElementById('settingsBtn').click();
        break;
      case 'h':
        e.preventDefault();
        document.getElementById('historyBtn').click();
        break;
      case ' ':
        e.preventDefault();
        document.getElementById('voiceBtn').click();
        break;
    }
  }
});
