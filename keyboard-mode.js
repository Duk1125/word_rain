// ============================================================
// keyboard-mode.js — Хурууны байрлал: Sliding single-line
// practice with visual keyboard + finger guide.
// ============================================================

window.KeyboardMode = (function () {

    // ── DOM refs ──────────────────────────────────────────
    let containerEl, displayAreaEl, hintAreaEl, statsEl;

    // ── State ─────────────────────────────────────────────
    let currentStageIndex = 0;
    let targetText = "";       // 120-char no-space practice string
    let charIndex = 0;         // current position
    let correctCount = 0;
    let errorCount = 0;

    let timerInterval = null;
    let startTime = null;
    let timeElapsed = 0;
    let isRunning = false;
    let isActiveMode = false;

    // span elements for the sliding track
    let charSpans = [];

    // ── Constants ─────────────────────────────────────────
    const TOTAL_CHARS = 120;
    const CHAR_PX = 42;        // approx width per char (monospace em units handled by CSS)
    const ANCHOR_LEFT = 120;   // px from left edge where the active char sits

    // ── init ──────────────────────────────────────────────
    function init(elements) {
        containerEl   = elements.container;
        displayAreaEl = elements.patternDisplay;  // #keyboard-display-area
        hintAreaEl    = elements.keyboardDisplay; // #keyboard-hint-area
        statsEl       = elements.stats;

        if (!displayAreaEl) return;

        document.addEventListener('keydown', handleKeyDown);
    }

    // ── start ─────────────────────────────────────────────
    function start(stageIndex) {
        const lessons = window.keyboardLessons || [];
        if (!lessons.length) return;
        if (stageIndex === undefined || stageIndex >= lessons.length) stageIndex = 0;
        currentStageIndex = stageIndex;

        // Reset state
        charIndex    = 0;
        correctCount = 0;
        errorCount   = 0;
        timeElapsed  = 0;
        isRunning    = false;
        isActiveMode = true;
        startTime    = null;
        clearInterval(timerInterval);

        const stage = lessons[stageIndex];
        targetText = generateText(stage.keys);

        buildSliderDOM();
        renderKeyboard(targetText[0]);
        updateStats();
        if (containerEl) containerEl.classList.remove('hidden');
    }

    // ── Text generation (no spaces) ───────────────────────
    function generateText(keys) {
        const capitalRatio = 0.25;
        let text = "";

        // Shuffle-based approach: cycle through keys with random shuffle to avoid clustering
        const pool = [...keys];
        let shuffled = shuffle([...pool]);
        let si = 0;

        for (let i = 0; i < TOTAL_CHARS; i++) {
            if (si >= shuffled.length) {
                shuffled = shuffle([...pool]);
                si = 0;
            }
            let ch = shuffled[si++];
            text += Math.random() < capitalRatio ? ch.toUpperCase() : ch.toLowerCase();
        }
        return text;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ── Build single-line sliding DOM ─────────────────────
    function buildSliderDOM() {
        displayAreaEl.innerHTML = '';

        // Wrapper (viewport, clips overflow)
        const viewport = document.createElement('div');
        viewport.id = 'kb-viewport';

        // Track (slides left)
        const track = document.createElement('div');
        track.id = 'kb-track';

        charSpans = [];
        for (let i = 0; i < targetText.length; i++) {
            const sp = document.createElement('span');
            sp.textContent = targetText[i];
            sp.className = 'kb-char untyped';
            if (i === 0) sp.classList.add('kb-active');
            track.appendChild(sp);
            charSpans.push(sp);
        }

        viewport.appendChild(track);
        displayAreaEl.appendChild(viewport);

        // Progress bar container
        const progressWrap = document.createElement('div');
        progressWrap.id = 'kb-progress-wrap';
        const progressBar = document.createElement('div');
        progressBar.id = 'kb-progress-bar';
        progressWrap.appendChild(progressBar);
        displayAreaEl.appendChild(progressWrap);

        updateTrackPosition();
    }

    function updateTrackPosition() {
        const track = document.getElementById('kb-track');
        if (!track) return;
        // Shift so active char stays at ANCHOR_LEFT pixels from viewport left
        const offset = charIndex * CHAR_PX;
        track.style.transform = `translateX(${ANCHOR_LEFT - offset}px)`;
    }

    // ── Key handler ───────────────────────────────────────
    function handleKeyDown(e) {
        if (!isActiveMode) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        // Block tab, backspace, space in practice
        if (e.key === 'Tab' || e.key === ' ' || e.key === 'Backspace') {
            e.preventDefault();
            return;
        }
        if (e.key.length !== 1) return;

        // Start timer on first keystroke
        if (!isRunning) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(tickTimer, 500);
        }

        const expected = targetText[charIndex];
        const typed    = e.key;

        if (typed === expected) {
            charSpans[charIndex].classList.remove('kb-active', 'untyped');
            charSpans[charIndex].classList.add('correct');
            correctCount++;
        } else {
            charSpans[charIndex].classList.remove('kb-active', 'untyped');
            charSpans[charIndex].classList.add('incorrect');
            errorCount++;
        }

        charIndex++;

        if (charIndex < targetText.length) {
            charSpans[charIndex].classList.add('kb-active');
            updateTrackPosition();
            updateProgressBar();
            renderKeyboard(targetText[charIndex]);
        } else {
            // Finished
            isActiveMode = false;
            updateProgressBar();
            renderKeyboard(null);
            clearInterval(timerInterval);
            timeElapsed = Math.round((Date.now() - startTime) / 1000);
            updateStats();
            setTimeout(finish, 350);
        }
    }

    // ── Timer tick ────────────────────────────────────────
    function tickTimer() {
        if (!startTime) return;
        timeElapsed = Math.round((Date.now() - startTime) / 1000);
        updateStats();
    }

    // ── Progress bar ──────────────────────────────────────
    function updateProgressBar() {
        const bar = document.getElementById('kb-progress-bar');
        if (bar) bar.style.width = ((charIndex / TOTAL_CHARS) * 100) + '%';
    }

    // ── Live stats ────────────────────────────────────────
    function updateStats() {
        if (!statsEl) return;
        const stageName = (window.keyboardLessons || [])[currentStageIndex]?.lesson || '';
        const fmt = window.TypingAnalytics ? window.TypingAnalytics.formatTime(timeElapsed) : timeElapsed + 'с';
        statsEl.innerHTML = `
            <div class="stat-item">Шат: <span>${stageName}</span></div>
            <div class="stat-item">Хугацаа: <span>${fmt}</span></div>
            <div class="stat-item">Нарийвчлал: <span>${charIndex > 0 ? Math.round(correctCount / charIndex * 100) : 100}%</span></div>
        `;
    }

    // ── Finish ────────────────────────────────────────────
    function finish() {
        isRunning = false;
        clearInterval(timerInterval);

        const totalTyped = charIndex;
        const accuracy   = totalTyped > 0 ? Math.round(correctCount / totalTyped * 100) : 0;
        const wpm        = window.TypingAnalytics
            ? window.TypingAnalytics.calculateWPM(correctCount, timeElapsed)
            : Math.round((correctCount / 5) / (timeElapsed / 60));
        const stageName  = (window.keyboardLessons || [])[currentStageIndex]?.lesson || '';
        const fmt        = window.TypingAnalytics
            ? window.TypingAnalytics.formatTime(timeElapsed)
            : timeElapsed + 'с';

        const stats = {
            "Шат":               stageName,
            "Зарцуулсан хугацаа": fmt,
            "Бичсэн үсгийн тоо":  totalTyped,
            "Алдааны тоо":        errorCount,
            "WPM":                wpm,
            "Нарийвчлал":         accuracy + "%"
        };

        if (window.AppController && window.AppController.handleKeyboardEnd) {
            window.AppController.handleKeyboardEnd(stats);
        }
    }

    // ── stop ─────────────────────────────────────────────
    function stop() {
        isRunning    = false;
        isActiveMode = false;
        clearInterval(timerInterval);
    }

    // ============================================================
    // Visual keyboard + finger guide
    // ============================================================
    function renderKeyboard(targetChar) {
        if (!hintAreaEl) return;

        const layout   = window.kbLayout  || [];
        const charPos  = window.kbCharPos  || {};
        const fingerMap = window.kbFingerMap || {};

        const ch = targetChar ? targetChar.toLowerCase() : null;
        const pos = ch ? charPos[ch] : null;         // { row, col }
        const fingerInfo = pos ? fingerMap[`${pos.row}-${pos.col}`] : null;

        // ── Keyboard visual ──────────────────────────────
        const rowOffsets = [0, 0, 18, 36]; // px indent per row (stagger)
        let kbHTML = '<div class="vkb">';

        for (let r = 1; r <= 3; r++) {
            kbHTML += `<div class="vkb-row" style="padding-left:${rowOffsets[r]}px">`;
            const row = layout[r] || [];
            for (let c = 0; c < row.length; c++) {
                const keyChar = row[c];
                const isTarget = pos && pos.row === r && pos.col === c;
                const fi = fingerMap[`${r}-${c}`];
                const fingerClass = fi
                    ? `vkb-${fi.hand}-f${fi.finger}`
                    : '';
                const activeClass = isTarget ? ' vkb-key-active' : '';
                kbHTML += `<div class="vkb-key ${fingerClass}${activeClass}" title="${fi ? fi.name : ''}">${keyChar.toUpperCase()}</div>`;
            }
            kbHTML += '</div>';
        }
        kbHTML += '</div>';

        // ── Finger guide ──────────────────────────────────
        const fingerNames = [
            '', // 0 unused
            'долоовор',  // 1 index
            'дунд',      // 2 middle
            'хонхор',    // 3 ring
            'чигчий'     // 4 pinky
        ];

        function handHTML(hand, label) {
            const fingers = hand === 'left'
                ? [4, 3, 2, 1]   // pinky…index (left-to-right visual)
                : [1, 2, 3, 4];  // index…pinky
            const fgElems = fingers.map(fi => {
                const isActive = fingerInfo && fingerInfo.hand === hand && fingerInfo.finger === fi;
                return `<div class="fguide-finger ${isActive ? 'fguide-active' : ''} fguide-${hand}-f${fi}">
                    <div class="fguide-tip"></div>
                    <div class="fguide-label">${fingerNames[fi]}</div>
                </div>`;
            }).join('');
            return `<div class="fguide-hand">
                <div class="fguide-hand-label">${label}</div>
                <div class="fguide-fingers ${hand}">${fgElems}</div>
            </div>`;
        }

        let fingerInfo2HTML = '';
        if (fingerInfo) {
            fingerInfo2HTML = `<div class="fguide-hint">▶ ${fingerInfo.name}</div>`;
        }

        const guideHTML = `<div class="fguide">
            ${handHTML('left',  'Зүүн гар')}
            ${handHTML('right', 'Баруун гар')}
        </div>
        ${fingerInfo2HTML}`;

        hintAreaEl.innerHTML = kbHTML + guideHTML;
    }

    // ── Public API ────────────────────────────────────────
    return {
        init, start, stop,
        get _lastStage() { return currentStageIndex; }
    };

})();
