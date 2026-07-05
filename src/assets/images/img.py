import requests
import json
import base64

response = requests.post(
  url="https://openrouter.ai/api/v1/images",
  headers={
    "Authorization": "Bearer <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>",
    "Content-Type": "application/json",
  },
  data=json.dumps({
    "model": "bytedance-seed/seedream-4.5",
    "prompt": "A narrow residential street at 3:47 in the morning, deep winter, no moon, almost total darkness. A black sedan sits with its headlights off, barely a shape against the night, exhaust curling and vanishing into the dark. A single window glows faintly amber — not bright, just barely enough to register — every other window on the street is pure black, indistinguishable from the walls around them. Two male silhouettes near the car are rendered as near-invisible negative shapes, implied by the absence of light rather than by linework. Wet cobblestones catch only the faintest ghost of reflection. Palette: near-total black and deep indigo, the one window an almost imperceptible ember. Style: fine art ink-wash illustration, minimal linework, the composition is mostly negative space and shadow, light used with extreme restraint. Composition: an overwhelmingly dark, empty street, the eye forced to search for the two small points of light. Mood: dread so heavy it flattens the whole frame into stillness."
  })
)

result = response.json()
for i, image in enumerate(result.get("data", [])):
  image_bytes = base64.b64decode(image["b64_json"])
  with open(f"output_{i}.png", "wb") as f:
    f.write(image_bytes)
  print(f"Saved image {i + 1}")