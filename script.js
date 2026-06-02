/**
 * QLD Health Intern Ballot Simulation - Web Implementation
 * Ported from simulation.py
 */

// Historical baseline (e.g., last year's first-preference counts).
// Keep these as the stable reference data for the "historical" preset.
const HOSPITALS = [
    { name: "Greenslopes Private Hospital", capacity: 12, applicants: 6, region: "SEQ" },
    { name: "Sunshine Coast University Hospital", capacity: 64, applicants: 83, region: "SEQ" },
    { name: "Toowoomba Hospital", capacity: 57, applicants: 34, region: "West" },
    { name: "The Prince Charles Hospital", capacity: 50, applicants: 30, region: "SEQ" },
    { name: "Bundaberg Hospital", capacity: 6, applicants: 5, region: "Central" },
    { name: "Princess Alexandra Hospital", capacity: 82, applicants: 114, region: "SEQ" },
    { name: "Cairns Hospital", capacity: 54, applicants: 54, region: "North" },
    { name: "Redcliffe Hospital", capacity: 28, applicants: 10, region: "SEQ" },
    { name: "Townsville University Hospital", capacity: 71, applicants: 33, region: "North" },
    { name: "Mt Isa Hospital", capacity: 2, applicants: 1, region: "West" },
    { name: "Royal Brisbane and Women's Hospital", capacity: 94, applicants: 122, region: "SEQ" },
    { name: "Redland Hospital", capacity: 15, applicants: 14, region: "SEQ" },
    { name: "Logan Hospital", capacity: 45, applicants: 56, region: "SEQ" },
    { name: "Gold Coast Hospital", capacity: 92, applicants: 162, region: "SEQ" },
    { name: "Mater Health Services", capacity: 18, applicants: 18, region: "SEQ" },
    { name: "Queen Elizabeth II Jubilee Hospital", capacity: 22, applicants: 13, region: "SEQ" },
    { name: "Mackay Base Hospital", capacity: 28, applicants: 2, region: "North" },
    { name: "Caboolture Hospital", capacity: 23, applicants: 3, region: "SEQ" },
    { name: "Hervey Bay Hospital", capacity: 8, applicants: 4, region: "Central" },
    { name: "Ipswich Hospital", capacity: 45, applicants: 18, region: "SEQ" },
    { name: "Rockhampton Base Hospital", capacity: 50, applicants: 2, region: "Central" }
];

