window.KeyboardMode = (function() {
    let containerElement;
    let patternDisplayElement;
    let statsElement;
    let keyboardDisplayElement;
    
    let currentStageIndex = 0;
    
    let timerInterval;
    let startTime;
    let timeElapsed = 0;
    let isRunning = false;
    
    let targetText = "";
    let typedText = "";
    
    let totalCorrectChars = 0;
    let totalTypedChars = 0;

    let isActiveMode = false;

    function init(elements) {
        containerElement = elements.container;
        patternDisplayElement = elements.patternDisplay;
        statsElement = elements.stats;
        keyboardDisplayElement = elements.keyboardDisplay;

        if(!patternDisplayElement) return;

        document.addEventListener('keydown', handleKeyDown);
    }

    function generateRandomText(keys) {
        let text = "";
        let currentWordLength = 0;
        // Random word length between 4 and 8
        let targetWordLength = Math.floor(Math.random() * 5) + 4;
        
        for (let i = 0; i < 120; i++) {
            // Need a space
            if (currentWordLength >= targetWordLength && i < 119) {
                text += " ";
                currentWordLength = 0;
                targetWordLength = Math.floor(Math.random() * 5) + 4;
            } else {
                let char = keys[Math.floor(Math.random() * keys.length)];
                
                // ~ 25% uppercase
                if (Math.random() < 0.25) {
                    char = char.toUpperCase();
                } else {
                    char = char.toLowerCase();
                }
                
                text += char;
                currentWordLength++;
            }
        }
        return text;
    }

    function start(stageIndex) {
        if (!window.keyboardLessons || stageIndex >= window.keyboardLessons.length || stageIndex === undefined) {
            stageIndex = 0;
        }
        
        currentStageIndex = stageIndex;
        const stageObj = window.keyboardLessons[stageIndex];
        
        totalCorrectChars = 0;
        totalTypedChars = 0;
        timeElapsed = 0;
        
        targetText = generateRandomText(stageObj.keys);
        typedText = "";
        
        isRunning = false;
        isActiveMode = true;
        startTime = null;
        clearInterval(timerInterval);
        
        renderPattern();
        renderKeyboardHint(stageObj);
        updateLiveStats();
        
        // Ensure container is visible
        if(containerElement) containerElement.classList.remove('hidden');
    }

    function handleKeyDown(e) {
        if (!isActiveMode) return;

        if (!isRunning && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        if (!isRunning) return;

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
        
        renderPattern();
        
        if (isFinished) {
            for (let i = 0; i < targetText.length; i++) {
                totalTypedChars++;
                if (typedText[i] === targetText[i]) totalCorrectChars++;
            }
            // Small delay to show completion then finish
            isActiveMode = false;
            setTimeout(finish, 300); 
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
    
    function renderKeyboardHint(stageObj) {
        if(!keyboardDisplayElement) return;
        const keys = stageObj.keys;
        keyboardDisplayElement.innerHTML = `
            <div class="keyboard-hints">
                <p>Анхаарах товчнууд:</p>
                <div class="key-list" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 10px;">
                    ${keys.map(k => `<span class="k-key" style="margin:0;">${k.toLowerCase()}</span>`).join('')}
                </div>
            </div>
        `;
    }

    function updateLiveStats() {
        if(statsElement) {
            const stageName = window.keyboardLessons[currentStageIndex]?.lesson || '';
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics ? window.TypingAnalytics.formatTime(timeElapsed) : timeElapsed}</span></div>
                <div class="stat-item">Шат: <span>${stageName}</span></div>
            `;
        }
    }

    function finish() {
        isRunning = false;
        clearInterval(timerInterval);
        
        const finalAcc = window.TypingAnalytics ? window.TypingAnalytics.calculateAccuracy(totalCorrectChars, totalTypedChars) : 0;
        const finalWpm = window.TypingAnalytics ? window.TypingAnalytics.calculateWPM(totalCorrectChars, timeElapsed) : 0;
        const stageName = window.keyboardLessons[currentStageIndex]?.lesson || '';
        
        const stats = {
            "Шат": stageName,
            "Зарцуулсан хугацаа": window.TypingAnalytics ? window.TypingAnalytics.formatTime(timeElapsed) : timeElapsed,
            "Бичсэн үсгийн тоо": totalTypedChars,
            "WPM (Үг/минут)": finalWpm,
            "Нарийвчлал": finalAcc + "%"
        };
        
        if(window.AppController && window.AppController.handleKeyboardEnd) {
            window.AppController.handleKeyboardEnd(stats);
        }
    }

    function stop() {
        isRunning = false;
        isActiveMode = false;
        clearInterval(timerInterval);
    }

    return { init, start, stop };
})();
