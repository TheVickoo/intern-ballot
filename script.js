/**
 * QLD Health Intern Ballot Simulation - Web Implementation
 * Ported from simulation.py
 */

// Historical baseline (e.g., last year's first-preference counts).
// Keep these as the stable reference data for the "historical" preset.
const HOSPITALS = [
    { name: "Greenslopes Private Hospital", capacity: 12, applicants: 6 },
    { name: "SCUH", capacity: 64, applicants: 83 },
    { name: "Toowoomba", capacity: 57, applicants: 34 },
    { name: "TPCH", capacity: 50, applicants: 30 },
    { name: "Bundaberg", capacity: 6, applicants: 5 },
    { name: "PA Hospital", capacity: 82, applicants: 114 },
    { name: "Cairns", capacity: 54, applicants: 54 },
    { name: "Redcliffe", capacity: 28, applicants: 10 },
    { name: "Townsville", capacity: 71, applicants: 33 },
    { name: "RBWH", capacity: 94, applicants: 122 },
    { name: "Redland", capacity: 15, applicants: 14 },
    { name: "Logan", capacity: 45, applicants: 56 },
    { name: "Gold Coast", capacity: 92, applicants: 162 },
    { name: "Mater", capacity: 18, applicants: 18 },
    { name: "QEII", capacity: 22, applicants: 13 },
    { name: "Mackay", capacity: 28, applicants: 2 },
    { name: "Caboolture", capacity: 23, applicants: 3 },
    { name: "Hervey Bay", capacity: 8, applicants: 4 },
    { name: "Ipswich", capacity: 45, applicants: 18 },
    { name: "Rockhampton", capacity: 50, applicants: 2 }
];

// Initialize application state
let currentHospitals = JSON.parse(JSON.stringify(HOSPITALS));
let userPrefs = []; // Indices into currentHospitals
let applicationMode = 'solo'; // 'joint' = couple (2), 'solo' = single (1)

function partySize() {
    return applicationMode === 'joint' ? 2 : 1;
}

/**
 * Weighted choice implementation
 */
function weightedChoice(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) return -1;

    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

/**
 * Runs a single Monte Carlo iteration
 */
function runSingleBallot(capacities, firstPrefCounts, userPreferenceIndices, party) {
    let counts = [...firstPrefCounts];
    let userHospitalIndex = userPreferenceIndices[0];

    for (let step = 0; step < 500; step++) {
        const oversubscribed = [];
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] > capacities[i]) oversubscribed.push(i);
        }

        if (oversubscribed.length === 0) break;

        const chosen = oversubscribed[Math.floor(Math.random() * oversubscribed.length)];
        const excess = counts[chosen] - capacities[chosen];

        // Is the user's party drawn out of this hospital?
        let userDrawn = false;
        if (userHospitalIndex === chosen) {
            // P(none of the party drawn) = prod((n - party - j) / (n - j)) for j in 0..excess-1
            const n = counts[chosen];
            let pNotDrawn = 1.0;
            for (let j = 0; j < excess; j++) {
                pNotDrawn *= (n - party - j) / (n - j);
            }
            userDrawn = Math.random() > pNotDrawn;
        }

        counts[chosen] = capacities[chosen];

        let nonUserToPlace = excess;
        if (userDrawn) {
            nonUserToPlace = excess - party;
            if (nonUserToPlace < 0) {
                // Party larger than excess (only possible for joint with excess=1)
                counts[chosen] = capacities[chosen] - (party - excess);
                nonUserToPlace = 0;
            }
        }

        // Place displaced non-user applicants
        for (let i = 0; i < nonUserToPlace; i++) {
            const weights = counts.map((c, h) => {
                return (h !== chosen && counts[h] < capacities[h]) ? firstPrefCounts[h] : 0;
            });
            const dest = weightedChoice(weights);
            if (dest >= 0) counts[dest]++;
        }

        // Place the user's party at the next available preference
        if (userDrawn) {
            let placed = false;
            const currentPrefRank = userPreferenceIndices.indexOf(userHospitalIndex);

            for (let i = currentPrefRank + 1; i < userPreferenceIndices.length; i++) {
                const prefHosp = userPreferenceIndices[i];
                if (counts[prefHosp] + party <= capacities[prefHosp]) {
                    counts[prefHosp] += party;
                    userHospitalIndex = prefHosp;
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                for (let h = 0; h < capacities.length; h++) {
                    if (counts[h] + party <= capacities[h]) {
                        counts[h] += party;
                        userHospitalIndex = h;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    const lastHosp = userPreferenceIndices[userPreferenceIndices.length - 1];
                    counts[lastHosp] += party;
                    userHospitalIndex = lastHosp;
                }
            }
        }
    }

    return userHospitalIndex;
}

