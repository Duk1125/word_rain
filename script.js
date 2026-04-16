// Words are loaded from words.js as a global variable

class WordBag {
    constructor() {
        this.bags = {
            level1: [],
            level2: [],
            level3: [],
            level4: []
        };
    }

    getWord(difficulty) {
        if (this.bags[difficulty].length === 0) {
            this.refillBag(difficulty);
        }
        return this.bags[difficulty].pop();
    }

    refillBag(difficulty) {
        let allWords = window.mongolianWords;
        let filteredWords = [];

        if (difficulty === 'level1') {
            // Level 1: Very short words (<= 4 chars)
            filteredWords = allWords.filter(w => w.length <= 4);
        } else if (difficulty === 'level2') {
            // Level 2: Short/Medium words (<= 6 chars)
            filteredWords = allWords.filter(w => w.length <= 6);
        } else if (difficulty === 'level3') {
            // Level 3: Long words (>= 5 chars)
            filteredWords = allWords.filter(w => w.length >= 5);
        } else if (difficulty === 'level4') {
            // Level 4: Very Long words (>= 7 chars)
            filteredWords = allWords.filter(w => w.length >= 7);
        } else {
            filteredWords = [...allWords];
        }

        if (filteredWords.length === 0) filteredWords = [...allWords]; // Fallback

        // Shuffle
        for (let i = filteredWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filteredWords[i], filteredWords[j]] = [filteredWords[j], filteredWords[i]];
        }

        this.bags[difficulty] = filteredWords;
    }
}

const wordBag = new WordBag();

const gameArea = document.getElementById('game-area');
const wordInput = document.getElementById('word-input');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const livesElement = document.getElementById('lives-container');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// New Elements
const usernameScreen = document.getElementById('username-screen');
const usernameInput = document.getElementById('username-input');
const usernameSubmitBtn = document.getElementById('username-submit-btn');
const gameContainer = document.getElementById('game-container');
const currentPlayerElement = document.getElementById('current-player');
const changeUserBtn = document.getElementById('change-user-btn');

const leaderboardModal = document.getElementById('leaderboard-modal');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
const rankDisplay = document.getElementById('rank-display');
const newRankElement = document.getElementById('new-rank');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const sizeOptions = document.querySelectorAll('.size-btn');
const themeOptions = document.querySelectorAll('.theme-btn');
const previewArea = document.getElementById('preview-area');
const previewWord = document.getElementById('preview-word');
const pauseBtn = document.getElementById('pause-btn');

let score = 0;
let lives = 5;
let highScore = 0;
let currentDifficulty = 'level2'; // Default to Normal
let gameInterval;
let spawnInterval;
let activeWords = [];
let gameRunning = false;
let spawnRate = 2000; // ms
let fallSpeed = 120; // Changed to pixels per second for Delta Time (approx 2.0 * 60)
let isPaused = false;
let lastFrameTime = 0;
let username = '';
let playerId = '';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Initialize
// Function to get difficulty key from speed value
function getDifficultyKey(speed) {
    if (speed === 1.0) return 'level1';
    if (speed === 1.4) return 'level2';
    if (speed === 2.0) return 'level3';
    if (speed === 2.8) return 'level4';
    return 'level2'; // default
}

// Function to load high score for a difficulty
function loadHighScore(difficultyKey) {
    // Personal high score
    return parseInt(localStorage.getItem(`highScore_${difficultyKey}_${username}`)) || 0;
}

// Check for existing username
function checkUsername() {
    const savedUser = localStorage.getItem('acidRainUsername');
    let savedPlayerId = localStorage.getItem('acidRainPlayerId');
    if (!savedPlayerId) {
        savedPlayerId = generateUUID();
        localStorage.setItem('acidRainPlayerId', savedPlayerId);
    }
    playerId = savedPlayerId;

    if (savedUser) {
        username = savedUser;
        showStartScreen();
    } else {
        usernameScreen.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        startScreen.classList.add('hidden');
        usernameInput.focus();
    }
}

function showStartScreen() {
    usernameScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    startScreen.classList.remove('hidden');
    currentPlayerElement.textContent = username;

    // Update high score display for current user
    highScore = loadHighScore(currentDifficulty);
    highScoreElement.textContent = highScore;
    loadSettings(); // Load user settings preference
}

// User Settings Logic
let currentFontSize = 'normal';
let currentTheme = 'default';

const fontSizes = {
    'very-small': '1.4rem',
    'small': '1.8rem',
    'normal': '2.2rem',
    'large': '2.6rem',
    'very-large': '3rem'
};

