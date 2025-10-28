# CodeMentor AI - Development Phases

## Phase 1: Basic Extension Setup (Day 1)
**Goal:** Get a working Chrome extension that loads on LeetCode

### Tasks:
1. Create manifest.json with basic permissions
2. Create simple popup.html with one button
3. Create popup.js to handle button clicks
4. Add placeholder icons
5. Load and test extension in Chrome

**Deliverable:** Extension appears in Chrome toolbar and popup opens

---

## Phase 2: LeetCode Data Extraction (Day 1-2)
**Goal:** Extract problem data from LeetCode pages

### Tasks:
1. Create content-script.js
2. Write selectors to extract:
   - Problem title
   - Problem description
   - Difficulty level
   - User's code from editor
3. Test extraction on multiple LeetCode problems
4. Send data to popup via messaging

**Deliverable:** Extension can read LeetCode problem details

---

## Phase 3: Gemini Nano Integration (Day 2-3)
**Goal:** Connect to Chrome's built-in AI

### Tasks:
1. Enable Gemini Nano flag in Chrome
2. Create background.js service worker
3. Initialize AI session using Prompt API
4. Test basic prompt/response flow
5. Handle errors if AI unavailable

**Deliverable:** Extension can send prompts and get AI responses

---

## Phase 4: Core AI Features (Day 3-4)
**Goal:** Implement main assistance features

### Tasks:
1. **Get Hint** - Generate subtle hints
2. **Explain Approach** - Step-by-step solution
3. **Analyze Code** - Review user's code
4. Create prompts for each feature
5. Display AI responses in popup

**Deliverable:** All three main features working

---

## Phase 5: UI/UX Polish (Day 4-5)
**Goal:** Make it look professional

### Tasks:
1. Design styles.css
2. Add loading states
3. Format AI responses (markdown, code blocks)
4. Add error messages
5. Improve layout and responsiveness

**Deliverable:** Clean, user-friendly interface

---

## Phase 6: Advanced Features (Day 5-6) - OPTIONAL
**Goal:** Add multimodal capabilities

### Tasks:
1. Screenshot capture for code analysis
2. Voice input support
3. Session persistence (save chat history)
4. Token management optimization

**Deliverable:** Enhanced interaction methods

---

## Phase 7: Testing & Refinement (Day 6-7)
**Goal:** Bug fixes and optimization

### Tasks:
1. Test on different LeetCode problems
2. Test edge cases (no code, long problems)
3. Optimize AI prompts for better responses
4. Fix any bugs
5. Add usage instructions

**Deliverable:** Stable, production-ready extension

---

## Phase 8: Documentation & Deployment (Day 7)
**Goal:** Prepare for distribution

### Tasks:
1. Write README.md
2. Create user guide
3. Package extension for Chrome Web Store
4. Record demo video (optional)
5. Prepare submission materials

**Deliverable:** Ready to publish or share

---

## Minimum Viable Product (MVP)
**Focus on Phases 1-4 first** - This gives you a working extension with core features.

Phases 5-8 can be done iteratively based on time and requirements.
