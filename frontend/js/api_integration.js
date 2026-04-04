/**
 * ECG Dashboard API Integration Module
 * Enables communication with FastAPI backend for ML model inference
 */

const API_BASE_URL = 'http://localhost:8001';
let useBackendAPI = false; // Set to true if backend server is available


// ========== API CLIENT ==========
class ECGAPIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }
    
    async checkHealth() {
        "Use strict";
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (response.ok) {
                console.log("✅ Backend API is available");
                return true;
            }
        } catch (e) {
            console.log("❌ Backend API not available:", e.message);
        }
        return false;
    }
    
    async getModelInfo() {
        try {
            const response = await fetch(`${this.baseURL}/info`);
            return await response.json();
        } catch (e) {
            console.error("Error fetching model info:", e);
            return null;
        }
    }
    
    async analyzeSignal(signalArray) {
        "Use strict";
        try {
            const response = await fetch(`${this.baseURL}/analyze_raw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ signal: signalArray })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (e) {
            console.error("Error analyzing signal:", e);
            return null;
        }
    }
    
    async uploadFile(file) {
        "Use strict";
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${this.baseURL}/analyze`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (e) {
            console.error("Error uploading file:", e);
            return null;
        }
    }
}

// Initialize API client
const apiClient = new ECGAPIClient();

// ========== API-BASED ANALYSIS ==========
async function analyzeSignalWithBackend(signal) {
    "Use strict";
    console.log("Sending signal to backend ML model...");
    
    const result = await apiClient.analyzeSignal(signal);
    
    if (result && result.status === 'success') {
        // Convert API response to match internal format
        const analysis = {
            condition: result.prediction,
            confidence: Math.round(result.confidence),
            risk: result.risk_level,
            insight: result.insight
        };
        
        console.log(`BackendML: ${analysis.condition} (${analysis.confidence}% confidence)`);
        
        // Store API response for details
        analysis.apiResponse = result;
        
        return analysis;
    } else {
        console.warn("Backend API failed, using rule-based classifier");
        return null;
    }
}

// ========== ENHANCED HYBRID ANALYSIS ==========
async function analyzeSignalHybrid(signal) {
    "Use strict";
    if (!useBackendAPI) {
        return analyzeSignal(signal); // Use rule-based classifier
    }
    
    // Try backend first
    let backendResult = await analyzeSignalWithBackend(signal);
    
    // Fallback to rule-based if backend fails
    if (!backendResult) {
        console.log("Falling back to rule-based classifier");
        backendResult = analyzeSignal(signal);
    }
    
    return backendResult;
}

// ========== FILE UPLOAD WITH BACKEND ==========
async function uploadECGFile(file, patientName, patientAge) {
    "Use strict";
    document.getElementById("statusText").innerHTML = "UPLOADING";
    
    try {
        const result = await apiClient.uploadFile(file);
        
        if (result && result.status === 'success') {
            // Use backend result
            const analysis = {
                condition: result.prediction,
                confidence: Math.round(result.confidence),
                risk: result.risk_level,
                insight: result.insight
            };
            
            // The signal is processed by backend, but we need to regenerate it locally for visualization
            // Use synthetic data based on predicted class
            let currentSignal = [];
            if (analysis.condition === "Normal Sinus Rhythm") {
                currentSignal = generateNormalECG(550);
            } else if (analysis.condition === "Atrial Fibrillation") {
                currentSignal = generateAFibECG(550);
            } else {
                currentSignal = generateVFibECG(550);
            }
            
            window.currentSignal = currentSignal;
            window.currentAnalysis = analysis;
            
            renderECG(currentSignal);
            updateUI(analysis, patientName, patientAge);
            addToHistory(analysis, currentSignal, patientName, patientAge);
            document.getElementById("fileNameDisplay").innerHTML = `✅ ${file.name}`;
            
            console.log(`✅ Backend processed: ${analysis.condition} (${analysis.confidence}%)`);
        } else {
            throw new Error("Backend analysis failed");
        }
    } catch (e) {
        console.warn("Backend upload failed, trying local processing:", e.message);
        // Fallback to local processing
        const reader = new FileReader();
        reader.onload = (ev) => processECG(file, ev.target.result, patientName, patientAge);
        reader.readAsText(file);
    } finally {
        document.getElementById("statusText").innerHTML = "CONNECTED";
    }
}

// ========== BATCH TESTING WITH BACKEND ==========
async function testAccuracyWithBackend() {
    "Use strict";
    console.log("🧪 Running Backend ML Model Tests...");
    
    const conditions = {
        normal: { gen: generateNormalECG, expected: "Normal Sinus Rhythm" },
        afib: { gen: generateAFibECG, expected: "Atrial Fibrillation" },
        vfib: { gen: generateVFibECG, expected: "Ventricular Fibrillation" }
    };
    
    const results = {};
    
    for (const [condName, config] of Object.entries(conditions)) {
        const condResults = [];
        
        for (let i = 0; i < 10; i++) {
            const signal = config.gen(550);
            const result = await apiClient.analyzeSignal(signal);
            
            if (result && result.status === 'success') {
                const correct = result.prediction === config.expected;
                condResults.push({
                    prediction: result.prediction,
                    confidence: result.confidence,
                    correct: correct
                });
            }
        }
        
        results[condName] = condResults;
        const accuracy = (condResults.filter(r => r.correct).length / condResults.length) * 100;
        const avgConf = condResults.reduce((sum, r) => sum + r.confidence, 0) / condResults.length;
        
        console.log(`✅ ${condName.toUpperCase()}: ${accuracy.toFixed(1)}% | Avg Conf: ${avgConf.toFixed(1)}%`);
    }
    
    const totalTests = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    const totalCorrect = Object.values(results).reduce(
        (sum, arr) => sum + arr.filter(r => r.correct).length, 0
    );
    const overallAccuracy = (totalCorrect / totalTests) * 100;
    
    console.log(`\n📊 BACKEND ML OVERALL ACCURACY: ${overallAccuracy.toFixed(1)}% (${totalCorrect}/${totalTests})`);
    
    return results;
}

// ========== INITIALIZATION ==========
async function initializeAPI() {
    "Use strict";
    console.log("Initializing API client...");
    
    const apiAvailable = await apiClient.checkHealth();
    
    if (apiAvailable) {
        useBackendAPI = true;
        const modelInfo = await apiClient.getModelInfo();
        console.log("📦 Model Info:", modelInfo);
        
        // Add backend indicator to UI
        const statusText = document.getElementById("statusText");
        if (statusText) {
            statusText.innerHTML = "CONNECTED (ML Backend)";
        }
    } else {
        useBackendAPI = false;
        console.log("ℹ️  Using local rule-based classifier (Backend not available)");
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAPI);
} else {
    initializeAPI();
}

// ========== OVERRIDE FILE PROCESSING ==========
// Store original processECG function
const originalProcessECG = window.processECG;

// Create wrapper that uses backend if available
window.processECG = function(file, fileData, patientName, patientAge) {
    if (useBackendAPI && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
        uploadECGFile(file, patientName, patientAge);
    } else {
        // Fall back to original
        originalProcessECG.call(this, file, fileData, patientName, patientAge);
    }
};

// Export for global use
window.ECGAPIClient = ECGAPIClient;
window.apiClient = apiClient;
window.analyzeSignalWithBackend = analyzeSignalWithBackend;
window.testAccuracyWithBackend = testAccuracyWithBackend;
window.uploadECGFile = uploadECGFile;
