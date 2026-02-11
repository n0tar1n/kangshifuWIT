# app/ui.py
import time
import cv2
import numpy as np
import streamlit as st
import joblib
from core import extract_hand_sequence, featurize
import mediapipe as mp

# DeepSeek (optional)
# Keeping this off so the demo stays fully offline + reliable.
# If we decide to use DeepSeek later:
# - uncomment the imports below
# - uncomment the helper function further down
# - uncomment the DeepSeek block in "Suggested full sentences"
#
# import os
# import json
# import requests


try:
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
except AttributeError:
    from mediapipe.python.solutions import hands as mp_hands
    from mediapipe.python.solutions import drawing_utils as mp_drawing

WORDS = ["HOW", "GO", "MRT", "STATION", "WHERE", "EXIT", "CHANGE"]

st.set_page_config(page_title="MRT Sign Assist", layout="wide")
st.title("MRT Sign Assist (Word-at-a-time)")


@st.cache_resource
def load_model():
    return joblib.load("model.joblib")


clf = load_model()

if "tokens" not in st.session_state:
    st.session_state.tokens = []

station = st.selectbox(
    "Destination station (selected, not signed):",
    ["[STATION]", "Bugis", "Dhoby Ghaut", "Jurong East", "Paya Lebar", "Serangoon"],
)

seconds = st.slider("Record duration (seconds)", 0.8, 2.0, 1.2, 0.1)


def open_camera():
    # macOS can reshuffle camera indices (esp. after Continuity Camera / plugging devices).
    # We just try a few indices and take the first one that opens.
    for idx in [0, 1, 2, 3]:
        cap = cv2.VideoCapture(idx, cv2.CAP_AVFOUNDATION)
        if cap.isOpened():
            return cap
        cap.release()
    return None


# Center the preview
left, mid, right = st.columns([1, 3, 1])
with mid:
    preview = st.empty()

col1, col2, col3 = st.columns(3)
with col1:
    if st.button("Record 1 word"):
        cap = open_camera()
        if cap is None:
            st.error(
                "Can't open any camera. Close apps using the camera and allow Camera access for Terminal/VS Code in macOS Settings."
            )
            st.stop()

        frames = []

        with mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as hands:
            t0 = time.time()
            while time.time() - t0 < seconds:
                ret, frame = cap.read()
                if not ret or frame is None:
                    continue

                frames.append(frame)

                # Live preview with landmarks so it's obvious it's tracking a hand
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = hands.process(rgb)
                if res.multi_hand_landmarks:
                    for hand_lms in res.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(
                            rgb, hand_lms, mp_hands.HAND_CONNECTIONS
                        )

                preview.image(rgb, channels="RGB", width=650)

        cap.release()

        if len(frames) == 0:
            st.error("No frames captured from camera. Try closing other camera apps.")
        else:
            seq = extract_hand_sequence(frames)
            if seq is None:
                st.error("No hand detected. Try again.")
            else:
                feat = featurize(seq)
                probs = clf.predict_proba([feat])[0]
                classes = clf.classes_
                top = np.argsort(probs)[::-1][:3]
                st.session_state.last_pred = [(classes[i], float(probs[i])) for i in top]

with col2:
    if st.button("Clear"):
        st.session_state.tokens = []

with col3:
    if st.button("Backspace"):
        if st.session_state.tokens:
            st.session_state.tokens.pop()

# Show last prediction and let the user confirm the intended word
if "last_pred" in st.session_state:
    st.subheader("Pick the correct word:")
    for w, p in st.session_state.last_pred:
        if st.button(f"{w} ({p:.2f})"):
            st.session_state.tokens.append(w)
            del st.session_state["last_pred"]
            st.rerun()

st.subheader("Recognized words")
tokens = st.session_state.tokens
st.write(" ".join(tokens) if tokens else "(none)")


# DeepSeek helper (optional)
# Uncomment this function if you want DeepSeek to rewrite/autocomplete the sentence,
# and also uncomment the imports at the top + the DeepSeek block below.
#
# def deepseek_suggest_sentences(tokens, station, max_suggestions=3):
#     api_key = ""
#     try:
#         api_key = st.secrets.get("DEEPSEEK_API_KEY", "")
#     except Exception:
#         pass
#     api_key = (api_key or os.getenv("DEEPSEEK_API_KEY", "")).strip()
#     if not api_key or not tokens:
#         return None
#
#     url = "https://api.deepseek.com/chat/completions"
#     headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
#
#     system_msg = (
#         "You rewrite short MRT customer-service sentences from signed keyword sequences. "
#         "Don't invent new facts. Keep it concise. If destination is unknown, use [STATION]. "
#         "Return JSON only, in the form {\"suggestions\": [..]}."
#     )
#
#     user_msg = {
#         "signed_words": tokens,
#         "destination_station": station if station and station != "[STATION]" else "[STATION]",
#         "task": f"Return up to {max_suggestions} suggested sentences for MRT directions."
#     }
#
#     payload = {
#         "model": "deepseek-chat",
#         "messages": [
#             {"role": "system", "content": system_msg},
#             {"role": "user", "content": json.dumps(user_msg, ensure_ascii=False)},
#         ],
#         "temperature": 0.2,
#         "max_tokens": 160,
#         "stream": False,
#     }
#
#     r = requests.post(url, headers=headers, json=payload, timeout=12)
#     r.raise_for_status()
#     content = r.json()["choices"][0]["message"]["content"]
#
#     try:
#         obj = json.loads(content)
#         sugg = obj.get("suggestions", [])
#         sugg = [s.strip() for s in sugg if isinstance(s, str) and s.strip()]
#         return sugg[:max_suggestions] if sugg else None
#     except Exception:
#         return None


st.subheader("Suggested full sentences")

suggestions = []
tset = set(tokens)

# DeepSeek block (optional)
# Uncomment this if you want suggestions to come from DeepSeek first.
# If DeepSeek isn't enabled or fails, the templates below still work.
#
# cache_key = (tuple(tokens), station)
# if st.session_state.get("ds_cache_key") != cache_key:
#     st.session_state.ds_cache_key = cache_key
#     st.session_state.ds_suggestions = None
#
# if st.session_state.ds_suggestions is None:
#     try:
#         st.session_state.ds_suggestions = deepseek_suggest_sentences(tokens, station)
#     except Exception:
#         st.session_state.ds_suggestions = None
#
# suggestions = st.session_state.ds_suggestions or []

# Template fallback (quick and predictable for demo)
if not suggestions:
    if {"HOW", "GO", "EXIT"}.issubset(tset):
        suggestions.append(f"How do I go to exit A?")
    if "WHERE" in tset and "EXIT" in tset:
        suggestions.append(f"Which exit should I take for {station}?")
    if "CHANGE" in tset:
        suggestions.append(f"Do I need to change lines to reach {station}?")

    if not suggestions and tokens:
        suggestions.append(" ".join(tokens).title() + "?")

for s in suggestions[:3]:
    st.write("• " + s)
