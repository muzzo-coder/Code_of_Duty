/**
 * Cardiac AI Monitor - Clinical Dashboard
 * ECG Analysis, Signal Processing, UI Updates
 */

// ========== ECG SIGNAL GENERATORS ==========
function generateNormalECG(points = 550) {
    const data = [];
    for (let i = 0; i < points; i++) {
        const t = i * 0.04;
        const mod = t % 1.0;
        let val = 0;
        if (mod < 0.08) val = 0.12 + Math.sin(mod * 55) * 0.08;
        else if (mod < 0.16) val = -0.03;
        else if (mod < 0.24) val = 0.95 * Math.sin((mod - 0.16) * 38) + 0.15;
        else if (mod < 0.32) val = -0.28;
        else if (mod < 0.40) val = 0.12;
        else val = -0.02 + Math.sin(mod * 12) * 0.04;
        data.push(val + (Math.random() - 0.5) * 0.02);
    }
    return data;
}

function generateAFibECG(points = 550) {
    const data = [];
    for (let i = 0; i < points; i++) {
        const irregular = Math.random() > 0.72 ? 0.45 : 0;
        let val = 0.18 * Math.sin(i * 0.12) + irregular * 0.3 + (Math.random() - 0.5) * 0.12;
        if (Math.random() > 0.97) val += 0.65;
        data.push(Math.min(1.2, Math.max(-0.85, val)));
    }
    return data;
}

function generateVFibECG(points = 550) {
    const data = [];
    for (let i = 0; i < points; i++) {
        const chaotic = Math.sin(i * 0.95) * 0.45 + Math.sin(i * 2.7) * 0.4 + (Math.random() - 0.5) * 0.55;
        data.push(Math.min(1.3, Math.max(-1.1, chaotic)));
    }
    return data;
}

// ========== AI ANALYSIS ENGINE ==========
function analyzeSignal(signal) {
    if (!signal || signal.length < 40) {
        return { 
            condition: "Normal", 
            confidence: 70, 
            risk: "Low", 
            insight: "Insufficient data, review manually." 
        };
    }
    
    const rms = Math.sqrt(signal.reduce((s, v) => s + v * v, 0) / signal.length);
    const maxVal = Math.max(...signal);
    let variability = 0;
    for (let i = 1; i < signal.length; i++) {
        variability += Math.abs(signal[i] - signal[i - 1]);
    }
    variability /= signal.length;
    
    if (maxVal > 1.05 && variability > 0.48) {
        return {
            condition: "Ventricular Fibrillation",
            confidence: 94,
            risk: "High",
            insight: "Rapid chaotic oscillations — defibrillation indicated immediately."
        };
    } else if (variability > 0.29 && rms < 0.27) {
        return {
            condition: "Atrial Fibrillation",
            confidence: 89,
            risk: "Medium",
            insight: "Irregular rhythm, absent P waves. Anticoagulation consult advised."
        };
    } else {
        return {
            condition: "Normal",
            confidence: 96,
            risk: "Low",
            insight: "Sinus rhythm with normal P-QRS-T complexes."
        };
    }
}

// ========== GLOBAL STATE ==========
let ecgChart = null;
let currentSignal = [];
let currentAnalysis = null;
let historyReports = [];