// Geography weights derived from approximate hospital coordinates.
// Each row is the "from" hospital; each column is the destination hospital.
// Values are precomputed multipliers based on distance decay to avoid runtime math.
// Source coordinates were drawn from public references (OSM/Wikipedia).
// Weight formula used for the matrix: 1 + 2 * exp(-distance_km / 400).
const GEO_WEIGHT_MATRIX = [
    [
        3,
        2.6156,
        2.5237,
        2.9315,
        1.9391,
        2.9901,
        1.061,
        2.8454,
        1.1236,
        1.0398,
        2.9631,
        2.8998,
        2.903,
        2.7227,
        2.9828,
        2.9739,
        1.2639,
        2.7712,
        2.0781,
        2.8524,
        1.5369
    ],
    [
        2.6156,
        3,
        2.3834,
        2.6708,
        2.1457,
        2.6212,
        1.072,
        2.7497,
        1.1447,
        1.0428,
        2.644,
        2.5999,
        2.5472,
        2.4184,
        2.627,
        2.5946,
        1.3135,
        2.8094,
        2.3284,
        2.5455,
        1.6366
    ],
    [
        2.5237,
        2.3834,
        3,
        2.5256,
        1.9381,
        2.5282,
        1.0695,
        2.4792,
        1.1419,
        1.0503,
        2.5282,
        2.4488,
        2.4873,
        2.3817,
        2.5294,
        2.5235,
        1.2932,
        2.5026,
        2.0256,
        2.6355,
        1.5904
    ],
    [
        2.9315,
        2.6708,
        2.5256,
        3,
        1.9723,
        2.9396,
        1.063,
        2.9042,
        1.1275,
        1.0406,
        2.9675,
        2.864,
        2.8399,
        2.6679,
        2.9469,
        2.9064,
        1.2727,
        2.834,
        2.1162,
        2.8254,
        1.5547
    ],
    [
        1.9391,
        2.1457,
        1.9381,
        1.9723,
        3,
        1.9433,
        1.1226,
        2.0099,
        1.2433,
        1.0614,
        1.9568,
        1.9196,
        1.8949,
        1.8149,
        1.947,
        1.9271,
        1.5362,
        2.0601,
        2.6858,
        1.9243,
        2.0716
    ],
    [
        2.9901,
        2.6212,
        2.5282,
        2.9396,
        1.9433,
        3,
        1.0613,
        2.8511,
        1.1242,
        1.04,
        2.9717,
        2.8813,
        2.8686,
        2.6924,
        2.9791,
        2.9378,
        1.2687,
        2.8043,
        2.0981,
        2.8436,
        1.5466
    ],
    [
        1.061,
        1.072,
        1.0695,
        1.063,
        1.1226,
        1.0613,
        3,
        1.0646,
        1.9745,
        1.2811,
        1.0621,
        1.0589,
        1.0581,
        1.0526,
        1.0616,
        1.0604,
        1.4573,
        1.0682,
        1.1035,
        1.0619,
        1.2261
    ],
    [
        2.8454,
        2.7497,
        2.4792,
        2.9042,
        2.0099,
        2.8511,
        1.0646,
        3,
        1.1305,
        1.0406,
        2.8758,
        2.8202,
        2.768,
        2.6137,
        2.8572,
        2.8218,
        1.2804,
        2.8958,
        2.1645,
        2.7418,
        1.5704
    ],
    [
        1.1236,
        1.1447,
        1.1419,
        1.1275,
        1.2433,
        1.1242,
        1.9745,
        1.1305,
        3,
        1.288,
        1.1258,
        1.1192,
        1.1177,
        1.1065,
        1.1247,
        1.1223,
        1.8944,
        1.1377,
        1.2051,
        1.1257,
        1.4527
    ],
    [
        1.0398,
        1.0428,
        1.0503,
        1.0406,
        1.0614,
        1.04,
        1.2811,
        1.0406,
        1.288,
        3,
        1.0403,
        1.0379,
        1.0382,
        1.035,
        1.0401,
        1.0395,
        1.1624,
        1.0426,
        1.0527,
        1.0418,
        1.1071
    ],
    [
        2.9631,
        2.644,
        2.5282,
        2.9675,
        1.9568,
        2.9717,
        1.0621,
        2.8758,
        1.1258,
        1.0403,
        3,
        2.8813,
        2.8686,
        2.6924,
        2.9791,
        2.9378,
        1.2687,
        2.8043,
        2.0981,
        2.8436,
        1.5466
    ],
    [
        2.8998,
        2.5999,
        2.4488,
        2.864,
        1.9196,
        2.8925,
        1.0589,
        2.8202,
        1.1192,
        1.0379,
        2.8813,
        3,
        2.9117,
        2.7723,
        2.8888,
        2.9017,
        1.2555,
        2.7282,
        2.0627,
        2.7678,
        1.5197
    ],
    [
        2.903,
        2.5472,
        2.4873,
        2.8399,
        1.8949,
        2.8937,
        1.0581,
        2.768,
        1.1177,
        1.0382,
        2.8686,
        2.9117,
        3,
        2.8099,
        2.8866,
        2.9249,
        1.2511,
        2.6884,
        2.0296,
        2.8183,
        1.5109
    ],
    [
        2.7227,
        2.4184,
        2.3817,
        2.6679,
        1.8149,
        2.7142,
        1.0526,
        2.6137,
        1.1065,
        1.035,
        2.6924,
        2.7723,
        2.8099,
        3,
        2.7079,
        2.742,
        1.2274,
        2.5345,
        1.9422,
        2.6705,
        1.4626
    ],
    [
        2.9828,
        2.627,
        2.5294,
        2.9469,
        1.947,
        2.9923,
        1.0616,
        2.8572,
        1.1247,
        1.0401,
        2.9791,
        2.8888,
        2.8866,
        2.7079,
        3,
        2.958,
        1.2662,
        2.7855,
        2.0866,
        2.8535,
        1.5416
    ],
    [
        2.9739,
        2.5946,
        2.5235,
        2.9064,
        1.9271,
        2.9655,
        1.0604,
        2.8218,
        1.1223,
        1.0395,
        2.9378,
        2.9017,
        2.9249,
        2.742,
        2.958,
        3,
        1.2609,
        2.7482,
        2.064,
        2.8588,
        1.5306
    ],
    [
        1.2639,
        1.3135,
        1.2932,
        1.2727,
        1.5362,
        1.2652,
        1.4573,
        1.2804,
        1.8944,
        1.1624,
        1.2687,
        1.2555,
        1.2511,
        1.2274,
        1.2662,
        1.2609,
        3,
        1.2957,
        1.4525,
        1.2661,
        1.9831
    ],
    [
        2.7712,
        2.8094,
        2.5026,
        2.834,
        2.0601,
        2.7787,
        1.0682,
        2.8958,
        1.1377,
        1.0426,
        2.8043,
        2.7282,
        2.6884,
        2.5345,
        2.7855,
        2.7482,
        1.2957,
        3,
        2.2169,
        2.7081,
        1.6014
    ],
    [
        2.0781,
        2.3284,
        2.0256,
        2.1162,
        2.6858,
        2.0825,
        1.1035,
        2.1645,
        1.2051,
        1.0527,
        2.0981,
        2.0627,
        2.0296,
        1.9422,
        2.0866,
        2.064,
        1.4525,
        2.2169,
        3,
        2.0491,
        1.9034
    ],
    [
        2.8524,
        2.5455,
        2.6355,
        2.8254,
        1.9243,
        2.8549,
        1.0619,
        2.7418,
        1.1257,
        1.0418,
        2.8436,
        2.7678,
        2.8183,
        2.6705,
        2.8535,
        2.8588,
        1.2661,
        2.7081,
        2.0491,
        3,
        1.5406
    ],
    [
        1.5369,
        1.6366,
        1.5904,
        1.5547,
        2.0716,
        1.5395,
        1.2261,
        1.5704,
        1.4527,
        1.1071,
        1.5466,
        1.5197,
        1.5109,
        1.4626,
        1.5416,
        1.5306,
        1.9831,
        1.6014,
        1.9034,
        1.5406,
        3
    ]
];

