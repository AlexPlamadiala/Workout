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
    initTrainerMode();
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

/* ========== TRAINER MODE ========== */
function initTrainerMode() {
    const overlay = document.getElementById('trainer-overlay');
    const closeBtn = document.getElementById('trainer-close');
    const actionBtn = document.getElementById('trainer-action');
    const actionSecBtn = document.getElementById('trainer-action-secondary');
    const skipRestBtn = document.getElementById('trainer-skip-rest');

    let state = null; // trainer state

    // Warm-up steps based on workout type
    const warmupSteps = {
        upper: [
            { icon: '🏃', name: 'Cardio Usor', detail: 'Alergare pe loc, jumping jacks sau sari coarda. Scopul e sa-ti cresti pulsul usor.', duration: '3 minute' },
            { icon: '🔄', name: 'Rotatii Brate', detail: 'Cercuri mici si mari cu bratele. 10 inainte, 10 inapoi. Incalzeste articulatiile umarului.', duration: '30 secunde' },
            { icon: '💪', name: 'Flotari Usoare', detail: 'Fa 10 flotari usoare (de pe genunchi daca e nevoie) ca sa activezi pieptul si tricepsul.', duration: '30 secunde' },
            { icon: '🙆', name: 'Stretching Dinamic Umeri', detail: 'Cross-body arm stretches si arm circles. 10 repetari pe fiecare parte.', duration: '1 minut' }
        ],
        lower: [
            { icon: '🏃', name: 'Cardio Usor', detail: 'Alergare pe loc, genuflexiuni cu greutatea corpului sau high knees. Creste-ti pulsul.', duration: '3 minute' },
            { icon: '🦵', name: 'Genuflexiuni Bodyweight', detail: 'Fa 15 genuflexiuni lente fara greutate. Coboara adanc, simte stretching-ul.', duration: '1 minut' },
            { icon: '🔄', name: 'Rotatii Solduri', detail: 'Cercuri cu soldurile - 10 in fiecare directie. Deschide articulatia soldului.', duration: '30 secunde' },
            { icon: '🧘', name: 'Fandari Dinamice', detail: 'Fandari alternante fara greutate - 8 pe fiecare picior. Activeaza fesieri si cvadriceps.', duration: '1 minut' }
        ]
    };

    const cooldownSteps = [
        { icon: '🧘', name: 'Stretching Tot Corpul', detail: 'Stretching static pentru fiecare grupa musculara lucrata. Tine fiecare pozitie 20-30 secunde.', duration: '3 minute' },
        { icon: '🫁', name: 'Respiratie Profunda', detail: 'Inspira pe nas 4 secunde, tine 4 secunde, expira pe gura 6 secunde. Repeta de 5 ori.', duration: '1 minut' },
        { icon: '💧', name: 'Hidrateaza-te!', detail: 'Bea un pahar mare de apa. Corpul tau are nevoie de hidratare dupa efort.', duration: '' }
    ];

    const trainerMessages = {
        warmupStart: [
            'Hai sa ne incalzim bine! Un corp incalzit = performanta mai buna si risc redus de accidentari.',
            'E timpul de incalzire! Nu sari peste pasul asta, e esential pentru un antrenament bun.',
            'Sa incepem cu incalzirea! Cateva minute acum iti salveaza saptamani de recuperare.'
        ],
        warmupStep: [
            'Foarte bine! Continua asa, pregateste-ti corpul.',
            'Excelent! Simti cum se incalzeste musculatura?',
            'Bun! Mai avem putin si trecem la treaba!'
        ],
        exerciseStart: [
            'Gata incalzirea! Acum incepe treaba serioasa. Concentreaza-te pe forma corecta!',
            'Ai terminat incalzirea, esti pregatit! Sa dam tot ce avem!',
            'Perfect, esti incalzit! Acum trage tare, dar cu forma corecta!'
        ],
        setDone: [
            'Bravo! Set terminat! Ia o pauza si recupereaza.',
            'Excelent! Felicitari! Acum odihneste-te putin.',
            'Foarte bine! Foloseste pauza sa-ti controlezi respiratia.',
            'Set gata! Bea o gura de apa si respira adanc.',
            'Perfect executat! Pauza meritata!'
        ],
        nextExercise: [
            'Urmatorul exercitiu! Concentreaza-te pe forma.',
            'Trecem mai departe! Tine-o tot asa!',
            'Exercitiu nou! Citeste indicatiile si da-i drumul.',
            'Hai la urmatorul! Esti pe drumul bun!'
        ],
        lastSet: [
            'Ultimul set! Da tot ce ai, nu te opri!',
            'Setul FINAL! Lasa totul aici!',
            'Mai ai UN SET! Fa-l sa conteze!'
        ],
        cooldownStart: [
            'Antrenamentul s-a terminat! Bravo! Acum sa ne racim si sa ne intindem.',
            'Felicitari, ai terminat! Cooldown-ul e important pentru recuperare.',
            'Excelent antrenament! Sa ne racim putin acum.'
        ],
        finished: [
            'BRAVO! Ai terminat antrenamentul de azi! Fii mandru de tine!',
            'FELICITARI! Alt antrenament bifat! Consistenta e cheia!',
            'EXCELENT! Ai dat totul azi! Acum odihneste-te si mananca bine!'
        ]
    };

    function randomMsg(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function parseExercises(dayId) {
        const dayContent = document.getElementById(dayId);
        if (!dayContent) return [];
        const cards = dayContent.querySelectorAll('.exercise-card');
        const exercises = [];
        cards.forEach(card => {
            const name = card.querySelector('.exercise-header h4')?.textContent || '';
            const setsText = card.querySelector('.sets-badge')?.textContent || '';
            const target = card.querySelector('.exercise-target')?.textContent || '';
            const desc = card.querySelector('.exercise-desc')?.textContent || '';
            const dataExercise = card.querySelector('.exercise-sets')?.dataset.exercise || '';

            // Parse sets count from text like "4 × 8-12" or "3 × MAX"
            const setsMatch = setsText.match(/(\d+)\s*[×x]/i);
            const numSets = setsMatch ? parseInt(setsMatch[1]) : 3;

            exercises.push({ name, setsText, target, desc, numSets, dataExercise });
        });
        return exercises;
    }

    function getDayType(dayId) {
        const header = document.querySelector(`[data-target="${dayId}"]`);
        if (!header) return 'upper';
        const badge = header.querySelector('.day-badge');
        if (badge && badge.classList.contains('lower')) return 'lower';
        return 'upper';
    }

    function getDayTitle(dayId) {
        const header = document.querySelector(`[data-target="${dayId}"]`);
        if (!header) return '';
        const titleSpan = header.querySelector('.day-title span:not(.day-badge)');
        return titleSpan ? titleSpan.textContent : '';
    }

    function startTrainer(dayId) {
        const exercises = parseExercises(dayId);
        if (exercises.length === 0) return;

        const dayType = getDayType(dayId);
        const warmup = warmupSteps[dayType] || warmupSteps.upper;

        state = {
            dayId,
            dayTitle: getDayTitle(dayId),
            dayType,
            exercises,
            warmup,
            phase: 'warmup', // warmup, exercise, rest, cooldown, done
            warmupIndex: 0,
            exerciseIndex: 0,
            setIndex: 0,
            cooldownIndex: 0,
            totalSets: exercises.reduce((sum, ex) => sum + ex.numSets, 0),
            completedSets: 0,
            startTime: Date.now(),
            restTimer: null,
            restTime: 90,
            restTimeLeft: 0
        };

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        showWarmupStart();
    }

    function stopTrainer() {
        if (state && state.restTimer) {
            clearInterval(state.restTimer);
        }
        state = null;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateProgress() {
        if (!state) return;
        const fill = document.getElementById('trainer-progress-fill');
        const totalSteps = state.warmup.length + state.totalSets + cooldownSteps.length;
        let completed = 0;

        if (state.phase === 'warmup') {
            completed = state.warmupIndex;
        } else if (state.phase === 'exercise' || state.phase === 'rest') {
            completed = state.warmup.length + state.completedSets;
        } else if (state.phase === 'cooldown') {
            completed = state.warmup.length + state.totalSets + state.cooldownIndex;
        } else if (state.phase === 'done') {
            completed = totalSteps;
        }

        const pct = Math.min(100, (completed / totalSteps) * 100);
        fill.style.width = pct + '%';
    }

    function setPhaseLabel(text, cls) {
        const label = document.getElementById('trainer-phase-label');
        label.textContent = text;
        label.className = '';
        if (cls) label.classList.add(cls);
    }

    function setStepLabel(text) {
        document.getElementById('trainer-step-label').textContent = text;
    }

    function setTrainerText(text) {
        document.getElementById('trainer-text').textContent = text;
    }

    function showElement(id) {
        document.getElementById(id).style.display = '';
    }

    function hideElement(id) {
        document.getElementById(id).style.display = 'none';
    }

    function hideAllCards() {
        hideElement('trainer-exercise');
        document.getElementById('trainer-exercise').classList.remove('visible');
        hideElement('trainer-step-card');
        hideElement('trainer-set-tracker');
        hideElement('trainer-timer');
        hideElement('trainer-summary');
    }

    // ---- WARM-UP ----
    function showWarmupStart() {
        hideAllCards();
        setPhaseLabel('INCALZIRE', 'warmup');
        setStepLabel(`Pas ${state.warmupIndex + 1} din ${state.warmup.length}`);
        setTrainerText(randomMsg(trainerMessages.warmupStart));
        showWarmupStep();
        actionBtn.textContent = 'GATA, URMATORUL PAS';
        actionBtn.onclick = nextWarmupStep;
        hideElement('trainer-action-secondary');
        updateProgress();
    }

    function showWarmupStep() {
        const step = state.warmup[state.warmupIndex];
        if (!step) return;

        showElement('trainer-step-card');
        document.getElementById('trainer-step-icon').textContent = step.icon;
        document.getElementById('trainer-step-name').textContent = step.name;
        document.getElementById('trainer-step-detail').textContent = step.detail;
        document.getElementById('trainer-step-duration').textContent = step.duration;
    }

    function nextWarmupStep() {
        state.warmupIndex++;
        if (state.warmupIndex >= state.warmup.length) {
            // Warm-up done, move to exercises
            startExercisePhase();
            return;
        }
        setStepLabel(`Pas ${state.warmupIndex + 1} din ${state.warmup.length}`);
        setTrainerText(randomMsg(trainerMessages.warmupStep));
        hideAllCards();
        showWarmupStep();
        updateProgress();
    }

    // ---- EXERCISES ----
    function startExercisePhase() {
        state.phase = 'exercise';
        state.exerciseIndex = 0;
        state.setIndex = 0;
        setTrainerText(randomMsg(trainerMessages.exerciseStart));
        showCurrentExercise();
    }

    function showCurrentExercise() {
        hideAllCards();
        const ex = state.exercises[state.exerciseIndex];
        if (!ex) return;

        setPhaseLabel('EXERCITIU', 'exercise');
        setStepLabel(`Exercitiu ${state.exerciseIndex + 1} din ${state.exercises.length}`);

        // Show exercise card
        const exCard = document.getElementById('trainer-exercise');
        exCard.style.display = '';
        exCard.classList.add('visible');
        document.getElementById('trainer-exercise-name').textContent = ex.name;
        document.getElementById('trainer-sets-badge').textContent = ex.setsText;
        document.getElementById('trainer-target').textContent = ex.target;
        document.getElementById('trainer-desc').textContent = ex.desc;

        // Show set tracker
        showElement('trainer-set-tracker');
        renderSetDots(ex.numSets, state.setIndex);

        actionBtn.textContent = state.setIndex === ex.numSets - 1 ? 'ULTIMUL SET - GATA!' : 'SET TERMINAT!';
        actionBtn.onclick = completeSet;
        hideElement('trainer-action-secondary');

        updateProgress();
    }

    function renderSetDots(total, currentIndex) {
        const container = document.getElementById('trainer-set-dots');
        container.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('div');
            dot.className = 'trainer-set-dot';
            if (i < currentIndex) {
                dot.classList.add('done');
                dot.textContent = '✓';
            } else if (i === currentIndex) {
                dot.classList.add('current');
                dot.textContent = (i + 1);
            } else {
                dot.textContent = (i + 1);
            }
            container.appendChild(dot);
        }
        document.getElementById('trainer-set-label').textContent = `Set ${currentIndex + 1} din ${total}`;
    }

    function completeSet() {
        const ex = state.exercises[state.exerciseIndex];
        state.completedSets++;

        // Mark checkbox in original workout page
        markSetCheckbox(ex.dataExercise, state.setIndex);

        state.setIndex++;

        if (state.setIndex >= ex.numSets) {
            // Exercise done, move to next exercise or cooldown
            state.exerciseIndex++;
            state.setIndex = 0;

            if (state.exerciseIndex >= state.exercises.length) {
                // All exercises done!
                startCooldownPhase();
            } else {
                // Show rest then next exercise
                setTrainerText(randomMsg(trainerMessages.nextExercise));
                startRestTimer(() => showCurrentExercise());
            }
        } else {
            // More sets, start rest
            if (state.setIndex === ex.numSets - 1) {
                setTrainerText(randomMsg(trainerMessages.lastSet));
            } else {
                setTrainerText(randomMsg(trainerMessages.setDone));
            }
            startRestTimer(() => showCurrentExercise());
        }
    }

    function markSetCheckbox(dataExercise, setIdx) {
        if (!dataExercise) return;
        const container = document.querySelector(`[data-exercise="${dataExercise}"]`);
        if (!container) return;
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        if (checkboxes[setIdx]) {
            checkboxes[setIdx].checked = true;
            saveExerciseState();
        }
    }

    // ---- REST TIMER ----
    function startRestTimer(callback) {
        state.phase = 'rest';
        hideAllCards();

        // Keep exercise card visible but show timer
        const exCard = document.getElementById('trainer-exercise');
        exCard.style.display = '';
        exCard.classList.add('visible');

        // Update set dots
        const ex = state.exercises[state.exerciseIndex] || state.exercises[state.exerciseIndex - 1];
        if (ex) {
            showElement('trainer-set-tracker');
            const currentSet = state.exerciseIndex < state.exercises.length ? state.setIndex : ex.numSets;
            renderSetDots(ex.numSets, currentSet);
        }

        setPhaseLabel('PAUZA', 'rest');

        showElement('trainer-timer');
        state.restTimeLeft = state.restTime;
        updateRestDisplay();

        actionBtn.textContent = 'ASTEPT...';
        actionBtn.onclick = null;
        actionBtn.style.opacity = '0.5';

        // Start countdown
        state.restTimer = setInterval(() => {
            state.restTimeLeft--;
            updateRestDisplay();

            if (state.restTimeLeft <= 5 && state.restTimeLeft > 0) {
                document.getElementById('trainer-timer-display').classList.add('finishing');
            }

            if (state.restTimeLeft <= 0) {
                clearInterval(state.restTimer);
                state.restTimer = null;
                document.getElementById('trainer-timer-display').classList.remove('finishing');
                document.getElementById('trainer-timer-display').classList.add('done');
                timerDoneNotify();
                state.phase = 'exercise';
                actionBtn.style.opacity = '1';
                actionBtn.textContent = 'HAI, URMATORUL!';
                actionBtn.onclick = () => {
                    document.getElementById('trainer-timer-display').classList.remove('done');
                    callback();
                };
            }
        }, 1000);

        // Skip rest button
        skipRestBtn.onclick = () => {
            clearInterval(state.restTimer);
            state.restTimer = null;
            state.phase = 'exercise';
            actionBtn.style.opacity = '1';
            document.getElementById('trainer-timer-display').classList.remove('finishing', 'done');
            callback();
        };

        updateProgress();
    }

    function updateRestDisplay() {
        const min = Math.floor(state.restTimeLeft / 60);
        const sec = state.restTimeLeft % 60;
        document.getElementById('trainer-timer-display').textContent =
            `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function timerDoneNotify() {
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
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
        } catch (e) { /* ok */ }
    }

    // ---- COOLDOWN ----
    function startCooldownPhase() {
        state.phase = 'cooldown';
        state.cooldownIndex = 0;
        setTrainerText(randomMsg(trainerMessages.cooldownStart));
        showCooldownStep();
    }

    function showCooldownStep() {
        hideAllCards();
        const step = cooldownSteps[state.cooldownIndex];
        if (!step) return;

        setPhaseLabel('RACIRE', 'cooldown');
        setStepLabel(`Pas ${state.cooldownIndex + 1} din ${cooldownSteps.length}`);

        showElement('trainer-step-card');
        document.getElementById('trainer-step-icon').textContent = step.icon;
        document.getElementById('trainer-step-name').textContent = step.name;
        document.getElementById('trainer-step-detail').textContent = step.detail;
        document.getElementById('trainer-step-duration').textContent = step.duration;

        actionBtn.style.opacity = '1';
        actionBtn.textContent = 'GATA, URMATORUL PAS';
        actionBtn.onclick = nextCooldownStep;
        hideElement('trainer-action-secondary');

        updateProgress();
    }

    function nextCooldownStep() {
        state.cooldownIndex++;
        if (state.cooldownIndex >= cooldownSteps.length) {
            showSummary();
            return;
        }
        showCooldownStep();
    }

    // ---- SUMMARY ----
    function showSummary() {
        state.phase = 'done';
        hideAllCards();
        setPhaseLabel('GATA!', 'done');
        setStepLabel('');
        setTrainerText(randomMsg(trainerMessages.finished));

        showElement('trainer-summary');

        const duration = Math.round((Date.now() - state.startTime) / 60000);
        const statsHtml = `
            <div class="trainer-stat-card">
                <span class="trainer-stat-value">${state.exercises.length}</span>
                <span class="trainer-stat-label">Exercitii</span>
            </div>
            <div class="trainer-stat-card">
                <span class="trainer-stat-value">${state.completedSets}</span>
                <span class="trainer-stat-label">Seturi</span>
            </div>
            <div class="trainer-stat-card">
                <span class="trainer-stat-value">${duration}</span>
                <span class="trainer-stat-label">Minute</span>
            </div>
            <div class="trainer-stat-card">
                <span class="trainer-stat-value">${state.dayType === 'upper' ? 'UPPER' : 'LOWER'}</span>
                <span class="trainer-stat-label">Tip Zi</span>
            </div>
        `;
        document.getElementById('trainer-summary-stats').innerHTML = statsHtml;

        actionBtn.style.opacity = '1';
        actionBtn.textContent = 'INCHIDE';
        actionBtn.onclick = stopTrainer;
        hideElement('trainer-action-secondary');

        updateProgress();
    }

    // ---- PRESET HANDLERS ----
    document.querySelectorAll('.trainer-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            document.querySelectorAll('.trainer-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            if (state) {
                state.restTime = parseInt(preset.dataset.time);
                // If timer is running, update it
                if (state.phase === 'rest' && state.restTimer) {
                    clearInterval(state.restTimer);
                    state.restTimeLeft = state.restTime;
                    updateRestDisplay();
                    document.getElementById('trainer-timer-display').classList.remove('finishing', 'done');

                    actionBtn.textContent = 'ASTEPT...';
                    actionBtn.onclick = null;
                    actionBtn.style.opacity = '0.5';

                    const callback = actionBtn._restCallback;
                    state.restTimer = setInterval(() => {
                        state.restTimeLeft--;
                        updateRestDisplay();
                        if (state.restTimeLeft <= 5 && state.restTimeLeft > 0) {
                            document.getElementById('trainer-timer-display').classList.add('finishing');
                        }
                        if (state.restTimeLeft <= 0) {
                            clearInterval(state.restTimer);
                            state.restTimer = null;
                            document.getElementById('trainer-timer-display').classList.remove('finishing');
                            document.getElementById('trainer-timer-display').classList.add('done');
                            timerDoneNotify();
                            state.phase = 'exercise';
                            actionBtn.style.opacity = '1';
                            actionBtn.textContent = 'HAI, URMATORUL!';
                        }
                    }, 1000);
                }
            }
        });
    });

    // ---- EVENT LISTENERS ----
    closeBtn.addEventListener('click', () => {
        if (state && state.phase !== 'done') {
            if (confirm('Esti sigur ca vrei sa opresti antrenamentul?')) {
                stopTrainer();
            }
        } else {
            stopTrainer();
        }
    });

    // Start workout buttons
    document.querySelectorAll('.btn-start-workout').forEach(btn => {
        btn.addEventListener('click', () => {
            startTrainer(btn.dataset.day);
        });
    });
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
