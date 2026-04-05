import pandas as pd
import numpy as np

df = pd.read_csv('c:/Users/shree/Desktop/Orch_8/Code_of_Duty/dataset/ecg_dataset.csv', nrows=1000)

print("Columns:", df.columns)
print("First 5 rows:")
print(df.head())

if 'signal' in df.columns:
    print("Signal type:", type(df['signal'][0]))

    if isinstance(df['signal'][0], str):
        signal_len = len(df['signal'][0].split(','))
        print("Signal length (split by comma):", signal_len)
    else:
        print("Signal value (not string):", df['signal'][0])

print("Value counts for label:")
print(df['label'].value_counts())
