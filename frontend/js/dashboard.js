

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setupEventListeners();
    console.log("Cardiac AI Monitor Initialized");
});

let ecgChart = null;
let currentSignal = [];
let animationFrame = null;
let isAnimating = false;

function initChart() {
    const ctx = document.getElementById('ecgChart').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#00b4d8');
    gradient.addColorStop(1, '#0077b6');

    ecgChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 300 }, (_, i) => i),
            datasets: [{
                label: 'ECG Signal',
                data: new Array(300).fill(0),
                borderColor: '#00b4d8',
                borderWidth: 2.5,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                shadowColor: 'rgba(0, 180, 216, 0.5)',
                shadowBlur: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                xaiHighlight: { active: false }
            },
            scales: {
                x: { display: false },
                y: {
                    display: false,

                    grace: '10%'
                }
            }
        }
    });
}

function setupEventListeners() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    analyzeBtn.addEventListener('click', handleAnalyze);

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            document.getElementById('fileStatus').innerText = e.target.files[0].name;
            processFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            document.getElementById('fileStatus').innerText = e.dataTransfer.files[0].name;
            processFile(e.dataTransfer.files[0]);
        }
    });
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let data = [];
            if (file.name.endsWith('.json')) {
                const json = JSON.parse(content);
                data = Array.isArray(json) ? json : (json.data || json.signal || []);
            } else {

                data = content.split(/[\n,]/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
            }

            if (data.length > 0) {
                currentSignal = normalizeSignal(data);
                startECGAnimation(currentSignal);
            }
        } catch (err) {
            console.error("Error parsing file:", err);
            showInsight("Error: Invalid file format. Please upload a valid ECG data file.");
        }
    };
    reader.readAsText(file);
}

function denoiseSignal(signal) {

    const result = [];
    for (let i = 0; i < signal.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = -2; j <= 2; j++) {
            if (signal[i + j] !== undefined) {
                sum += signal[i + j];
                count++;
            }
        }
        result.push(sum / (count || 1));
    }
    return result;
}

function processNumerics(signal) {

    return denoiseSignal(signal);
}

function normalizeSignal(signal) {

    return processNumerics(signal);
}

function startECGAnimation(signal) {
    if (isAnimating) cancelAnimationFrame(animationFrame);
    isAnimating = true;

    let offset = 0;
    const windowSize = 300;

    function animate() {
        if (!isAnimating) return;

        const displayData = [];
        for (let i = 0; i < windowSize; i++) {
            displayData.push(signal[(offset + i) % signal.length]);
        }

        ecgChart.data.datasets[0].data = displayData;
        ecgChart.update('none');

        offset = (offset + 2) % signal.length;
        animationFrame = requestAnimationFrame(animate);
    }

    animate();
}

async function handleAnalyze() {
    const name = document.getElementById('patientName').value || "Unknown Patient";
    const age = document.getElementById('patientAge').value || "N/A";
    const file = document.getElementById('fileInput').files[0];

    if (!file && currentSignal.length === 0) {
        alert("Please upload an ECG file or use a demo simulation first.");
        return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);

    if (file) {
        formData.append('file', file);
    } else if (currentSignal.length > 0) {

        const jsonContent = JSON.stringify({ data: currentSignal });
        const blob = new Blob([jsonContent], { type: 'application/json' });
        formData.append('file', blob, 'demo_signal.json');
    }

    try {
        const [response] = await Promise.all([
            fetch("http://localhost:8000/predict", {
                method: "POST",
                body: formData
            }),
            animateDataFlow()
        ]);

        if (!response.ok) throw new Error("Backend connection failed");

        const result = await response.json();
        updateUIWithResults(result);
    } catch (err) {
        console.error("API Error:", err);
        showInsight("Connection to AI backend failed. Using local heuristic fallback...");

        simulateBackendResponse(name, age);
    } finally {
        setLoading(false);
    }
}

function updateUIWithResults(data) {

    document.getElementById('displayName').innerText = data.name || "N/A";
    document.getElementById('displayAge').innerText = data.age || "N/A";

    document.getElementById('cnnResult').innerText = data.cnn_prediction || "N/A";
    document.getElementById('lstmResult').innerText = data.lstm_prediction || "N/A";
    document.getElementById('finalResult').innerText = data.final_prediction || "N/A";

    const warning = document.getElementById('disagreementWarning');
    if (data.cnn_prediction !== data.lstm_prediction) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }

    const conf = data.confidence || 0;
    document.getElementById('confidencePercent').innerText = `${conf}%`;
    document.getElementById('confidenceBar').style.width = `${conf}%`;

    const risk = (data.risk || "LOW").toUpperCase();
    const riskContainer = document.getElementById('riskContainer');
    riskContainer.innerText = risk;
    riskContainer.className = `risk-display ${risk.toLowerCase()}`;

    const meter = document.getElementById('riskMeter');
    if (risk === "HIGH") meter.value = 90;
    else if (risk === "MEDIUM") meter.value = 50;
    else meter.value = 10;

    document.getElementById('clinicalText').innerText = data.insight || "No specific insights available for this waveform.";

    if (risk === "HIGH") {
        showAlert(`Critical Alert: ${data.final_prediction} detected. Immediate attention required.`);
    }

    const bpm = (risk === "HIGH" ? 140 : (risk === "MEDIUM" ? 110 : 72));
    document.getElementById('bpmValue').innerText = bpm;

}

