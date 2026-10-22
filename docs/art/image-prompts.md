# The Mandate — Cutscene Art Brief (v2)

Every image in this brief must look like it was painted by the same studio
that painted the 49 character portraits in `src/assets/potraits/`. Those
portraits are the canon. Characters are drawn **from their portrait file**,
never from a written description alone.

---

## 1. How to keep everything consistent

1. **Style reference — attach to every generation:**
   `src/assets/potraits/vyktor_reznik.jpeg` and
   `src/assets/potraits/katerin_ashavel.jpeg`
   (Midjourney: `--sref`; ChatGPT / Gemini / Ideogram / Leonardo: upload and
   say "match the painting style of the attached portraits".)
2. **Character reference — attach each character's portrait** listed under
   "Cast" for that shot (Midjourney: `--cref <file> --cw 100`; other tools:
   "the person in attachment N is <name>; keep face, age, hair and clothing
   identical").
3. Generate **one hero image first** (the inauguration), approve it, then use
   it as an extra style reference for everything that follows.
4. Same aspect, same light logic, same palette across all shots (below).

### House style block — paste at the end of every prompt

> Museum-quality classical oil painting in the style of the attached portraits.
> Realistic, dignified, serious. Rembrandt / chiaroscuro lighting from a single
> warm practical source (window, lamp or sky), deep shadow falloff, rich umber,
> olive, charcoal and muted navy palette with restrained gold accents. Visible
> but controlled brushwork, fine canvas texture, natural skin, accurate anatomy.
> Setting: the fictional Central European Republic of Veltria, 1963 —
> Habsburg-era civic architecture, period-accurate suits, uniforms, vehicles and
> objects. Cinematic 16:9 composition with a clear focal point and calm negative
> space at the bottom. Faces of named characters exactly match their reference
> portraits. No text, no lettering, no logos, no watermark.

### Negative (if your tool has a field for it)

cartoon, anime, comic, illustration, 3D render, CGI, photograph, plastic skin,
glamour lighting, oversaturated, neon, modern objects, modern cars, phones,
readable text, signage, real-world flags, real political symbols, iron crosses,
swastikas, gore, blood spray, exaggerated expressions, extra fingers.

### Technical

| Rule | Value |
|---|---|
| Size | 2752 × 1536 (16:9) or larger, JPEG ~85 |
| Safe area | key faces and action inside the middle 70% (phones crop top and bottom ~12%) |
| Caption zone | bottom fifth calm and dark |
| Veltrian flag | vertical tricolour navy / cream / navy; navy eight-point compass star in a gold ring on the cream band |
| Republic colours | navy and gold (bunting, sashes, emblems) |

---

## 2. Cast sheet (from the portraits)

Attach the file, and use the description only as a backup.

| Character | Role | Portrait file | Key look |
|---|---|---|---|
| **Katerin Ashavel** | Chancellor (player) | `katerin_ashavel.jpeg` | Woman, late 40s; dark brown hair greying at the temples, pulled back into a low chignon; strong dark brows; composed, unsmiling; charcoal tailored jacket over a cream high-necked silk blouse; small gold laurel-wreath brooch on the lapel |
| **Vyktor Reznik** | Chief of Staff | `vyktor_reznik.jpeg` | Gaunt man, mid 50s; short receding grey-brown hair; hollow cheeks; pale blue, unblinking eyes; navy suit, white shirt, narrow navy tie |
| **Serida Valk** | Head of protection | `serida_valk.jpeg` | Woman, about 40; chestnut hair in a neat side-parted bob; calm, watchful; charcoal suit, pale shirt, dark tie |
| **Jonas Ashavel** | Katerin's husband | `jonas_ashavel.jpeg` | Man, mid 40s; tousled light-brown hair; warm, tired eyes; brown tweed jacket over a teal turtleneck |
| **Oskar Brenner** | Army Chief of Staff (Marshal) | `oskar_brenner.jpeg` | Heavyset, 60s; grey crew cut; bristling grey moustache; olive general's tunic with gold shoulder boards and rows of medal ribbons (no crosses) |
| **Drazen Kolvar** | Opposition leader | `drazen_kolvar.jpeg` | Tall, lean, 60s; silver hair swept back; long pale face; grey pinstripe suit, navy tie |

### Cabinet candidates (shown according to the player's appointment)

| Ministry | Candidate A | Candidate B |
|---|---|---|
| Finance | **Elara Vostane** `elara_vostane.jpeg`: black hair pulled tight, round gold glasses, black turtleneck, dark blazer, severe | **Drazen Kolvar** `drazen_kolvar.jpeg` (as above) |
| Interior | **Danika Oberlin** `danika_oberlin.jpeg`: platinum-blonde waves, red lipstick, black leather jacket over a red blouse | **Nikolai Perov** `nikolai_perov.jpeg`: grey hair, heavy-lidded, dark open-collar shirt and dark jacket |
| Defense | **Col. Irina Dusek** `colonel_dusek.jpeg`: woman, 50s, short dark-grey hair, olive colonel's tunic, ribbons | **Gen. Mikov Vass** `general_vass.jpeg`: grey-haired general, olive tunic with red collar tabs, gold braid |
| Justice | **Aldric Theron** `aldric_theron.jpeg`: elderly, wild white hair, white beard, round wire glasses, tweed jacket, burgundy tie | **Roman Kešić** `roman_kesic.jpeg`: round face, round glasses, thinning hair, dark suit, maroon tie |
| Labor | **Gregor Marić** `gregor_maric.jpeg`: weathered, curly dark-grey hair, thick moustache, brown worn work jacket, open collar | **Petra Solec** `petra_solec.jpeg`: woman, 40s, dark hair in a bun, navy suit, reserved |
| Foreign Affairs | **Vera Sorin** `vera_sorin.jpeg` | **Henryk Borač** `henryk_borac.jpeg` |
| Education | **Dr. Marta Solén** `marta_solen.jpeg` | **Petr Horák** `petr_horak.jpeg` |
| Health | **Dr. Lena Kaspar** `lena_kaspar.jpeg` | **Dr. August Meln** `august_meln.jpeg` |
| Development | **Benedikt Varro** `benedikt_varro.jpeg` | **Sofia Drenek** `sofia_drenek.jpeg` |
| Resources | **Orin Valdek** `orin_valdek.jpeg` | **Daria Voss** `daria_voss.jpeg` |

---

## 3. Can a cutscene show the cabinet the player chose?

**Yes.** There are 10 ministries with 2 candidates each, so there are 1,024
possible cabinets. That's too many to paint one by one, so two techniques
are combined:

**A. Variants (for shots featuring one minister).** The shot is painted once
per candidate, for example `mine_collapse__gregor_maric.jpg` and
`mine_collapse__petra_solec.jpg`. The game shows the variant for whoever holds
that ministry. That's two images per shot.

**B. Layered compositing (for the full cabinet).** One painting of the room
with the empty seats (the "plate"), plus one cut-out painting per candidate
seated at their ministry's chair (transparent PNG). The game layers in the
ministers the player actually appointed. The 20 cut-outs are painted once and
reused by every cabinet scene.

Both techniques need a small engine addition: image names that resolve by
appointed minister, and a composite panel type. That's build work I can run
after you approve this brief. The shots below are already split for it.

> Continuity note found while preparing this: several story scenes (the
> bombing, the emergency cabinet, Gravenmark, the coup, the poisoning) are
> written for the A candidates (Oberlin, Dusek, Theron, Vostane) even if the
> player appointed the B candidate. The cutscenes will follow the real
> appointment. The scene text needs the same treatment, which is a separate
> writing pass.

---

## 4. Story cutscenes — `src/assets/images/cutscenes/`

Each shot lists: **Cast** (attach these portraits) · **Variants** · **Prompt**.

### 01 · `inauguration.jpg` — The Oath of Office · Week 1
**Cast:** Katerin, Vyktor, Jonas · **Variants:** none

> Wide high-angle view from behind and slightly above a marble podium at the top
> of the ministry steps on Republic Square, Ashenmere, on a clear frozen morning,
> 1 January 1963. Katerin Ashavel stands at the podium in a long charcoal wool
> coat, seen from behind at three-quarter profile, one hand on a leather-bound
> book of oaths. Two steps behind her to the left stands Vyktor Reznik in a navy
> overcoat holding a folder; in the front row of seated dignitaries, Jonas Ashavel
> watches her. Below, a vast crowd of twenty thousand fills the square past a
> baroque fountain into the side streets, breath visible in the cold. Navy-and-cream
> Veltrian flags with the gold-ringed compass star hang from the colonnade. Low
> golden sunrise rakes across the crowd; long blue shadows.

### 02 · `address_nation.jpg` — Address the Nation · Week 1
**Cast:** Katerin, Vyktor · **Variants:** none

> Interior of a state radio studio, 1963. Katerin Ashavel sits at a felt-covered
> desk before a large chrome ribbon microphone, three-quarter view, face lit warm
> by a green-shaded desk lamp, typed speech pages in her hands, expression
> resolute. Behind a large glass window in the dark control room, Vyktor Reznik
> stands with arms folded beside an engineer at a valve mixing console glowing
> amber; a red on-air lamp casts a faint glow. Acoustic wood panelling, a haze of
> cigarette smoke. Intimate, tense, historic.

### 03 · `mine_collapse__<labor minister>.jpg` — The Weight of Kravenstal · Week 3
**Cast:** Katerin, Vyktor, Labor minister · **Variants:** `mine_collapse__gregor_maric.jpg`, `mine_collapse__petra_solec.jpg`

> A coal-mine pithead at dawn in steady rain, Kravenstal. A black steel headframe
> rises against a grey-amber sky, chimneys behind. At the pit gate a line of
> miners' wives in headscarves and dark coats wait in silence, faces composed and
> grim. Katerin Ashavel, in a charcoal coat, rain on her hair, walks toward them
> beside the Labor Minister [GREGOR MARIĆ in his worn brown work jacket, cap in
> hand / PETRA SOLEC in a navy suit and dark raincoat]; Vyktor Reznik follows
> half a step behind holding a black umbrella over no one. Rescue lamps and
> miners' helmet lights glow through the mist; puddles reflect the light. Solemn,
> respectful, documentary.

### 04 · `no_confidence__<justice minister>.jpg` — The Vote · Week 13
**Cast:** Katerin, Kolvar, Justice minister · **Variants:** `no_confidence__aldric_theron.jpg`, `no_confidence__roman_kesic.jpg`

> A horseshoe parliamentary chamber of dark carved oak and green leather benches,
> packed with deputies in 1960s suits. On the opposition side, Drazen Kolvar
> stands at the dispatch box mid-speech, one finger raised, coldly triumphant.
> Opposition deputies on their feet behind him. On the government front bench,
> Katerin Ashavel sits perfectly still, hands folded, gaze level; beside her the
> Justice Minister [ALDRIC THERON, white hair and beard, wire glasses / ROMAN
> KEŠIĆ, round glasses, dark suit] leans to whisper. The raised Speaker's chair
> under a gilded compass-star emblem; press galleries above; smoke and slanting
> late-afternoon window light.

> **Referendum triptych: one camera, three outcomes.** All three shots use the
> same back-shot framing, so the outcome reads from the hall alone. **Camera:**
> behind Katerin and Vyktor at the upper gallery rail, slightly above shoulder
> height, a 35mm-equivalent lens. The two of them fill the lower-left and
> lower-centre foreground as dark silhouettes, seen from behind, with no faces
> visible. The hall stretches away beyond the rail. Katerin stands left in her
> charcoal coat, chignon and greying temples catching the light; Vyktor stands
> right, a step back, gaunt, in a navy suit. For likeness, attach both
> portraits: they match by hair, build and clothing even though the faces are
> hidden.

### 05 · `referendum_decisive.jpg` — The Mandate · Week 26 (wide win)
**Cast:** Katerin, Vyktor (from behind) · **Variants:** none

> Back shot from behind Katerin Ashavel and her Chief of Staff Vyktor Reznik
> standing at the upper gallery rail of a vast nineteenth-century exhibition hall
> with an iron-and-glass vaulted roof, the national counting centre, at night.
> We see only their backs and shoulders in the dark foreground — Katerin on the
> left, chignon, charcoal coat, one hand resting on the brass rail; Vyktor half a
> step behind her on the right, hands at his sides. Beyond and below them the
> hall erupts: hundreds of supporters throwing papers, ballots and confetti into
> the air, a storm of white sheets drifting and catching the light, raised arms,
> hats in the air, flashbulbs bursting. A wall of mechanical tally boards glows in
> the far distance (numbers only, soft focus). Warm golden light floods the hall
> and rims their silhouettes; cool night glass above. The faces stay unseen, and
> the moment belongs to the crowd.

### 06 · `referendum_narrow.jpg` — By a Thread · Week 26 (narrow win)
**Cast:** Katerin, Vyktor (from behind), Kolvar · **Variants:** none

> The identical back shot from behind Katerin Ashavel and Vyktor Reznik at the
> gallery rail, 2:17 a.m. The hall below is half empty: exhausted officials stand
> motionless staring at the tally board, a few sheets of paper lie still on the
> floor, none in the air. In the lower level, small in the frame, Drazen Kolvar
> stands very still with three allies, not conceding. Katerin's hand grips the
> rail; Vyktor leans in slightly as if to speak. Cold blue-white light from the
> glass roof, one warm pool of lamplight. Quiet, uncertain, tense.

### 07 · `referendum_rejected.jpg` — Forty-Six · Week 26 (defeat)
**Cast:** Katerin, Vyktor (from behind) · **Variants:** none

> The identical back shot from behind Katerin Ashavel and Vyktor Reznik at the
> gallery rail, after midnight. The hall below is emptying: cleaners sweep torn
> ballots and fallen streamers, the tally boards frozen in the distance. Katerin
> stands straight, both hands on the rail, shoulders squared; Vyktor stands a full
> step further back, hat in hand. Desolate cold blue light, long shadows. Grief
> held in check.

### 08 · `assassination_sniper.jpg` — The Parade · Act 3
**Cast:** Katerin, Serida, Brenner, Vyktor · **Variants:** none

> Independence Day on a grand square. A reviewing stand draped in navy and gold
> bunting; the 4th Rifle Division in dress uniform marching below. The instant the
> shot is fired: Serida Valk throws herself across Katerin Ashavel, driving her
> down behind the stone balustrade; Marshal Oskar Brenner turns sharply toward
> the Treasury building; Vyktor Reznik is mid-crouch, shielding his face. A puff of
> stone dust bursts from the balustrade. Across the square, one upper window of a
> neoclassical Treasury stands open. Frozen motion, high tension, no blood.

### 09 · `assassination_bombing.jpg` — The Bombing · Act 3
**Cast:** Serida · **Variants:** none (ministers kept out of frame)

> A ministry corridor seconds after an explosion. A briefing-room door is blown
> inward; smoke and plaster dust hang in shafts of grey light from shattered
> windows; papers drift; chairs overturned. Serida Valk, dust on her charcoal
> suit and in her hair, pulls herself up against the doorframe, one hand on the
> wall, eyes fixed into the smoke. Muffled, ears-ringing atmosphere. No bodies,
> no gore.

### 10 · `assassination_poisoning__<justice minister>.jpg` — The Dinner · Act 3
**Cast:** Katerin, Serida, Vyktor, Justice minister · **Variants:** `assassination_poisoning__aldric_theron.jpg`, `assassination_poisoning__roman_kesic.jpg`

> An embassy dining room of white marble and crystal chandeliers; a long banquet
> table for forty set with silver and candles. The moment it goes wrong: Katerin
> Ashavel slumps sideways in her chair, a wine glass falling from the table
> mid-air; the Justice Minister [ALDRIC THERON / ROMAN KEŠIĆ] beside her reaches
> to loosen her collar; Serida Valk is already vaulting around the table; Vyktor
> Reznik half-rises, stricken. Diplomats in evening dress recoil. Warm candlelight
> turning sinister.

### 11 · `emergency_cabinet` — The Government Responds · Act 3 (composite)
**Cast:** Katerin and Vyktor in the plate; Interior, Defense, Justice and Finance ministers as cut-outs.

**11a · Plate:** `emergency_cabinet_plate.jpg`
> A windowless emergency cabinet room beneath the palace: a long mahogany table
> under green-shaded lamps, maps of the capital pinned to wood-panelled walls,
> black telephones with tangled cords, overflowing ashtrays, smoke. Katerin
> Ashavel sits at the head of the table, front-facing, hands flat on a dossier,
> expression hard. Vyktor Reznik stands at her shoulder. **Four empty leather
> chairs** — two on each long side of the table, the nearer pair to camera left
> and right — waiting for ministers. Night, harsh lamp light.

**11b · Cut-outs:** see section 6 (one per Interior, Defense, Justice and
Finance candidate).

### 12 · `coup_night.jpg` — The Night the Tanks Came · Week 37
**Cast:** Katerin, Serida, Vyktor · **Variants:** none (the Defense minister stays off-screen; the scene reveals their loyalty)

> The Chancellor's residence at 3:41 a.m. In the dark foreground interior, Serida
> Valk stands at the edge of a tall window, pistol held low, one hand raised to
> stop Katerin Ashavel, who has just entered in a dark dressing gown, hair loose,
> face set. Vyktor Reznik in shirtsleeves in the doorway with a telephone receiver.
> Through the window: two 1960s tanks in the courtyard with headlights on,
> soldiers in greatcoats deploying, searchlight beams cutting through freezing
> fog. Cold blue night, white searchlight glare, dread.

### 13 · `gravenmark_pass__<defense minister>.jpg` — The Stand at Gravenmark · Act 3
**Cast:** Brenner, Defense minister, Katerin · **Variants:** `gravenmark_pass__colonel_dusek.jpg`, `gravenmark_pass__general_vass.jpg`

> A sandbagged forward command post at 4 a.m. under a hooded lamp: field
> telephones, a map table spread with the northern pass. Marshal Oskar Brenner
> leans over the map, jaw set; the Defense Minister [COLONEL IRINA DUSEK in an
> olive tunic and greatcoat / GENERAL MIKOV VASS in an olive tunic with red collar
> tabs] points to the pass. Katerin Ashavel stands in a military greatcoat at the
> edge of the lamplight, listening. Through the bunker's opening: the granite pass
> between towering cliffs, distant artillery flashes lighting low cloud orange,
> snow on the rocks. The war heard more than seen.

---

## 5. Location shots — `src/assets/images/locations/`

Empty rooms, no people. These establish the setting for two seconds, so they
should read instantly. They use the same house style, with each room lit by a
single practical light.

| File | Used by | Prompt |
|---|---|---|
| `chancellors_office.jpg` | 149 scenes | Chancellor's office in an old palace: tall windows with heavy olive drapes, a large walnut desk with a green banker's lamp lit, two black rotary telephones, stacked dossiers, a Veltrian flag on a stand, bookshelves; a pale rectangle on the panelled wall where a dictator's portrait was removed. Late-afternoon light, dust in the air. |
| `chancellors_residence.jpg` | 32 | Private living room at night: worn leather armchairs, a wooden radio set, family photographs on the mantel, a boy's schoolbooks on a side table, a single lamp, rain on the window. |
| `private_study.jpg` | 25 | Small study late at night: writing desk under one lamp, a typewriter, a glass of tea, handwritten notes; a window onto a dark snowy city and a cathedral spire. |
| `ministry_of_defense.jpg` | 22 | Military briefing room: large wall map of the northern border with pins and string, long table with officers' caps, steel filing cabinets, harsh overhead light, a flag in the corner. |
| `cabinet_room.jpg` | 19 | Formal cabinet room: long polished table, a dozen leather chairs, water carafes at each place, a chandelier, tall windows, the empty head chair under a gilded compass-star emblem. Daylight. |
| `finance_ministry.jpg` | 22 | Finance office: ledgers and adding machines, a wall chart of falling lines (no text), a tall window over a grey city, a vault door ajar behind. Cold daylight. |
| `ashenmere_palace.jpg` | 11 | Exterior of Ashenmere Palace at dusk: neoclassical Habsburg palace with a central dome, guards at the gate, lamps just lit, navy-and-gold flags, light snow, a black 1960s state car at the steps. |
| `situation_room.jpg` | 5 | Underground situation room: concrete walls, a large illuminated map table, banks of telephones and teleprinters, red emergency lamps, low ceiling. |

---

## 6. Cabinet cut-outs — `src/assets/images/cabinet/`

One per candidate. These are layered into the cabinet plate, so all of them
must share **pose, framing, light and size**.

**Spec for every cut-out:**
- **Background:** transparent PNG (or a pure flat mid-grey backdrop, which I will key out).
- **Size and framing:** 1600 × 1800, the figure seated at a table edge, framed from the waist up, filling 85% of the height.
- **Facing:** left-side seats face right; right-side seats face left (see table).
- **Light:** a single warm key light from the upper front (the table lamp), cool fill, chiaroscuro.
- **Hands:** forearms resting on the table edge, hands visible, holding a pen or folder.
- **Likeness:** the face is identical to the portrait (attach it as the character reference).

> Waist-up seated portrait of [NAME] at the edge of a mahogany cabinet table,
> facing [LEFT/RIGHT] in three-quarter view, forearms on the table, [holding a
> pen / hands clasped / holding a folder], serious and attentive, wearing [their
> portrait clothing]. Warm lamp key light from above-front, deep shadows.
> Isolated on a transparent background. + house style block.

| File | Ministry | Seat | Faces |
|---|---|---|---|
| `danika_oberlin.png` / `nikolai_perov.png` | Interior | near left | right |
| `colonel_dusek.png` / `general_vass.png` | Defense | near right | left |
| `aldric_theron.png` / `roman_kesic.png` | Justice | far left | right |
| `elara_vostane.png` / `drazen_kolvar.png` | Finance | far right | left |

The other six ministries (12 cut-outs) can follow later for a full-cabinet
meeting shot. They use the same spec.

---

## 7. Epilogue paintings — `src/assets/images/epilogues/`

**Cast:** Katerin (aged about five years) in each, plus Jonas where noted.

| File | Prompt |
|---|---|
| `ending_democratic_triumph.jpg` | Republic Square in spring sun, years later — the same fountain and steps. Ordinary life: a market stall, children, couples. Katerin Ashavel, a little greyer, walks unescorted across the square beside Jonas Ashavel; people nod as she passes. Hopeful, earned. |
| `ending_benevolent_autocrat.jpg` | The same square, spotless and silent; soldiers at the corners; a vast compass-star banner on the ministry. Katerin Ashavel watches from a high window, alone, face hard. Cold sunlight, order with a price. |
| `ending_war_survivor.jpg` | A northern border town being rebuilt after the war: scaffolding, a memorial of flowers and candles. Katerin Ashavel in a dark coat lays a wreath; Marshal Oskar Brenner salutes beside her. Winter turning to thaw. |
| `ending_economic_survivor.jpg` | A grey industrial street at dawn: workers queueing at a factory gate, half the chimneys cold, one bakery lit warm. Katerin Ashavel, in a plain coat, is seen through the bakery window shaking a worker's hand. Austere, resilient. |
| `ending_revolutionary.jpg` | A steelworks courtyard during a workers' assembly: navy-and-red banners (no text), a worker speaking from a crate, sparks and smoke. Katerin Ashavel stands among the crowd, not on the stage. Heroic light with an undertone of doubt. |
| `ending_collapse.jpg` | Ashenmere at night with fires on the horizon; the palace dark; a torn Veltrian flag on a balcony. Katerin Ashavel stands at a train window leaving the city, her reflection in the glass. Tragic, quiet. |

---

## 8. Neighbour flags — `src/assets/images/Flags/`

**Benchmark:** `Orythian Dominion.jpg`. It's the standard to match: rich
saturated fields, **gold braided fimbriation** (the thin ornamental borders
between colours), and a finely drawn heraldic emblem with a gilt-edged shield.
Each flag below tells its nation's story at a glance and is drawn to the same
production level.

**Shared spec for all four**
- **Size:** 2800 × 1600 (7:4), flat and front-on. No folds, no pole, no wind and no perspective.
- **Finish:** crisp heraldic illustration with fine engraving detail on metal elements, a subtle woven-silk texture over the colour fields, and gold rendered as burnished gilt thread rather than flat yellow.
- **Geometry:** perfectly symmetrical where the design is symmetrical, and emblems centred exactly as specified.
- **Silhouette test:** each flag must still be recognisable at 60 px wide, as it appears on the map card.
- **No resemblance to real flags:** none may look like any real-world flag, eagle state flag, fleur-de-lis, swastika, or the Nordic or Saint Andrew's cross.

**Prompt prefix for every flag:**
> A national flag for a fictional 1960s European state, displayed perfectly flat
> and front-on, filling the frame edge to edge, 7:4 proportions. Professional
> vexillological design, crisp heraldic illustration, fine engraved detail,
> burnished gold braid fimbriation, subtle woven silk texture. Same artistic
> standard as the attached Orythian Dominion flag (attach it as reference).

---

### 28 · `Lytheira.jpg` — Republic of Lytheira
**Story:** a fading colonial empire. It ruled Veltria for two centuries until
the 1897 revolution, still holds much of Veltria's debt, and dominates the
shipping lanes. The flag is old imperial pomp, slightly faded: it once meant
power, and now it means pride.

| Element | Spec |
|---|---|
| Field | Royal blue `#1E3A6E` |
| Border | The whole flag framed by a thin gold braid inset 3% from every edge |
| Emblem | Centred and 55% of flag height: an ornate gilt-edged **heater shield** of ivory `#EFE6D2` bearing a **three-masted galleon under full sail** in navy and silver on stylised waves; the shield **surmounted by a closed royal crown** (gold, crimson velvet cap `#7A1F2B`, pearls); behind the shield, **two crossed gold anchors** whose flukes show at the four diagonals |
| Mood | Imperial, maritime and aristocratic, with a gentle sun-faded patina on the blue |

> + prefix. Royal-blue field framed by a thin inset gold braid border. In the
> centre a large ornate gilt-edged ivory heater shield bearing a navy-and-silver
> three-masted galleon under full sail on stylised waves, surmounted by a closed
> gold royal crown with a crimson velvet cap and pearls, two crossed gold anchors
> behind the shield. Imperial, maritime, aristocratic; a faint sun-faded patina.

---

### 29 · `Tyvaren.jpg` — The Tyvaren Confederation
**Story:** a single-party military state under Marshal Dragan Vukov, preaching
"Tyvaren destiny", that occupied Sevagrad in 1942–45 and still claims it. The
flag reads as aggressive and forward-thrusting, cold steel rather than gold:
menace without borrowing any real regime's symbols.

| Element | Spec |
|---|---|
| Field | Blood red `#7E1414` |
| Spearhead | A black `#111111` isosceles triangle from the hoist, its point reaching 40% of the flag's length, edged with a **brushed-steel / silver fimbriation** `#B8BCC2` |
| Emblem | Centred in the red fly area (not in the triangle): a black roundel 45% of flag height, ringed in silver, bearing a **snarling silver wolf's head** in left profile, facing the hoist; an **upright silver longsword** behind it, its point breaking the top of the ring; below the wolf, **three jagged silver mountain peaks** (the claimed northern range) |
| Accents | Two thin silver lines run horizontally from the triangle's tip to the fly edge, framing the roundel |
| Mood | Militarist, cold and predatory. All metal is silver, never gold |

> + prefix. Blood-red field with a black spearhead triangle driving in from the
> hoist, edged in brushed-steel silver. In the red area, a black roundel ringed
> in silver bearing a snarling silver wolf's head in profile facing the hoist, an
> upright silver longsword behind it piercing the ring, three jagged silver
> mountain peaks beneath. Cold, militarist, menacing; all metalwork silver.

---

### 30 · `Morivask.jpg` — Morivask under the Junta
**Story:** a republic that failed. Warlord Radovan Skala seized power in 1959.
The flag *shows the coup*: the old republic's tricolour is still there, but the
junta has stamped its badge over the old emblem. That storytelling is the hook.

| Element | Spec |
|---|---|
| Field | Horizontal tricolour, **slate green** `#3F4A3A` / **bone** `#D8CEB0` / **ochre** `#9A7428`, stripes of equal height |
| Old emblem | Centred on the bone stripe, 50% of flag height: the old republic's **wheat sheaf and open book within a laurel ring**, fine and civic, drawn in faded green and ochre ink |
| Junta overlay | Painted roughly **over** the old emblem: a black `#141414` shield-shaped stencil bearing a **red five-point star above crossed sabre and rifle** in dull bronze; the stencil's edges dry-brushed and imperfect, the old laurel ring **ghosting through** at the edges |
| Finish | Sun-faded, slightly worn cloth: tired colours, a frayed fly edge |
| Mood | Provisional, imposed and broken; a regime that won't last |

> + prefix. Horizontal tricolour of slate green, bone and ochre. On the bone
> stripe, a faded civic emblem of a wheat sheaf and open book in a laurel ring,
> crudely overpainted by a black stencilled shield bearing a red five-point star
> above a crossed bronze sabre and rifle; the old laurel ring ghosts through
> around the stencil's dry-brushed edges. Sun-faded worn cloth, frayed fly edge.
> Provisional, imposed, broken.

---

### 31 · `Sovarka.jpg` — Republic of Sovarka
**Story:** a small island republic that survives on neutrality, sitting on
highland mineral deposits every power wants. The flag is calm, maritime and
dignified: a small nation with a long memory.

| Element | Spec |
|---|---|
| Field | Diagonal division from the lower hoist to the upper fly: **deep sea teal** `#1C5656` above, **night navy** `#14263D` below |
| Coastline | Between them, a **cream** `#EFE6D2` wave-crested diagonal band (the shoreline), edged in thin gold braid |
| Emblem | In the upper-hoist teal triangle: a cream roundel ringed with a **gold maritime rope**, bearing a **three-peaked mountain in gold** with a **white seabird** in flight above it; an **olive branch** (neutrality) curving beneath the mountain |
| Mood | Calm, maritime and neutral, with understated pride |

> + prefix. Diagonal division from lower hoist to upper fly: deep sea-teal above,
> night navy below, separated by a cream wave-crested band edged in thin gold
> braid. In the upper-hoist teal area, a cream roundel ringed with a gold
> maritime rope, bearing a gold three-peaked mountain with a white seabird in
> flight above it and an olive branch curving beneath. Calm, maritime, neutral.

---

**Tip:** image models sometimes warp the geometry of a flag. If the stripes or
triangle come out uneven, generate the emblem alone on a transparent background
using the "Emblem" row. I'll then build the flag's geometry in code (exact
colours, perfect stripes and braid) and place the emblem on it.

---

## 9. Production order

1. `inauguration.jpg`. Approve it as the style anchor.
2. The emergency cabinet plate and the 8 cut-outs. This proves the cabinet compositing.
3. `chancellors_office.jpg`, which 149 scenes use.
4. The remaining story cutscenes, then the locations, epilogues and flags.

Save each file under the exact name and folder above, then tell me. I'll
register them and wire them into their scenes.
