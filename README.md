<div align="center">
  <img src="https://img.icons8.com/?size=100&id=12230&format=png&color=41B883" alt="Heartbeat Icon" width="80" />
  <h1>🫀 AI-Powered Cardiac Arrhythmia Predictor</h1>
  <p><strong>A production-grade Clinical Decision Support System (CDSS) for continuous ECG rhythm monitoring and life-saving ML diagnostics.</strong></p>

  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-00a67d.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![TensorFlow](https://img.shields.io/badge/TensorFlow-2.14+-FF6F00.svg?logo=tensorflow)](https://www.tensorflow.org/)
  [![Chart.js](https://img.shields.io/badge/Chart.js_&_Zoom-4.4-FF6384.svg?logo=chartdotjs)](https://www.chartjs.org/)
</div>

<hr>

## 🚀 The Vision

Interpreting an Electrocardiogram (ECG) accurately takes years of specialized cardiology training. In emergency settings, seconds matter. **Code_of_Duty's Cardiac Arrhythmia Predictor** bridges the clinical gap by combining modern Web technologies, advanced signal preprocessing logic (`SciPy`, Wavelet Transforms), and a **Dual-Architecture Deep Learning Model** to instantly detect hidden cardiac anomalies.

Instead of generic React setups prone to UI-freezing, our dashboard is built on a custom, high-performance **Native JS engine**. It acts as a 1:1 digital twin to proper hospital hardware—live-streaming patient data directly into an interactive, visually stunning medical interface.

---

## ✨ Outstanding Features 

### 🧠 Dual-Sourced AI Architecture (1D-CNN + BiLSTM)
*   **CNN Layer:** Performs detailed morphological shape analysis (analyzing P-Waves, hidden QRS distortions, and inverted T-waves).
*   **LSTM Layer:** Calculates complex time-series context, analyzing long-term R-R interval rhythms.
*   **Explainable AI (XAI):** Predicts between *Normal Sinus Rhythm (NSR)*, *Atrial Fibrillation (AFib)*, and devastating *Ventricular Fibrillation (VFib)* while outputting transparent confidence metrics and logical clinical explanations.

### 🏥 Medical-Grade Visualization Engine
*   **No UI Freezing:** Completely native HTML5/CSS3/Vanilla JS integration paired with lightweight `Chart.js`. 
*   **Real-Time Trace Scrolling:** Automatically sweeps and animates a clinical 1000-point signal block forward, replicating a physical ECG monitor.
*   **Advanced Caliper Telemetry:** Native pinch-and-zoom and panning enabled via `chartjs-plugin-zoom`, and hover-enabled micro-voltage tooltips.
*   **Algorithmic R-Peak Highlighting:** Our custom API runs mathematical `scipy.signal.find_peaks` evaluation, instantly mapping bright red scatter-dots directly over genuine heartbeat spikes for the doctor's visual review. 

### 📐 Rigorous Signal Preprocessing
Raw biomedical data is notoriously noisy. Our FastAPI backend processes incoming data pipelines with:
*   Multi-level **Daubechies 4 (db4) Wavelet Denoising**.
*   **Bandpass Filtering** (Nyquist theorems) targeted precisely to critical heart frequencies.
*   Z-score Amplitude Normalization to cleanly stabilize wandering baseline inputs.

---

## 🛠️ Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Backend & API** | FastAPI, Uvicorn, Python |
| **Core Machine Learning** | TensorFlow, Keras, Scikit-Learn |
| **Biomedical DSP** | SciPy (`find_peaks`, filters), PyWavelets, NumPy |
| **Frontend UI** | HTML5, Modern CSS Variables (Dark Matrix Theme), Vanilla JS |
| **Chart Rendering** | Chart.js, Hammer.js (Gestures), Chart.js Zoom Plugin |

---

## 📂 Architecture Mapping

```text
Code_of_Duty/
├── frontend/             # High-performance native render environment
│   ├── css/              # Dark medical monitor styling & animations
│   ├── js/                 # Asynchronous fetch, Chart.js looping, scaling
│   └── index.html        # Main Clinical Viewport
├── dataset/              # Training/validation ECG arrays (.csv)
├── main.py               # 🚀 FastAPI application & DSP signal smoothing endpoints
├── train_model.py        # Keras Sequential DL model training routines
├── evaluate.py           # Scikit-learn confusion matrix generator
├── classes.npy           # Target labels matrix
├── ecg_model.keras       # The serialized 1D-CNN+LSTM weights tracker
└── dummy_signal.json     # Demo validation baseline tests
```

---

## 💻 Setup & Deployment

### 1. Requirements

Ensure you are running Python 3.8+ or higher. A GPU environment (CUDA) is highly recommended if you intend to re-train the models.

### 2. Prepare the Environment

Clone the repository and install the biomedical/backend dependencies:
```bash
cd Code_of_Duty
pip install fastapi uvicorn tensorflow pandas numpy scipy PyWavelets scikit-learn matplotlib seaborn
```

### 3. Ignition / Run the Server 

Since the frontend is served entirely through FastAPI's StaticFiles module, a single command deploys the complete stack.
```bash
python3 main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Open your browser and navigate to: **[`http://localhost:8000`](http://localhost:8000)**

---

## 🔬 How to Use the Predictor

1.  **Patient Triaging:** Register dummy metadata on the left pipeline control.
2.  **Telemetry Data Input:** Drag and drop an external `.json` or `.csv` array directly into the portal, OR hit one of our **Live Demo Simulations** (`Normal`, `AFib`, `VFib`) which stream chaotic math-generated waves directly into the backend for authentic modeling.
3.  **Real-Time Review:** Watch the signal render. Zoom into noisy sections or inspect highlighted QRS peaks with hover measurements.
4.  **Clinical Interpretation:** Look at the generated right-side panel. It displays combined CNN/LSTM results, disagreement warnings (if the models argue), total risk meters, and action-oriented clinical insights!

---

## 📈 Model Resampling & Retraining

We include a pure-Python training pipeline for data scientists seeking to boost parameters or swap architectures.

To start completely fresh:
1. Place standard formatted arrays inside `dataset/ecg_dataset.csv`.
2. Execute the deep-learning orchestrator:
```bash
python train_model.py
```
This triggers data reshaping, automatic Focal-Loss handling, EarlyStopping callbacks, and renders the latest prediction matrix (`confusion_matrix.png`) automatically upon finish. 

---

<br>
<p align="center">
  <i>Disclaimer: This software was developed primarily for education, ML demonstration, and Hackathons. It is NOT FDA-Approved diagnostic software and should always be superseded by the judgment of licensed cardiologists.</i>
</p>
