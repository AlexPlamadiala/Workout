/* ========================================
   ALEX FITNESS — App Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initWorkoutAccordions();
    initTimer();
    initProgress();
    highlightToday();
    loadExerciseState();
});

/* ========== NAVIGATION ========== */
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.section;

            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

/* ========== WORKOUT ACCORDIONS ========== */
function initWorkoutAccordions() {
    const headers = document.querySelectorAll('.day-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.dataset.target;
            const content = document.getElementById(targetId);
            const isOpen = content.classList.contains('open');

            // Close all
            document.querySelectorAll('.day-content').forEach(c => c.classList.remove('open'));
            document.querySelectorAll('.day-header').forEach(h => h.classList.remove('open'));

            // Toggle clicked
            if (!isOpen) {
                content.classList.add('open');
                header.classList.add('open');
            }
        });
    });

    // Open today's workout by default
    openTodaysWorkout();

    // Exercise checkbox persistence
    document.querySelectorAll('.exercise-sets input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', saveExerciseState);
    });
}

function openTodaysWorkout() {
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...
    const dayMap = { 1: 'day1', 2: 'day2', 3: 'day3', 4: 'day4', 5: 'day5' };
    const todayId = dayMap[dayOfWeek];

    if (todayId) {
        const content = document.getElementById(todayId);
        const header = document.querySelector(`[data-target="${todayId}"]`);
        if (content && header) {
            content.classList.add('open');
            header.classList.add('open');
        }
    }
}

/* ========== EXERCISE STATE PERSISTENCE ========== */
function saveExerciseState() {
    const today = new Date().toISOString().split('T')[0];
    const state = {};

    document.querySelectorAll('.exercise-sets').forEach(container => {
        const exercise = container.dataset.exercise;
        const checks = [];
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            checks.push(cb.checked);
        });
        state[exercise] = checks;
    });

    localStorage.setItem(`workout_${today}`, JSON.stringify(state));
}

function loadExerciseState() {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`workout_${today}`);

    if (!saved) return;

    const state = JSON.parse(saved);
    Object.keys(state).forEach(exercise => {
        const container = document.querySelector(`[data-exercise="${exercise}"]`);
        if (!container) return;
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        state[exercise].forEach((checked, i) => {
            if (checkboxes[i]) checkboxes[i].checked = checked;
        });
    });
}

/* ========== HIGHLIGHT TODAY ========== */
function highlightToday() {
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...
    const items = document.querySelectorAll('.schedule-item');

    items.forEach(item => {
        if (parseInt(item.dataset.day) === dayOfWeek) {
            item.classList.add('today');
        }
    });
}

/* ========== REST TIMER ========== */
function initTimer() {
    let timerInterval = null;
    let timeLeft = 90;
    let totalTime = 90;
    let isRunning = false;

    const display = document.getElementById('timer-value');
    const startBtn = document.getElementById('timer-start');
    const resetBtn = document.getElementById('timer-reset');
    const presets = document.querySelectorAll('.timer-preset');

    function updateDisplay() {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        display.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function startTimer() {
        if (isRunning) {
            // Pause
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.textContent = 'CONTINUA';
            display.classList.remove('running');
            return;
        }

        if (timeLeft <= 0) {
            timeLeft = totalTime;
            updateDisplay();
        }

        isRunning = true;
        startBtn.textContent = 'PAUZA';
        display.classList.add('running');
        display.classList.remove('done');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = 'START';
                display.classList.remove('running');
                display.classList.add('done');
                timerDone();
            }
        }, 1000);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = totalTime;
        updateDisplay();
        startBtn.textContent = 'START';
        display.classList.remove('running', 'done');
    }

    function timerDone() {
        // Visual notification + vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Audio beep using Web Audio API
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            for (let i = 0; i < 3; i++) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = 800;
                gain.gain.value = 0.3;
                osc.start(audioCtx.currentTime + i * 0.3);
                osc.stop(audioCtx.currentTime + i * 0.3 + 0.15);
            }
        } catch (e) {
            // Audio not supported, that's ok
        }
    }

    startBtn.addEventListener('click', startTimer);
    resetBtn.addEventListener('click', resetTimer);

    presets.forEach(preset => {
        preset.addEventListener('click', () => {
            presets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            totalTime = parseInt(preset.dataset.time);
            timeLeft = totalTime;
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.textContent = 'START';
            display.classList.remove('running', 'done');
            updateDisplay();
        });
    });
}

/* ========== PROGRESS TRACKER ========== */
function initProgress() {
    const saveBtn = document.getElementById('save-progress');
    const dateInput = document.getElementById('progress-date');

    // Set today's date as default
    dateInput.value = new Date().toISOString().split('T')[0];

    saveBtn.addEventListener('click', saveProgressEntry);
    renderProgressHistory();
    renderChart();
}

function getProgressData() {
    const data = localStorage.getItem('fitness_progress');
    return data ? JSON.parse(data) : [];
}

function saveProgressData(data) {
    localStorage.setItem('fitness_progress', JSON.stringify(data));
}

