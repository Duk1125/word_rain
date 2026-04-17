window.KeyboardMode = (function() {
    let containerElement;
    let patternDisplayElement;
    let inputElement;
    let statsElement;
    let keyboardDisplayElement;
    
    let currentLesson = null;
    let currentPatternIndex = 0;
    
    let timerInterval;
    let startTime;
    let timeElapsed = 0;
    let isRunning = false;
    
    let targetText = "";
    let typedText = "";
    
    let totalCorrectChars = 0;
    let totalTypedChars = 0;

    function init(elements) {
        containerElement = elements.container;
        patternDisplayElement = elements.patternDisplay;
        inputElement = elements.input;
        statsElement = elements.stats;
        keyboardDisplayElement = elements.keyboardDisplay; // Optional visual keys

        if(!inputElement || !patternDisplayElement) return;

        inputElement.addEventListener('input', handleInput);
    }

    function startRandom() {
        const lessons = window.keyboardLessons || [];
        if(lessons.length === 0) return;
        const randomIndex = Math.floor(Math.random() * lessons.length);
        start(lessons[randomIndex]);
    }

    function start(lessonObj) {
        currentLesson = lessonObj;
        currentPatternIndex = 0;
        
        totalCorrectChars = 0;
        totalTypedChars = 0;
        timeElapsed = 0;
        
        loadPattern();
        
        isRunning = false;
        startTime = null;
        clearInterval(timerInterval);
        
        inputElement.disabled = false;
        inputElement.focus();
        
        updateLiveStats();
    }

    function loadPattern() {
        if(currentPatternIndex >= currentLesson.patterns.length) {
            finish();
            return;
        }
        
        targetText = currentLesson.patterns[currentPatternIndex];
        typedText = "";
        inputElement.value = "";
        
        renderPattern();
        renderKeyboardHint();
    }

    function handleInput(e) {
        if(!isRunning && e.target.value.length > 0) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        typedText = e.target.value;
        const isFinished = typedText.length >= targetText.length;
        
        renderPattern();
        
        if (isFinished) {
            // Tally stats
            for (let i = 0; i < targetText.length; i++) {
                totalTypedChars++;
                if (typedText[i] === targetText[i]) totalCorrectChars++;
            }
            
            currentPatternIndex++;
            setTimeout(loadPattern, 300); // Small delay to show completion
        }
    }

    function updateTimer() {
        timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        updateLiveStats();
    }

    function renderPattern() {
        let html = '';
        for (let i = 0; i < targetText.length; i++) {
            const char = targetText[i];
            const typedChar = typedText[i];
            
            let charClass = '';
            if (typedChar == null) {
                charClass = 'untyped';
                if(i === typedText.length) charClass += ' cursor';
            } else if (char === typedChar) {
                charClass = 'correct';
            } else {
                charClass = 'incorrect';
            }
            
            html += `<span class="${charClass}">${char === ' ' ? '&nbsp;' : char}</span>`;
        }
        
        patternDisplayElement.innerHTML = `<div class="kb-pattern">${html}</div>`;
    }
    
    function renderKeyboardHint() {
        if(!keyboardDisplayElement) return;
        const keys = currentLesson.keys;
        keyboardDisplayElement.innerHTML = `
            <div class="keyboard-hints">
                <p>Анхаарах товчнууд:</p>
                <div class="key-list">
                    ${keys.map(k => `<span class="k-key">${k}</span>`).join('')}
                </div>
            </div>
        `;
    }

    function updateLiveStats() {
        if(statsElement) {
            let acc = window.TypingAnalytics.calculateAccuracy(totalCorrectChars, totalTypedChars);
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">Дасгал: <span>${currentPatternIndex + 1}/${currentLesson.patterns.length}</span></div>
            `;
        }
    }

    function finish() {
        isRunning = false;
        clearInterval(timerInterval);
        inputElement.disabled = true;
        
        const finalAcc = window.TypingAnalytics.calculateAccuracy(totalCorrectChars, totalTypedChars);
        
        const stats = {
            "Хичээл": currentLesson.lesson,
            "Зарцуулсан хугацаа": window.TypingAnalytics.formatTime(timeElapsed),
            "Нарийвчлал": finalAcc + "%"
        };
        
        if(window.AppController && window.AppController.handleKeyboardEnd) {
            window.AppController.handleKeyboardEnd(stats);
        }
    }

    function stop() {
        isRunning = false;
        clearInterval(timerInterval);
    }

    return { init, startRandom, stop };
})();
