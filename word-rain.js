const WordRain = (function() {
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
            
            // Map keys back to difficulty levels in words.js setup
            // 1.0 -> level1, 1.4 -> level2, 2.0 -> level3, 2.8 -> level4
            let targetDiff = 2; // Default
            if (difficultyKey === 'level1') targetDiff = 1;
            if (difficultyKey === 'level3') targetDiff = 3;
            if (difficultyKey === 'level4') targetDiff = 4;

            // Simple fallback logic since we refactored
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

    // Elements
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

        const baseSpawnRate = 1830;
        const baseFallSpeed = 64;

        spawnRate = baseSpawnRate * spawnMult;
        fallSpeed = baseFallSpeed * speedMult;

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
        let leftPos;
        let attempts = 0;
        const minHorizontalGap = 100;

        do {
            leftPos = Math.random() * maxLeft;
            var tooClose = activeWords.some(w => {
                if (w.y < gameArea.clientHeight * 0.3) {
                    return Math.abs(parseFloat(w.element.style.left) - leftPos) < minHorizontalGap;
                }
                return false;
            });
            attempts++;
        } while (tooClose && attempts < 10);

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
            spawnTime: Date.now() // Tracking start time
        });

        stats.totalSpawned++;
        if (spawnRate > 500) spawnRate -= 10;
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
            const typedTime = Date.now();
            const timeTaken = typedTime - wordObj.spawnTime;
            
            stats.totalTyped++;
            stats.wordTimes.push({ word: wordObj.text, timeMs: timeTaken });

            createExplosion(wordObj.element);
            wordObj.element.remove();
            activeWords.splice(matchIndex, 1);

            score += wordObj.text.length;
            fallSpeed += 0.4;
            
            updateStats();
            e.target.value = '';
        } else if (typed.length > 5 && !activeWords.some(w => w.text.toLowerCase().startsWith(typed.toLowerCase()))) {
            wordInput.classList.add('shake');
            setTimeout(() => wordInput.classList.remove('shake'), 400);
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
        const gameHeight = gameArea.clientHeight;

        for (let i = activeWords.length - 1; i >= 0; i--) {
            const wordObj = activeWords[i];
            wordObj.y += fallSpeed * deltaTime;
            wordObj.element.style.transform = `translate3d(0, ${wordObj.y.toFixed(1)}px, 0)`;

            if (wordObj.y > gameHeight - 50) {
                stats.totalMissed++;
                stats.missedWordsList.push(wordObj.text);
                
                loseLife();
                wordObj.element.remove();
                activeWords.splice(i, 1);
            }
        }

        gameInterval = requestAnimationFrame(gameLoop);
    }

    function createExplosion(element) {
        const text = element.textContent;
        const rect = element.getBoundingClientRect();
        
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.top}px`;
        container.style.width = 'max-content';
        container.style.display = 'flex';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '100';
        document.body.appendChild(container);

        text.split('').forEach((char) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.color = '#ff00ff';
            span.style.textShadow = '0 0 15px rgba(255, 0, 255, 0.8)';
            span.style.fontSize = 'var(--game-font-size)';
            span.style.fontWeight = '600';
            span.style.fontFamily = 'var(--font-heading)';
            span.style.transition = 'all 0.5s ease-out';
            
            const randomX = (Math.random() - 0.5) * 150;
            const randomY = (Math.random() - 0.5) * 150 - 50;
            const randomRot = (Math.random() - 0.5) * 180;
            
            container.appendChild(span);
            
            requestAnimationFrame(() => {
                span.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg) scale(0)`;
                span.style.opacity = '0';
            });
        });

        setTimeout(() => container.remove(), 500);
    }

    function loseLife() {
        lives--;
        updateStats();

        gameArea.style.boxShadow = '0 0 50px rgba(255, 50, 50, 0.5)';
        setTimeout(() => {
            gameArea.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.2)';
        }, 200);

        if (lives <= 0) endGame();
    }

    function updateStats() {
        if(scoreElement) scoreElement.textContent = score;
        if(livesElement) {
            livesElement.innerHTML = '';
            for (let i = 0; i < lives; i++) {
                const heart = document.createElement('span');
                heart.classList.add('heart-icon');
                heart.textContent = '❤️';
                livesElement.appendChild(heart);
            }
        }
    }

    function endGame() {
        gameRunning = false;
        cancelAnimationFrame(gameInterval);
        clearInterval(spawnInterval);
        
        // Ensure final word states are cleared
        activeWords.forEach(w => w.element.remove());
        activeWords = [];

        // Save score if Main controller wants to
        if(window.AppController && window.AppController.handleWordRainEnd) {
            window.AppController.handleWordRainEnd(score, currentDifficulty, generateAnalytics());
        }
    }

    function generateAnalytics() {
        const sortedTimes = [...stats.wordTimes].sort((a,b) => b.timeMs - a.timeMs);
        const top5Slowest = sortedTimes.slice(0, 5).map(w => `${w.word} (${(w.timeMs/1000).toFixed(1)}s)`);
        
        let avgTime = 0;
        if(stats.wordTimes.length > 0) {
            const sum = stats.wordTimes.reduce((acc, val) => acc + val.timeMs, 0);
            avgTime = sum / stats.wordTimes.length;
        }

        return {
            "Оноо": score,
            "Нийт бичсэн үг": stats.totalTyped,
            "Нийт алдсан үг": stats.totalMissed,
            "Дундаж хугацаа (үгсэд)": stats.totalTyped > 0 ? (avgTime/1000).toFixed(2) + "с" : "N/A",
            "Хамгийн удаан бичсэн Top 5": top5Slowest,
            "Алдсан үгс": [...new Set(stats.missedWordsList)] // Unique missed words
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

    return { init, start, stop, togglePause, getScore: () => score };
})();
