# AI-Powered Cardiac Arrhythmia Predictor 🫀

**A comprehensive, production-grade Clinical Decision Support System (CDSS) for real-time ECG arrhythmia classification using deep learning.**

## Overview

This project provides an end-to-end full-stack solution to detect and classify cardiac arrhythmias from Electrocardiogram (ECG) data. It leverages a dual-architecture deep learning strategy (1D Convolutional Neural Networks + Bi-directional LSTM) to analyze both individual waveform morphology and temporal rhythmic patterns, ensuring high precision and robust clinical insights.

The platform includes a high-performance FastAPI backend for model inference and signal processing, integrated with a sleek, responsive native HTML/CSS/JS frontend dashboard. The system is designed to simulate a real-world clinical monitoring environment with real-time waveform visualization, emergency alerts, and explainable AI insights.

## Key Features

- **Dual-Model Architecture:** Combines 1D-CNN (for P-QRS-T complex shape analysis) and LSTM (for long-term R-R interval rhythms).
- **Advanced Signal Processing:** Employs multi-level Wavelet Denoising (Daubechies 4) and bandpass filtering to clean raw ECG sensor data and isolate critical diagnostic frequencies.
- **Real-Time Clinical Dashboard:** A low-latency, modern UI built with native Web technologies and Chart.js for smooth waveform rendering without UI freezing.
- **Explainable AI (XAI):** Provides transparent diagnostic reasoning explaining the focus of both the CNN and LSTM models.
- **Automated Risk Assessment:** Dynamically calculates risk levels (Low, Medium, High) and triggers critical alerts for life-threatening arrhythmias like Ventricular Fibrillation (VFib).
- **RESTful API:** A scalable FastAPI backend handling data ingestion (JSON/CSV), preprocessing, prediction, and returning structured clinical data.

## Tech Stack

* **Backend & API:** FastAPI, Uvicorn, Python 3.x
* **Machine Learning:** TensorFlow, Keras, Scikit-Learn
* **Signal Processing:** SciPy, PyWavelets, NumPy, Pandas
* **Frontend:** HTML5, CSS3 (Modern Medical Theme), Vanilla JavaScript, Chart.js

## Project Structure

```text
Code_of_Duty/
├── frontend/             # Real-time dashboard interface
│   ├── css/              # Stylesheets including dashboard.css
│   ├── js/               # Interactive logic, API integration, chart rendering
│   └── index.html        # Main dashboard view
├── dataset/              # Training datasets (CSV)
├── main.py               # FastAPI application, prediction endpoints, signal processing
├── train_model.py        # Model definition, training loop, evaluation, and saving
├── evaluate.py           # Model evaluation scripts
├── classes.npy           # Encoded classes for the model prediction
├── ecg_model.keras       # Pre-trained core model
└── README.md             # Project documentation
```

## Setup and Installation

### Prerequisites

Ensure you have Python 3.8+ installed.

### 1. Clone or Open the Repository
Navigate to the project directory:
```bash
cd path/to/Code_of_Duty
```

### 2. Install Dependencies
Install the required Python packages:
```bash
pip install fastapi uvicorn tensorflow pandas numpy scipy PyWavelets scikit-learn matplotlib seaborn
```

### 3. Start the Backend Server
Run the FastAPI application using Uvicorn:
```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The server will start on `http://localhost:8000`.

### 4. Access the Dashboard
Open your web browser and navigate to:
```
http://localhost:8000
```

## Usage

1. **Patient Intake:** Enter the patient's name and age on the left panel.
2. **File Upload:** Drag and drop an ECG data file (`.csv` or `.json`) or use the built-in demo simulations (Normal, AFib, VFib).
3. **Analyze:** Click "Analyze ECG". The frontend sends the required data to the `/predict` FastAPI endpoint.
4. **Clinical Review:** Observe the real-time ECG waveform, dual-model predictions (CNN + LSTM), confidence meter, risk level, and explainable AI reasoning on the dashboard.

## Model Training

To retrain the model with a custom dataset:
1. Place your dataset in `dataset/ecg_dataset.csv`. The expected format requires `signal` (array of values) and `label` (class name).
2. Run the training script:
```bash
python train_model.py
```
This script will preprocess the data, train the 1D-CNN + LSTM hybrid model with Focal Loss, generate a confusion matrix (`confusion_matrix.png`), and save the new `.keras` model and class encoding (`classes.npy`).

## Disclaimer
*This system is intended for educational, research, and demonstration purposes. It is not currently certified as a medical device by regulatory bodies (e.g., FDA). Clinical decisions must ultimately be made by qualified healthcare professionals.*
