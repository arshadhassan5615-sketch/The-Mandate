import requests
import json
import base64
import os
import time

API_KEY = "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"

music_folder = r"C:\Users\arsha\OneDrive\Documents\game\the-mandate\src\assets\audio\music"
os.makedirs(music_folder, exist_ok=True)

# ─── V9: Dystopian Distorted Cello (Inspired by Krux, 100% Original) ──────────
# We translate the breakdown into pure sound-design keywords.
# We force the AI to distort the cello and use sub-bass, while banning beats.

track_name = "mandate_distorted_cello_drone"
prompt = (
    "Instrumental dark ambient cinematic drone. Dystopian industrial sound design. "
    "The track features a solitary cello passed through heavy distortion and "
    "overdrive effects, creating harsh, metallic, and corrupted harmonics. "
    "The cello plays slow, sustained, dissonant notes with subtle pitch bends, "
    "sounding like a corrupted human voice. "
    "A deep, continuous sub-bass synthesizer drone anchors the track, creating "
    "a physical sense of claustrophobia and heavy dread. "
    "The sound is drenched in massive cavernous reverb, making the cello echo "
    "as if trapped inside an abandoned concrete facility. "
    "The structure is slow, linear, and atmospheric, building in tension and "
    "then slowly decaying into silence. "
    "Absolutely no drums, no percussion, no beats, no rhythm, no piano, no "
    "choir, no melody. Pure atmospheric texture."
)

def generate_track(track_name, prompt):
    out_path = f"{music_folder}\\{track_name}.mp3"

    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"Already saved, skipping: {track_name}")
        return True

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://the-mandate-game.com",
            "X-Title": "The Mandate"
        },
        json={
            "model": "google/lyria-3-pro-preview",
            "stream": True,
            "modalities": ["audio"],
            "audio": {"format": "mp3"},
            "messages": [
                {"role": "user", "content": prompt}
            ]
        },
        stream=True,
        timeout=180
    )

    if response.status_code != 200:
        print(f"HTTP ERROR {response.status_code}: {response.text[:200]}")
        return False

    all_lines = []
    for line in response.iter_lines():
        if line:
            all_lines.append(line.decode('utf-8'))

    print(f"Total chunks received: {len(all_lines)}")

    audio_chunks = []
    got_tokens = False

    for line_text in all_lines:
        if line_text.startswith("data: "):
            line_text = line_text[6:]

        if line_text == "[DONE]":
            continue

        try:
            chunk = json.loads(line_text)

            if "choices" in chunk and chunk["choices"]:
                delta = chunk["choices"][0].get("delta", {})

                if "audio" in delta:
                    audio = delta["audio"]
                    if isinstance(audio, dict) and "data" in audio:
                        audio_chunks.append(audio["data"])

                content = delta.get("content", "")
                if content and content.startswith("[["):
                    got_tokens = True

        except json.JSONDecodeError:
            try:
                decoded = base64.b64decode(line_text)
                if len(decoded) > 100:
                    audio_chunks.append(line_text)
            except Exception:
                pass

    if audio_chunks:
        combined = "".join(audio_chunks)
        audio_bytes = base64.b64decode(combined)
        with open(out_path, "wb") as f:
            f.write(audio_bytes)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"SAVED: {track_name}.mp3 ({size_kb:.0f} KB)")
        return True
    elif got_tokens:
        print(f"Got [[tokens]] instead of audio — retrying usually fixes this")
        return False
    else:
        print(f"NO AUDIO CAPTURED")
        with open(f"{music_folder}\\{track_name}_debug.txt", "w") as f:
            f.write("\n".join(all_lines[:50]))
        return False


# Try up to 5 times to brute-force past the [[token]] random failures
print(f"Generating: {track_name}...")
success = False
for attempt in range(1, 6):
    if attempt > 1:
        print(f"\nAttempt {attempt}: {track_name}...")
        time.sleep(3)
    success = generate_track(track_name, prompt)
    if success:
        break

print("\n=== RESULT ===")
if success:
    print(f"SAVED: {music_folder}\\{track_name}.mp3")
    print("Listen and compare against the RDR2 reference before deciding.")
else:
    print(f"FAILED after 5 attempts: {track_name}")
    print(f"Debug file: {music_folder}\\{track_name}_debug.txt")