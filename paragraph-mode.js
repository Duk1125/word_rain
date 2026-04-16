const ParagraphMode = (function() {
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
    
    function init(elements) {
        containerElement = elements.container;
        textDisplayElement = elements.textDisplay;
        inputElement = elements.input;
        statsElement = elements.stats;

        // Ensure elements exist
        if(!inputElement || !textDisplayElement) return;

        inputElement.addEventListener('input', handleInput);
        
        // Prevent clicking outside to lose focus easily
        containerElement.addEventListener('click', () => {
            if(isRunning) inputElement.focus();
        });
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
        startTime = null;
        
        clearInterval(timerInterval);
        
        inputElement.value = "";
        inputElement.disabled = false;
        
        renderText();
        updateLiveStats();
        
        // Show container if not handled by root
        containerElement.classList.remove('hidden');
        inputElement.focus();
    }

    function handleInput(e) {
        if(!isRunning && e.target.value.length > 0) {
            // Start timer on first keystroke
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        typedText = e.target.value;
        const isFinished = typedText.length >= targetText.length;
        
        renderText();
        
        if (isFinished) {
            finish();
        }
    }

    function updateTimer() {
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
        if(!isRunning) return;
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
        clearInterval(timerInterval);
        inputElement.disabled = true;
        
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

    function stop() {
        isRunning = false;
        clearInterval(timerInterval);
    }

    return { init, startRandom, stop };
})();
