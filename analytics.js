/**
 * Shared analytics and metric calculation logic for all modes
 */

window.TypingAnalytics = {
    // Calculates Words Per Minute
    // standard calculation: 5 characters = 1 word
    calculateWPM: function (correctChars, timeInSeconds) {
        if (timeInSeconds === 0) return 0;
        const minutes = timeInSeconds / 60;
        const words = correctChars / 5;
        return Math.round(words / minutes);
    },

    // Calculates Accuracy percentage
    calculateAccuracy: function (correctChars, totalTypedChars) {
        if (totalTypedChars === 0) return 0;
        return Math.round((correctChars / totalTypedChars) * 100);
    },

    // Formats seconds into MM:SS
    formatTime: function (seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    // Shows standard analytic results modal
    showResultsModal: function (modeName, statsData, actionCallback) {
        let resultsHtml = `<h2>${modeName} - Үр дүн</h2>`;

        // We want to handle arrays (lists) with priority for "Attention" words
        resultsHtml += `<div class="analytics-grid">`;
        for (const [key, value] of Object.entries(statsData)) {
            if (Array.isArray(value)) { continue; } // Handle lists separately
            resultsHtml += `
                <div class="analytics-card">
                    <div class="analytics-label">${key}</div>
                    <div class="analytics-value">${value}</div>
                </div>
            `;
        }
        resultsHtml += `</div>`;

        // Handle arrays (e.g. slowest words, missed words, or the new Attention words)
        for (const [key, value] of Object.entries(statsData)) {
            if (Array.isArray(value) && value.length > 0) {
                // Requirement 3 & 4: label is accurately shown from statsData (e.g. "Анхаарах ёстой үсэг")
                resultsHtml += `
                    <div class="analytics-list-section">
                        <h3>${key}</h3>
                        <div class="analytics-tags">
                            ${value.map(v => `<span class="analytics-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // Requirement 1: "🏆 Тэргүүлэгчид үзэх 🏆" now uses text-btn style like "Үндсэн цэс рүү буцах"
        resultsHtml += `
            <div class="game-over-buttons" style="margin-top: 25px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <button id="modal-restart-btn" class="primary-btn" style="width: 100%; max-width: 280px;">Дахин эхлэх</button>
                <button id="modal-leaderboard-btn" class="text-btn" style="margin-top: 10px; display: none; font-size: 1.1rem; color: var(--primary-color);">🏆 Тэргүүлэгчид үзэх 🏆</button>
                <button id="modal-menu-btn" class="text-btn" style="margin-top: 2px;">Үндсэн цэс рүү буцах</button>
            </div>
        `;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'analytics-modal';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-content analytics-content">
                ${resultsHtml}
            </div>
        `;

        document.body.appendChild(modalOverlay);

        if (actionCallback && actionCallback.leaderboard) {
            const lbBtn = document.getElementById('modal-leaderboard-btn');
            lbBtn.style.display = 'block';
            lbBtn.onclick = () => {
                modalOverlay.remove();
                actionCallback.leaderboard();
            };
        }

        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            modalOverlay.remove();
            if (actionCallback && actionCallback.restart) actionCallback.restart();
        });

        document.getElementById('modal-menu-btn').addEventListener('click', () => {
            modalOverlay.remove();
            if (actionCallback && actionCallback.menu) actionCallback.menu();
        });
    }
};
