// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    const label = document.getElementById('themeLabel');

    if (html.getAttribute('data-theme') === 'blue') {
        html.removeAttribute('data-theme');
        if (label) label.textContent = '🔴 Red';
    } else {
        html.setAttribute('data-theme', 'blue');
        if (label) label.textContent = '🔵 Blue';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('hoyoverse-theme');
    const label = document.getElementById('themeLabel');
    if (savedTheme === 'blue') {
        document.documentElement.setAttribute('data-theme', 'blue');
        if (label) label.textContent = '🔵 Blue';
    }
});

const originalToggle = toggleTheme;
toggleTheme = function() {
    originalToggle();
    const theme = document.documentElement.getAttribute('data-theme') || 'red';
    localStorage.setItem('hoyoverse-theme', theme);
};

// ============================================================
// ARROW TOGGLE — Open/Close dropdowns on click
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const menu = document.querySelector('.menu');
    if (!menu) return;

    function toggleDropdown(arrowElement) {
        const isOpen = arrowElement.classList.contains('open');
        const parentLi = arrowElement.closest('li');
        if (!parentLi) return;

        const dropdown = parentLi.querySelector('.dropdown, .sub-dropdown');
        if (!dropdown) return;

        if (isOpen) {
            arrowElement.classList.remove('open');
            dropdown.classList.remove('open');
        } else {
            // Close any other open dropdowns at the same level
            const siblings = parentLi.parentElement.querySelectorAll('.dropdown.open, .sub-dropdown.open');
            siblings.forEach(function(sib) {
                if (sib !== dropdown) {
                    sib.classList.remove('open');
                    const arrow = sib.closest('li').querySelector('.arrow');
                    if (arrow) arrow.classList.remove('open');
                }
            });

            arrowElement.classList.add('open');
            dropdown.classList.add('open');
        }
    }

    function closeAllDropdowns() {
        const allArrows = document.querySelectorAll('.arrow');
        allArrows.forEach(function(arrow) {
            arrow.classList.remove('open');
            const parentLi = arrow.closest('li');
            if (parentLi) {
                const dropdown = parentLi.querySelector('.dropdown, .sub-dropdown');
                if (dropdown) dropdown.classList.remove('open');
            }
        });
    }

    // Attach click listeners to ALL arrows
    const allArrows = document.querySelectorAll('.arrow');
    allArrows.forEach(function(arrow) {
        arrow.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleDropdown(this);
        });
    });

    // Clicking outside the menu closes everything
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu')) {
            closeAllDropdowns();
        }
    });
});
    // ============================================================
    // HOLLOW ZERO LIVE STATUS — REAL COUNTDOWN + SIMULATED
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {

        // --- Get elements ---
        const statusText = document.getElementById('statusText');
        const statusBadge = document.getElementById('statusBadge');
        const statusSub = document.getElementById('statusSub');
        const corruptionValue = document.getElementById('corruptionValue');
        const corruptionFill = document.getElementById('corruptionFill');
        const corruptionTrend = document.getElementById('corruptionTrend');
        const countdownDisplay = document.getElementById('countdownDisplay');
        const updateTime = document.getElementById('updateTime');

        // --- Safety check ---
        if (!statusText || !statusBadge || !statusSub || !corruptionValue || 
            !corruptionFill || !corruptionTrend || !countdownDisplay || !updateTime) {
            console.error('❌ Hollow Widget: Missing HTML elements!');
            return;
        }

        // ============================================================
        // CONFIG — CHANGE THIS TO THE NEXT REAL BANNER/PATCH DATE
        // ============================================================
        // Format: YYYY-MM-DDTHH:MM:SS (24-hour time)
        // Example: August 15, 2026 at 6:00 PM
        const TARGET_DATE = new Date('2026-07-08T18:00:00').getTime();

        // ============================================================
        // STATUS SYSTEM (Simulates realistic Hollow behavior)
        // ============================================================
        const statuses = [
            { label: 'Safe', badge: '🟢 Safe', sub: 'No immediate threats', class: '' },
            { label: 'Elevated', badge: '🟡 Elevated', sub: 'Increased Ethereal activity', class: 'warning' },
            { label: 'Extreme', badge: '🔴 Extreme', sub: '⚠️ Hollow expansion imminent!', class: 'danger' }
        ];

        let currentStatus = 0;
        let corruption = 23.4;
        let targetCorruption = 23.4;

        // ============================================================
        // UPDATE STATUS (Changes slowly and realistically)
        // ============================================================
        function updateStatus() {
            const now = Date.now();
            const timeOfDay = new Date().getHours();

            // --- Corruption: moves toward a target, changes slowly ---
            if (Math.random() < 0.03) { // 3% chance to change target
                targetCorruption = Math.random() * 70 + 5; // between 5% and 75%
            }

            // Smoothly move corruption toward target
            corruption += (targetCorruption - corruption) * 0.02;
            corruption = Math.min(75, Math.max(5, corruption));

            // --- Status changes based on corruption level + time of day ---
            let newStatus = 0; // Safe by default
            if (corruption > 60) {
                newStatus = 2; // Extreme
            } else if (corruption > 35) {
                newStatus = 1; // Elevated
            } else {
                newStatus = 0; // Safe
            }

            // Add some randomness — sometimes status changes at lower/higher levels
            if (Math.random() < 0.02) {
                if (corruption > 25 && corruption < 50) {
                    newStatus = 1; // Random elevated spike
                }
            }

            // --- Update UI ---
            if (newStatus !== currentStatus) {
                currentStatus = newStatus;
                const status = statuses[currentStatus];
                statusText.textContent = status.label;
                statusBadge.textContent = status.badge;
                statusBadge.className = 'widget-badge ' + status.class;
                statusSub.textContent = status.sub;
            }

            // --- Update corruption display ---
            corruptionValue.textContent = corruption.toFixed(1) + '%';
            corruptionFill.style.width = corruption + '%';

            // --- Update trend ---
            const change = corruption - parseFloat(corruptionValue.textContent);
            if (change > 0.5) corruptionTrend.textContent = '▲ Rising quickly';
            else if (change > 0.1) corruptionTrend.textContent = '▲ Rising slowly';
            else if (change < -0.5) corruptionTrend.textContent = '▼ Falling quickly';
            else if (change < -0.1) corruptionTrend.textContent = '▼ Falling slowly';
            else corruptionTrend.textContent = '— Stable';

            // --- Update timestamp ---
            updateTime.textContent = new Date().toLocaleTimeString();
        }

        // ============================================================
        // COUNTDOWN TIMER
        // ============================================================
        function updateCountdown() {
            const now = Date.now();
            const diff = TARGET_DATE - now;

            if (diff <= 0) {
                countdownDisplay.textContent = '🎉 AVAILABLE NOW!';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            countdownDisplay.textContent =
                `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        }

        // ============================================================
        // START THE WIDGET
        // ============================================================
        updateStatus();
        updateCountdown();

        // Update status every 10 seconds
        setInterval(updateStatus, 10000);

        // Update countdown every second
        setInterval(updateCountdown, 1000);

        // Log success
        console.log('✅ Hollow Widget is LIVE! Next reset: ' + new Date(TARGET_DATE).toLocaleString());

    });
