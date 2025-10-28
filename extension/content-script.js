// Prevent duplicate script injection
if (typeof window.codeMentorAILoaded === 'undefined') {
  window.codeMentorAILoaded = true;
  
  console.log('CodeMentor AI v1.1 - Enhanced Content Script Loaded');

  let lastCodeContent = '';
  let codeChangeTimer = null;

  // Enhanced problem data extraction
  function extractEnhancedProblemData() {
    const data = {};
    
    // Extract title with multiple fallback methods
    let title = 'Problem title not found';
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (urlMatch) {
      title = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Try DOM selectors as backup
    const titleSelectors = ['h1', '[data-cy="question-title"]', 'div[class*="title"] span'];
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.trim().length > 3) {
        title = element.textContent.trim();
        break;
      }
    }
    data.title = title;
    
    // Extract difficulty with enhanced detection
    let difficulty = 'Medium';
    const difficultySelectors = [
      '[class*="difficulty"]',
      'span[class*="Easy"], span[class*="Medium"], span[class*="Hard"]',
      'div[class*="Easy"], div[class*="Medium"], div[class*="Hard"]'
    ];
    
    for (const selector of difficultySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (['Easy', 'Medium', 'Hard'].includes(text)) {
          difficulty = text;
          break;
        }
      }
    }
    data.difficulty = difficulty;
    
    // Enhanced description extraction
    const descSelectors = [
      '[class*="content"]',
      '[class*="description"]',
      'div[class*="question-content"]',
      '.question-content',
      'div p'
    ];
    
    let description = 'Description not available';
    for (const selector of descSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 100) {
        description = element.textContent.trim().substring(0, 800);
        break;
      }
    }
    data.description = description;
    
    // Enhanced code extraction
    data.code = extractCodeFromEditor();
    
    // Extract additional data
    data.testCases = extractTestCases();
    data.constraints = extractConstraints();
    data.tags = extractTags();
    
    return data;
  }

  // Advanced code extraction from various editor types
  function extractCodeFromEditor() {
    // Monaco Editor (primary)
    const monacoTextarea = document.querySelector('.monaco-editor textarea');
    if (monacoTextarea && monacoTextarea.value) {
      return monacoTextarea.value;
    }
    
    // Monaco Editor - alternative method
    const monacoLines = document.querySelectorAll('.monaco-editor .view-line');
    if (monacoLines.length > 0) {
      return Array.from(monacoLines).map(line => line.textContent).join('\n');
    }
    
    // CodeMirror Editor
    const codeMirror = document.querySelector('.CodeMirror');
    if (codeMirror && codeMirror.CodeMirror) {
      return codeMirror.CodeMirror.getValue();
    }
    
    // Fallback: any textarea
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 10) {
        return textarea.value;
      }
    }
    
    return 'No code found';
  }

  // Extract test cases from problem
  function extractTestCases() {
    const testCases = [];
    const exampleElements = document.querySelectorAll('[class*="example"], .example');
    
    exampleElements.forEach((element, index) => {
      const text = element.textContent;
      const inputMatch = text.match(/Input:\s*(.+)/i);
      const outputMatch = text.match(/Output:\s*(.+)/i);
      
      if (inputMatch && outputMatch) {
        testCases.push({
          input: inputMatch[1].trim(),
          output: outputMatch[1].trim(),
          example: index + 1
        });
      }
    });
    
    return testCases;
  }

  // Extract constraints
  function extractConstraints() {
    const constraintElements = document.querySelectorAll('[class*="constraint"], .constraints');
    const constraints = [];
    
    constraintElements.forEach(element => {
      const text = element.textContent.trim();
      if (text.length > 0) {
        constraints.push(text);
      }
    });
    
    return constraints;
  }

  // Extract problem tags/topics
  function extractTags() {
    const tagElements = document.querySelectorAll('[class*="tag"], .tag, [class*="topic"], .topic');
    const tags = [];
    
    tagElements.forEach(element => {
      const text = element.textContent.trim();
      if (text.length > 0 && text.length < 30) {
        tags.push(text);
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Real-time code monitoring
  function startCodeMonitoring() {
    const checkCodeChanges = () => {
      const currentCode = extractCodeFromEditor();
      if (currentCode !== lastCodeContent && currentCode !== 'No code found') {
        lastCodeContent = currentCode;
        
        // Debounce code change notifications
        clearTimeout(codeChangeTimer);
        codeChangeTimer = setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'codeChanged',
            code: currentCode,
            timestamp: new Date().toISOString()
          }).catch(() => {}); // Ignore errors if popup is closed
        }, 2000); // Wait 2 seconds after user stops typing
      }
    };
    
    // Monitor for changes every 3 seconds
    setInterval(checkCodeChanges, 3000);
    
    // Also monitor for DOM changes
    const observer = new MutationObserver(checkCodeChanges);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Voice command processing
  function processVoiceCommand(transcript) {
    const command = transcript.toLowerCase();
    
    if (command.includes('hint') || command.includes('help')) {
      return { action: 'generateHint', confidence: 0.9 };
    } else if (command.includes('explain') || command.includes('approach') || command.includes('solution')) {
      return { action: 'explainApproach', confidence: 0.9 };
    } else if (command.includes('analyze') || command.includes('review') || command.includes('check')) {
      return { action: 'analyzeCode', confidence: 0.8 };
    } else if (command.includes('screenshot') || command.includes('capture')) {
      return { action: 'captureScreen', confidence: 0.7 };
    } else if (command.includes('settings') || command.includes('preferences')) {
      return { action: 'openSettings', confidence: 0.6 };
    }
    
    return { action: 'unknown', confidence: 0.0, transcript };
  }

  // Message listener with enhanced capabilities
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'ping':
        sendResponse({ status: 'ready' });
        break;
        
      case 'extractData':
        const problemData = extractEnhancedProblemData();
        sendResponse(problemData);
        break;
        
      case 'extractCode':
        const code = extractCodeFromEditor();
        sendResponse({ code, timestamp: new Date().toISOString() });
        break;
        
      case 'processVoiceCommand':
        const commandResult = processVoiceCommand(request.transcript);
        sendResponse(commandResult);
        break;

      case 'startVoiceRecognition': {
        // Run SpeechRecognition in page context; return transcript and parsed action
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          sendResponse({ error: 'not_supported' });
          break;
        }

        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 3;

          recognition.onresult = (event) => {
            const results = Array.from(event.results[0] || []);
            const transcripts = results.map(r => (r.transcript || '').trim()).filter(Boolean);
            const primary = transcripts[0] || '';
            const parsed = processVoiceCommand(primary);
            sendResponse({ transcript: primary, action: parsed.action, confidence: parsed.confidence });
          };

          recognition.onerror = (e) => {
            sendResponse({ error: e.error || 'recognition_error' });
          };

          recognition.onnomatch = () => {
            sendResponse({ error: 'no_match' });
          };

          recognition.start();
          return true; // keep channel open for async response
        } catch (err) {
          sendResponse({ error: 'init_failed' });
        }
        break;
      }
        
      case 'startMonitoring':
        startCodeMonitoring();
        sendResponse({ status: 'monitoring_started' });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Keep message channel open
  });

  // Initialize monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCodeMonitoring);
  } else {
    startCodeMonitoring();
  }
}
