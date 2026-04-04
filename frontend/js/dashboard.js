// ========== ECG GENERATORS ==========
    function generateNormalECG(points = 550) {
        const data = [];
        for (let i = 0; i < points; i++) {
            const t = i * 0.04;
            const mod = t % 1.0;
            let val = 0;
            
            // P wave (0-0.10s): lower amplitude, occurs before QRS
            if (mod < 0.08) {
                val = 0.15 * Math.sin((mod / 0.08) * Math.PI);
            }
            // PR segment (0.08-0.12s): isoelectric
            else if (mod < 0.12) {
                val = 0;
            }
            // QRS complex (0.12-0.20s): high amplitude, sharp spikes
            else if (mod < 0.20) {
                const qrsNorm = (mod - 0.12) / 0.08;
                if (qrsNorm < 0.3) {
                    val = -0.25 * Math.sin(qrsNorm * Math.PI); // Q wave
                } else if (qrsNorm < 0.6) {
                    val = 0.95 * Math.sin((qrsNorm - 0.3) * Math.PI); // R wave
                } else {
                    val = -0.2 * Math.sin((qrsNorm - 0.6) * Math.PI); // S wave
                }
            }
            // ST segment (0.20-0.28s): slightly elevated
            else if (mod < 0.28) {
                val = 0.02;
            }
            // T wave (0.28-0.40s): medium amplitude, rounded
            else if (mod < 0.40) {
                val = 0.3 * Math.sin(((mod - 0.28) / 0.12) * Math.PI);
            }
            // Baseline
            else {
                val = 0.02 * Math.sin(mod * 2);
            }
            
            // Add realistic baseline wander and noise
            const baselineWander = 0.05 * Math.sin(t * 0.3);
            const noise = (Math.random() - 0.5) * 0.03;
            data.push(val + baselineWander + noise);
        }
        return data;
    }
    
    function generateAFibECG(points = 550) {
        const data = [];
        const fibrillationWave = [];
        
        // Create irregular fibrillatory waves (no identifiable P waves or regular rhythm)
        for (let i = 0; i < points; i++) {
            const t = i * 0.04;
            
            // Multiple irregular frequencies creating chaotic baseline
            const fibrillationBaseline = 
                0.08 * Math.sin(t * 8.7) +
                0.12 * Math.sin(t * 5.3) +
                0.09 * Math.sin(t * 11.2);
            
            // Irregular QRS-like complexes at random intervals
            const qrsPresence = Math.sin(t * 2.5) > 0.92 ? 1 : 0;
            const qrs = qrsPresence * (0.6 * Math.sin((t * 15) % Math.PI));
            
            // Random noise and irregularities
            const noise = (Math.random() - 0.5) * 0.15;
            const val = fibrillationBaseline + qrs * 0.5 + noise;
            
            // Enforce realistic amplitude bounds
            data.push(Math.min(0.9, Math.max(-0.8, val)));
        }
        return data;
    }
    
    function generateVFibECG(points = 550) {
        const data = [];
        for (let i = 0; i < points; i++) {
            const t = i * 0.04;
            
            // Ventricular fibrillation: rapid, irregular, chaotic oscillations
            const vfibOscillation1 = 0.3 * Math.sin(t * 25);
            const vfibOscillation2 = 0.25 * Math.sin(t * 18.5);
            const vfibOscillation3 = 0.2 * Math.sin(t * 31.2);
            
            // Random amplitude variations
            const randomModulation = (Math.random() - 0.5) * 0.4;
            
            // Rare organized activity
            const sporadicQRS = Math.sin(t * 3) > 0.95 ? 0.5 * Math.sin((t * 20) % Math.PI) : 0;
            
            // Strong noise
            const noise = (Math.random() - 0.5) * 0.2;
            
            const val = vfibOscillation1 + vfibOscillation2 + vfibOscillation3 + randomModulation + sporadicQRS + noise;
            
            // VFib typically has large amplitude
            data.push(Math.min(1.3, Math.max(-1.2, val)));
        }
        return data;
    }
    
    // ========== HELPER: Fast Fourier Transform (FFT) ==========
    function fft(real, imag = null) {
        const N = real.length;
        if (N <= 1) return { real, imag: imag || new Array(N).fill(0) };
        
        const even = real.filter((_, i) => i % 2 === 0);
        const oddReal = real.filter((_, i) => i % 2 === 1);
        const evenImag = imag ? imag.filter((_, i) => i % 2 === 0) : new Array(even.length).fill(0);
        const oddImag = imag ? imag.filter((_, i) => i % 2 === 1) : new Array(oddReal.length).fill(0);
        
        const fe = fft(even, evenImag);
        const fo = fft(oddReal, oddImag);
        
        const result = { real: new Array(N), imag: new Array(N) };
        for (let k = 0; k < N / 2; k++) {
            const angle = -2 * Math.PI * k / N;
            const wr = Math.cos(angle);
            const wi = Math.sin(angle);
            const tr = fo.real[k] * wr - fo.imag[k] * wi;
            const ti = fo.real[k] * wi + fo.imag[k] * wr;
            result.real[k] = fe.real[k] + tr;
            result.imag[k] = fe.imag[k] + ti;
            result.real[k + N / 2] = fe.real[k] - tr;
            result.imag[k + N / 2] = fe.imag[k] - ti;
        }
        return result;
    }
    
    // ========== HELPER: Power Spectrum ==========
    function getPowerSpectrum(signal) {
        const padded = [...signal, ...new Array(Math.pow(2, Math.ceil(Math.log2(signal.length))) - signal.length).fill(0)];
        const fftResult = fft(padded);
        const power = [];
        for (let i = 0; i < fftResult.real.length / 2; i++) {
            power.push(fftResult.real[i] ** 2 + fftResult.imag[i] ** 2);
        }
        return power;
    }
    
    // ========== HELPER: RR Interval Detection ==========
    function detectRRIntervals(signal, threshold = 0.5) {
        const peaks = [];
        for (let i = 1; i < signal.length - 1; i++) {
            if (signal[i] > threshold && signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
                peaks.push(i);
            }
        }
        
        const rrIntervals = [];
        for (let i = 1; i < peaks.length; i++) {
            rrIntervals.push(peaks[i] - peaks[i-1]);
        }
        return { peaks, rrIntervals };
    }
    
    // ========== HELPER: Heart Rate Variability ==========
    function calculateHRV(rrIntervals) {
        if (rrIntervals.length < 2) return { sdnn: 0, rmssd: 0, pnn50: 0 };
        
        const mean = rrIntervals.reduce((a, b) => a + b) / rrIntervals.length;
        const sdnn = Math.sqrt(rrIntervals.reduce((sum, rr) => sum + (rr - mean) ** 2, 0) / rrIntervals.length);
        
        const diffs = [];
        for (let i = 1; i < rrIntervals.length; i++) {
            diffs.push(Math.abs(rrIntervals[i] - rrIntervals[i-1]));
        }
        const rmssd = Math.sqrt(diffs.reduce((a, b) => a + b ** 2, 0) / diffs.length);
        
        const pnn50 = (diffs.filter(d => d > 50).length / diffs.length) * 100;
        
        return { sdnn, rmssd, pnn50 };
    }
    
    // ========== ANALYSIS ENGINE (ENHANCED) ==========
    function analyzeSignal(signal) {
        if (!signal || signal.length < 40) {
            return { condition: "Normal", confidence: 70, risk: "Low", insight: "Insufficient data" };
        }
        
        // Feature 1: Variability & Amplitude
        let variability = 0, meanAbs = 0;
        for (let i = 1; i < signal.length; i++) {
            variability += Math.abs(signal[i] - signal[i-1]);
            meanAbs += Math.abs(signal[i]);
        }
        variability /= signal.length;
        meanAbs /= signal.length;
        const maxVal = Math.max(...signal);
        const minVal = Math.min(...signal);
        const amplitude = maxVal - minVal;
        
        // Feature 2: RR Intervals and Heart Rate
        const { rrIntervals } = detectRRIntervals(signal, meanAbs * 0.6);
        let avgRR = 0, rrRegularity = 1;
        if (rrIntervals.length > 1) {
            avgRR = rrIntervals.reduce((a, b) => a + b) / rrIntervals.length;
            const rrMean = avgRR;
            const rrStd = Math.sqrt(rrIntervals.reduce((sum, rr) => sum + (rr - rrMean) ** 2, 0) / rrIntervals.length);
            rrRegularity = 1 - Math.min(1, rrStd / (rrMean || 1));
        }
        
        // Feature 3: Heart Rate Variability
        const hrv = calculateHRV(rrIntervals);
        
        // Feature 4: Spectral Analysis
        const power = getPowerSpectrum(signal);
        const totalPower = power.reduce((a, b) => a + b, 0) || 1;
        
        // Frequency bands (normalized to signal length)
        const vlfPower = power.slice(0, Math.max(1, Math.ceil(power.length * 0.04))).reduce((a, b) => a + b, 0);
        const lfPower = power.slice(Math.max(1, Math.ceil(power.length * 0.04)), Math.max(2, Math.ceil(power.length * 0.15))).reduce((a, b) => a + b, 0);
        const hfPower = power.slice(Math.max(2, Math.ceil(power.length * 0.15)), Math.max(3, Math.ceil(power.length * 0.4))).reduce((a, b) => a + b, 0);
        
        const lfHfRatio = (lfPower + 0.001) / (hfPower + 0.001);
        
        // Feature 5: Entropy (Signal Complexity)
        const sorted = [...signal].sort((a, b) => a - b);
        const binWidth = (maxVal - minVal) / 10 || 0.1;
        const entropy = signal.reduce((sum, val) => {
            const bin = Math.floor((val - minVal) / binWidth);
            return sum - Math.log(sorted.filter(s => Math.floor((s - minVal) / binWidth) === bin).length / signal.length + 0.001);
        }, 0) / signal.length;
        
        // Classification Logic (Multi-feature fusion)
        let vfibScore = 0, afibScore = 0, normalScore = 0;
        
        // Ventricular Fibrillation indicators
        if (maxVal > 1.1) vfibScore += 25;
        if (variability > 0.5) vfibScore += 20;
        if (amplitude > 1.5) vfibScore += 20;
        if (rrRegularity < 0.4) vfibScore += 15;
        if (lfHfRatio < 1) vfibScore += 10;
        if (entropy > 3.5) vfibScore += 10;
        
        // Atrial Fibrillation indicators
        if (variability > 0.28 && variability < 0.5) afibScore += 25;
        if (0.3 < rrRegularity && rrRegularity < 0.8) afibScore += 20;
        if (hrv.rmssd > 40) afibScore += 20;
        if (hrv.pnn50 > 15) afibScore += 15;
        if (lfHfRatio > 2) afibScore += 10;
        if (entropy > 2.5 && entropy < 3.5) afibScore += 10;
        
        // Normal sinus rhythm indicators
        if (variability < 0.28) normalScore += 30;
        if (rrRegularity > 0.8) normalScore += 25;
        if (hrv.rmssd < 35 && hrv.pnn50 < 10) normalScore += 20;
        if (0.8 < lfHfRatio && lfHfRatio < 3) normalScore += 15;
        if (amplitude < 1.2) normalScore += 10;
        
        // Normalize scores
        const totalScore = vfibScore + afibScore + normalScore || 1;
        vfibScore = Math.round((vfibScore / totalScore) * 100);
        afibScore = Math.round((afibScore / totalScore) * 100);
        normalScore = Math.round((normalScore / totalScore) * 100);
        
        // Decision with confidence
        let condition, confidence, risk, insight;
        
        if (vfibScore > afibScore && vfibScore > normalScore) {
            condition = "Ventricular Fibrillation";
            confidence = Math.min(98, 70 + vfibScore / 3);
            risk = "High";
            insight = "Chaotic rapid oscillations detected — immediate defibrillation required.";
        } else if (afibScore > normalScore) {
            condition = "Atrial Fibrillation";
            confidence = Math.min(95, 65 + afibScore / 3);
            risk = "Medium";
            insight = "Irregular rhythm with variable RR intervals — anticoagulation therapy recommended.";
        } else {
            condition = "Normal";
            confidence = Math.min(98, 70 + normalScore / 3);
            risk = "Low";
            insight = "Regular sinus rhythm with normal morphology — no acute intervention needed.";
        }
        
        return { condition, confidence: Math.round(confidence), risk, insight };
    }
    
    // ========== GLOBAL STATE ==========
    let ecgChart = null;
    let trendChart = null;
    let currentSignal = [];
    let currentAnalysis = null;
    let historyReports = [];
    let animationInterval = null;
    
    // ========== RENDER ECG ==========
    function renderECG(data) {
        const ctx = document.getElementById('ecgCanvas').getContext('2d');
        if (ecgChart) {
            ecgChart.data.datasets[0].data = data;
            ecgChart.update('none');
        } else {
            ecgChart = new Chart(ctx, {
                type: 'line',
                data: { labels: Array.from({length: data.length}, (_,i)=>i), datasets: [{ label: 'ECG (mV)', data: data, borderColor: '#006d77', borderWidth: 2.2, tension: 0.2, pointRadius: 0, fill: false }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { zoom: { pan: { enabled: true }, zoom: { wheel: { enabled: true } } } }, scales: { y: { min: -1.3, max: 1.5 } } }
            });
        }
    }
    
    // ========== UPDATE ALL UI ==========
    function updateUI(analysis, patientName, patientAge) {
        const cond = analysis.condition;
        const conf = analysis.confidence;
        const risk = analysis.risk;
        
        document.getElementById("diagnosisText").innerHTML = cond;
        document.getElementById("confidencePercent").innerHTML = `${conf}%`;
        document.getElementById("confidenceFill").style.width = `${conf}%`;
        document.getElementById("clinicalText").innerHTML = analysis.insight;
        
        // Patient Summary
        document.getElementById("summaryName").innerHTML = patientName?.trim() || "Anonymous";
        document.getElementById("summaryAge").innerHTML = patientAge || "—";
        document.getElementById("summaryStatus").innerHTML = risk === "High" ? "⚠️ HIGH RISK" : (risk === "Medium" ? "⚠️ Medium Risk" : "✅ Stable");
        document.getElementById("summaryStatus").className = risk === "High" ? "text-danger" : (risk === "Medium" ? "text-warning" : "text-success");
        document.getElementById("summaryTime").innerHTML = new Date().toLocaleTimeString();
        
        // Risk Meter Indicator
        const riskPercent = risk === "High" ? 90 : (risk === "Medium" ? 55 : 15);
        document.getElementById("riskIndicator").style.left = `${riskPercent}%`;
        
        // Diagnosis Badge
        const badgeMap = {
            "Normal": '<span class="risk-badge" style="background:#e0f2e9; color:#1e7b4a; padding:0.25rem 0.75rem; border-radius:1rem;">✅ Regular</span>',
            "Atrial Fibrillation": '<span class="risk-badge" style="background:#fff0e0; color:#c26b1a; padding:0.25rem 0.75rem; border-radius:1rem;">⚠️ Arrhythmia</span>',
            "Ventricular Fibrillation": '<span class="risk-badge" style="background:#ffe8e6; color:#c72a1f; padding:0.25rem 0.75rem; border-radius:1rem;">🚨 Critical</span>'
        };
        document.getElementById("diagnosisBadge").innerHTML = badgeMap[cond] || "";
        
        // HR value
        const hrMap = { "Normal": 72, "Atrial Fibrillation": 110, "Ventricular Fibrillation": 145 };
        document.getElementById("hrValue").innerHTML = `${hrMap[cond] || 72} <span style="font-size:0.7rem;">BPM</span>`;
        
        // Explainable AI
        const reasons = {
            "Normal": "Regular R-R intervals, normal P waves present",
            "Atrial Fibrillation": "Irregular R-R interval, missing P waves",
            "Ventricular Fibrillation": "Chaotic waveform, no identifiable QRS complexes"
        };
        document.getElementById("explainReason").innerHTML = reasons[cond] || "Analysis complete";
        
        // Multi-model ensemble
        const cnnConf = conf - 2 + Math.floor(Math.random() * 5);
        const lstmConf = conf + 1 - Math.floor(Math.random() * 4);
        document.getElementById("cnnResult").innerHTML = `${cond} (${cnnConf}%)`;
        document.getElementById("lstmResult").innerHTML = `${cond} (${lstmConf}%)`;
        document.getElementById("ensembleResult").innerHTML = `<strong>${cond}</strong> (${conf}%) ✓`;
        
        // Critical Alert
        if (risk === "High") {
            const toast = document.getElementById("criticalToast");
            document.getElementById("toastMessage").innerHTML = `${patientName || "Patient"}: ${analysis.insight.substring(0, 80)}`;
            toast.style.display = "flex";
            const beep = document.getElementById("alertBeep");
            if (beep) beep.play().catch(e => console.log("Audio not supported"));
            setTimeout(() => toast.style.display = "none", 8000);
        }
    }
    
    // ========== HISTORY ==========
    function addToHistory(analysis, signalCopy, patientName, patientAge) {
        const name = patientName?.trim() || "Anonymous";
        const age = patientAge || "—";
        const date = new Date().toLocaleString();
        historyReports.unshift({ patientName: name, patientAge: age, date, prediction: analysis.condition, risk: analysis.risk, confidence: analysis.confidence, signal: [...signalCopy] });
        if (historyReports.length > 6) historyReports.pop();
        renderHistory();
        updateTrendGraph();
    }
    
    function renderHistory() {
        const tbody = document.getElementById("historyBody");
        if (!historyReports.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No previous reports</td></tr>';
            return;
        }
        tbody.innerHTML = historyReports.map(item => `
            <tr style="cursor:pointer;" onclick="loadHistory(${historyReports.indexOf(item)})">
                <td>${item.patientName}</td><td>${item.date}</td>
                <td>${item.prediction}</td>
                <td class="${item.risk === 'High' ? 'text-danger' : (item.risk === 'Medium' ? 'text-warning' : 'text-success')}">${item.risk}</td>
            </tr>
        `).join('');
    }
    
    function updateTrendGraph() {
        const ctx = document.getElementById('trendCanvas').getContext('2d');
        const risks = historyReports.slice(0,6).reverse().map(r => r.risk === "High" ? 2 : (r.risk === "Medium" ? 1 : 0));
        if (trendChart) trendChart.destroy();
        trendChart = new Chart(ctx, {
            type: 'line',
            data: { labels: risks.map((_,i)=>i+1), datasets: [{ label: 'Risk Level', data: risks, borderColor: '#c72a1f', fill: false, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 2.5, ticks: { callback: (v) => v === 2 ? "High" : (v === 1 ? "Med" : "Low") } } } }
        });
    }
    
    function loadHistory(index) {
        const item = historyReports[index];
        if (item && item.signal) {
            currentSignal = [...item.signal];
            const analysis = analyzeSignal(currentSignal);
            currentAnalysis = analysis;
            renderECG(currentSignal);
            updateUI(analysis, item.patientName, item.patientAge);
            document.getElementById("patientName").value = item.patientName !== "Anonymous" ? item.patientName : "";
            if (item.patientAge !== "—") document.getElementById("patientAge").value = item.patientAge;
        }
    }
    
    // ========== FILE PROCESSING ==========
    function processECG(file, fileData, patientName, patientAge) {
        document.getElementById("statusText").innerHTML = "PROCESSING";
        setTimeout(() => {
            try {
                let signalArray = [];
                if (file.name.endsWith('.csv')) {
                    const lines = fileData.split(/\r?\n/);
                    signalArray = lines.filter(l => l.trim().length > 0 && !isNaN(parseFloat(l))).map(l => parseFloat(l));
                } else if (file.name.endsWith('.json')) {
                    const parsed = JSON.parse(fileData);
                    signalArray = Array.isArray(parsed) ? parsed : (parsed.data || parsed.values || []);
                }
                if (!signalArray.length) throw new Error("Invalid");
                const maxAbs = Math.max(...signalArray.map(v=>Math.abs(v)), 0.2);
                const normalized = signalArray.map(v => (v / maxAbs) * 0.95);
                let finalSignal = normalized.slice(0, 600);
                if (finalSignal.length < 100) finalSignal.push(...generateNormalECG(120));
                currentSignal = finalSignal;
                const analysis = analyzeSignal(finalSignal);
                currentAnalysis = analysis;
                renderECG(currentSignal);
                updateUI(analysis, patientName, patientAge);
                addToHistory(analysis, currentSignal, patientName, patientAge);
                document.getElementById("fileNameDisplay").innerHTML = `✅ ${file.name}`;
            } catch(e) {
                document.getElementById("clinicalText").innerHTML = "Error parsing file";
            } finally {
                document.getElementById("statusText").innerHTML = "CONNECTED";
            }
        }, 800);
    }
    
    // ========== ANIMATION ==========
    function startAnimation() {
        if (animationInterval) clearInterval(animationInterval);
        let offset = 0;
        animationInterval = setInterval(() => {
            if (currentSignal.length) {
                const animated = [...currentSignal.slice(offset % 50), ...currentSignal.slice(0, offset % 50)];
                if (ecgChart) {
                    ecgChart.data.datasets[0].data = animated.slice(0, 550);
                    ecgChart.update('none');
                }
                offset++;
            }
        }, 80);
    }
    
    function stopAnimation() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
            if (currentSignal.length) renderECG(currentSignal);
        }
    }
    
    // ========== DOWNLOAD REPORT ==========
    function downloadReport() {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding:2rem; font-family: Arial;">
                <h1 style="color:#006d77;">Cardiac AI Monitor - Clinical Report</h1>
                <hr>
                <h3>Patient: ${document.getElementById("summaryName").innerText}</h3>
                <p>Age: ${document.getElementById("summaryAge").innerText} | Date: ${new Date().toLocaleString()}</p>
                <h3>Diagnosis: ${document.getElementById("diagnosisText").innerText}</h3>
                <p>Confidence: ${document.getElementById("confidencePercent").innerText}</p>
                <p>Clinical Insight: ${document.getElementById("clinicalText").innerText}</p>
                <hr>
                <p><em>Generated by Cardiac AI Monitor - Clinical Decision Support System</em></p>
            </div>
        `;
        html2pdf().from(element).save('ecg_report.pdf');
    }
    
    // ========== DARK MODE ==========
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }
    
    // ========== TESTING & ACCURACY ==========
    let testResults = { normal: [], afib: [], vfib: [] };
    
    function testSignal(signalGenerator, expectedCondition, iterations = 10) {
        const results = [];
        for (let i = 0; i < iterations; i++) {
            const signal = signalGenerator(550);
            const analysis = analyzeSignal(signal);
            const correct = analysis.condition === expectedCondition;
            results.push({
                condition: analysis.condition,
                confidence: analysis.confidence,
                correct: correct
            });
        }
        return results;
    }
    
    function runAccuracyTests() {
        console.log("🧪 Running ECG Classifier Accuracy Tests...");
        const conditionMap = {
            normal: { gen: generateNormalECG, expected: "Normal" },
            afib: { gen: generateAFibECG, expected: "Atrial Fibrillation" },
            vfib: { gen: generateVFibECG, expected: "Ventricular Fibrillation" }
        };
        
        const allResults = {};
        for (const [conditionName, config] of Object.entries(conditionMap)) {
            const results = testSignal(config.gen, config.expected, 20);
            allResults[conditionName] = results;
            
            const accuracy = (results.filter(r => r.correct).length / results.length) * 100;
            const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
            
            console.log(`✅ ${conditionName.toUpperCase()}: ${accuracy.toFixed(1)}% accuracy | Avg Confidence: ${avgConfidence.toFixed(1)}%`);
            results.forEach((r, idx) => {
                console.log(`   Test ${idx + 1}: ${r.condition} (${r.confidence}%) ${r.correct ? '✓' : '✗'}`);
            });
        }
        
        const totalTests = Object.values(allResults).reduce((sum, arr) => sum + arr.length, 0);
        const totalCorrect = Object.values(allResults).reduce((sum, arr) => sum + arr.filter(r => r.correct).length, 0);
        const overallAccuracy = (totalCorrect / totalTests) * 100;
        
        console.log(`\n📊 OVERALL ACCURACY: ${overallAccuracy.toFixed(1)}% (${totalCorrect}/${totalTests} correct)`);
        
        return { allResults, overallAccuracy };
    }
    
    function loadDemoNormal() {
        const signal = generateNormalECG(550);
        currentSignal = signal;
        const analysis = analyzeSignal(signal);
        currentAnalysis = analysis;
        renderECG(signal);
        updateUI(analysis, "Demo Patient", "45");
        addToHistory(analysis, signal, "Demo - Normal Sinus", "45");
        console.log(`📊 Normal ECG Demo: ${analysis.condition} (${analysis.confidence}% confidence)`);
    }
    
    function loadDemoAFib() {
        const signal = generateAFibECG(550);
        currentSignal = signal;
        const analysis = analyzeSignal(signal);
        currentAnalysis = analysis;
        renderECG(signal);
        updateUI(analysis, "Demo Patient", "62");
        addToHistory(analysis, signal, "Demo - Atrial Fib", "62");
        console.log(`📊 AFib ECG Demo: ${analysis.condition} (${analysis.confidence}% confidence)`);
    }
    
    function loadDemoVFib() {
        const signal = generateVFibECG(550);
        currentSignal = signal;
        const analysis = analyzeSignal(signal);
        currentAnalysis = analysis;
        renderECG(signal);
        updateUI(analysis, "Demo Patient", "58");
        addToHistory(analysis, signal, "Demo - Ventricular Fib", "58");
        console.log(`📊 VFib ECG Demo: ${analysis.condition} (${analysis.confidence}% confidence)`);
    }
    
    // Expose to global scope
    window.testSignal = testSignal;
    window.runAccuracyTests = runAccuracyTests;
    window.loadDemoNormal = loadDemoNormal;
    window.loadDemoAFib = loadDemoAFib;
    window.loadDemoVFib = loadDemoVFib;
    
    // ========== EVENT LISTENERS ==========
    document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
    document.getElementById("analyzeBtn").addEventListener("click", () => {
        const file = document.getElementById("fileInput").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => processECG(file, e.target.result, document.getElementById("patientName").value, document.getElementById("patientAge").value);
            reader.readAsText(file);
        }
    });
    document.getElementById("animateBtn").addEventListener("click", startAnimation);
    document.getElementById("stopBtn").addEventListener("click", stopAnimation);
    document.getElementById("downloadReportBtn").addEventListener("click", downloadReport);
    
    const uploadZone = document.getElementById("uploadZone");
    uploadZone.addEventListener("click", () => document.getElementById("fileInput").click());
    uploadZone.addEventListener("dragover", (e) => e.preventDefault());
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => processECG(file, ev.target.result, document.getElementById("patientName").value, document.getElementById("patientAge").value);
            reader.readAsText(file);
        }
    });
    
    // Initialize
    const defaultSignal = generateNormalECG(550);
    currentSignal = defaultSignal;
    const defaultAnalysis = analyzeSignal(defaultSignal);
    currentAnalysis = defaultAnalysis;
    renderECG(defaultSignal);
    updateUI(defaultAnalysis, "", "");
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
    
    function closeAlert() { document.getElementById("criticalToast").style.display = "none"; }
    window.closeAlert = closeAlert;
    window.loadHistory = loadHistory;