/**
 * Runs the full simulation
 */
async function performSimulation(nSims = 50000) {
    const capacities = currentHospitals.map(h => h.capacity);
    const firstPrefCounts = currentHospitals.map(h => h.applicants);
    const results = new Array(currentHospitals.length).fill(0);
    const party = partySize();

    const chunkSize = 5000;
    for (let i = 0; i < nSims; i += chunkSize) {
        for (let j = 0; j < chunkSize && (i + j) < nSims; j++) {
            const outcome = runSingleBallot(capacities, firstPrefCounts, userPrefs, party);
            results[outcome]++;
        }
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0));
        updateProgress(i + chunkSize, nSims);
    }

    return results;
}

// Live/self-reported first-preference counts for the current cycle.
// Update this without overwriting historical data above.
const LIVE_STATUS_REPORT = {
    "Bundaberg": 2,
    "Caboolture": 1,
    "Cairns": 12,
    "Gold Coast": 15,
    "Greenslopes Private Hospital": 0,
    "Hervey Bay": 0,
    "Ipswich": 1,
    "Logan": 5,
    "Mackay": 1,
    "Mater": 6,
    "Mt Isa Hospital": 1, // Capacity is 0, so it is not included in the simulation.
    "PA Hospital": 4,
    "QEII": 4,
    "Redcliffe": 1,
    "Redland": 0,
    "Rockhampton": 1,
    "RBWH": 16,
    "SCUH": 9,
    "TPCH": 5,
    "Toowoomba": 6,
    "Townsville": 8
};

function applyPreset(type) {
    if (type === 'historical') {
        currentHospitals.forEach((hosp, i) => {
            const original = HOSPITALS.find(h => h.name === hosp.name);
            if (original) currentHospitals[i].applicants = original.applicants;
        });
    } else if (type === 'live') {
        currentHospitals.forEach((hosp, i) => {
            if (LIVE_STATUS_REPORT[hosp.name] !== undefined) {
                currentHospitals[i].applicants = LIVE_STATUS_REPORT[hosp.name];
            }
        });
    } else if (type === 'extrapolate') {
        const totalHistorical = HOSPITALS.reduce((sum, h) => sum + h.applicants, 0);
        const totalLive = Object.values(LIVE_STATUS_REPORT).reduce((sum, val) => sum + val, 0);
        
        if (totalLive > 0) {
            const scale = totalHistorical / totalLive;
            currentHospitals.forEach((hosp, i) => {
                if (LIVE_STATUS_REPORT[hosp.name] !== undefined) {
                    currentHospitals[i].applicants = Math.round(LIVE_STATUS_REPORT[hosp.name] * scale);
                }
            });
        }
    }
    saveState();
    renderDataTable();
}

// --- UI Logic ---

function updateProgress(current, total) {
    const btn = document.getElementById('run-btn');
    const status = document.getElementById('status-text');
    const percent = Math.min(100, Math.round((current / total) * 100));
    btn.innerHTML = `<span class="btn-cast-verb">Monty draws… ${percent}%</span>`;
    status.innerText = `Card ${current.toLocaleString()} of ${total.toLocaleString()}, turned.`;
}

function renderUI() {
    renderPreferenceList();
    renderDataTable();
}

