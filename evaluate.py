import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pywt

def wavelet_denoising(data, wavelet='db4', level=4):
    coeff = pywt.wavedec(data, wavelet, mode="per")
    sigma = (1/0.6745) * np.median(np.abs(coeff[-level] - np.median(coeff[-level])))
    uthresh = sigma * np.sqrt(2 * np.log(len(data)))
    coeff[1:] = [pywt.threshold(i, value=uthresh, mode='soft') for i in coeff[1:]]
    return pywt.waverec(coeff, wavelet, mode="per")

def load_data(filepath):
    print("Loading dataset...")
    df = pd.read_csv(filepath)

    print("Processing signals with Wavelet Denoising & Z-score Normalization...")
    def parse_and_clean(s):
        s = str(s).replace('[', '').replace(']', '')
        signal = np.array([float(x.strip()) for x in s.split(',') if x.strip()], dtype=np.float32)

        signal = wavelet_denoising(signal)

        mean = np.mean(signal)
        std = np.std(signal) + 1e-8
        return (signal - mean) / std

    X = np.stack(df['signal'].apply(parse_and_clean).values)
    le = LabelEncoder()
    y = le.fit_transform(df['label'])
    return X, y, le

print("Loading model...")
model = tf.keras.models.load_model('ecg_model.keras', compile=False)

filepath = 'dataset/ecg_dataset.csv'
X, y, le = load_data(filepath)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

print(f"Test set size: {X_test.shape[0]} samples")

print("Making predictions...")
y_pred = model.predict(X_test, verbose=0)
y_pred_classes = np.argmax(y_pred, axis=1)

f1_weighted = f1_score(y_test, y_pred_classes, average='weighted')
f1_macro = f1_score(y_test, y_pred_classes, average='macro')

print("\n" + "="*50)
print("🔥 F1 Score Results:")
print("="*50)
print(f"Weighted F1 Score: {f1_weighted:.4f}")
print(f"Macro F1 Score:    {f1_macro:.4f}")
print(f"\nClass Labels: {le.classes_}")

print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred_classes, target_names=le.classes_))