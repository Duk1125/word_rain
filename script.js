/**
 * Main Application Controller
 * Handles routing, user session, settings, and bridging game modes with shared UI (leaderboards, analytics).
 */

const AppController = (function() {
    // Globals
    let username = '';
    let playerId = '';

    // Screens & Containers
    const startScreen = document.getElementById('start-screen');
    const usernameScreen = document.getElementById('username-screen');
    const wordRainContainer = document.getElementById('game-container');
    const paragraphContainer = document.getElementById('paragraph-container');
    const keyboardContainer = document.getElementById('keyboard-container');

    const prepKeyboard = document.getElementById('prep-keyboard');
    const prepWordRain = document.getElementById('prep-word-rain');
    const prepParagraph = document.getElementById('prep-paragraph');

    // UI Elements
    const usernameInput = document.getElementById('username-input');
    const settingsModal = document.getElementById('settings-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    
    // UUID Generator
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Modes state
    let activeMode = null; // 'word-rain', 'paragraph', 'keyboard'
    let currentWRDiff = { speed: 1.4, spawn: 1.4, key: 'level2' };
    let currentKBStage = 0;

    const pauseModal = document.getElementById('pause-modal');

    function init() {
        checkUsername();
        setupEventListeners();
        loadSettings();
        
        // Init Modes
        if(window.WordRain) {
            window.WordRain.init({
                gameArea: document.getElementById('game-area'),
                scoreElement: document.getElementById('score'),
                livesElement: document.getElementById('lives-container'),
                wordInput: document.getElementById('word-input')
            });
        }
        
        if(window.ParagraphMode) {
            window.ParagraphMode.init({
                container: paragraphContainer,
                textDisplay: document.getElementById('paragraph-display-area'),
                input: document.getElementById('paragraph-input'),
                stats: document.getElementById('paragraph-stats')
            });
        }

        if(window.KeyboardMode) {
            window.KeyboardMode.init({
                container: keyboardContainer,
                patternDisplay: document.getElementById('keyboard-display-area'),
                input: document.getElementById('keyboard-input'),
                stats: document.getElementById('keyboard-stats'),
                keyboardDisplay: document.getElementById('keyboard-hint-area')
            });
        }
    }

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
            const curPlayerEl = document.getElementById('current-player');
            if(curPlayerEl) curPlayerEl.textContent = username;
            if(usernameInput) usernameInput.value = username;
        }
        
        showScreen(usernameScreen);
        usernameInput.focus();
    }

    function submitUsername() {
        const name = usernameInput.value.trim();
        if (name.length >= 2) {
            username = name;
            localStorage.setItem('acidRainUsername', username);
            const curPlayerEl = document.getElementById('current-player');
            if(curPlayerEl) curPlayerEl.textContent = username;
            showScreen(startScreen);
        } else {
            alert('Please enter a name with at least 2 characters.');
        }
    }

    function showScreen(screenEl) {
        [
            startScreen, usernameScreen, 
            wordRainContainer, paragraphContainer, keyboardContainer,
            prepKeyboard, prepWordRain, prepParagraph
        ].forEach(el => {
            if(el) el.classList.add('hidden');
        });
        if(screenEl) screenEl.classList.remove('hidden');

        // Reset active mode if returning to menu/start
        if (screenEl === startScreen || screenEl === usernameScreen || screenEl.id?.startsWith('prep-')) {
            activeMode = null;
        }
    }

    function setupEventListeners() {
        // Username
        document.getElementById('username-submit-btn').addEventListener('click', submitUsername);
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitUsername();
        });

        // Mode Navigation Routing
        document.querySelectorAll('.prep-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.closest('.mode-card').dataset.mode;
                if(mode === 'word-rain') {
                    showScreen(prepWordRain);
                } else if(mode === 'paragraph') {
                    showScreen(prepParagraph);
                } else if(mode === 'keyboard') {
                    showScreen(prepKeyboard);
                }
            });
        });

        document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showScreen(startScreen);
            });
        });

        // Word Rain Difficulty logic inside Prep Screen
        document.querySelectorAll('#prep-word-rain .diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#prep-word-rain .diff-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                currentWRDiff.speed = parseFloat(e.target.dataset.speed);
                currentWRDiff.spawn = parseFloat(e.target.dataset.spawn);
                
                if (currentWRDiff.speed === 1.0) currentWRDiff.key = 'level1';
                else if (currentWRDiff.speed === 1.4) currentWRDiff.key = 'level2';
                else if (currentWRDiff.speed === 2.0) currentWRDiff.key = 'level3';
                else if (currentWRDiff.speed === 2.8) currentWRDiff.key = 'level4';
            });
        });

        // Keyboard Stage logic inside Prep Screen
        document.querySelectorAll('#keyboard-stage-select .diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#keyboard-stage-select .diff-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                currentKBStage = parseInt(e.target.dataset.stage, 10);
            });
        });

        document.querySelectorAll('.real-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                startMode(mode);
            });
        });

        // Universal Pause Button Handling
        document.querySelectorAll('.pause-btn').forEach(btn => {
            btn.addEventListener('click', openPauseModal);
        });

        // Pause Modal Actions
        document.getElementById('pause-resume-btn').addEventListener('click', closePauseModal);
        document.getElementById('pause-restart-btn').addEventListener('click', () => {
            restartCurrentMode();
            closePauseModal();
        });
        document.getElementById('pause-home-btn').addEventListener('click', () => {
            stopCurrentMode();
            closePauseModal();
            showScreen(startScreen);
        });
        document.getElementById('pause-settings-btn').addEventListener('click', () => {
            openSettings();
        });

        // Leaderboard modal specific (from prep screen)
        if(document.getElementById('prep-show-leaderboard-btn')) {
            document.getElementById('prep-show-leaderboard-btn').addEventListener('click', () => {
                document.getElementById('leaderboard-modal').classList.remove('hidden');
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === currentWRDiff.key);
                });
                renderLeaderboard(currentWRDiff.key);
            });
        }
        if(document.getElementById('close-leaderboard')) {
            document.getElementById('close-leaderboard').addEventListener('click', () => {
                document.getElementById('leaderboard-modal').classList.add('hidden');
            });
        }
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderLeaderboard(tab);
            });
        });

        // Settings Modal
        document.getElementById('close-settings').addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
        
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFontSize = btn.dataset.size;
                localStorage.setItem('acidRainFontSize', currentFontSize);
                applySettings();
                updateSettingsUI();
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTheme = btn.dataset.theme;
                localStorage.setItem('acidRainTheme', currentTheme);
                applySettings();
                updateSettingsUI();
            });
        });
    }

    // --- Mode Control Logic ---
    function startMode(mode) {
        activeMode = mode;
        if(mode === 'word-rain') {
            showScreen(wordRainContainer);
            window.WordRain.start(currentWRDiff.speed, currentWRDiff.spawn, currentWRDiff.key);
        } else if(mode === 'paragraph') {
            showScreen(paragraphContainer);
            window.ParagraphMode.startRandom();
        } else if(mode === 'keyboard') {
            showScreen(keyboardContainer);
            window.KeyboardMode.start(currentKBStage);
        }
    }

    function stopCurrentMode() {
        if(window.WordRain) window.WordRain.stop();
        if(window.ParagraphMode) window.ParagraphMode.stop();
        if(window.KeyboardMode) window.KeyboardMode.stop();
        activeMode = null;
    }

    function restartCurrentMode() {
        const prevMode = activeMode;
        stopCurrentMode();
        if (prevMode) startMode(prevMode);
    }

    function openPauseModal() {
        if (!activeMode) return;
        
        // Call pause on the specific mode
        if (activeMode === 'word-rain' && window.WordRain) window.WordRain.togglePause();
        else if (activeMode === 'paragraph' && window.ParagraphMode) window.ParagraphMode.pause();
        else if (activeMode === 'keyboard' && window.KeyboardMode) window.KeyboardMode.pause();

        pauseModal.classList.remove('hidden');
    }

    function closePauseModal() {
        pauseModal.classList.add('hidden');
        if (!activeMode) return;

        // Call resume on the specific mode
        if (activeMode === 'word-rain' && window.WordRain) window.WordRain.togglePause();
        else if (activeMode === 'paragraph' && window.ParagraphMode) window.ParagraphMode.resume();
        else if (activeMode === 'keyboard' && window.KeyboardMode) window.KeyboardMode.resume();
    }

    function openSettings() {
        // Filter Font Size setting only for Word Rain
        const fontSizeSection = document.getElementById('font-size-section');
        if (fontSizeSection) {
            // Should show if activeMode is word-rain OR if we are on prep screen for word-rain
            const isWordRainActive = activeMode === 'word-rain' || (!activeMode && !prepWordRain.classList.contains('hidden'));
            fontSizeSection.style.display = isWordRainActive ? 'block' : 'none';
        }
        settingsModal.classList.remove('hidden');
    }

    // --- Settings Logic ---
    let currentFontSize = 'normal';
    let currentTheme = 'default';
    const fontSizes = {
        'very-small': '1.4rem', 'small': '1.8rem', 'normal': '2.2rem', 'large': '2.6rem', 'very-large': '3rem'
    };
    const themes = {
        'default': { bg: '#0a0a12', gradient: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a12 100%)', text: '#ffffff' },
        'high-contrast': { bg: '#1b3a24', gradient: 'none', text: '#ffffff' },
        'warm': { bg: '#2b2b2b', gradient: 'none', text: '#F5DEB3' },
        'deep-blue': { bg: '#1a1a3e', gradient: 'radial-gradient(circle at 50% 50%, #2a2a5e 0%, #1a1a3e 100%)', text: '#ffffff' }
    };

    function loadSettings() {
        const savedSize = localStorage.getItem('acidRainFontSize');
        const savedTheme = localStorage.getItem('acidRainTheme');
        if (savedSize && fontSizes[savedSize]) currentFontSize = savedSize;
        if (savedTheme && themes[savedTheme]) currentTheme = savedTheme;
        applySettings();
        updateSettingsUI();
    }

    function applySettings() {
        const sizeValue = fontSizes[currentFontSize];
        document.documentElement.style.setProperty('--game-font-size', sizeValue);
        const theme = themes[currentTheme];
        document.documentElement.style.setProperty('--game-bg-color', theme.bg);
        document.documentElement.style.setProperty('--game-bg-gradient', theme.gradient);
        document.documentElement.style.setProperty('--game-text-color', theme.text);
    }

    function updateSettingsUI() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.size === currentFontSize);
        });
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.theme === currentTheme);
        });
    }

    // --- Leaderboard & Analytical Hooks ---
    async function handleWordRainEnd(score, difficulty, statsData) {
        // Run async leaderboard save, but don't block UI immediately
        saveScoreToLeaderboard(score, difficulty).then(rank => {
            if (rank > 0) {
                statsData["Дэлхийн зэрэглэл"] = "#" + rank;
            }
            showGameStatsMenu("Үгэн бороо", statsData, () => window.WordRain.start());
        }).catch(err => {
            showGameStatsMenu("Үгэн бороо", statsData, () => window.WordRain.start());
        });
    }

    function handleParagraphEnd(statsData) {
        showGameStatsMenu("Эх бичих", statsData, () => window.ParagraphMode.startRandom());
    }

    function handleKeyboardEnd(statsData) {
        // Get the stage that was last played so restart works correctly
        const lastStage = (window.KeyboardMode && window.KeyboardMode._lastStage !== undefined)
            ? window.KeyboardMode._lastStage : 0;
        showGameStatsMenu("Хурууны байрлал", statsData, () => {
            if (window.KeyboardMode) window.KeyboardMode.start(lastStage);
        });
    }

    function showGameStatsMenu(modeName, statsData, restartCallback) {
        window.TypingAnalytics.showResultsModal(modeName, statsData, {
            restart: restartCallback,
            menu: () => showScreen(startScreen)
        });
    }

    // --- Legacy Leaderboard Logic ---
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
        const data = localStorage.getItem(`leaderboard_${difficulty}`);
        return data ? JSON.parse(data) : [];
    }

    async function saveScoreToLeaderboard(score, difficulty) {
        if(score <= 0) return -1;
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
                const { data: existingData, error: fetchError } = await supabaseClient
                    .from('leaderboards').select('score').eq('player_id', playerId).eq('difficulty', difficulty);
                if (fetchError) throw fetchError;
                
                const existingScore = existingData && existingData.length > 0 ? existingData[0].score : -1;

                if (score > existingScore) {
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

                    const { data: leaderboard, error: rankError } = await supabaseClient
                        .from('leaderboards').select('player_id, score').eq('difficulty', difficulty).order('score', { ascending: false }).limit(50);
                    if (rankError) throw rankError;

                    const rank = leaderboard.findIndex(entry => entry.player_id === playerId && entry.score === score) + 1;
                    return rank > 0 ? rank : -1;
                } else return -1;
            } catch (error) {
                console.warn("Supabase save failed, using localStorage:", error);
            }
        }

        // Fallback
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
        } else return -1;
    }

    async function renderLeaderboard(difficulty) {
        const leaderboardList = document.getElementById('leaderboard-list');
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



    // Global Exposure
    window.AppController = {
        init,
        handleWordRainEnd,
        handleParagraphEnd,
        handleKeyboardEnd
    };

    return window.AppController;
})();

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
    AppController.init();
});
