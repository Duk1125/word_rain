// ============================================================
// keyboard-mode.js — Хурууны байрлал
// Single-line sliding practice + visual keyboard/finger guide
// Includes: pause modal, completion modal, pause/resume logic
// ============================================================

window.KeyboardMode = (function () {

    // ── DOM refs ──────────────────────────────────────────
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
    let isPaused      = false;

    let charSpans = [];

    // ── Constants ─────────────────────────────────────────
    const TOTAL_CHARS = 120;
    const CHAR_PX     = 50;   // px per char cell — must match CSS .kb-char min-width
    const ANCHOR_LEFT = 160;  // px from left where active char sits

    // ── init ──────────────────────────────────────────────
    function init(elements) {
        containerEl   = elements.container;
        displayAreaEl = elements.patternDisplay;
        hintAreaEl    = elements.keyboardDisplay;
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
        isPaused     = false;
        startTime    = null;
        clearInterval(timerInterval);

        // Close any lingering modals
        removeModal('kb-pause-modal');
        removeModal('kb-result-modal');

        const stage = lessons[stageIndex];
        targetText = generateText(stage.keys);

        buildSliderDOM();
        renderKeyboard(targetText[0]);
        updateStats();
        if (containerEl) containerEl.classList.remove('hidden');
    }

    // ── Text generation ───────────────────────────────────
    function generateText(keys) {
        const capitalRatio = 0.20;
        let pool = [...keys];
        let shuffled = shuffle([...pool]);
        let si = 0, text = "";
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
        if (['Shift','CapsLock','Control','Alt','Meta'].includes(e.key)) return;
        if (e.key.length !== 1) return;

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
            isRunning    = false;
            clearInterval(timerInterval);
            timeElapsed = Math.round((Date.now() - startTime) / 1000);
            updateProgressBar();
            renderKeyboard(null);
            updateStats();
            setTimeout(finish, 300);
        }
    }

    // ── Timer ─────────────────────────────────────────────
    function tickTimer() {
        if (!startTime || isPaused) return;
        timeElapsed = Math.round((Date.now() - startTime) / 1000);
        updateStats();
    }

    function updateProgressBar() {
        const bar = document.getElementById('kb-progress-bar');
        if (bar) bar.style.width = ((charIndex / TOTAL_CHARS) * 100) + '%';
    }

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

    // ── finish → show result modal (no redirect to analytics.js) ─
    function finish() {
        const accuracy  = charIndex > 0 ? Math.round(correctCount / charIndex * 100) : 0;
        const wpm       = window.TypingAnalytics
            ? window.TypingAnalytics.calculateWPM(correctCount, timeElapsed)
            : Math.round((correctCount / 5) / Math.max(timeElapsed / 60, 0.01));
        const stageName = (window.keyboardLessons || [])[currentStageIndex]?.lesson || '';
        const fmt       = window.TypingAnalytics
            ? window.TypingAnalytics.formatTime(timeElapsed)
            : timeElapsed + 'с';

        showResultModal({
            stage:    stageName,
            total:    charIndex,
            errors:   errorCount,
            accuracy: accuracy,
            time:     fmt,
            wpm:      wpm
        });
    }

    // ── stop ─────────────────────────────────────────────
    function stop() {
        isRunning    = false;
        isActiveMode = false;
        isPaused     = false;
        clearInterval(timerInterval);
        removeModal('kb-pause-modal');
        removeModal('kb-result-modal');
    }

    // ── pause / resume ────────────────────────────────────
    function pause() {
        if (!isActiveMode && !isRunning) return;
        isPaused = true;
        clearInterval(timerInterval);
        // Freeze elapsed time snapshot
        if (startTime) timeElapsed = Math.round((Date.now() - startTime) / 1000);
    }

    function resume() {
        if (!isPaused) return;
        isPaused = false;
        if (isRunning) {
            // Recalculate startTime to account for paused duration
            startTime = Date.now() - timeElapsed * 1000;
            timerInterval = setInterval(tickTimer, 500);
        }
    }

    // ── Modal helpers ─────────────────────────────────────
    function removeModal(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ── Pause modal ───────────────────────────────────────
    function showPauseModal() {
        pause();
        removeModal('kb-pause-modal');

        const overlay = document.createElement('div');
        overlay.id = 'kb-pause-modal';
        overlay.className = 'modal-overlay kb-modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content kb-pause-content">
                <h2>⏸ Түр зогсоов</h2>
                <div class="kb-pause-buttons">
                    <button id="kbp-resume"  class="primary-btn">▶ Үргэлжлүүлэх</button>
                    <button id="kbp-restart" class="primary-btn kbp-secondary">↺ Дахин эхлэх</button>
                    <button id="kbp-home"    class="text-btn">🏠 Үндсэн цэс</button>
                    <button id="kbp-settings" class="text-btn">⚙️ Тохиргоо</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('kbp-resume').addEventListener('click', () => {
            overlay.remove();
            resume();
        });
        document.getElementById('kbp-restart').addEventListener('click', () => {
            overlay.remove();
            start(currentStageIndex);
        });
        document.getElementById('kbp-home').addEventListener('click', () => {
            overlay.remove();
            stop();
            if (window.AppController && window.AppController.goHome) window.AppController.goHome();
        });
        document.getElementById('kbp-settings').addEventListener('click', () => {
            // Keep pause modal open, just open settings on top
            if (window.AppController && window.AppController.openSettingsForMode) {
                window.AppController.openSettingsForMode('keyboard');
            }
        });
    }

    // ── Result modal (Хурууны байрлал completion) ─────────
    function showResultModal(data) {
        removeModal('kb-result-modal');

        const overlay = document.createElement('div');
        overlay.id = 'kb-result-modal';
        overlay.className = 'modal-overlay kb-modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content kb-result-content">
                <h2>✅ Дадлага дууслаа</h2>
                <div class="kb-result-grid">
                    <div class="kb-result-card">
                        <div class="kb-result-label">Шат</div>
                        <div class="kb-result-value">${data.stage}</div>
                    </div>
                    <div class="kb-result-card">
                        <div class="kb-result-label">Нийт үсэг</div>
                        <div class="kb-result-value">${data.total}</div>
                    </div>
                    <div class="kb-result-card">
                        <div class="kb-result-label">Алдаа</div>
                        <div class="kb-result-value kb-result-error">${data.errors}</div>
                    </div>
                    <div class="kb-result-card">
                        <div class="kb-result-label">Нарийвчлал</div>
                        <div class="kb-result-value">${data.accuracy}%</div>
                    </div>
                    <div class="kb-result-card">
                        <div class="kb-result-label">Хугацаа</div>
                        <div class="kb-result-value">${data.time}</div>
                    </div>
                    <div class="kb-result-card">
                        <div class="kb-result-label">WPM</div>
                        <div class="kb-result-value">${data.wpm}</div>
                    </div>
                </div>
                <div class="game-over-buttons" style="margin-top:22px">
                    <button id="kbr-restart" class="primary-btn">↺ Дахин эхлэх</button>
                    <button id="kbr-home"    class="text-btn">🏠 Үндсэн цэс рүү буцах</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('kbr-restart').addEventListener('click', () => {
            overlay.remove();
            start(currentStageIndex);
        });
        document.getElementById('kbr-home').addEventListener('click', () => {
            overlay.remove();
            stop();
            if (window.AppController && window.AppController.goHome) window.AppController.goHome();
        });
    }

    // ============================================================
    // Visual keyboard + finger guide (rendered into hintAreaEl)
    // ============================================================
    function renderKeyboard(targetChar) {
        if (!hintAreaEl) return;

        const layout    = window.kbLayout    || [];
        const charPos   = window.kbCharPos   || {};
        const fingerMap = window.kbFingerMap || {};
        const FC        = window.FINGER_COLORS || {};

        const ch      = targetChar ? targetChar.toLowerCase() : null;
        const isUpper = targetChar
            ? (targetChar !== targetChar.toLowerCase() && targetChar.toLowerCase() !== targetChar.toUpperCase())
            : false;
        const pos     = ch ? charPos[ch] : null;
        const fiInfo  = pos ? fingerMap[`${pos.row}-${pos.col}`] : null;
        const fiNum   = fiInfo ? fiInfo.finger : null;
        const fiCol   = fiNum  ? FC[fiNum]     : null;

        // Shift is always чигчий (4) / Blue — regardless of which hand
        const shiftHand = (isUpper && fiInfo)
            ? (fiInfo.hand === 'left' ? 'right' : 'left')
            : null;
        const shiftFingerNum = 4;           // always чигчий
        const shiftFC        = FC[shiftFingerNum]; // always blue

        // Row stagger (Row 3 starts with Left Shift, so no indent)
        const staggerPx = [0, 22, 42, 0];

        function activeKeyStyle(fc) {
            return `background:${fc.bg};border-color:${fc.border};color:${fc.text};` +
                   `box-shadow:0 0 26px ${fc.bg}aa;transform:translateY(2px) scale(1.13);` +
                   `z-index:2;position:relative;`;
        }
        function shiftHighlightStyle(fc) {
            return `background:${fc.subtle};border-color:${fc.border};color:${fc.border};` +
                   `box-shadow:0 0 16px ${fc.bg}60;transform:translateY(1px);`;
        }

        // ── keyboard HTML ─────────────────────────────────
        let kbHTML = '<div class="vkb">';

        // Row 0 – symbol row
        kbHTML += `<div class="vkb-row" style="padding-left:0">`;
        const symRow = layout[0] || [];
        for (let c = 0; c < symRow.length; c++) {
            const isT  = pos && pos.row === 0 && pos.col === c;
            const fi0  = fingerMap[`0-${c}`];
            const fCls = fi0 ? `vkb-${fi0.hand}-f${fi0.finger}` : '';
            const sAttr = isT && fiCol ? `style="${activeKeyStyle(fiCol)}"` : '';
            kbHTML += `<div class="vkb-key vkb-sym ${fCls}" ${sAttr}>${symRow[c]}</div>`;
        }
        kbHTML += `</div>`;

        // Rows 1-3
        for (let r = 1; r <= 3; r++) {
            kbHTML += `<div class="vkb-row" style="padding-left:${staggerPx[r]}px">`;

            // LEFT SHIFT (row 3 only)
            if (r === 3) {
                const lsActive = shiftHand === 'left';
                const lsStyle  = lsActive && shiftFC
                    ? `style="${shiftHighlightStyle(shiftFC)}"`
                    : '';
                kbHTML += `<div class="vkb-key vkb-shift vkb-left-f4" ${lsStyle} title="Зүүн Shift">⇧</div>`;
            }

            const row = layout[r] || [];
            for (let c = 0; c < row.length; c++) {
                const isT  = pos && pos.row === r && pos.col === c;
                const fi   = fingerMap[`${r}-${c}`];
                const fCls = fi ? `vkb-${fi.hand}-f${fi.finger}` : '';
                const sAttr = isT && fiCol ? `style="${activeKeyStyle(fiCol)}"` : '';
                const title = fi ? fi.name : '';
                kbHTML += `<div class="vkb-key ${fCls}" ${sAttr} title="${title}">${row[c].toUpperCase()}</div>`;
            }

            // RIGHT SHIFT (row 3 only)
            if (r === 3) {
                const rsActive = shiftHand === 'right';
                const rsStyle  = rsActive && shiftFC
                    ? `style="${shiftHighlightStyle(shiftFC)}"`
                    : '';
                kbHTML += `<div class="vkb-key vkb-shift vkb-right-f4" ${rsStyle} title="Баруун Shift">⇧</div>`;
            }

            kbHTML += `</div>`;
        }
        kbHTML += `</div>`;

        // ── finger guide ──────────────────────────────────
        const fingerLabel = ['', 'долоовор', 'дунд', 'ядам', 'чигчий'];

        function handHTML(hand, handLabel) {
            const fingers = hand === 'left' ? [4,3,2,1] : [1,2,3,4];
            const cells = fingers.map(f => {
                const isActiveChar  = fiInfo && fiInfo.hand === hand && fiInfo.finger === f;
                const isShiftFinger = isUpper && shiftHand === hand && f === shiftFingerNum;
                const highlight     = isActiveChar || isShiftFinger;
                const fc            = FC[f];
                const tipStyle = fc
                    ? highlight
                        ? `style="background:${fc.bg};box-shadow:0 0 22px ${fc.bg}aa;border-color:${fc.border};" `
                        : `style="border-color:${fc.subtleBorder};background:${fc.subtle};" `
                    : '';
                const labelStyle = fc
                    ? `style="color:${fc.label};opacity:${highlight ? 1 : 0.5};" `
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

        let hintLine = '';
        if (fiInfo && fiCol) {
            const shiftNote = isUpper && shiftFC
                ? ` <span style="opacity:.5">+</span> <span style="color:${shiftFC.label}">${shiftHand === 'left' ? 'Зүүн' : 'Баруун'} Shift (чигчий)</span>`
                : '';
            hintLine = `<div class="fguide-hint" style="color:${fiCol.label}">▶ ${fiInfo.name}${shiftNote}</div>`;
        }

        const guideHTML = `
            <div class="fguide-section">
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
        showPauseModal,
        get _lastStage() { return currentStageIndex; }
    };

})();