const themes = {
    'default': {
        bg: '#0a0a12',
        gradient: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a12 100%)',
        text: '#ffffff'
    },
    'high-contrast': {
        bg: '#1b3a24',
        gradient: 'none',
        text: '#ffffff'
    },
    'warm': {
        bg: '#2b2b2b',
        gradient: 'none',
        text: '#F5DEB3'
    },
    'deep-blue': {
        bg: '#1a1a3e',
        gradient: 'radial-gradient(circle at 50% 50%, #2a2a5e 0%, #1a1a3e 100%)',
        text: '#ffffff'
    }
};

function loadSettings() {
    const savedSize = localStorage.getItem('acidRainFontSize');
    const savedTheme = localStorage.getItem('acidRainTheme');

    if (savedSize && fontSizes[savedSize]) {
        currentFontSize = savedSize;
    }

    if (savedTheme && themes[savedTheme]) {
        currentTheme = savedTheme;
    }

    applySettings();
    updateSettingsUI();
}

function applySettings() {
    // Apply Font Size
    const sizeValue = fontSizes[currentFontSize];
    document.documentElement.style.setProperty('--game-font-size', sizeValue);

    // Apply Theme
    const theme = themes[currentTheme];
    document.documentElement.style.setProperty('--game-bg-color', theme.bg);
    document.documentElement.style.setProperty('--game-bg-gradient', theme.gradient);
    document.documentElement.style.setProperty('--game-text-color', theme.text);

    // Update Preview
    if (previewWord) previewWord.style.fontSize = sizeValue;
    if (previewArea) {
        previewArea.style.backgroundColor = theme.bg;
        previewArea.style.backgroundImage = theme.gradient;
        previewWord.style.color = theme.text;
    }
}

function updateSettingsUI() {
    // Update Size Buttons
    sizeOptions.forEach(btn => {
        if (btn.dataset.size === currentFontSize) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Update Theme Buttons
    themeOptions.forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Settings Event Listeners
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    updateSettingsUI(); // Ensure UI is synced
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

sizeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFontSize = btn.dataset.size;
        localStorage.setItem('acidRainFontSize', currentFontSize);
        applySettings();
        updateSettingsUI();
    });
});

themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTheme = btn.dataset.theme;
        localStorage.setItem('acidRainTheme', currentTheme);
        applySettings();
        updateSettingsUI();
    });
});

// Username Event Listeners
usernameSubmitBtn.addEventListener('click', submitUsername);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitUsername();
});

function submitUsername() {
    const name = usernameInput.value.trim();
    if (name.length >= 2) {
        username = name;
        localStorage.setItem('acidRainUsername', username);
        showStartScreen();
    } else {
        alert('Please enter a name with at least 2 characters.');
    }
}

changeUserBtn.addEventListener('click', () => {
    localStorage.removeItem('acidRainUsername');
    location.reload();
});

// Leaderboard Logic
async function getLeaderboard(difficulty) {
    if (typeof supabaseClient !== 'undefined') {
        try {
            const { data, error } = await supabaseClient
                .from('leaderboards')
                .select('*')
                .eq('difficulty', difficulty)
                .order('score', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data;
        } catch (error) {
            console.warn("Supabase read failed, using localStorage:", error);
        }
    }

    // Fallback to localStorage
    const data = localStorage.getItem(`leaderboard_${difficulty}`);
    return data ? JSON.parse(data) : [];
}

async function saveScoreToLeaderboard(score, difficulty) {
    const date = new Date().toLocaleDateString();
    const timestamp = Date.now();

    const newEntry = {
        player_id: playerId,
        name: username,
        score: score,
        difficulty: difficulty,
        date: date,
        timestamp: timestamp
    };

    if (typeof supabaseClient !== 'undefined') {
        try {
            // Fetch existing highest score
            const { data: existingData, error: fetchError } = await supabaseClient
                .from('leaderboards')
                .select('score')
                .eq('player_id', playerId)
                .eq('difficulty', difficulty);
                
            if (fetchError) throw fetchError;
            
            const existingScore = existingData && existingData.length > 0 ? existingData[0].score : -1;

            if (score > existingScore) {
                // Upsert new high score
                const { error: upsertError } = await supabaseClient
                    .from('leaderboards')
                    .upsert({
                        player_id: playerId,
                        name: username,
                        score: score,
                        difficulty: difficulty,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'player_id, difficulty' });

                if (upsertError) throw upsertError;

                // Find rank by fetching top 50
                const { data: leaderboard, error: rankError } = await supabaseClient
                    .from('leaderboards')
                    .select('player_id, score')
                    .eq('difficulty', difficulty)
                    .order('score', { ascending: false })
                    .limit(50);

                if (rankError) throw rankError;

                const rank = leaderboard.findIndex(entry => entry.player_id === playerId && entry.score === score) + 1;
                return rank > 0 ? rank : -1;
            } else {
                return -1; // Did not beat high score
            }
        } catch (error) {
            console.warn("Supabase save failed, using localStorage:", error);
        }
    }

    // Fallback to localStorage
    let leaderboard = JSON.parse(localStorage.getItem(`leaderboard_${difficulty}`) || '[]');
    const existingEntryLocal = leaderboard.find(entry => entry.player_id === playerId || entry.name === username);

    if (!existingEntryLocal || score > existingEntryLocal.score) {
        leaderboard = leaderboard.filter(entry => entry.player_id !== playerId && entry.name !== username);
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 50);
        localStorage.setItem(`leaderboard_${difficulty}`, JSON.stringify(leaderboard));

        const rank = leaderboard.findIndex(entry => (entry.player_id === playerId || entry.name === username) && entry.score === score) + 1;
        return rank > 0 ? rank : -1;
    } else {
        return -1;
    }
}

