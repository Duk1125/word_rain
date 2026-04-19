// ============================================================
// keyboard-mode.js — Хурууны байрлал
// Layout order: header → text slider → keyboard guide (bottom)
// ============================================================

window.KeyboardMode = (function () {

    // ── DOM refs ──────────────────────────────────────────
    // displayAreaEl = #keyboard-display-area  → text slider
    // hintAreaEl    = #keyboard-hint-area     → keyboard + finger guide
    let containerEl, displayAreaEl, hintAreaEl, statsEl;

    // ── State ─────────────────────────────────────────────
    let currentStageIndex = 0;
    let targetText  = "";
    let charIndex   = 0;
    let correctCount = 0;
    let errorCount   = 0;

    let timerInterval = null;
    let startTime     = null;
    let timeElapsed   = 0;
    let isRunning     = false;
    let isActiveMode  = false;

    let charSpans = [];

    // ── Constants ─────────────────────────────────────────
    const TOTAL_CHARS  = 120;
    const CHAR_PX      = 44;    // px per character cell (must match CSS min-width)
    const ANCHOR_LEFT  = 140;   // px from viewport left where active char is pinned

    // ── init ──────────────────────────────────────────────
    function init(elements) {
        containerEl   = elements.container;
        displayAreaEl = elements.patternDisplay;   // #keyboard-display-area
        hintAreaEl    = elements.keyboardDisplay;  // #keyboard-hint-area
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

    // ── Text generation (no spaces, shuffle-based) ────────
    function generateText(keys) {
        const capitalRatio = 0.25;
        const pool = [...keys];
        let shuffled = shuffle([...pool]);
        let si = 0;
        let text = "";

        for (let i = 0; i < TOTAL_CHARS; i++) {
            if (si >= shuffled.length) { shuffled = shuffle([...pool]); si = 0; }
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

    // ── Build sliding text DOM (into displayAreaEl) ───────
    function buildSliderDOM() {
        displayAreaEl.innerHTML = '';

        const viewport = document.createElement('div');
        viewport.id = 'kb-viewport';

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
        track.style.transform = `translateX(${ANCHOR_LEFT - charIndex * CHAR_PX}px)`;
    }

    // ── Key handler ───────────────────────────────────────
    function handleKeyDown(e) {
        if (!isActiveMode) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Tab' || e.key === ' ' || e.key === 'Backspace') {
            e.preventDefault();
            return;
        }
        // Ignore modifier-only keys
        if (e.key === 'Shift' || e.key === 'CapsLock' || e.key.length !== 1) return;

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
            isActiveMode = false;
            updateProgressBar();
            renderKeyboard(null);
            clearInterval(timerInterval);
            timeElapsed = Math.round((Date.now() - startTime) / 1000);
            updateStats();
            setTimeout(finish, 350);
        }
    }

    // ── Timer ─────────────────────────────────────────────
    function tickTimer() {
        if (!startTime) return;
        timeElapsed = Math.round((Date.now() - startTime) / 1000);
        updateStats();
    }

    // ── Progress ──────────────────────────────────────────
    function updateProgressBar() {
        const bar = document.getElementById('kb-progress-bar');
        if (bar) bar.style.width = ((charIndex / TOTAL_CHARS) * 100) + '%';
    }

    // ── Stats ─────────────────────────────────────────────
    function updateStats() {
        if (!statsEl) return;
        const stageName = (window.keyboardLessons || [])[currentStageIndex]?.lesson || '';
        const fmt = window.TypingAnalytics
            ? window.TypingAnalytics.formatTime(timeElapsed)
            : timeElapsed + 'с';
        const acc = charIndex > 0 ? Math.round(correctCount / charIndex * 100) : 100;
        statsEl.innerHTML = `
            <div class="stat-item">Шат: <span>${stageName}</span></div>
            <div class="stat-item">Хугацаа: <span>${fmt}</span></div>
            <div class="stat-item">Нарийвчлал: <span>${acc}%</span></div>
        `;
    }

    // ── Finish ────────────────────────────────────────────
    function finish() {
        isRunning = false;
        clearInterval(timerInterval);

        const accuracy  = charIndex > 0 ? Math.round(correctCount / charIndex * 100) : 0;
        const wpm       = window.TypingAnalytics
            ? window.TypingAnalytics.calculateWPM(correctCount, timeElapsed)
            : Math.round((correctCount / 5) / Math.max(timeElapsed / 60, 0.01));
        const stageName = (window.keyboardLessons || [])[currentStageIndex]?.lesson || '';
        const fmt       = window.TypingAnalytics
            ? window.TypingAnalytics.formatTime(timeElapsed)
            : timeElapsed + 'с';

        const stats = {
            "Шат":               stageName,
            "Зарцуулсан хугацаа": fmt,
            "Бичсэн үсгийн тоо":  charIndex,
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
    // Visual keyboard + finger guide  (rendered into hintAreaEl)
    // Layout order inside hintAreaEl: keyboard first, finger guide below
    // ============================================================
    function renderKeyboard(targetChar) {
        if (!hintAreaEl) return;

        const layout    = window.kbLayout   || [];
        const charPos   = window.kbCharPos  || {};
        const fingerMap = window.kbFingerMap || {};

        // Determine target key position & finger
        const ch         = targetChar ? targetChar.toLowerCase() : null;
        const isUpper    = targetChar ? (targetChar !== targetChar.toLowerCase()) : false;
        const pos        = ch ? charPos[ch] : null;          // { row, col }
        const fingerInfo = pos ? fingerMap[`${pos.row}-${pos.col}`] : null;

        // Which Shift should light up? Opposite hand from the character key.
        // Left char → right Shift; right char → left Shift.
        let shiftHand = null;
        if (isUpper && fingerInfo) {
            shiftHand = fingerInfo.hand === 'left' ? 'right' : 'left';
        }

        // ── Row stagger offsets (px, like a real keyboard) ──
        // Row 0 (numbers): 0px indent
        // Row 1 (upper):   ~24px
        // Row 2 (home):    ~36px
        // Row 3 (lower):   ~60px
        const staggerPx = [0, 24, 36, 60];

        // ── Number row (decorative) ──────────────────────────
        let kbHTML = '<div class="vkb">';

        // Row 0 – number row
        kbHTML += `<div class="vkb-row" style="padding-left:0px">`;
        const numRow = layout[0] || [];
        for (let c = 0; c < numRow.length; c++) {
            kbHTML += `<div class="vkb-key vkb-num">${numRow[c]}</div>`;
        }
        // Backspace (wide, decorative)
        kbHTML += `<div class="vkb-key vkb-wide vkb-num">⌫</div>`;
        kbHTML += `</div>`;

        // Rows 1-3 – letter rows with Shift
        for (let r = 1; r <= 3; r++) {
            kbHTML += `<div class="vkb-row" style="padding-left:${staggerPx[r]}px">`;

            // Left Shift on Row 3
            if (r === 3) {
                const lShiftActive = shiftHand === 'left' ? ' vkb-key-shift-active' : '';
                kbHTML += `<div class="vkb-key vkb-shift-left vkb-left-f4${lShiftActive}" title="Зүүн Shift">⇧</div>`;
            }

            const row = layout[r] || [];
            for (let c = 0; c < row.length; c++) {
                const keyChar   = row[c];
                const isTarget  = pos && pos.row === r && pos.col === c;
                const fi        = fingerMap[`${r}-${c}`];
                const fClass    = fi ? `vkb-${fi.hand}-f${fi.finger}` : '';
                const aClass    = isTarget ? ' vkb-key-active' : '';
                const title     = fi ? fi.name : '';
                const display   = isUpper && isTarget
                    ? keyChar.toUpperCase()
                    : keyChar.toUpperCase();   // always show uppercase label on key
                kbHTML += `<div class="vkb-key ${fClass}${aClass}" title="${title}">${display}</div>`;
            }

            // Right Shift on Row 3
            if (r === 3) {
                const rShiftActive = shiftHand === 'right' ? ' vkb-key-shift-active' : '';
                kbHTML += `<div class="vkb-key vkb-shift-right vkb-right-f4${rShiftActive}" title="Баруун Shift">⇧</div>`;
            }

            kbHTML += `</div>`;
        }
        kbHTML += '</div>'; // end .vkb

        // ── Finger guide ──────────────────────────────────────
        // Finger display names
        const fingerLabel = ['', 'долоовор', 'дунд', 'ядам', 'чигчий'];

        function handHTML(hand, label) {
            // Left: pinky(4)→index(1), Right: index(1)→pinky(4)
            const fingers = hand === 'left' ? [4, 3, 2, 1] : [1, 2, 3, 4];
            const cells = fingers.map(fi => {
                const isActive = fingerInfo && fingerInfo.hand === hand && fingerInfo.finger === fi;
                // Shift also lights up appropriate pinky
                const isShiftActive = isUpper && shiftHand === hand && fi === 4;
                const activeClass = (isActive || isShiftActive) ? 'fguide-active' : '';
                return `<div class="fguide-finger ${activeClass} fguide-${hand}-f${fi}">
                    <div class="fguide-tip"></div>
                    <div class="fguide-label">${fingerLabel[fi]}</div>
                </div>`;
            }).join('');
            return `<div class="fguide-hand">
                <div class="fguide-fingers ${hand}">${cells}</div>
                <div class="fguide-hand-label">${label}</div>
            </div>`;
        }

        // Hint text below finger guide
        let hintText = '';
        if (fingerInfo) {
            hintText = `<div class="fguide-hint">▶ ${fingerInfo.name}`;
            if (isUpper) hintText += ` &nbsp;+&nbsp; ${shiftHand === 'left' ? 'Зүүн' : 'Баруун'} Shift`;
            hintText += `</div>`;
        }

        const guideHTML = `
            <div class="fguide-section">
                <div class="fguide">
                    ${handHTML('left',  'Зүүн гар')}
                    ${handHTML('right', 'Баруун гар')}
                </div>
                ${hintText}
            </div>`;

        // Keyboard top, finger guide below
        hintAreaEl.innerHTML = kbHTML + guideHTML;
    }

    // ── Public API ────────────────────────────────────────
    return {
        init, start, stop,
        get _lastStage() { return currentStageIndex; }
    };

})();
