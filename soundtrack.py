import requests
import json
import base64
import os
import time

API_KEY = "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"

music_folder = r"C:\Users\arsha\OneDrive\Documents\game\the-mandate\src\assets\audio\music"
os.makedirs(music_folder, exist_ok=True)

# ─── V2: rebuilt to match the RDR2 intro's actual sonic signature ─────────────
# Key corrections from v1:
#   - ELECTRIC baritone guitar with heavy reverb/delay (not nylon classical)
#   - F major / D minor relative ambiguity (not pure D minor)
#   - 67 bpm rubato (matching the reference)
#   - "Neo-western dark ambient" genre anchor — Lyria has strong
#     associations with this vocabulary
#   - Shorter, denser prompt — every phrase earns its place

track_name = "cinematic_prologue_v2"
prompt = (
    "Instrumental only. Neo-western dark ambient cinematic score in the style "
    "of a slow mournful game opening theme. Key of F major drifting into its "
    "relative D minor, never resolving. 67 bpm played rubato, free and "
    "expressive, not locked to a grid. "
    "Soft felt piano playing heavy solitary bass chords in the lowest octaves, "
    "F and C root notes, each chord struck once and left to slowly decay into "
    "silence. "
    "Electric baritone guitar drenched in heavy reverb and tape delay echo, "
    "playing isolated high single notes and two-note dyads, each note echoing "
    "out and fading like sound reflecting off a vast frozen empty landscape. "
    "A continuous low-frequency drone bed of bowed strings sitting at the "
    "absolute bottom of the mix, eerie and barely audible. "
    "Enormous negative space, long silences between every phrase, the silence "
    "as important as the notes. "
    "A dark elegy, a funeral song for the end of an era, weary and final, "
    "stripped of all heroism. "
    "No drums, no percussion, no vocals, no strumming, no melody repetition."
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


# Try up to 3 times (the [[token]] failure mode is random and retry fixes it)
print(f"Generating: {track_name}...")
success = False
for attempt in range(1, 4):
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
    print(f"FAILED after 3 attempts: {track_name}")
    print(f"Debug file: {music_folder}\\{track_name}_debug.txt")