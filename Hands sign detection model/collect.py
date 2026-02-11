# app/collect.py
import os, time
import cv2
import numpy as np
from core import extract_hand_sequence, featurize

WORDS = ["HOW","GO","MRT","STATION","WHERE","EXIT","CHANGE"]

def record_samples(word, n=8, seconds=2, cam=0):
    assert word in WORDS
    outdir = os.path.join("data", word)
    os.makedirs(outdir, exist_ok=True)

    cap = cv2.VideoCapture(cam)
    if not cap.isOpened():
        raise RuntimeError("Cannot open camera")

    print(f"Recording {n} samples for {word}. Press SPACE to start each sample, ESC to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        cv2.putText(frame, f"WORD: {word} | SPACE=start | ESC=quit", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        cv2.imshow("collect", frame)
        k = cv2.waitKey(1) & 0xFF
        if k == 27:
            break
        if k == 32:
            # countdown
            t0 = time.time()
            frames = []
            while time.time() - t0 < seconds:
                ret, f = cap.read()
                if not ret: 
                    continue
                frames.append(f)
                cv2.imshow("collect", f)
                cv2.waitKey(1)
            seq = extract_hand_sequence(frames)
            if seq is None:
                print("No hand detected. Try again.")
                continue
            feat = featurize(seq)
            fname = os.path.join(outdir, f"{int(time.time()*1000)}.npy")
            np.save(fname, feat)
            print("Saved:", fname)
            n -= 1
            if n <= 0:
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    w = input(f"Word {WORDS}: ").strip().upper()
    record_samples(w)
