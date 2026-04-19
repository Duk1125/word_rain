/**
 * Main Application Controller
 * Handles routing, user session, settings (with mode-based font-size toggle),
 * pause modals for all three modes, and bridging game modes.
 */

const AppController = (function() {
    let username  = '';
    let playerId  = '';

    // Track which mode is currently active
    // 'keyboard' | 'paragraph' | 'word-rain' | null
    let activeMode = null;

    // Screens & Containers
    const startScreen       = document.getElementById('start-screen');
    const usernameScreen    = document.getElementById('username-screen');
    const wordRainContainer = document.getElementById('game-container');
    const paragraphContainer = document.getElementById('paragraph-container');
    const keyboardContainer = document.getElementById('keyboard-container');

    const prepKeyboard  = document.getElementById('prep-keyboard');
    const prepWordRain  = document.getElementById('prep-word-rain');
    const prepParagraph = document.getElementById('prep-paragraph');

    const usernameInput  = document.getElementById('username-input');
    const settingsModal  = document.getElementById('settings-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');

    // Settings size group — hidden for keyboard/paragraph modes
    const settingsSizeGroup = document.getElementById('settings-size-group');

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function init() {
        checkUsername();
        setupEventListeners();
        loadSettings();

        if (window.WordRain) {
            window.WordRain.init({
                gameArea:     document.getElementById('game-area'),
                scoreElement: document.getElementById('score'),
                livesElement: document.getElementById('lives-container'),
                wordInput:    document.getElementById('word-input')
            });
        }

        if (window.ParagraphMode) {
            window.ParagraphMode.init({
                container:   paragraphContainer,
                textDisplay: document.getElementById('paragraph-display-area'),
                stats:       document.getElementById('paragraph-stats')
            });
        }

        if (window.KeyboardMode) {
            window.KeyboardMode.init({
                container:       keyboardContainer,
                patternDisplay:  document.getElementById('keyboard-display-area'),
                stats:           document.getElementById('keyboard-stats'),
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
            if (curPlayerEl) curPlayerEl.textContent = username;
            if (usernameInput) usernameInput.value = username;
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
            if (curPlayerEl) curPlayerEl.textContent = username;
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
        ].forEach(el => { if (el) el.classList.add('hidden'); });
        if (screenEl) screenEl.classList.remove('hidden');
    }

    // Navigate to start screen (exposed for pause modals inside mode JS)
    function goHome() {
        if (window.WordRain)      window.WordRain.stop();
        if (window.ParagraphMode) window.ParagraphMode.stop();
        if (window.KeyboardMode)  window.KeyboardMode.stop();
        activeMode = null;
        showScreen(startScreen);
    }

    // Open settings with mode-aware font-size toggle
    function openSettingsForMode(mode) {
        // mode: 'keyboard' | 'paragraph' | 'word-rain'
        if (settingsSizeGroup) {
            settingsSizeGroup.style.display = (mode === 'word-rain') ? '' : 'none';
        }
        settingsModal.classList.remove('hidden');
    }

    function setupEventListeners() {
        // Username
        document.getElementById('username-submit-btn').addEventListener('click', submitUsername);
        usernameInput.addEventListener('keypress', e => { if (e.key === 'Enter') submitUsername(); });

        // Mode navigation
        document.querySelectorAll('.prep-mode-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const mode = e.target.closest('.mode-card').dataset.mode;
                if (mode === 'word-rain')  showScreen(prepWordRain);
                else if (mode === 'paragraph') showScreen(prepParagraph);
                else if (mode === 'keyboard')  showScreen(prepKeyboard);
            });
        });

        document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => showScreen(startScreen));
        });

        // Word Rain difficulty
        let selectedSpeed = 1.4, selectedSpawn = 1.4, wrDiffKey = 'level2';
        document.querySelectorAll('#prep-word-rain .diff-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('#prep-word-rain .diff-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedSpeed = parseFloat(e.target.dataset.speed);
                selectedSpawn = parseFloat(e.target.dataset.spawn);
                if (selectedSpeed === 1.0) wrDiffKey = 'level1';
                else if (selectedSpeed === 1.4) wrDiffKey = 'level2';
                else if (selectedSpeed === 2.0) wrDiffKey = 'level3';
                else if (selectedSpeed === 2.8) wrDiffKey = 'level4';
            });
        });

        // Keyboard stage
        let selectedKeyboardStage = 0;
        document.querySelectorAll('#keyboard-stage-select .diff-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('#keyboard-stage-select .diff-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedKeyboardStage = parseInt(e.target.dataset.stage, 10);
            });
        });

        // Start buttons
        document.querySelectorAll('.real-start-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const mode = e.target.dataset.mode;
                if (mode === 'word-rain') {
                    activeMode = 'word-rain';
                    showScreen(wordRainContainer);
                    window.WordRain.start(selectedSpeed, selectedSpawn, wrDiffKey);
                } else if (mode === 'paragraph') {
                    activeMode = 'paragraph';
                    showScreen(paragraphContainer);
                    window.ParagraphMode.startRandom();
                } else if (mode === 'keyboard') {
                    activeMode = 'keyboard';
                    showScreen(keyboardContainer);
                    window.KeyboardMode.start(selectedKeyboardStage);
                }
            });
        });

        // ── Pause buttons ──────────────────────────────────────
        // Keyboard pause btn
        const kbPauseBtn = document.getElementById('kb-pause-btn');
        if (kbPauseBtn) {
            kbPauseBtn.addEventListener('click', () => {
                if (window.KeyboardMode) window.KeyboardMode.showPauseModal();
            });
        }

        // Paragraph pause btn
        const paraPauseBtn = document.getElementById('para-pause-btn');
        if (paraPauseBtn) {
            paraPauseBtn.addEventListener('click', () => {
                if (window.ParagraphMode) window.ParagraphMode.showPauseModal();
            });
        }

        // Word Rain pause btn — uses its own modal (wr-pause-modal in HTML)
        const wrPauseBtn = document.getElementById('pause-btn');
        if (wrPauseBtn) {
            wrPauseBtn.addEventListener('click', () => showWordRainPauseModal());
        }

        // Word Rain pause modal buttons
        const wrPauseModal = document.getElementById('wr-pause-modal');
        if (wrPauseModal) {
            document.getElementById('wrp-resume').addEventListener('click', () => {
                wrPauseModal.style.display = 'none';
                wrPauseModal.classList.add('hidden');
                if (window.WordRain) window.WordRain.togglePause(); // un-pause
                wrPauseBtn.textContent = '⏸️';
            });
            document.getElementById('wrp-restart').addEventListener('click', () => {
                wrPauseModal.style.display = 'none';
                wrPauseModal.classList.add('hidden');
                if (window.WordRain) window.WordRain.start(selectedSpeed, selectedSpawn, wrDiffKey);
                wrPauseBtn.textContent = '⏸️';
            });
            document.getElementById('wrp-home').addEventListener('click', () => {
                wrPauseModal.style.display = 'none';
                wrPauseModal.classList.add('hidden');
                goHome();
            });
            document.getElementById('wrp-settings').addEventListener('click', () => {
                openSettingsForMode('word-rain');
            });
        }

        // Leaderboard
        const prepLbBtn = document.getElementById('prep-show-leaderboard-btn');
        if (prepLbBtn) {
            prepLbBtn.addEventListener('click', () => {
                leaderboardModal.classList.remove('hidden');
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === wrDiffKey);
                });
                renderLeaderboard(wrDiffKey);
            });
        }
        const closeLb = document.getElementById('close-leaderboard');
        if (closeLb) {
            closeLb.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
        }
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderLeaderboard(tab);
            });
        });

        // Settings buttons on PREP screens (with mode-awareness)
        document.querySelectorAll('.settings-btn-bottom-left').forEach(btn => {
            btn.addEventListener('click', e => {
                const mode = e.currentTarget.dataset.settingsMode || activeMode || 'word-rain';
                openSettingsForMode(mode);
            });
        });

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

    // ── Word Rain pause modal helper ──────────────────────────
    function showWordRainPauseModal() {
        const modal    = document.getElementById('wr-pause-modal');
        const pauseBtn = document.getElementById('pause-btn');
        if (!modal) return;
        const willPause = window.WordRain ? window.WordRain.togglePause() : true;
        if (willPause) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            if (pauseBtn) pauseBtn.textContent = '▶️';
        } else {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            if (pauseBtn) pauseBtn.textContent = '⏸️';
        }
    }

    // --- Settings Logic ---
    let currentFontSize = 'normal';
    let currentTheme    = 'default';
    const fontSizes = {
        'very-small': '1.4rem', 'small': '1.8rem', 'normal': '2.2rem',
        'large': '2.6rem', 'very-large': '3rem'
    };
    const themes = {
        'default':       { bg: '#0a0a12', gradient: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a12 100%)', text: '#ffffff' },
        'high-contrast': { bg: '#1b3a24', gradient: 'none', text: '#ffffff' },
        'warm':          { bg: '#2b2b2b', gradient: 'none', text: '#F5DEB3' },
        'deep-blue':     { bg: '#1a1a3e', gradient: 'radial-gradient(circle at 50% 50%, #2a2a5e 0%, #1a1a3e 100%)', text: '#ffffff' }
    };

    function loadSettings() {
        const savedSize  = localStorage.getItem('acidRainFontSize');
        const savedTheme = localStorage.getItem('acidRainTheme');
        if (savedSize  && fontSizes[savedSize])   currentFontSize = savedSize;
        if (savedTheme && themes[savedTheme])       currentTheme    = savedTheme;
        applySettings();
        updateSettingsUI();
    }

    function applySettings() {
        document.documentElement.style.setProperty('--game-font-size', fontSizes[currentFontSize]);
        const theme = themes[currentTheme];
        document.documentElement.style.setProperty('--game-bg-color',     theme.bg);
        document.documentElement.style.setProperty('--game-bg-gradient',  theme.gradient);
        document.documentElement.style.setProperty('--game-text-color',   theme.text);
    }

    function updateSettingsUI() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.size === currentFontSize);
        });
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.theme === currentTheme);
        });
    }

    // --- Analytics hooks ---
    async function handleWordRainEnd(score, difficulty, statsData) {
        saveScoreToLeaderboard(score, difficulty).then(rank => {
            if (rank > 0) statsData["Дэлхийн зэрэглэл"] = "#" + rank;
            showGameStatsMenu("Үгэн бороо", statsData, () => {
                const btn = document.querySelector('#prep-word-rain .real-start-btn');
                // Re-get selected speed/spawn from DOM
                const selBtn = document.querySelector('#prep-word-rain .diff-btn.selected');
                const spd = selBtn ? parseFloat(selBtn.dataset.speed) : 1.4;
                const spw = selBtn ? parseFloat(selBtn.dataset.spawn) : 1.4;
                let dk = 'level2';
                if (spd === 1.0) dk = 'level1';
                else if (spd === 2.0) dk = 'level3';
                else if (spd === 2.8) dk = 'level4';
                window.WordRain.start(spd, spw, dk);
            });
        }).catch(() => {
            showGameStatsMenu("Үгэн бороо", statsData, () => window.WordRain.start());
        });
    }

    function handleParagraphEnd(statsData) {
        showGameStatsMenu("Эх бичих", statsData, () => window.ParagraphMode.startRandom());
    }

    // handleKeyboardEnd is no longer used (KeyboardMode shows its own result modal)
    function handleKeyboardEnd(statsData) {
        // kept for safety — keyboard mode now shows its own inline result modal
    }

    function showGameStatsMenu(modeName, statsData, restartCallback) {
        window.TypingAnalytics.showResultsModal(modeName, statsData, {
            restart: restartCallback,
            menu:    () => goHome()
        });
    }

    // --- Leaderboard ---
    async function getLeaderboard(difficulty) {
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data, error } = await supabaseClient
                    .from('leaderboards').select('*')
                    .eq('difficulty', difficulty).order('score', { ascending: false }).limit(50);
                if (error) throw error;
                return data;
            } catch (error) {
                console.warn("Supabase read failed:", error);
            }
        }
        const data = localStorage.getItem(`leaderboard_${difficulty}`);
        return data ? JSON.parse(data) : [];
    }

    async function saveScoreToLeaderboard(score, difficulty) {
        if (score <= 0) return -1;
        const timestamp = Date.now();
        const newEntry  = { player_id: playerId, name: username, score, difficulty, date: new Date().toLocaleDateString(), timestamp };

        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: existingData, error: fetchError } = await supabaseClient
                    .from('leaderboards').select('score').eq('player_id', playerId).eq('difficulty', difficulty);
                if (fetchError) throw fetchError;
                const existingScore = existingData && existingData.length > 0 ? existingData[0].score : -1;
                if (score > existingScore) {
                    const { error: upsertError } = await supabaseClient.from('leaderboards').upsert({
                        player_id: playerId, name: username, score, difficulty,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'player_id, difficulty' });
                    if (upsertError) throw upsertError;
                    const { data: lb, error: rankError } = await supabaseClient.from('leaderboards')
                        .select('player_id, score').eq('difficulty', difficulty).order('score', { ascending: false }).limit(50);
                    if (rankError) throw rankError;
                    const rank = lb.findIndex(e => e.player_id === playerId && e.score === score) + 1;
                    return rank > 0 ? rank : -1;
                }
                return -1;
            } catch (error) {
                console.warn("Supabase save failed:", error);
            }
        }
        let lb = JSON.parse(localStorage.getItem(`leaderboard_${difficulty}`) || '[]');
        const existing = lb.find(e => e.player_id === playerId || e.name === username);
        if (!existing || score > existing.score) {
            lb = lb.filter(e => e.player_id !== playerId && e.name !== username);
            lb.push(newEntry);
            lb.sort((a, b) => b.score - a.score);
            lb = lb.slice(0, 50);
            localStorage.setItem(`leaderboard_${difficulty}`, JSON.stringify(lb));
            const rank = lb.findIndex(e => (e.player_id === playerId || e.name === username) && e.score === score) + 1;
            return rank > 0 ? rank : -1;
        }
        return -1;
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
            let rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
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

    return {
        init, goHome,
        openSettingsForMode,
        handleWordRainEnd,
        handleParagraphEnd,
        handleKeyboardEnd
    };
})();

window.addEventListener('DOMContentLoaded', () => { AppController.init(); });