// ========== CHART RENDERING ==========
function renderECG(data) {
    const ctx = document.getElementById('ecgCanvas').getContext('2d');
    
    if (ecgChart) {
        ecgChart.data.datasets[0].data = data;
        ecgChart.update('none');
    } else {
        ecgChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: data.length }, (_, i) => i),
                datasets: [{
                    label: 'ECG (mV)',
                    data: data,
                    borderColor: '#006d77',
                    borderWidth: 2.2,
                    tension: 0.2,
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    zoom: {
                        pan: { enabled: true, mode: 'x' },
                        zoom: { wheel: { enabled: true }, mode: 'x' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Amplitude: ${ctx.raw.toFixed(2)} mV`
                        }
                    }
                },
                scales: {
                    y: { min: -1.3, max: 1.5, grid: { color: '#dee9f2' } },
                    x: { grid: { color: '#dee9f2' } }
                }
            }
        });
    }
}

// ========== UI UPDATE FUNCTIONS ==========
function updateUI(analysis, patientName, patientAge) {
    const cond = analysis.condition;
    const conf = analysis.confidence;
    
    // Diagnosis text
    const diagnosisEl = document.getElementById("diagnosisText");
    diagnosisEl.innerHTML = cond;
    
    const colorMap = {
        "Normal": "#1e7b4a",
        "Atrial Fibrillation": "#c26b1a",
        "Ventricular Fibrillation": "#c72a1f"
    };
    diagnosisEl.style.color = colorMap[cond] || "#1a2c3e";
    
    // Badge
    const badgeMap = {
        "Normal": '<span class="risk-badge risk-low">✅ Regular rhythm</span>',
        "Atrial Fibrillation": '<span class="risk-badge risk-medium">⚠️ Arrhythmia</span>',
        "Ventricular Fibrillation": '<span class="risk-badge risk-high">🚨 Critical rhythm</span>'
    };
    document.getElementById("diagnosisBadge").innerHTML = badgeMap[cond] || "";
    
    // Confidence
    document.getElementById("confidencePercent").innerHTML = `${conf}%`;
    document.getElementById("confidenceFill").style.width = `${conf}%`;
    
    // Risk
    const riskMap = {
        "Low": '<span class="risk-badge risk-low">⬇️ Low Risk</span>',
        "Medium": '<span class="risk-badge risk-medium">⚠️ Medium Risk</span>',
        "High": '<span class="risk-badge risk-high">🚨 High Risk — Urgent</span>'
    };
    document.getElementById("riskContainer").innerHTML = riskMap[analysis.risk] || '<span>—</span>';
    
    // Clinical insight
    document.getElementById("clinicalText").innerHTML = analysis.insight;
    
    // HR value based on condition
    const hrMap = { 
        "Normal": 72, 
        "Atrial Fibrillation": 110, 
        "Ventricular Fibrillation": 145 
    };
    document.getElementById("hrValue").innerHTML = hrMap[cond] || 72;
    
    // Critical alert for High Risk
    if (analysis.risk === "High" || cond === "Ventricular Fibrillation") {
        const msg = patientName ? `${patientName}: High Risk Detected` : "High Risk Detected – Immediate Attention Required";
        document.getElementById("toastMessage").innerText = msg;
        document.getElementById("criticalToast").style.display = "flex";
        setTimeout(() => {
            document.getElementById("criticalToast").style.display = "none";
        }, 6000);
    }
}

// ========== HISTORY MANAGEMENT ==========
function addToHistory(analysis, signalCopy, patientName, patientAge) {
    const name = patientName?.trim() || "Anonymous";
    const age = patientAge ? parseInt(patientAge) : "—";
    const date = new Date().toLocaleString();
    
    historyReports.unshift({
        patientName: name,
        patientAge: age,
        date: date,
        prediction: analysis.condition,
        confidence: analysis.confidence,
        signal: [...signalCopy],
        analysisCopy: { ...analysis }
    });
    
    if (historyReports.length > 8) historyReports.pop();
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById("historyBody");
    
    if (!historyReports.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No previous reports — upload ECG to start</td></tr>';
        return;
    }
    
    tbody.innerHTML = "";
    
    historyReports.forEach(item => {
        const row = tbody.insertRow();
        row.classList.add("history-row");
        
        row.insertCell(0).innerHTML = `<span class="font-medium">${escapeHtml(item.patientName)}</span>`;
        row.insertCell(1).innerHTML = item.patientAge !== "—" ? `${item.patientAge} yrs` : "—";
        row.insertCell(2).innerHTML = `<span class="date-text">${escapeHtml(item.date)}</span>`;
        
        let colorClass = "";
        if (item.prediction === "Normal") colorClass = "text-green-700";
        else if (item.prediction === "Atrial Fibrillation") colorClass = "text-amber-700";
        else colorClass = "text-red-700";
        
        row.insertCell(3).innerHTML = `<span class="prediction-text ${colorClass}">${escapeHtml(item.prediction)}</span>`;
        row.insertCell(4).innerHTML = `${item.confidence}%`;
        
        // Click to reload from history
        row.addEventListener("click", () => {
            if (item.signal) {
                currentSignal = [...item.signal];
                currentAnalysis = { ...item.analysisCopy };
                renderECG(currentSignal);
                updateUI(currentAnalysis, item.patientName, item.patientAge);
                
                // Update form fields
                if (item.patientName !== "Anonymous") {
                    document.getElementById("patientName").value = item.patientName;
                }
                if (item.patientAge !== "—") {
                    document.getElementById("patientAge").value = item.patientAge;
                }
                
                // Update file display
                document.getElementById("fileNameDisplay").innerHTML = `<span>📋 Loaded: ${escapeHtml(item.patientName)} (${item.date})</span>`;
            }
        });
    });
}

// Helper function to prevent XSS
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== FILE PROCESSING ==========
function processECG(file, fileData, patientName, patientAge) {
    // Show loader
    document.getElementById("loaderOverlay").style.display = "flex";
    document.getElementById("statusText").innerHTML = "PROCESSING";
    const statusLed = document.getElementById("statusLed");
    statusLed.classList.add("warning");
    statusLed.classList.remove("error");
    
    setTimeout(() => {
        try {
            let signalArray = [];
            
            if (file.name.endsWith('.csv')) {
                const lines = fileData.split(/\r?\n/);
                signalArray = lines
                    .filter(l => l.trim().length > 0 && !isNaN(parseFloat(l)))
                    .map(l => parseFloat(l));
            } else if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(fileData);
                signalArray = Array.isArray(parsed) ? parsed : (parsed.data || parsed.values || []);
            }
            
            if (!signalArray.length || signalArray.length < 30) {
                throw new Error("Invalid data: need at least 30 data points");
            }
            
            // Normalize signal
            const maxAbs = Math.max(...signalArray.map(v => Math.abs(v)), 0.2);
            const normalized = signalArray.map(v => (v / maxAbs) * 0.95);
            let finalSignal = normalized.slice(0, 600);
            
            if (finalSignal.length < 100) {
                finalSignal.push(...generateNormalECG(120));
            }
            
            currentSignal = finalSignal;
            const analysis = analyzeSignal(finalSignal);
            currentAnalysis = analysis;
            
            renderECG(currentSignal);
            updateUI(analysis, patientName, patientAge);
            addToHistory(analysis, currentSignal, patientName, patientAge);
            
            // Update file display
            document.getElementById("fileNameDisplay").innerHTML = `<span>✅ ${escapeHtml(file.name)} · analyzed</span>`;
            
        } catch (err) {
            console.error("Processing error:", err);
            document.getElementById("clinicalText").innerHTML = "Error parsing file. Use CSV with numeric values or JSON array.";
            document.getElementById("statusText").innerHTML = "ERROR";
            statusLed.classList.add("error");
            statusLed.classList.remove("warning");
            
            // Fallback to normal ECG
            const fallback = generateNormalECG(500);
            currentSignal = fallback;
            renderECG(fallback);
            
            setTimeout(() => {
                document.getElementById("statusText").innerHTML = "CONNECTED";
                statusLed.classList.remove("error", "warning");
            }, 2000);
        } finally {
            setTimeout(() => {
                document.getElementById("loaderOverlay").style.display = "none";
                if (document.getElementById("statusText").innerHTML !== "ERROR") {
                    document.getElementById("statusText").innerHTML = "CONNECTED";
                    statusLed.classList.remove("warning", "error");
                }
            }, 500);
        }
    }, 800);
}

function handleFileUpload(file) {
    if (!file) return;
    
    const patientName = document.getElementById("patientName").value;
    const patientAge = document.getElementById("patientAge").value;
    
    const reader = new FileReader();
    reader.onload = (e) => processECG(file, e.target.result, patientName, patientAge);
    reader.readAsText(file);
}

function closeAlert() {
    document.getElementById("criticalToast").style.display = "none";
}

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");
    const analyzeBtn = document.getElementById("analyzeBtn");
    
    // Click to upload
    uploadZone.addEventListener("click", () => fileInput.click());
    
    // Analyze button
    analyzeBtn.addEventListener("click", () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        } else {
            alert("Please select an ECG file first.");
        }
    });
    
    // File input change
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) {
            const fileName = e.target.files[0].name;
            document.getElementById("fileNameDisplay").innerHTML = `<span>📄 ${escapeHtml(fileName)}</span>`;
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("drag-over");
    });
    
    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("drag-over");
    });
    
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("drag-over");
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
                fileInput.files = e.dataTransfer.files;
                document.getElementById("fileNameDisplay").innerHTML = `<span>📄 ${escapeHtml(file.name)}</span>`;
                handleFileUpload(file);
            } else {
                alert("Please upload CSV or JSON file only.");
            }
        }
    });
    
    // Initialize with normal ECG demo
    const defaultSignal = generateNormalECG(550);
    currentSignal = defaultSignal;
    const defaultAnalysis = analyzeSignal(defaultSignal);
    currentAnalysis = defaultAnalysis;
    
    renderECG(defaultSignal);
    updateUI(defaultAnalysis, "", "");
    
    // Set initial status
    document.getElementById("statusText").innerHTML = "CONNECTED";
    document.getElementById("statusLed").classList.remove("warning", "error");
    
    // Initialize empty history
    historyReports = [];
    renderHistoryTable();
});

// Make closeAlert available globally
window.closeAlert = closeAlert;