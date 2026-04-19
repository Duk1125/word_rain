window.ParagraphMode = (function() {
    let containerElement;
    let textDisplayElement;
    let statsElement;
    
    let currentParagraph = null;
    let timerInterval;
    let startTime;
    let timeElapsed = 0;
    let isRunning = false;
    let isPaused  = false;
    
    let targetText = "";
    let typedText  = "";
    
    let isActiveMode = false;
    
    function init(elements) {
        containerElement  = elements.container;
        textDisplayElement = elements.textDisplay;
        statsElement      = elements.stats;
        if (!textDisplayElement) return;
        document.addEventListener('keydown', handleKeyDown);
    }

    function startRandom() {
        const paragraphs = window.typingParagraphs || [];
        if (paragraphs.length === 0) return;
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        start(paragraphs[randomIndex]);
    }

    function start(paragraphObj) {
        currentParagraph = paragraphObj;
        targetText  = paragraphObj.text;
        typedText   = "";
        timeElapsed = 0;
        isRunning   = false;
        isPaused    = false;
        isActiveMode = true;
        startTime   = null;
        clearInterval(timerInterval);
        removeModal('para-pause-modal');
        renderText();
        updateLiveStats();
        containerElement.classList.remove('hidden');
    }

    function handleKeyDown(e) {
        if (!isActiveMode || isPaused) return;

        if (!isRunning && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
        if (!isRunning) return;

        if (e.key === ' ' || e.key === 'Backspace') e.preventDefault();

        if (e.key === 'Backspace') {
            typedText = typedText.slice(0, -1);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            typedText += e.key;
        } else {
            return;
        }

        const isFinished = typedText.length >= targetText.length;
        renderText();
        if (isFinished) finish();
    }

    function updateTimer() {
        if (isPaused) return;
        timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        updateLiveStats();
    }

    function renderText() {
        let html = '';
        let correctCount = 0;
        for (let i = 0; i < targetText.length; i++) {
            const char     = targetText[i];
            const typedChar = typedText[i];
            let charClass = '';
            if (typedChar == null) {
                charClass = i === typedText.length ? 'untyped cursor' : 'untyped';
            } else if (char === typedChar) {
                charClass = 'correct'; correctCount++;
            } else {
                charClass = 'incorrect';
            }
            html += `<span class="${charClass}">${char === ' ' ? '&nbsp;' : char}</span>`;
        }
        textDisplayElement.innerHTML = html;
        let currentAcc = window.TypingAnalytics.calculateAccuracy(correctCount, typedText.length);
        let currentWpm = window.TypingAnalytics.calculateWPM(correctCount, timeElapsed);
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">WPM: <span>${currentWpm}</span></div>
                <div class="stat-item">Нарийвчлал: <span>${currentAcc}%</span></div>
            `;
        }
    }
    
    function updateLiveStats() {
        if (!isRunning) return;
        let correctCount = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === targetText[i]) correctCount++;
        }
        let currentWpm = window.TypingAnalytics.calculateWPM(correctCount, timeElapsed);
        let currentAcc = window.TypingAnalytics.calculateAccuracy(correctCount, typedText.length);
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">WPM: <span>${currentWpm}</span></div>
                <div class="stat-item">Нарийвчлал: <span>${currentAcc}%</span></div>
            `;
        }
    }

    function finish() {
        isRunning    = false;
        isActiveMode = false;
        clearInterval(timerInterval);
        let correctCount = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === targetText[i]) correctCount++;
        }
        const finalWpm = window.TypingAnalytics.calculateWPM(correctCount, timeElapsed);
        const finalAcc = window.TypingAnalytics.calculateAccuracy(correctCount, typedText.length);
        const stats = {
            "Зарцуулсан хугацаа": window.TypingAnalytics.formatTime(timeElapsed),
            "Бичсэн үсгийн тоо":  typedText.length,
            "WPM (Үг/минут)":     finalWpm,
            "Нарийвчлал":         finalAcc + "%"
        };
        if (window.AppController && window.AppController.handleParagraphEnd) {
            window.AppController.handleParagraphEnd(stats);
        }
    }

    function stop() {
        isRunning    = false;
        isActiveMode = false;
        isPaused     = false;
        clearInterval(timerInterval);
        removeModal('para-pause-modal');
    }

    // ── pause / resume ─────────────────────────────────
    function pause() {
        if (!isActiveMode && !isRunning) return;
        isPaused = true;
        clearInterval(timerInterval);
        if (startTime) timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    }

    function resume() {
        if (!isPaused) return;
        isPaused = false;
        if (isRunning) {
            startTime = Date.now() - timeElapsed * 1000;
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    function removeModal(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function showPauseModal() {
        pause();
        removeModal('para-pause-modal');
        const overlay = document.createElement('div');
        overlay.id = 'para-pause-modal';
        overlay.className = 'modal-overlay kb-modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content kb-pause-content">
                <h2>⏸ Түр зогсоов</h2>
                <div class="kb-pause-buttons">
                    <button id="parp-resume"   class="primary-btn">▶ Үргэлжлүүлэх</button>
                    <button id="parp-restart"  class="primary-btn kbp-secondary">↺ Дахин эхлэх</button>
                    <button id="parp-home"     class="text-btn">🏠 Үндсэн цэс</button>
                    <button id="parp-settings" class="text-btn">⚙️ Тохиргоо</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('parp-resume').addEventListener('click', () => {
            overlay.remove(); resume();
        });
        document.getElementById('parp-restart').addEventListener('click', () => {
            overlay.remove(); start(currentParagraph);
        });
        document.getElementById('parp-home').addEventListener('click', () => {
            overlay.remove(); stop();
            if (window.AppController && window.AppController.goHome) window.AppController.goHome();
        });
        document.getElementById('parp-settings').addEventListener('click', () => {
            if (window.AppController && window.AppController.openSettingsForMode) {
                window.AppController.openSettingsForMode('paragraph');
            }
        });
    }

    return { init, startRandom, stop, pause, resume, showPauseModal };
})();
