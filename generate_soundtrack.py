import requests
import json
import os
import time
import base64

# ─── Configuration ────────────────────────────────────────────────────────────

API_KEY    = "your-openrouter-api-key-here"
MODEL      = "google/lyria-3-pro-preview"
OUTPUT_DIR = "the_mandate_soundtrack"
DURATION   = 30  # seconds per track (increase to 60 if the model supports it)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Track definitions ────────────────────────────────────────────────────────
# Each prompt is written to match the 1963 Veltria political RPG aesthetic.
# The cinematic_prologue track is built directly from the composition brief.

TRACKS = [

    # ── CINEMATIC OPENING ────────────────────────────────────────────────────
    {
        "filename": "cinematic_prologue.mp3",
        "prompt": (
            "Minimalist dark ambient cinematic score, D minor, 60 BPM rubato, "
            "prepared felt piano low register bass chords struck once and left to decay fully, "
            "bowed upright bass playing root notes only no vibrato, "
            "nylon string acoustic guitar single isolated notes with heavy plate reverb and tape delay echo, "
            "low synthesizer drone barely audible below 80hz felt more than heard, "
            "sparse high violin harmonics used only twice total, "
            "long silences between phrases intentional negative space, "
            "harmonic movement D minor to B flat to F major to G minor never resolving, "
            "A major chord used once creating instability and dissonance, "
            "mood is exhausted institutional decay a government building at 3am, "
            "1963 Eastern European political atmosphere, "
            "no drums no percussion no melody repetition, "
            "the silence between notes is as important as the notes themselves, "
            "elegy for a republic that called itself democratic"
        ),
    },

    # ── MAP / GOVERNANCE ─────────────────────────────────────────────────────
    {
        "filename": "theme_map.mp3",
        "prompt": (
            "Ambient political governance music, 1963 Eastern European republic atmosphere, "
            "slow minimal piano with long decay, subtle string pads underneath, "
            "sense of a city seen from above, weight of administration, "
            "cold war era tension beneath surface calm, "
            "no drums, sparse and spacious, cinematic"
        ),
    },
    {
        "filename": "theme_map_tension.mp3",
        "prompt": (
            "Tense political strategy ambient music, 1963 cold war Eastern Europe, "
            "low cello drones, occasional prepared piano notes, "
            "sense of unseen forces moving, conspiracy beneath bureaucracy, "
            "very slow tempo, minimal instrumentation, dark and watchful"
        ),
    },

    # ── CEREMONY / INAUGURATION ──────────────────────────────────────────────
    {
        "filename": "theme_ceremony.mp3",
        "prompt": (
            "Ceremonial orchestral music for a republic inauguration, 1963 Eastern European, "
            "dignified brass and strings, sense of history being made, "
            "hopeful but carrying the weight of what came before, "
            "not triumphant - solemn and serious, "
            "Shostakovich-influenced, slow and stately"
        ),
    },

    # ── CABINET / MEETING ────────────────────────────────────────────────────
    {
        "filename": "theme_cabinet.mp3",
        "prompt": (
            "Formal government chamber music, 1963 political drama, "
            "quiet strings and woodwinds, deliberative atmosphere, "
            "ministers arguing in hushed tones, "
            "understated authority, tension kept carefully controlled, "
            "chamber music aesthetic, no percussion"
        ),
    },

    # ── CRISIS / EMERGENCY ───────────────────────────────────────────────────
    {
        "filename": "theme_crisis.mp3",
        "prompt": (
            "Government crisis music 1963 cold war political thriller, "
            "urgent low strings, brass stabs held back, "
            "sense of controlled panic, decisions being made in real time, "
            "no full resolution, tension sustained throughout, "
            "Eastern European orchestral, serious and immediate"
        ),
    },

    # ── SHADOW / ESPIONAGE ───────────────────────────────────────────────────
    {
        "filename": "theme_shadow.mp3",
        "prompt": (
            "Cold war espionage ambient score, 1963 Eastern European intelligence atmosphere, "
            "low drone pads, isolated piano notes in the upper register, "
            "sense of being watched, information moving through unofficial channels, "
            "sparse and unsettling, no melody, "
            "the sound of a man who officially does not exist"
        ),
    },
    {
        "filename": "theme_shadow_operative.mp3",
        "prompt": (
            "Dark minimalist spy thriller score, clinical and cold, "
            "prepared piano fragments, bowed metal sounds, "
            "low frequency drone, distant strings, "
            "1963 secret intelligence operation, no emotion no warmth, "
            "the sound of evidence being gathered in the middle of the night"
        ),
    },

    # ── PERSONAL / FAMILY ────────────────────────────────────────────────────
    {
        "filename": "theme_personal.mp3",
        "prompt": (
            "Intimate personal scene music 1963, quiet piano melody, "
            "emotional warmth, family in a small apartment, "
            "Eastern European folk music influence, gentle and human, "
            "bittersweet undertone, the cost of public life on private life, "
            "no drama, just quiet presence"
        ),
    },
    {
        "filename": "theme_family_memory.mp3",
        "prompt": (
            "Nostalgic memory music, childhood in 1930s Eastern Europe, "
            "distant music box or music hall piano, slightly degraded like an old recording, "
            "warmth filtered through time and loss, "
            "folk melody fragments, a kitchen in a cold city, "
            "bittersweet and irretrievable"
        ),
    },

    # ── EVENING REVIEW ───────────────────────────────────────────────────────
    {
        "filename": "theme_evening_review.mp3",
        "prompt": (
            "End of day reflection music, political drama 1963, "
            "slow tired piano, weight of decisions made and unmade, "
            "a chancellor alone in an office at night reading reports, "
            "quiet melancholy, no resolution, "
            "the music of accountability"
        ),
    },

    # ── NEWSPAPER / PRESS ────────────────────────────────────────────────────
    {
        "filename": "theme_newspaper.mp3",
        "prompt": (
            "1963 newspaper press room ambient, typewriter rhythm as percussion, "
            "mid-century jazz piano underneath, ink and urgency, "
            "five different papers competing for the story, "
            "busy purposeful energy, slightly chaotic, "
            "Eastern European city newsroom"
        ),
    },

    # ── SOCIAL EVENT ─────────────────────────────────────────────────────────
    {
        "filename": "theme_social.mp3",
        "prompt": (
            "1963 Eastern European political gathering ballroom music, "
            "elegant strings with subtle jazz influence, "
            "sophisticated tension beneath surface charm, "
            "oligarchs and ministers making deals over champagne, "
            "waltz tempo but sinister undertone, "
            "the sound of power being exercised as politeness"
        ),
    },

    # ── MILITARY / SECURITY ──────────────────────────────────────────────────
    {
        "filename": "theme_military.mp3",
        "prompt": (
            "Military briefing music 1963 cold war, stern brass, "
            "march undertones never quite breaking into a march, "
            "disciplined and serious, the sound of an army that answers to itself, "
            "Eastern European military atmosphere, "
            "controlled power barely constrained"
        ),
    },

    # ── DIPLOMACY / FOREIGN ──────────────────────────────────────────────────
    {
        "filename": "theme_diplomacy.mp3",
        "prompt": (
            "Diplomatic tension music 1963, two nations measuring each other, "
            "formal strings, careful woodwind phrases, "
            "neither warm nor hostile, calculated neutrality, "
            "the sound of words chosen with extreme care, "
            "cold war negotiation atmosphere"
        ),
    },

    # ── OIL / INDUSTRY ───────────────────────────────────────────────────────
    {
        "filename": "theme_industry.mp3",
        "prompt": (
            "Industrial economic power music, 1963 Eastern European resource extraction, "
            "deep brass, rhythmic low strings suggesting machinery, "
            "ambition and risk, a man who built something from nothing, "
            "the sound of capital in motion, "
            "not villainous - driven"
        ),
    },

    # ── VICTORY / RESOLUTION ─────────────────────────────────────────────────
    {
        "filename": "theme_victory.mp3",
        "prompt": (
            "Political victory music 1963 Eastern European republic, "
            "restrained triumph, dignity over celebration, "
            "brass and strings, full orchestral but controlled, "
            "the sound of something hard-won, "
            "not triumphant - relieved"
        ),
    },

    # ── EPILOGUE ─────────────────────────────────────────────────────────────
    {
        "filename": "theme_epilogue.mp3",
        "prompt": (
            "Epilogue orchestral music political drama, 1963 republic, "
            "full strings swell, piano underneath, "
            "legacy and consequence, fifty-two weeks of decisions, "
            "solemn cinematic conclusion, "
            "the sound of history recording what happened here"
        ),
    },

]