async function renderLeaderboard(difficulty) {
    const leaderboard = await getLeaderboard(difficulty);
    leaderboardList.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="loading">Оноо байхгүй байна. Эхний нэгнийх бол!</div>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = entry.player_id ? entry.player_id === playerId : entry.name === username;

        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;

        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        const displayDate = entry.created_at ? new Date(entry.created_at).toLocaleDateString() : entry.date;

        item.innerHTML = `
            <div class="rank ${rankClass}">#${rank}</div>
            <div class="player-info">
                <span class="player-name">${entry.name}</span>
                <span class="player-date">${displayDate}</span>
            </div>
            <div class="player-score">${entry.score}</div>
        `;

        leaderboardList.appendChild(item);
    });
}

// Leaderboard UI Events
let fromGameOver = false;



closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.add('hidden');
    if (fromGameOver) {
        gameOverScreen.classList.remove('hidden');
        fromGameOver = false;
    }
});

viewLeaderboardBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    leaderboardModal.classList.remove('hidden');
    renderLeaderboard(currentDifficulty);
    updateActiveTab(currentDifficulty);
    fromGameOver = true;
});

// Start screen leaderboard button
const startLeaderboardBtn = document.getElementById('start-leaderboard-btn');
startLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.remove('hidden');
    renderLeaderboard(currentDifficulty);
    updateActiveTab(currentDifficulty);
    fromGameOver = false;
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        renderLeaderboard(tab);
        updateActiveTab(tab);
    });
});

function updateActiveTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// Load default high score (Level 2/Normal)
currentDifficulty = 'level2';
// highScore loaded in showStartScreen

let selectedSpeed = 1.0;
let selectedSpawn = 1.2;

// Select default difficulty (Normal)
const defaultBtn = document.querySelector('.diff-btn[data-speed="1.0"]');
if (defaultBtn) defaultBtn.classList.add('selected');

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove selected class from all
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        // Add to clicked
        e.target.classList.add('selected');

        selectedSpeed = parseFloat(e.target.dataset.speed);
        selectedSpawn = parseFloat(e.target.dataset.spawn);

        // Update high score display for selected difficulty
        currentDifficulty = getDifficultyKey(selectedSpeed);
        highScore = loadHighScore(currentDifficulty);
        highScoreElement.textContent = highScore;
    });
});

startBtn.addEventListener('click', () => {
    startGame(selectedSpeed, selectedSpawn);
});

restartBtn.addEventListener('click', resetGame);
wordInput.addEventListener('input', checkInput);

if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
}

