# app/train.py
import glob, os
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
import joblib

WORDS = ["HOW","GO","MRT","STATION","WHERE","EXIT","CHANGE"]

def load_data():
    X, y = [], []
    for w in WORDS:
        files = glob.glob(os.path.join("data", w, "*.npy"))
        for f in files:
            X.append(np.load(f))
            y.append(w)
    if not X:
        raise RuntimeError("No data found. Run collect.py first.")
    return np.stack(X), np.array(y)

if __name__ == "__main__":
    X, y = load_data()
    clf = KNeighborsClassifier(n_neighbors=3, weights="distance")
    clf.fit(X, y)
    joblib.dump(clf, "model.joblib")
    print("Saved model.joblib with", len(y), "samples.")