# ─── Generator ────────────────────────────────────────────────────────────────

def generate_track(prompt: str, filename: str) -> bool:
    print(f"\n{'─' * 50}")
    print(f"Generating: {filename}")
    print(f"Prompt:     {prompt[:80]}...")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://the-mandate-game.com",
        "X-Title": "The Mandate - Political RPG Soundtrack",
    }

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "duration": DURATION,
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/audio/generations",
            headers=headers,
            data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
            timeout=180,
        )

        if response.status_code == 200:
            data = response.json()

            if "data" in data and len(data["data"]) > 0:
                audio_data = data["data"][0]
                output_path = os.path.join(OUTPUT_DIR, filename)

                if "url" in audio_data:
                    audio_response = requests.get(audio_data["url"], timeout=60)
                    with open(output_path, "wb") as f:
                        f.write(audio_response.content)
                    size_kb = os.path.getsize(output_path) // 1024
                    print(f"✓ Saved {output_path} ({size_kb} KB)")
                    return True

                elif "b64_json" in audio_data:
                    audio_bytes = base64.b64decode(audio_data["b64_json"])
                    with open(output_path, "wb") as f:
                        f.write(audio_bytes)
                    size_kb = os.path.getsize(output_path) // 1024
                    print(f"✓ Saved {output_path} ({size_kb} KB)")
                    return True

            print(f"✗ Unexpected response format:")
            print(json.dumps(data, indent=2)[:400])
            return False

        else:
            print(f"✗ API error {response.status_code}:")
            print(response.text[:400])
            return False

    except requests.exceptions.Timeout:
        print(f"✗ Request timed out after 180s")
        return False
    except Exception as e:
        print(f"✗ Exception: {e}")
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 50)
    print("THE MANDATE - Soundtrack Generator")
    print(f"Model:  {MODEL}")
    print(f"Tracks: {len(TRACKS)}")
    print(f"Output: {OUTPUT_DIR}/")
    print("=" * 50)

    if API_KEY == "your-openrouter-api-key-here":
        print("\nERROR: Replace API_KEY at the top of this script with your OpenRouter key")
        print("Get one at: https://openrouter.ai/keys")
        return

    success = 0
    skipped = 0
    failed  = []

    for i, track in enumerate(TRACKS, 1):
        output_path = os.path.join(OUTPUT_DIR, track["filename"])

        if os.path.exists(output_path):
            print(f"\n[{i}/{len(TRACKS)}] SKIP (exists): {track['filename']}")
            skipped += 1
            success += 1
            continue

        print(f"\n[{i}/{len(TRACKS)}]", end="")

        if generate_track(track["prompt"], track["filename"]):
            success += 1
        else:
            failed.append(track["filename"])

        # Rate limiting - Lyria 3 Pro is a heavy model
        if i < len(TRACKS):
            print("  Waiting 3s before next request...")
            time.sleep(3)

    print("\n" + "=" * 50)
    print(f"COMPLETE: {success}/{len(TRACKS)} tracks ({skipped} skipped, {len(failed)} failed)")
    if failed:
        print(f"FAILED:   {', '.join(failed)}")
    print(f"\nNext step: copy all MP3s to:")
    print(r"  C:\Users\arsha\OneDrive\Documents\game\the-mandate\src\assets\audio\music\\")
    print("\nThe cinematic_prologue.mp3 goes into the CinematicOpening component.")
    print("All others replace or supplement the existing 15 tracks in the game.")
    print("=" * 50)


if __name__ == "__main__":
    main()
