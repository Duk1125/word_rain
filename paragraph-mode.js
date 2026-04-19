window.ParagraphMode = (function() {
    let containerElement;
    let textDisplayElement;
    let inputElement;
    let statsElement;
    
    let currentParagraph = null;
    let timerInterval;
    let startTime;
    let timeElapsed = 0; // seconds
    let isRunning = false;
    
    let targetText = "";
    let typedText = "";
    
    let isActiveMode = false;
    
    function init(elements) {
        containerElement = elements.container;
        textDisplayElement = elements.textDisplay;
        statsElement = elements.stats;

        // Ensure elements exist
        if(!textDisplayElement) return;

        document.addEventListener('keydown', handleKeyDown);
    }

    function startRandom() {
        const paragraphs = window.typingParagraphs || [];
        if(paragraphs.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        start(paragraphs[randomIndex]);
    }

    function start(paragraphObj) {
        currentParagraph = paragraphObj;
        targetText = paragraphObj.text;
        typedText = "";
        timeElapsed = 0;
        isRunning = false;
        isActiveMode = true;
        startTime = null;
        
        clearInterval(timerInterval);
        
        renderText();
        updateLiveStats();
        
        // Show container if not handled by root
        containerElement.classList.remove('hidden');
    }

    let isPaused = false;
    let pauseStartTime = 0;

    function handleKeyDown(e) {
        if (!isActiveMode || isPaused) return;

        if (!isRunning && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Start timer on first keystroke
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        if (!isRunning) return;

        // Prevent browser default actions for spacebar and backspace when playing
        if (e.key === ' ' || e.key === 'Backspace') {
            e.preventDefault();
        }

        if (e.key === 'Backspace') {
            typedText = typedText.slice(0, -1);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            typedText += e.key;
        } else {
            return;
        }
        
        const isFinished = typedText.length >= targetText.length;
        
        renderText();
        
        if (isFinished) {
            finish();
        }
    }

    function updateTimer() {
        if (!isRunning || isPaused) return;
        timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        updateLiveStats();
    }

    function renderText() {
        // Build character by character HTML
        let html = '';
        let correctCount = 0;
        
        for (let i = 0; i < targetText.length; i++) {
            const char = targetText[i];
            const typedChar = typedText[i];
            
            let charClass = '';
            if (typedChar == null) {
                charClass = 'untyped';
                // Mark cursor position loosely
                if(i === typedText.length) charClass += ' cursor';
            } else if (char === typedChar) {
                charClass = 'correct';
                correctCount++;
            } else {
                charClass = 'incorrect';
            }
            
            html += `<span class="${charClass}">${char === ' ' ? '&nbsp;' : char}</span>`;
        }
        
        textDisplayElement.innerHTML = html;
        
        // Live accuracy
        let currentAcc = window.TypingAnalytics.calculateAccuracy(correctCount, typedText.length);
        let currentWpm = window.TypingAnalytics.calculateWPM(correctCount, timeElapsed);
        
        if(statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">WPM: <span>${currentWpm}</span></div>
                <div class="stat-item">Нарийвчлал: <span>${currentAcc}%</span></div>
            `;
        }
    }
    
    function updateLiveStats() {
        if(!isRunning || isPaused) return;
        let correctCount = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === targetText[i]) correctCount++;
        }
        let currentWpm = window.TypingAnalytics.calculateWPM(correctCount, timeElapsed);
        let currentAcc = window.TypingAnalytics.calculateAccuracy(correctCount, typedText.length);
        
        if(statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">WPM: <span>${currentWpm}</span></div>
                <div class="stat-item">Нарийвчлал: <span>${currentAcc}%</span></div>
            `;
        }
    }

    function finish() {
        isRunning = false;
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
            "Бичсэн үсгийн тоо": typedText.length,
            "WPM (Үг/минут)": finalWpm,
            "Нарийвчлал": finalAcc + "%"
        };
        
        if(window.AppController && window.AppController.handleParagraphEnd) {
            window.AppController.handleParagraphEnd(stats);
        }
    }

    function pause() {
        if (!isRunning || isPaused) return;
        isPaused = true;
        pauseStartTime = Date.now();
        clearInterval(timerInterval);
    }

    function resume() {
        if (!isPaused) return;
        isPaused = false;
        if (startTime) {
            const pausedDuration = Date.now() - pauseStartTime;
            startTime += pausedDuration;
        }
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stop() {
        isRunning = false;
        isActiveMode = false;
        isPaused = false;
        clearInterval(timerInterval);
    }

    return { init, startRandom, start, stop, pause, resume };
})();