function togglePause() {
    if (!gameRunning) return;

    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = '▶️';
        wordInput.blur();
        
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pause-overlay';
        pauseOverlay.innerHTML = `
            <h2>ТҮР ЗОГСООВ</h2>
            <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap; justify-content: center;">
                <button id="resume-btn" class="primary-btn" style="font-size: 1.2rem; padding: 12px 24px;">Үргэлжлүүлэх</button>
                <button id="restart-pause-btn" class="primary-btn" style="font-size: 1.2rem; padding: 12px 24px;">Дахин эхлүүлэх</button>
                <button id="main-menu-btn" class="primary-btn" style="font-size: 1.2rem; padding: 12px 24px;">Үндсэн цэс</button>
            </div>
        `;
        gameArea.appendChild(pauseOverlay);

        document.getElementById('resume-btn').addEventListener('click', togglePause);
        
        document.getElementById('restart-pause-btn').addEventListener('click', () => {
            gameRunning = false;
            isPaused = false;
            cancelAnimationFrame(gameInterval);
            clearInterval(spawnInterval);
            
            pauseBtn.textContent = '⏸️';
            pauseOverlay.remove();
            
            // clear existing words before restart
            activeWords.forEach(wordObj => wordObj.element.remove());
            activeWords = [];
            
            startGame(selectedSpeed, selectedSpawn);
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            gameRunning = false;
            isPaused = false;
            cancelAnimationFrame(gameInterval);
            clearInterval(spawnInterval);
            
            pauseBtn.textContent = '⏸️';
            pauseOverlay.remove();
            
            resetGame();
        });
    } else {
        pauseBtn.textContent = '⏸️';
        const overlay = document.getElementById('pause-overlay');
        if (overlay) overlay.remove();
        wordInput.focus();
    }
}

function startGame(speedMult, spawnMult) {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
    score = 0;
    lives = 5;

    // Set current difficulty and load its high score
    currentDifficulty = getDifficultyKey(speedMult);
    highScore = loadHighScore(currentDifficulty);
    highScoreElement.textContent = highScore;

    // Base values - Spawn interval reduced by 1.2x (was 2200)
    const baseSpawnRate = 1830;
    const baseFallSpeed = 64; // Reduced from 85 for better pace

    spawnRate = baseSpawnRate * spawnMult;
    fallSpeed = baseFallSpeed * speedMult;

    lastFrameTime = performance.now();

    activeWords = [];
    updateStats();
    wordInput.value = '';
    wordInput.focus();

    // Start loops
    gameInterval = requestAnimationFrame(gameLoop);
    spawnInterval = setInterval(spawnWord, spawnRate);
}

function resetGame() {
    // Clear existing words
    activeWords.forEach(wordObj => wordObj.element.remove());
    activeWords = [];

    // Go back to start screen
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // Reset score display
    score = 0;
    lives = 5;
    updateStats();
}

// Clear input on Enter
wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        wordInput.value = '';
    }
});