function renderPreferenceList() {
    const list = document.getElementById('preference-list');
    list.innerHTML = '';

    userPrefs.forEach((hospIndex, rank) => {
        const hospital = currentHospitals[hospIndex];
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.draggable = true;
        item.dataset.index = hospIndex;
        const padded = String(rank + 1).padStart(2, '0');
        item.innerHTML = `
            <div class="left">
                <span class="pref-index">${padded}</span>
                <span class="hospital-name">
                    ${hospital.name}
                    <span class="cap">Capacity ${hospital.capacity}</span>
                </span>
            </div>
            <div class="controls">
                <button type="button" onclick="movePref(${rank}, -1)" aria-label="Move up">↑</button>
                <button type="button" onclick="movePref(${rank}, 1)" aria-label="Move down">↓</button>
            </div>
        `;

        // Drag and Drop events
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => item.classList.remove('dragging'));

        list.appendChild(item);
    });

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });

    // Handle drag drop to update state
    list.addEventListener('drop', () => {
        const items = [...list.querySelectorAll('.sortable-item')];
        userPrefs = items.map(item => parseInt(item.dataset.index));
        saveState();
        renderPreferenceList();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function movePref(rank, direction) {
    const newRank = rank + direction;
    if (newRank < 0 || newRank >= userPrefs.length) return;

    const temp = userPrefs[rank];
    userPrefs[rank] = userPrefs[newRank];
    userPrefs[newRank] = temp;

    saveState();
    renderPreferenceList();
}

function renderDataTable() {
    const body = document.getElementById('data-body');
    body.innerHTML = '';

    currentHospitals.forEach((hosp, i) => {
        const tr = document.createElement('tr');
        const ratio = hosp.capacity > 0 ? hosp.applicants / hosp.capacity : 0;
        tr.innerHTML = `
            <td>${hosp.name}</td>
            <td class="num">${hosp.capacity}</td>
            <td class="num">
                <input type="number" min="0" value="${hosp.applicants}"
                    onchange="updateApplicants(${i}, this.value)">
            </td>
            <td class="num ratio ${ratioClass(ratio)}">${ratio.toFixed(2)}×</td>
        `;
        body.appendChild(tr);
    });
}

function ratioClass(r) {
    if (r > 1.05) return 'high';
    if (r < 0.95) return 'low';
    return 'even';
}

function updateRatioCell(index) {
    const hosp = currentHospitals[index];
    const ratio = hosp.capacity > 0 ? hosp.applicants / hosp.capacity : 0;
    const row = document.querySelectorAll('#data-body tr')[index];
    if (!row) return;
    const cell = row.querySelector('.ratio');
    if (cell) {
        cell.textContent = `${ratio.toFixed(2)}×`;
        cell.classList.remove('high', 'low', 'even');
        cell.classList.add(ratioClass(ratio));
    }
}

function updateApplicants(index, value) {
    currentHospitals[index].applicants = parseInt(value) || 0;
    saveState();
    updateRatioCell(index);
}

function saveState() {
    localStorage.setItem('readymedygo_userPrefs', JSON.stringify(userPrefs));
    localStorage.setItem('readymedygo_hospitals', JSON.stringify(currentHospitals));
    localStorage.setItem('readymedygo_mode', applicationMode);
    updateURL();
}

function updateURL() {
    const state = {
        p: userPrefs,
        h: currentHospitals.map(h => h.applicants),
        m: applicationMode
    };
    const encoded = btoa(JSON.stringify(state));
    window.history.replaceState(null, '', `#${encoded}`);
}

function loadState() {
    const hash = window.location.hash.substring(1);
    let state = null;

    if (hash) {
        try {
            state = JSON.parse(atob(hash));
        } catch (e) {
            console.error('Failed to load state from URL', e);
        }
    }

    const isStateValid = state
        && Array.isArray(state.h)
        && Array.isArray(state.p)
        && state.h.length === HOSPITALS.length
        && state.p.length === HOSPITALS.length;

    if (isStateValid) {
        userPrefs = state.p;
        state.h.forEach((apps, i) => {
            currentHospitals[i].applicants = apps;
        });
        if (state.m === 'solo' || state.m === 'joint') {
            applicationMode = state.m;
        }
    } else {
        const savedPrefs = localStorage.getItem('readymedygo_userPrefs');
        const savedHospitals = localStorage.getItem('readymedygo_hospitals');
        const savedMode = localStorage.getItem('readymedygo_mode');

        if (savedHospitals) {
            const parsedHospitals = JSON.parse(savedHospitals);
            if (Array.isArray(parsedHospitals) && parsedHospitals.length === HOSPITALS.length) {
                currentHospitals = parsedHospitals;
            }
        }
        if (savedMode === 'solo' || savedMode === 'joint') {
            applicationMode = savedMode;
        }

        if (savedPrefs) {
            const parsedPrefs = JSON.parse(savedPrefs);
            if (Array.isArray(parsedPrefs) && parsedPrefs.length === HOSPITALS.length) {
                userPrefs = parsedPrefs;
            }
        } else {
            resetToDefaults();
            return;
        }
    }
}

function setMode(mode) {
    if (mode !== 'solo' && mode !== 'joint') return;
    if (mode === applicationMode) return;
    applicationMode = mode;
    saveState();
    renderModeSwitch();
    // Hide stale results so the user re-runs against the new mode
    const resultsSection = document.getElementById('results');
    if (resultsSection) resultsSection.style.display = 'none';
    document.getElementById('status-text').innerText = mode === 'joint'
        ? 'Monty shifts to a joint reading. Cast the lots to refresh.'
        : 'Monty shifts to a solo reading. Cast the lots to refresh.';
}

function renderModeSwitch() {
    document.querySelectorAll('.mode-option').forEach(btn => {
        const active = btn.dataset.mode === applicationMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
}

function resetToDefaults() {
    currentHospitals = JSON.parse(JSON.stringify(HOSPITALS));
    // Default order: most to least popular by historical first-preference count.
    userPrefs = currentHospitals
        .map((h, i) => ({ i, applicants: h.applicants }))
        .sort((a, b) => b.applicants - a.applicants)
        .map(o => o.i);
    applicationMode = 'solo';
    saveState();
    renderUI();
    renderModeSwitch();
}

function copyShareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const status = document.getElementById('status-text');
        const originalText = status.innerText;
        status.innerText = "Monty has sealed a copy for you.";
        setTimeout(() => {
            status.innerText = originalText;
        }, 2000);
    });
}

async function runSimulation() {
    const btn = document.getElementById('run-btn');
    const resultsSection = document.getElementById('results');
    const status = document.getElementById('status-text');

    btn.disabled = true;
    resultsSection.style.display = 'none';

    const startTime = performance.now();
    const results = await performSimulation(50000);
    const endTime = performance.now();

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-cast-verb">Cast the lots</span><span class="btn-cast-arrow" aria-hidden="true">↬</span>';
    status.innerText = `Monty sets down the deck (${Math.round(endTime - startTime)} ms). The reading follows.`;

    displayResults(results);
}

function displayResults(results) {
    const body = document.getElementById('results-body');
    const summary = document.getElementById('results-summary');
    const section = document.getElementById('results');

    body.innerHTML = '';
    section.style.display = 'block';

    const nSims = results.reduce((a, b) => a + b, 0);
    const landingHospitals = [];

    let cumulative = 0;
    userPrefs.forEach((hospIndex, rank) => {
        const count = results[hospIndex];
        const prob = count / nSims;
        cumulative += prob;

        if (prob > 0) {
            landingHospitals.push({ name: currentHospitals[hospIndex].name, prob, rank: rank + 1 });
        }

        const tr = document.createElement('tr');
        if (prob === 0) tr.classList.add('zero-prob');
        const pct = (prob * 100).toFixed(1);
        const cumPct = (cumulative * 100).toFixed(1);
        const fillPct = prob > 0 ? Math.max(prob * 100, 1.2) : 0;
        const padded = String(rank + 1).padStart(2, '0');
        tr.innerHTML = `
            <td class="num">${padded}</td>
            <td>${currentHospitals[hospIndex].name}</td>
            <td>
                <div class="bar">
                    <div class="bar-track"></div>
                    <div class="bar-fill" style="width: ${fillPct}%"></div>
                </div>
            </td>
            <td class="num">${pct}%</td>
            <td class="num">${cumPct}%</td>
        `;
        body.appendChild(tr);
    });

    const top = landingHospitals[0];
    const topProb = top ? `${(top.prob * 100).toFixed(1)}%` : '—';
    const topName = top ? top.name : 'None';
    const topPref = currentHospitals[userPrefs[0]];
    const topPrefProb = (results[userPrefs[0]] / nSims) * 100;
    const modeLabel = applicationMode === 'joint' ? 'Joint draw' : 'Solo draw';

    summary.innerHTML = `
        <div class="stat is-accent">
            <span class="label">Most likely posting</span>
            <span class="value">${topName}<small>${topProb} probability</small></span>
        </div>
        <div class="stat">
            <span class="label">Reachable hospitals</span>
            <span class="value">${landingHospitals.length}<small>of ${userPrefs.length} ranked</small></span>
        </div>
        <div class="stat">
            <span class="label">Top preference · ${topPref.name}</span>
            <span class="value">${topPrefProb.toFixed(1)}%<small>chance of first choice</small></span>
        </div>
        <div class="stat">
            <span class="label">${modeLabel}</span>
            <span class="value">${nSims.toLocaleString()}<small>trials cast</small></span>
        </div>
    `;

    section.scrollIntoView({ behavior: 'smooth' });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderUI();
    renderModeSwitch();
    document.getElementById('run-btn').addEventListener('click', runSimulation);
    document.querySelectorAll('.mode-option').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
});
