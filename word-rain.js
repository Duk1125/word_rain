window.WordRain = (function() {
    let score = 0;
    let lives = 5;
    let currentDifficulty = 'level2';
    let gameInterval;
    let spawnInterval;
    let activeWords = [];
    let gameRunning = false;
    let spawnRate = 2000;
    let fallSpeed = 120;
    let isPaused = false;
    let lastFrameTime = 0;
    
    // Analytics tracking
    let stats = {
        totalSpawned: 0,
        totalTyped: 0,
        totalMissed: 0,
        wordTimes: [], // array of { word, timeMs }
        missedWordsList: []
    };

    class WordBag {
        constructor() {
            this.bags = { level1: [], level2: [], level3: [], level4: [] };
        }

        getWord(difficulty) {
            if (!this.bags[difficulty] || this.bags[difficulty].length === 0) {
                this.refillBag(difficulty);
            }
            return this.bags[difficulty].pop();
        }

        refillBag(difficultyKey) {
            let allWords = window.mongolianWords || [];
            let filteredWords = [];
            
            let targetDiff = (difficultyKey === 'level1') ? 1 : (difficultyKey === 'level3' ? 3 : (difficultyKey === 'level4' ? 4 : 2));

            filteredWords = allWords.filter(w => w.difficulty <= targetDiff).map(w => w.word);
            
            if (filteredWords.length === 0) filteredWords = allWords.map(w => w.word);

            // Shuffle
            for (let i = filteredWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredWords[i], filteredWords[j]] = [filteredWords[j], filteredWords[i]];
            }

            this.bags[difficultyKey] = filteredWords;
        }
    }

    const wordBag = new WordBag();
    let gameArea, scoreElement, livesElement, wordInput;

    function init(elements) {
        gameArea = elements.gameArea;
        scoreElement = elements.scoreElement;
        livesElement = elements.livesElement;
        wordInput = elements.wordInput;

        wordInput.addEventListener('input', checkInput);
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') wordInput.value = '';
        });
    }

    function start(speedMult, spawnMult, diffKey) {
        gameRunning = true;
        isPaused = false;
        score = 0;
        lives = 5;
        currentDifficulty = diffKey;
        
        stats = {
            totalSpawned: 0,
            totalTyped: 0,
            totalMissed: 0,
            wordTimes: [],
            missedWordsList: []
        };

        spawnRate = 1830 * (spawnMult || 1.4);
        fallSpeed = 64 * (speedMult || 1.4);

        lastFrameTime = performance.now();
        activeWords.forEach(w => w.element.remove());
        activeWords = [];
        
        updateStats();
        wordInput.value = '';
        wordInput.focus();

        gameInterval = requestAnimationFrame(gameLoop);
        spawnInterval = setInterval(spawnWord, spawnRate);
    }

    function spawnWord() {
        if (!gameRunning || isPaused) return;

        const wordText = wordBag.getWord(currentDifficulty);
        if (!wordText) return;

        const wordEl = document.createElement('div');
        wordEl.classList.add('falling-word');
        wordEl.textContent = wordText;

        const maxLeft = gameArea.clientWidth - 150;
        let leftPos = Math.random() * maxLeft;

        wordEl.style.left = `${Math.max(10, leftPos)}px`;
        wordEl.style.top = '0px';
        wordEl.style.transform = 'translateY(-40px)';
        wordEl.style.opacity = '0';

        gameArea.appendChild(wordEl);

        setTimeout(() => {
            wordEl.style.transition = 'opacity 0.3s ease';
            wordEl.style.opacity = '1';
        }, 50);

        activeWords.push({
            element: wordEl,
            text: wordText,
            y: -40,
            spawnTime: Date.now()
        });

        stats.totalSpawned++;
    }

    function checkInput(e) {
        if (isPaused || !gameRunning) {
            e.target.value = '';
            return;
        }
        
        const typed = e.target.value.trim();
        const matchIndex = activeWords.findIndex(w => w.text.toLowerCase() === typed.toLowerCase());

        if (matchIndex !== -1) {
            const wordObj = activeWords[matchIndex];
            stats.totalTyped++;
            stats.wordTimes.push({ word: wordObj.text, timeMs: Date.now() - wordObj.spawnTime });

            wordObj.element.remove();
            activeWords.splice(matchIndex, 1);

            score += wordObj.text.length;
            updateStats();
            e.target.value = '';
        }
    }

    function gameLoop(timestamp) {
        if (!gameRunning || isPaused) {
            lastFrameTime = timestamp;
            if (gameRunning) gameInterval = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = (timestamp - lastFrameTime) / 1000;
        lastFrameTime = timestamp;

        for (let i = activeWords.length - 1; i >= 0; i--) {
            const wordObj = activeWords[i];
            wordObj.y += fallSpeed * deltaTime;
            wordObj.element.style.transform = `translate3d(0, ${wordObj.y.toFixed(1)}px, 0)`;

            if (wordObj.y > gameArea.clientHeight - 50) {
                stats.totalMissed++;
                stats.missedWordsList.push(wordObj.text);
                loseLife();
                wordObj.element.remove();
                activeWords.splice(i, 1);
            }
        }

        gameInterval = requestAnimationFrame(gameLoop);
    }

    function loseLife() {
        lives--;
        updateStats();
        if (lives <= 0) endGame();
    }

    function updateStats() {
        if(scoreElement) scoreElement.textContent = score;
        if(livesElement) {
            livesElement.innerHTML = '';
            for (let i = 0; i < lives; i++) {
                const heart = document.createElement('span');
                heart.className = 'heart-icon';
                heart.textContent = '❤️';
                livesElement.appendChild(heart);
            }
        }
    }

    function endGame() {
        gameRunning = false;
        cancelAnimationFrame(gameInterval);
        clearInterval(spawnInterval);
        
        activeWords.forEach(w => w.element.remove());
        activeWords = [];

        if(window.AppController && window.AppController.handleWordRainEnd) {
            window.AppController.handleWordRainEnd(score, currentDifficulty, generateAnalytics());
        }
    }

    function generateAnalytics() {
        // Requirement 1, 2, 4, 16: Redesign summary card and missed words list
        const uniqueMissed = [...new Set(stats.missedWordsList)];
        
        // Generate summary text (Requirement 2)
        let summaryText = "Сайн бичлээ!";
        
        const avgTime = stats.totalTyped > 0 ? (stats.wordTimes.reduce((acc, val) => acc + val.timeMs, 0) / stats.totalTyped) : 0;
        const longWordsSlow = stats.wordTimes.filter(w => w.word.length > 6 && w.timeMs > 3000).length;

        if (stats.totalMissed > 5) {
            summaryText = "Олон үг алдсан";
        } else if (longWordsSlow > 2) {
            summaryText = "Урт үгс дээр саатсан";
        } else if (avgTime > 2500) {
            summaryText = "Хурд удаан байна";
        } else if (stats.totalMissed > 0) {
            summaryText = "Зарим үгийг алдсан";
        } else {
            summaryText = "Маш сайн, алдаагүй!";
        }

        return {
            "Оноо": score,
            "Нийт бичсэн үг": stats.totalTyped,
            "Дундаж хугацаа (үгсэд)": stats.totalTyped > 0 ? (avgTime/1000).toFixed(2) + "с" : "N/A",
            "Анхаарах зүйл": summaryText, // Requirement 1: short summary card
            "Анхаарах ёстой үгс": uniqueMissed.slice(0, 10) // Requirement 4: separate list (actual missed words only)
        };
    }

    function togglePause() {
        if (!gameRunning) return;
        isPaused = !isPaused;
        return isPaused;
    }
    
    function stop() {
        gameRunning = false;
        isPaused = false;
        cancelAnimationFrame(gameInterval);
        clearInterval(spawnInterval);
        activeWords.forEach(w => w.element.remove());
        activeWords = [];
    }

    return { init, start, stop, togglePause };
})();