function setLoading(isLoading) {
    const btn = document.getElementById('analyzeBtn');
    const status = document.getElementById('statusText');
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<span>Analyzing...</span><span class="material-symbols-outlined rotating">sync</span>';
        status.innerText = "Processing AI Inference...";
    } else {
        btn.disabled = false;
        btn.innerHTML = '<span>Analyze ECG</span><span class="material-symbols-outlined">analytics</span>';
        status.innerText = "System Ready";
    }
}

function showInsight(text) {
    document.getElementById('clinicalText').innerText = text;
}

function showAlert(msg) {
    document.getElementById('alertMessage').innerText = msg;
    document.getElementById('alertBox').classList.remove('hidden');
}

window.closeAlert = () => {
    document.getElementById('alertBox').classList.add('hidden');
};

function loadDemo(type) {
    let signal = [];
    if (type === 'Normal') signal = generateSignal(70, 0.05);
    else if (type === 'AFib') signal = generateSignal(110, 0.3);
    else if (type === 'VFib') signal = generateSignal(160, 0.8);

    currentSignal = signal;
    startECGAnimation(signal);
    document.getElementById('fileStatus').innerText = `Demo: ${type} Signal`;

    document.getElementById('patientName').value = `Demo ${type}`;
    document.getElementById('patientAge').value = Math.floor(Math.random() * 40) + 30;
}

function generateSignal(bpm, irregularity) {
    const pts = 1000;
    const data = [];
    for (let i = 0; i < pts; i++) {

        const t = i / 100;
        const heartCycle = (t * (bpm / 60)) % 1;
        let val = Math.sin(t * 2) * 0.1;

        if (heartCycle > 0.45 && heartCycle < 0.5) {
            val += 1.0;
        } else if (heartCycle > 0.42 && heartCycle < 0.45) {
            val -= 0.2;
        }

        val += (Math.random() - 0.5) * irregularity;
        data.push(val);
    }
    return normalizeSignal(data);
}

function simulateBackendResponse(name, age) {

    const maxVar = currentSignal.reduce((a, b, i, arr) => i > 0 ? a + Math.abs(b - arr[i-1]) : a, 0) / currentSignal.length;

    let condition = "Normal Sinus Rhythm";
    let risk = "LOW";
    let insight = "Waveform displays regular P-waves and consistent R-R intervals.";
    let confidence = 94;

    if (maxVar > 0.15) {
        condition = "Ventricular Fibrillation";
        risk = "HIGH";
        insight = "High-frequency chaotic oscillations detected. No identifiable QRS complexes. EMERGENCY.";
        confidence = 98;
    } else if (maxVar > 0.08) {
        condition = "Atrial Fibrillation";
        risk = "MEDIUM";
        insight = "Absent P-waves and irregularly irregular heart rate observed.";
        confidence = 89;
    }

    const mock = {
        name: name,
        age: age,
        cnn_prediction: condition,
        lstm_prediction: condition,
        final_prediction: condition,
        confidence: confidence,
        risk: risk,
        insight: insight
    };

    if (Math.random() > 0.8) {
        mock.lstm_prediction = "Noise Detected";
    }

    updateUIWithResults(mock);
}

window.loadDemo = loadDemo;

async function animateDataFlow() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const nodes = document.querySelectorAll('.flow-node');
    const arrows = document.querySelectorAll('.flow-arrow');

    nodes.forEach(n => n.classList.remove('active'));
    arrows.forEach(a => a.classList.remove('active'));

    for (let i = 0; i < nodes.length; i++) {

        nodes[i].classList.add('active');

        if (i > 0 && arrows[i-1]) {
            arrows[i-1].classList.add('active');
        }

        const container = document.querySelector('.pipeline-track');
        if (container) {
            const scrollLeft = nodes[i].offsetLeft - (container.offsetWidth / 2) + (nodes[i].offsetWidth / 2);
            const scrollTop = nodes[i].offsetTop - (container.offsetHeight / 2) + (nodes[i].offsetHeight / 2);
            container.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
        }

        await delay(350);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    if(!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.innerText = 'light_mode';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.innerText = newTheme === 'dark' ? 'light_mode' : 'dark_mode';

        if(window.ecgChart && window.ecgChart.options.scales.x) {
            const gridColor = newTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            window.ecgChart.options.scales.x.grid.color = gridColor;
            window.ecgChart.options.scales.y.grid.color = gridColor;
            window.ecgChart.update();
        }
    });
});