function saveProgressEntry() {
    const date = document.getElementById('progress-date').value;
    const weight = parseFloat(document.getElementById('progress-weight').value);
    const waist = document.getElementById('progress-waist').value;
    const arms = document.getElementById('progress-arms').value;
    const chest = document.getElementById('progress-chest').value;
    const notes = document.getElementById('progress-notes').value;

    if (!date || isNaN(weight)) {
        alert('Te rog completeaza data si greutatea!');
        return;
    }

    const data = getProgressData();

    // Check if entry for this date already exists
    const existingIndex = data.findIndex(e => e.date === date);
    const entry = {
        date,
        weight,
        waist: waist ? parseFloat(waist) : null,
        arms: arms ? parseFloat(arms) : null,
        chest: chest ? parseFloat(chest) : null,
        notes: notes || null
    };

    if (existingIndex >= 0) {
        data[existingIndex] = entry;
    } else {
        data.push(entry);
    }

    // Sort by date
    data.sort((a, b) => a.date.localeCompare(b.date));

    saveProgressData(data);
    renderProgressHistory();
    renderChart();

    // Clear form
    document.getElementById('progress-weight').value = '';
    document.getElementById('progress-waist').value = '';
    document.getElementById('progress-arms').value = '';
    document.getElementById('progress-chest').value = '';
    document.getElementById('progress-notes').value = '';
}

function renderProgressHistory() {
    const container = document.getElementById('progress-history');
    const data = getProgressData();

    if (data.length === 0) {
        container.innerHTML = '<p class="empty-state">Nicio inregistrare inca.</p>';
        return;
    }

    let html = '';
    data.slice().reverse().forEach((entry, i) => {
        const actualIndex = data.length - 1 - i;
        const prevEntry = actualIndex > 0 ? data[actualIndex - 1] : null;
        let changeHtml = '';

        if (prevEntry) {
            const diff = (entry.weight - prevEntry.weight).toFixed(1);
            if (diff > 0) {
                changeHtml = `<span class="entry-change up">+${diff} kg</span>`;
            } else if (diff < 0) {
                changeHtml = `<span class="entry-change down">${diff} kg</span>`;
            } else {
                changeHtml = `<span class="entry-change same">= 0</span>`;
            }
        }

        let measureHtml = '';
        const measures = [];
        if (entry.waist) measures.push(`Talie: ${entry.waist}cm`);
        if (entry.arms) measures.push(`Brate: ${entry.arms}cm`);
        if (entry.chest) measures.push(`Piept: ${entry.chest}cm`);
        if (measures.length) {
            measureHtml = `<span class="entry-measurements">${measures.join(' | ')}</span>`;
        }

        let notesHtml = entry.notes ? `<p class="entry-notes">${escapeHtml(entry.notes)}</p>` : '';

        html += `
            <div class="progress-entry">
                <div class="entry-info">
                    <span class="entry-date">${formatDate(entry.date)}</span>
                    ${measureHtml}
                    ${notesHtml}
                </div>
                <div class="entry-right">
                    <span class="entry-weight">${entry.weight} kg</span>
                    ${changeHtml}
                    <button class="entry-delete" data-index="${actualIndex}" title="Sterge">✕</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Attach delete handlers
    container.querySelectorAll('.entry-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const data = getProgressData();
            data.splice(index, 1);
            saveProgressData(data);
            renderProgressHistory();
            renderChart();
        });
    });
}

function renderChart() {
    const canvas = document.getElementById('chart-canvas');
    const empty = document.getElementById('chart-empty');
    const data = getProgressData();

    if (data.length < 2) {
        canvas.style.display = 'none';
        empty.style.display = 'block';
        if (data.length === 1) {
            empty.textContent = 'Adauga inca o cantarire pentru a vedea graficul!';
        }
        return;
    }

    canvas.style.display = 'block';
    empty.style.display = 'none';

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 400;

    const padding = { top: 30, right: 30, bottom: 50, left: 55 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    const weights = data.map(d => d.weight);
    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);
    const range = maxW - minW || 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
        const y = padding.top + (h / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();

        // Y labels
        const val = (maxW - (range / gridSteps) * i).toFixed(1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '20px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, padding.left - 10, y + 6);
    }

    // Data points
    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * w,
        y: padding.top + ((maxW - d.weight) / range) * h
    }));

    // Line gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#3b82f6');

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Area fill
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, padding.top + h);
    ctx.lineTo(points[0].x, padding.top + h);
    ctx.closePath();
    const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
    areaGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Data points (dots)
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // X labels (dates)
        if (data.length <= 10 || i % Math.ceil(data.length / 10) === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '18px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            const dateStr = data[i].date.slice(5); // MM-DD
            ctx.fillText(dateStr, p.x, padding.top + h + 30);
        }
    });

    // "kg" label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('kg', padding.left - 10, padding.top - 10);
}

/* ========== UTILITY FUNCTIONS ========== */
function formatDate(dateStr) {
    const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ========== WINDOW RESIZE ========== */
window.addEventListener('resize', () => {
    renderChart();
});