// NOTE: The GEO_WEIGHT_MATRIX is duplicated in scripts/geo-weight-matrix.js
// and can be regenerated via scripts/generate-geo-matrix.js.

// Initialize application state
let currentHospitals = JSON.parse(JSON.stringify(HOSPITALS));
let userPrefs = []; // Indices into currentHospitals
let applicationMode = 'solo'; // 'joint' = couple (2), 'solo' = single (1)
let fallbackMode = 'raw'; // 'raw', 'sqrt', 'geo', 'combo'

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
                if (h === chosen || counts[h] >= capacities[h]) return 0;

                let baseWeight = firstPrefCounts[h];
                if (fallbackMode === 'sqrt' || fallbackMode === 'combo') {
                    baseWeight = Math.sqrt(baseWeight);
                }

                let multiplier = 1.0;
                if (fallbackMode === 'geo' || fallbackMode === 'combo') {
                    const row = GEO_WEIGHT_MATRIX[chosen];
                    if (row && row[h] !== undefined) {
                        multiplier = row[h];
                    }
                }

                return baseWeight * multiplier;
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

    const chunkSize = 2000;
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
    "Bundaberg Hospital": 3,
    "Caboolture Hospital": 3,
    "Cairns Hospital": 38,
    "Gold Coast Hospital": 89,
    "Greenslopes Private Hospital": 0,
    "Hervey Bay Hospital": 0,
    "Ipswich Hospital": 14,
    "Logan Hospital": 32,
    "Mackay Base Hospital": 3,
    "Mater Health Services": 20,
    "Mt Isa Hospital": 1,
    "Princess Alexandra Hospital": 49,
    "Queen Elizabeth II Jubilee Hospital": 13,
    "Redcliffe Hospital": 7,
    "Redland Hospital": 2,
    "Rockhampton Base Hospital": 3,
    "Royal Brisbane and Women's Hospital": 91,
    "Sunshine Coast University Hospital": 50,
    "The Prince Charles Hospital": 16,
    "Toowoomba Hospital": 36,
    "Townsville University Hospital": 30
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
    localStorage.setItem('readymedygo_fallback', fallbackMode);
    updateURL();
}

function toBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
}

function updateURL() {
    const state = {
        p: userPrefs,
        h: currentHospitals.map(h => h.applicants),
        m: applicationMode,
        f: fallbackMode
    };
    const encoded = toBase64(JSON.stringify(state));
    window.history.replaceState(null, '', `#${encoded}`);
}

