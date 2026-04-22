window.ParagraphMode = (function() {
    let containerElement, textDisplayElement, statsElement;
    let currentParagraph = null, timerInterval, startTime, timeElapsed = 0;
    let isRunning = false, isPaused = false, pauseStartTime = 0;
    let isActiveMode = false;

    // Line-by-line state
    let lines = []; // { reference, typed }
    let currentLineIndex = 0;
    
    function init(elements) {
        containerElement = elements.container;
        textDisplayElement = elements.textDisplay;
        statsElement = elements.stats;
        if(!textDisplayElement) return;
        document.addEventListener('keydown', handleKeyDown);
    }

    function start(paragraphObj) {
        if (!paragraphObj) return;
        
        currentParagraph = paragraphObj;
        timeElapsed = 0;
        isRunning = false;
        isPaused = false;
        isActiveMode = true;
        startTime = null;
        
        // Split text into lines
        lines = splitTextIntoLines(paragraphObj.text).map(str => ({
            reference: str,
            typed: ""
        }));
        currentLineIndex = 0;
        
        clearInterval(timerInterval);
        renderText();
        
        if (containerElement) containerElement.classList.remove('hidden');
        if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
    }

    function splitTextIntoLines(text) {
        const words = text.split(' ');
        const resultLines = [];
        let currentLine = "";
        const maxChars = 65; // Balanced length for line-by-line UI

        words.forEach(word => {
            if ((currentLine + word).length > maxChars) {
                resultLines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        });
        if (currentLine) resultLines.push(currentLine.trim());
        return resultLines;
    }

    function escapeDisplayChar(char) {
        if (char == null) return '';
        if (char === ' ') return '&nbsp;';
        return String(char)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function handleKeyDown(e) {
        if (!isActiveMode || isPaused) return;

        // Start timer on first keystroke
        if (!isRunning && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            isRunning = true;
            startTime = Date.now();
            timerInterval = setInterval(() => {
                if(!isPaused) {
                    timeElapsed = Math.floor((Date.now() - startTime) / 1000);
                    updateLiveStats();
                }
            }, 1000);
        }

        if (e.key === ' ' || e.key === 'Backspace') e.preventDefault();
        if (!isRunning && e.key !== 'Backspace') return;

        const currentLine = lines[currentLineIndex];
        if (!currentLine) return;

        if (e.key === 'Backspace') {
            if (currentLine.typed.length > 0) {
                currentLine.typed = currentLine.typed.slice(0, -1);
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            currentLine.typed += e.key;
        } else return;
        
        renderText();

        // Check if current line is finished
        if (currentLine.typed.length >= currentLine.reference.length) {
            currentLineIndex++;
            if (currentLineIndex >= lines.length) {
                finish();
            } else {
                renderText();
            }
        }
    }

    function renderText() {
        if (!textDisplayElement) return;

        let html = '';
        lines.forEach((line, idx) => {
            const isActive = idx === currentLineIndex;
            const isCompleted = idx < currentLineIndex;
            
            html += `
                <div class="paragraph-line-pair ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="line-reference">${line.reference}</div>
                    <div class="line-input-container">
                        ${renderLineInput(line, isActive)}
                    </div>
                </div>
            `;
        });
        
        textDisplayElement.innerHTML = html;
        
        // Auto-scroll to active line
        const activeLineEl = textDisplayElement.querySelector('.paragraph-line-pair.active');
        if (activeLineEl) {
            activeLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        updateLiveStats();
    }

    function renderLineInput(line, isActive) {
        let lineHtml = '';
        const target = line.reference;
        const typed = line.typed;
        const renderLength = Math.max(target.length, typed.length);

        for (let i = 0; i < renderLength; i++) {
            const char = target[i];
            const typedChar = typed[i];

            if (typedChar == null && char != null) {
                if (isActive && i === typed.length) {
                    lineHtml += `<span class="cursor"></span>`;
                }
                lineHtml += `<span class="untyped">${escapeDisplayChar(char)}</span>`;
                continue;
            }

            const isCorrect = char != null && char === typedChar;
            const charClass = isCorrect ? 'correct' : 'incorrect';
            const displayChar = isCorrect ? char : typedChar;
            lineHtml += `<span class="${charClass}">${escapeDisplayChar(displayChar)}</span>`;
        }

        if (isActive && typed.length === renderLength) {
            lineHtml += `<span class="cursor"></span>`;
        }

        return lineHtml;
    }

    function updateLiveStats() {
        let totalCorrect = 0;
        let totalTyped = 0;
        
        lines.forEach(line => {
            totalTyped += line.typed.length;
            for (let i = 0; i < line.typed.length; i++) {
                if (line.typed[i] === line.reference[i]) totalCorrect++;
            }
        });

        const wpm = window.TypingAnalytics.calculateWPM(totalCorrect, timeElapsed);
        const acc = window.TypingAnalytics.calculateAccuracy(totalCorrect, totalTyped);
        
        if(statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">Хугацаа: <span>${window.TypingAnalytics.formatTime(timeElapsed)}</span></div>
                <div class="stat-item">WPM: <span>${wpm}</span></div>
                <div class="stat-item">Нарийвчлал: <span>${acc}%</span></div>
            `;
        }
    }

    function finish() {
        isRunning = false;
        isActiveMode = false;
        clearInterval(timerInterval);
        
        let totalCorrect = 0;
        let totalTyped = 0;
        lines.forEach(line => {
            totalTyped += line.typed.length;
            for (let i = 0; i < line.typed.length; i++) {
                if (line.typed[i] === line.reference[i]) totalCorrect++;
            }
        });
        
        const finalWpm = window.TypingAnalytics.calculateWPM(totalCorrect, timeElapsed);
        const finalAcc = window.TypingAnalytics.calculateAccuracy(totalCorrect, totalTyped);
        
        const stats = {
            "Зарцуулсан хугацаа": window.TypingAnalytics.formatTime(timeElapsed),
            "Бичсэн үсгийн тоо": totalTyped,
            "WPM (Үг/минут)": finalWpm,
            "Нарийвчлал": finalAcc + "%"
        };
        
        if(window.AppController && window.AppController.handleParagraphEnd) {
            window.AppController.handleParagraphEnd(stats);
        }
    }

    return { 
        init, 
        start, 
        stop: () => { isRunning = false; isActiveMode = false; clearInterval(timerInterval); }, 
        pause: () => { isPaused = true; pauseStartTime = Date.now(); }, 
        resume: () => { isPaused = false; if(startTime) startTime += (Date.now() - pauseStartTime); } 
    };
})();
