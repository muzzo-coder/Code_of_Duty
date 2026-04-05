import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
import io
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from scipy.signal import butter, filtfilt
import pywt
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")

MODEL_PATH = 'ecg_model.keras'
CLASSES_PATH = 'classes.npy'

model = None
classes = None

@app.on_event("startup")
def load_resources():
    global model, classes
    try:

        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        classes = np.load(CLASSES_PATH, allow_pickle=True)
        print(f"Model loaded. Classes: {classes}")
    except Exception as e:
        print(f"Error loading model or classes: {e}")

def wavelet_denoising(data, wavelet='db4', level=4):

    coeff = pywt.wavedec(data, wavelet, mode="per")
    sigma = (1/0.6745) * np.median(np.abs(coeff[-level] - np.median(coeff[-level])))
    uthresh = sigma * np.sqrt(2 * np.log(len(data)))
    coeff[1:] = [pywt.threshold(i, value=uthresh, mode='soft') for i in coeff[1:]]
    return pywt.waverec(coeff, wavelet, mode="per")

def apply_bandpass_filter(data, lowcut=0.5, highcut=40.0, fs=250, order=4):

    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, data)

def preprocess_signal(signal_data):

    signal = np.array(signal_data, dtype=np.float32)

    signal = np.nan_to_num(signal, nan=0.0, posinf=0.0, neginf=0.0)

    if len(signal) > 2500:
        signal = signal[:2500]
    elif len(signal) < 2500:
        signal = np.pad(signal, (0, 2500 - len(signal)), 'constant')

    try:
        signal = wavelet_denoising(signal)
    except Exception as e:
        print(f"Wavelet Processing Error: {e}. Fallback to bandpass.")
        try:
            signal = apply_bandpass_filter(signal)
        except:
             pass

    mean = np.mean(signal)
    std = np.std(signal) + 1e-8
    signal = (signal - mean) / std

    return signal.reshape(1, 2500, 1)

@app.post("/predict")
async def predict(
    name: str = Form("Unknown"),
    age: str = Form("N/A"),
    file: UploadFile = File(...)
):
    global model, classes
    if model is None or classes is None:
        return {"error": "Model not loaded"}

    try:

        content = await file.read()
        filename = file.filename.lower()

        signal_data = []
        if filename.endswith(".json"):
            data = json.loads(content)
            signal_data = data.get("data") or data.get("signal") or []
        elif filename.endswith(".csv"):

            text = content.decode("utf-8")
            signal_data = [float(x.strip()) for x in text.replace("\n", ",").split(",") if x.strip()]

        if not signal_data:
             return {"error": "No valid signal data found in file"}

        X = preprocess_signal(signal_data)

        preds = model.predict(X)[0]
        class_idx = np.argmax(preds)
        confidence = float(np.max(preds)) * 100

        label = str(classes[class_idx])

        insights = {
            "Normal": "Waveform displays regular rhythm and morphology. Normal heart function.",
            "AFib": "Absence of P-waves and irregular R-R intervals detected (Atrial Fibrillation).",
            "VFib": "High-risk chaotic waveform with no identifiable complexes (Ventricular Fibrillation)."
        }

        risk_levels = {
            "Normal": "LOW",
            "AFib": "MEDIUM",
            "VFib": "HIGH"
        }

        result = {
            "name": name,
            "age": age,
            "cnn_prediction": label,
            "lstm_prediction": label,
            "final_prediction": label,
            "confidence": round(confidence, 1),
            "risk": risk_levels.get(label, "LOW"),
            "insight": insights.get(label, "Unusual pattern detected. Further clinical review recommended.")
        }

        return result

    except Exception as e:
        print(f"Prediction error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