function isValidPreferenceOrder(prefList) {
    if (!Array.isArray(prefList)) return false;
    if (prefList.length !== HOSPITALS.length) return false;

    const seen = new Set();
    for (const value of prefList) {
        if (!Number.isInteger(value)) return false;
        if (value < 0 || value >= HOSPITALS.length) return false;
        if (seen.has(value)) return false;
        seen.add(value);
    }

    return true;
}

function isValidApplicantCounts(counts) {
    if (!Array.isArray(counts)) return false;
    if (counts.length !== HOSPITALS.length) return false;

    return counts.every(value => Number.isFinite(value) && value >= 0);
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
        && isValidApplicantCounts(state.h)
        && isValidPreferenceOrder(state.p);

    if (isStateValid) {
        userPrefs = state.p;
        state.h.forEach((apps, i) => {
            currentHospitals[i].applicants = apps;
        });
        if (state.m === 'solo' || state.m === 'joint') {
            applicationMode = state.m;
        }
        if (state.f && ['raw', 'sqrt', 'geo', 'combo'].includes(state.f)) {
            fallbackMode = state.f;
        }
    } else {
        const savedPrefs = localStorage.getItem('readymedygo_userPrefs');
        const savedHospitals = localStorage.getItem('readymedygo_hospitals');
        const savedMode = localStorage.getItem('readymedygo_mode');
        const savedFallback = localStorage.getItem('readymedygo_fallback');

        if (savedHospitals) {
            const parsedHospitals = JSON.parse(savedHospitals);
            if (Array.isArray(parsedHospitals) && parsedHospitals.length === HOSPITALS.length) {
                currentHospitals = parsedHospitals;
            }
        }
        if (savedMode === 'solo' || savedMode === 'joint') {
            applicationMode = savedMode;
        }
        if (savedFallback && ['raw', 'sqrt', 'geo', 'combo'].includes(savedFallback)) {
            fallbackMode = savedFallback;
        }

        if (savedPrefs) {
            const parsedPrefs = JSON.parse(savedPrefs);
            if (isValidPreferenceOrder(parsedPrefs)) {
                userPrefs = parsedPrefs;
            }
        } else {
            resetToDefaults();
            return;
        }
    }
}

function setupPreferenceDragAndDrop() {
    const list = document.getElementById('preference-list');
    if (!list) return;
    if (list.dataset.dragBound === 'true') return;

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });

    // Handle drag drop to update state
    list.addEventListener('drop', () => {
        const items = [...list.querySelectorAll('.sortable-item')];
        userPrefs = items.map(item => parseInt(item.dataset.index, 10));
        saveState();
        renderPreferenceList();
    });

    list.dataset.dragBound = 'true';
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

function setFallback(mode) {
    if (!['raw', 'sqrt', 'geo', 'combo'].includes(mode)) return;
    if (mode === fallbackMode) return;
    fallbackMode = mode;
    saveState();
    renderFallbackSwitch();
    // Hide stale results so the user re-runs against the new mode
    const resultsSection = document.getElementById('results');
    if (resultsSection) resultsSection.style.display = 'none';
    document.getElementById('status-text').innerText = 'Monty shifts his fallback logic. Cast the lots to refresh.';
}

function renderModeSwitch() {
    document.querySelectorAll('.mode-option').forEach(btn => {
        const active = btn.dataset.mode === applicationMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
}

function renderFallbackSwitch() {
    document.querySelectorAll('.fallback-option').forEach(btn => {
        const active = btn.dataset.fallback === fallbackMode;
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
    fallbackMode = 'raw';
    saveState();
    renderUI();
    renderModeSwitch();
    renderFallbackSwitch();
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
    }).catch(() => {
        const status = document.getElementById('status-text');
        const originalText = status.innerText;
        status.innerText = "Monty couldn't seal the link. Please copy from the address bar.";
        setTimeout(() => {
            status.innerText = originalText;
        }, 3000);
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
    setupPreferenceDragAndDrop();
    renderModeSwitch();
    renderFallbackSwitch();
    document.getElementById('run-btn').addEventListener('click', runSimulation);
    document.querySelectorAll('.mode-option').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
    document.querySelectorAll('.fallback-option').forEach(btn => {
        btn.addEventListener('click', () => setFallback(btn.dataset.fallback));
    });
});
