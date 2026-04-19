// ============================================================
// keyboard-mode.js — Хурууны байрлал
// Single-line sliding practice + visual keyboard guide
// Layout order: header → text slider → keyboard/finger guide
// ============================================================

window.KeyboardMode = (function () {

    // ── DOM refs ──────────────────────────────────────────
    // displayAreaEl = #keyboard-display-area  (text slider, ABOVE)
    // hintAreaEl    = #keyboard-hint-area     (keyboard + finger, BELOW)
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
    const TOTAL_CHARS = 120;
    const CHAR_PX     = 68;   // matches CSS .kb-char min-width
    const ANCHOR_LEFT = 200;  // matches CSS #kb-viewport::before left

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

        charIndex    = 0;
        correctCount = 0;
        errorCount   = 0;
        timeElapsed  = 0;
        isRunning    = false;
        isPaused     = false;
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

    // ── Build sliding DOM ─────────────────────────────────
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
        if (!isActiveMode || isPaused) return; 
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Tab' || e.key === ' ' || e.key === 'Backspace') {
            e.preventDefault();
            return;
        }
        // Ignore lone modifier keys
        if (['Shift','CapsLock','Control','Alt','Meta'].includes(e.key)) return;
        if (e.key.length !== 1) return;

        if (!isRunning) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(tickTimer, 1000);
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
        if (!startTime || isPaused) return;
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

        const statsData = {
            "Шат":               stageName,
            "Зарцуулсан хугацаа": fmt,
            "Нийт текст":        TOTAL_CHARS,
            "Алдааны тоо":        errorCount,
            "Нарийвчлал":         accuracy + "%",
            "WPM":                wpm
        };

        if (window.AppController && window.AppController.handleKeyboardEnd) {
            window.AppController.handleKeyboardEnd(statsData);
        }
    }

    // ── pause / resume / stop ──────────────────────────────
    let isPaused = false;
    let pauseStartTime = 0;

    function pause() {
        if(!isRunning || isPaused) return;
        isPaused = true;
        pauseStartTime = Date.now();
        clearInterval(timerInterval);
    }

    function resume() {
        if(!isPaused) return;
        isPaused = false;
        if(startTime) {
            const pausedDuration = Date.now() - pauseStartTime;
            startTime += pausedDuration;
        }
        timerInterval = setInterval(tickTimer, 1000);
    }

    function stop() {
        isRunning    = false;
        isPaused     = false;
        isActiveMode = false;
        clearInterval(timerInterval);
    }

    // ============================================================
    // Visual keyboard + finger guide
    // Rendered into hintAreaEl (below the text slider).
    //
    // Active key colour  = the finger colour (not fixed cyan)
    // Shift colour       = semi-transparent version of finger colour
    // Finger guide       = same colour system
    // ============================================================
    function renderKeyboard(targetChar) {
        if (!hintAreaEl) return;

        const layout    = window.kbLayout    || [];
        const charPos   = window.kbCharPos   || {};
        const fingerMap = window.kbFingerMap || {};
        const FC        = window.FINGER_COLORS || {};

        // Resolve target character lookup
        const ch      = targetChar ? targetChar.toLowerCase() : null;
        const isUpper = targetChar
            ? (targetChar !== targetChar.toLowerCase() && targetChar.toLowerCase() !== targetChar.toUpperCase())
            : false;
        const pos     = ch ? charPos[ch] : null;           // { row, col }
        const fiInfo  = pos ? fingerMap[`${pos.row}-${pos.col}`] : null;
        const fiNum   = fiInfo ? fiInfo.finger : null;
        const fiCol   = fiNum  ? FC[fiNum]     : null;

        // For uppercase, opposite hand uses Shift
        const shiftHand = (isUpper && fiInfo)
            ? (fiInfo.hand === 'left' ? 'right' : 'left')
            : null;

        // ── Key geometry ─────────────────────────────────
        const staggerPx = [0, 26, 48, 0];

        // ── Helper: build one key element style ──────────
        function activeKeyStyle(fc) {
            return `background:${fc.bg};border-color:${fc.border};color:${fc.text};` +
                   `box-shadow:0 0 26px ${fc.bg}bb;transform:translateY(2px) scale(1.1);` +
                   `z-index:2;position:relative;`;
        }

        function subtleKeyStyle(fc) {
            return `background:${fc.subtle};border-color:${fc.subtleBorder};color:${fc.border};`;
        }

        // ── Render keyboard HTML ──────────────────────────
        let kbHTML = '<div class="vkb">';

        // Row 0 – symbol row (Now standardized with finger colors)
        kbHTML += `<div class="vkb-row" style="padding-left:${staggerPx[0]}px">`;
        const symRow = layout[0] || [];
        for (let c = 0; c < symRow.length; c++) {
            const ch0   = symRow[c];
            const isT   = pos && pos.row === 0 && pos.col === c;
            const fi0   = fingerMap[`0-${c}`];
            const fCls  = fi0 ? `vkb-${fi0.hand}-f${fi0.finger}` : '';
            const sAttr = isT && fiCol ? `style="${activeKeyStyle(fiCol)}"` : '';
            kbHTML += `<div class="vkb-key ${fCls}" ${sAttr}>${ch0}</div>`;
        }
        kbHTML += `</div>`;

        // Rows 1-3 – letter rows
        for (let r = 1; r <= 3; r++) {
            kbHTML += `<div class="vkb-row" style="padding-left:${staggerPx[r]}px">`;

            // LEFT SHIFT (row 3 only)
            if (r === 3) {
                const lsActive = shiftHand === 'left';
                const lsAttr  = lsActive
                    ? `style="${activeKeyStyle(FC[4])}"`
                    : `style="${subtleKeyStyle(FC[4])}"`;
                kbHTML += `<div class="vkb-key vkb-shift vkb-left-f4" ${lsAttr} title="Зүүн Shift">⇧</div>`;
            }

            const row = layout[r] || [];
            for (let c = 0; c < row.length; c++) {
                const keyChar = row[c];
                const isT     = pos && pos.row === r && pos.col === c;
                const fi      = fingerMap[`${r}-${c}`];
                const fCls    = fi ? `vkb-${fi.hand}-f${fi.finger}` : '';
                const sAttr   = isT && fiCol ? `style="${activeKeyStyle(fiCol)}"` : '';
                const title   = fi ? fi.name : '';
                kbHTML += `<div class="vkb-key ${fCls}" ${sAttr} title="${title}">${keyChar.toUpperCase()}</div>`;
            }

            // RIGHT SHIFT (row 3 only)
            if (r === 3) {
                const rsActive = shiftHand === 'right';
                const rsAttr  = rsActive
                    ? `style="${activeKeyStyle(FC[4])}"`
                    : `style="${subtleKeyStyle(FC[4])}"`;
                kbHTML += `<div class="vkb-key vkb-shift vkb-right-f4" ${rsAttr} title="Баруун Shift">⇧</div>`;
            }

            kbHTML += `</div>`;
        }
        kbHTML += `</div>`; // .vkb

        // ── Finger guide HTML ─────────────────────────────
        const fingerLabel = ['', 'долоовор', 'дунд', 'ядам', 'чигчий'];

        function handHTML(hand, handLabel) {
            // Left hand: pinky(4)→index(1)  Right hand: index(1)→pinky(4)
            const fingers = hand === 'left' ? [4, 3, 2, 1] : [1, 2, 3, 4];

            const cells = fingers.map(f => {
                const isActiveChar  = fiInfo && fiInfo.hand === hand && fiInfo.finger === f;
                const isShiftFinger = isUpper && shiftHand === hand && f === 4;
                const highlight     = isActiveChar || isShiftFinger;
                
                // For Shift finger highlight, use blue (finger 4). For others, use their own color.
                const highlightCol = (isShiftFinger && !isActiveChar) ? FC[4] : FC[f];
                const fc            = FC[f];

                const tipStyle = fc
                    ? highlight
                        ? `style="background:${highlightCol.bg};box-shadow:0 0 25px ${highlightCol.bg}aa;border-color:${highlightCol.border};"`
                        : `style="border-color:${fc.subtleBorder};background:${fc.subtle};"`
                    : '';
                const labelStyle = fc
                    ? `style="color:${fc.label};opacity:${highlight ? 1 : 0.6};"`
                    : '';

                return `<div class="fguide-finger fguide-${hand}-f${f}">
                    <div class="fguide-tip" ${tipStyle}></div>
                    <div class="fguide-label" ${labelStyle}>${fingerLabel[f]}</div>
                </div>`;
            }).join('');

            return `<div class="fguide-hand">
                <div class="fguide-fingers ${hand}">${cells}</div>
                <div class="fguide-hand-label">${handLabel}</div>
            </div>`;
        }

        // Hint line below finger guide
        let hintLine = '';
        if (fiInfo && fiCol) {
            const shiftNote = isUpper
                ? ` <span style="color:rgba(255,255,255,0.45)">+</span>` +
                  ` <span style="color:${FC[4].label}">${shiftHand === 'left' ? 'Зүүн' : 'Баруун'} Shift</span>`
                : '';
            hintLine = `<div class="fguide-hint" style="color:${fiCol.label}">` +
                       `▶ ${fiInfo.name}${shiftNote}</div>`;
        }

        const guideHTML =
            `<div class="fguide-section">
                <div class="fguide">
                    ${handHTML('left',  'Зүүн гар')}
                    ${handHTML('right', 'Баруун гар')}
                </div>
                ${hintLine}
            </div>`;

        hintAreaEl.innerHTML = kbHTML + guideHTML;
    }

    // ── Public API ────────────────────────────────────────
    return {
        init, start, stop, pause, resume,
        get _lastStage() { return currentStageIndex; }
    };

})();
