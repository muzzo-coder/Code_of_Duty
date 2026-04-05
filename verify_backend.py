import requests
import json
import numpy as np

def test_predict():
    url = "http://localhost:8000/predict"

    t = np.linspace(0, 1, 2500)
    signal = np.sin(2 * np.pi * 5 * t)

    with open("dummy_signal.json", "w") as f:
        json.dump({"data": signal.tolist()}, f)

    files = {'file': ('dummy_signal.json', open('dummy_signal.json', 'rb'), 'application/json')}
    data = {'name': 'Test Patient', 'age': '45'}

    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            print("Success!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":

    test_predict()
