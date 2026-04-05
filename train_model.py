import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import confusion_matrix, classification_report
import pywt
import matplotlib.pyplot as plt
import seaborn as sns
import os

def focal_loss(gamma=2., alpha=0.25):
    def focal_loss_fixed(y_true, y_pred):
        y_true = tf.cast(y_true, tf.int32)
        y_true_one_hot = tf.one_hot(y_true, depth=tf.shape(y_pred)[1])
        epsilon = tf.keras.backend.epsilon()
        y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)

        cross_entropy = -y_true_one_hot * tf.math.log(y_pred)

        weight = alpha * tf.pow(1. - y_pred, gamma)
        loss = weight * cross_entropy
        return tf.reduce_sum(loss, axis=1)
    return focal_loss_fixed

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

def create_model(input_shape, num_classes):
    model = models.Sequential([
        layers.Input(shape=input_shape),

        layers.GaussianNoise(0.01),

        layers.Conv1D(64, kernel_size=15, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=4),
        layers.Dropout(0.2),

        layers.Conv1D(128, kernel_size=10, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=4),
        layers.Dropout(0.3),

        layers.Conv1D(256, kernel_size=5, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=2),
        layers.Dropout(0.4),

        layers.Bidirectional(layers.LSTM(64,
                                        return_sequences=False,
                                        kernel_regularizer=regularizers.l2(0.005))),
        layers.Dropout(0.4),

        layers.Dense(64, activation='relu', kernel_regularizer=regularizers.l2(0.005)),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam',
                  loss=focal_loss(gamma=2., alpha=0.25),
                  metrics=['accuracy'])
    return model

if __name__ == "__main__":
    filepath = 'c:/Users/shree/Desktop/Orch_8/Code_of_Duty/dataset/ecg_dataset.csv'
    X, y, le = load_data(filepath)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
    X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

    print(f"Data Shapes - X_train: {X_train.shape}, y_train: {y_train.shape}")
    print(f"Classes: {le.classes_}")

    model = create_model((X_train.shape[1], 1), len(le.classes_))
    model.summary()

    early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    print("Starting training...")
    history = model.fit(
        X_train, y_train,
        epochs=30,
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[early_stop]
    )

    test_loss, test_acc = model.evaluate(X_test, y_test)
    print(f"\nFinal Test Accuracy: {test_acc:.4f}")

    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)

    cm = confusion_matrix(y_test, y_pred_classes)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=le.classes_, yticklabels=le.classes_)
    plt.title('Confusion Matrix - Advanced ECG classification')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig('confusion_matrix.png')
    print("Confusion Matrix saved as confusion_matrix.png")

    model_path = 'ecg_model.keras'
    model.save(model_path)
    print(f"Model saved to {model_path}")
    np.save('classes.npy', le.classes_)