function spawnWord() {
    if (!gameRunning || isPaused) return;

    // Use WordBag to get a word
    const wordText = wordBag.getWord(currentDifficulty);

    if (!wordText) return; // Should not happen with fallback

    const wordEl = document.createElement('div');
    wordEl.classList.add('falling-word');
    wordEl.textContent = wordText;

    // Random X position with overlap avoidance
    const maxLeft = gameArea.clientWidth - 150;
    let leftPos;
    let attempts = 0;
    const minHorizontalGap = 100;

    do {
        leftPos = Math.random() * maxLeft;
        var tooClose = activeWords.some(w => {
            // Check words in the top 30% of the screen
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
    wordEl.style.opacity = '0'; // For fade-in effect

    gameArea.appendChild(wordEl);

    // Accurate boundary check after appending
    const rect = wordEl.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    if (rect.right > areaRect.right) {
        const overflow = rect.right - areaRect.right + 20;
        wordEl.style.left = `${parseFloat(wordEl.style.left) - overflow}px`;
    }

    // Animation trigger
    requestAnimationFrame(() => {
        wordEl.style.transition = 'opacity 0.3s ease';
        wordEl.style.opacity = '1';
    });

    activeWords.push({
        element: wordEl,
        text: wordText,
        y: -40
    });

    // Increase difficulty slightly over time
    if (spawnRate > 500) spawnRate -= 10;
}

function gameLoop(timestamp) {
    if (!gameRunning || isPaused) {
        lastFrameTime = timestamp; // Keep it fresh
        if (gameRunning) gameInterval = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (timestamp - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = timestamp;

    const gameHeight = gameArea.clientHeight;

    // Update words positions
    for (let i = activeWords.length - 1; i >= 0; i--) {
        const wordObj = activeWords[i];
        wordObj.y += fallSpeed * deltaTime;
        wordObj.element.style.transform = `translate3d(0, ${wordObj.y.toFixed(1)}px, 0)`;

        // Check collision with bottom
        if (wordObj.y > gameHeight - 50) {
            // Word hit bottom
            loseLife();
            wordObj.element.remove();
            activeWords.splice(i, 1);
        }
    }

    gameInterval = requestAnimationFrame(gameLoop);
}

function checkInput(e) {
    if (isPaused) {
        e.target.value = '';
        return;
    }
    const typed = e.target.value.trim();

    // Find matching word
    const matchIndex = activeWords.findIndex(w => w.text === typed || w.text.toLowerCase() === typed.toLowerCase());

    if (matchIndex !== -1) {
        // Correct type
        const wordObj = activeWords[matchIndex];
        createExplosion(wordObj.element);
        wordObj.element.remove();
        activeWords.splice(matchIndex, 1);

        // Award points based on word length (1 point per character)
        score += wordObj.text.length;

        // Increase speed slightly
        fallSpeed += 0.4; // Reduced from 0.6

        updateStats();
        e.target.value = ''; // Clear input
    } else {
        // Optional: clear input if it doesn't match and user presses space/enter?
        // For now, let's add a subtle shake to the input if it's getting long but no match
        if (typed.length > 5 && !activeWords.some(w => w.text.startsWith(typed))) {
            wordInput.classList.add('shake');
            setTimeout(() => wordInput.classList.remove('shake'), 400);
        }
    }
}

function loseLife() {
    lives--;
    updateStats();

    // Visual feedback
    gameArea.style.boxShadow = '0 0 50px rgba(255, 50, 50, 0.5)';
    setTimeout(() => {
        gameArea.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.2)';
    }, 200);

    if (lives <= 0) {
        endGame();
    }
}

function updateStats() {
    scoreElement.textContent = score;

    // Update high score if current score is higher for this difficulty
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem(`highScore_${currentDifficulty}_${username}`, highScore);
    }

    // Render hearts
    livesElement.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('span');
        heart.classList.add('heart-icon');
        heart.textContent = '❤️';
        livesElement.appendChild(heart);
    }
}

async function endGame() {
    gameRunning = false;
    cancelAnimationFrame(gameInterval);
    clearInterval(spawnInterval);

    finalScoreElement.textContent = `Оноо: ${score}`;

    // Show game over screen immediately
    gameOverScreen.classList.remove('hidden');

    // Save to leaderboard asynchronously (don't block)
    try {
        const rank = await saveScoreToLeaderboard(score, currentDifficulty);

        if (rank > 0) {
            rankDisplay.classList.remove('hidden');
            newRankElement.textContent = rank;
        } else {
            rankDisplay.classList.add('hidden');
        }
    } catch (error) {
        console.error("Failed to save score:", error);
        rankDisplay.classList.add('hidden');
    }
}

function createExplosion(element) {
    const text = element.textContent;
    const rect = element.getBoundingClientRect();
    
    // Create a container exactly where the word was
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.display = 'flex';
    container.style.whiteSpace = 'pre';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'none';

    // Match styles
    const computedStyle = window.getComputedStyle(element);
    container.style.fontSize = computedStyle.fontSize;
    container.style.fontWeight = computedStyle.fontWeight;
    container.style.fontFamily = computedStyle.fontFamily;
    container.style.color = computedStyle.color;
    container.style.textShadow = computedStyle.textShadow;
    /* To ensure padding doesn't shift the word, apply it here too if needed, 
       but left/top rect usually handles the exact position if there's no margin.
       Wait, the word might have padding. Let's add them. */
    container.style.paddingLeft = computedStyle.paddingLeft;
    container.style.paddingTop = computedStyle.paddingTop;

    document.body.appendChild(container);

    const chars = [];
    for (let i = 0; i < text.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = text[i];
        charSpan.style.display = 'inline-block';
        charSpan.style.transition = 'transform 0.6s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.6s ease-out, color 0.1s ease-out';
        container.appendChild(charSpan);
        chars.push(charSpan);
    }
    
    // Force CSS reflow
    container.offsetWidth;

    // Apply the scatter effect
    chars.forEach(span => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const rz = (Math.random() - 0.5) * 360; 
        
        span.style.transform = `translate(${tx}px, ${ty}px) rotate(${rz}deg) scale(${0.5 + Math.random() * 0.8})`;
        span.style.opacity = '0';
        span.style.color = 'rgba(255, 255, 255, 0.8)'; // Color fades/becomes pale rapidly
        span.style.textShadow = '0 0 10px rgba(0, 255, 204, 0.8)';
    });

    setTimeout(() => {
        container.remove();
    }, 600);
}

// Start by checking username
checkUsername();
