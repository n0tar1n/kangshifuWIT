# app/core.py
import numpy as np
import mediapipe as mp
import cv2

import mediapipe as mp

try:
    mp_hands = mp.solutions.hands
except AttributeError:
    try:
        from mediapipe.solutions import hands as mp_hands
    except Exception:
        from mediapipe.python.solutions import hands as mp_hands


def extract_hand_sequence(frames, max_hands=1):
    """
    frames: list of BGR images
    returns: np.array shape (t, 21, 3) or None if no hand detected in too many frames
    """
    seq = []
    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=max_hands,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as hands:
        for frame in frames:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = hands.process(rgb)
            if not res.multi_hand_landmarks:
                seq.append(None)
                continue
            lm = res.multi_hand_landmarks[0].landmark  # first hand
            pts = np.array([[p.x, p.y, p.z] for p in lm], dtype=np.float32)  # 21x3
            seq.append(pts)

    # fill missing frames by nearest previous valid (simple, good enough for demo)
    last = None
    filled = []
    for x in seq:
        if x is None:
            filled.append(last)
        else:
            filled.append(x)
            last = x
    # if never saw a hand, fail
    if last is None:
        return None
    # replace leading Nones with first valid
    first_valid = next(v for v in filled if v is not None)
    filled = [first_valid if v is None else v for v in filled]
    return np.stack(filled, axis=0)  # (t, 21, 3)

def normalize_keypoints(seq):
    """
    seq: (t, 21, 3)
    Normalize per-frame relative to wrist and scale by palm size.
    """
    wrist = seq[:, 0:1, :]          # (t, 1, 3)
    seq2 = seq - wrist              # (t, 21, 3)

    # scale = distance wrist -> middle_mcp (landmark 9), per frame
    scale = np.linalg.norm(seq2[:, 9, :2], axis=1) + 1e-6   # (t,)

    # xy divide by (t,1,1), z divide by (t,1)
    seq2[:, :, :2] = seq2[:, :, :2] / scale[:, None, None]  # (t,21,2)
    seq2[:, :, 2]  = seq2[:, :, 2]  / scale[:, None]        # (t,21)

    return seq2


def resample_to_T(seq, T=30):
    """
    seq: (t,21,3) -> (T,21,3) by linear index sampling
    """
    t = seq.shape[0]
    if t == T:
        return seq
    idx = np.linspace(0, t - 1, T).astype(np.int32)
    return seq[idx]

def featurize(seq, T=30):
    """
    seq: (t,21,3) -> feature vector (T*21*3)
    """
    seq = normalize_keypoints(seq)
    seq = resample_to_T(seq, T=T)
    return seq.reshape(-1).astype(np.float32)
