# Asset credits

All backgrounds and character sprites are illustrated art (not
photographs), chosen so the whole scene shares one visual language.
The café interiors are the same source painting, color-graded three
different ways (bright day / warm evening / dramatic confrontation)
rather than three different rooms, so the space stays recognizable
across scenes. The files in this folder are the processed output, not
the originals.

## Backgrounds

| File | Used for | Source |
|---|---|---|
| `bg-cafe.jpg` | bright/day café scenes | "Spiral Atlas VN House Backgrounds" (dining room) by Spiral Atlas, via https://opengameart.org/content/visual-novel-house-backgrounds — CC BY 3.0, lightly warm-graded |
| `bg-cafe-dim.jpg` | evening/intimate café scenes | same source painting, graded for warm lamp-lit evening light |
| `bg-cafe-cracked.jpg` | the confrontation/twist scene | same source painting, graded darker and more dramatic, with a procedurally-drawn wall crack (recursive branching lines, generated for this project) replacing the sci-fi green glow with a warm rose one |
| `bg-street.jpg` | rainy night street scene | Original artwork, generated procedurally for this project (no third-party source) — rebuilt for this pass with a painted sky gradient, layered building silhouettes, lit windows, rain streaks and a reflective wet street |

Attribution for the café background: "Spiral Atlas VN House Backgrounds"
by Spiral Atlas, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

The earlier sci-fi-flavored `bg-cafe-glitch.jpg` and `bg-void.jpg` have
been removed along with the CSS rules that referenced them, since no
scene in the current story uses them.

## Player character sprite (Yasmin)

`sprites/yasmin-*.webp` (6 expressions) are cropped and re-encoded from
**"Codel Visual Novel Sprite"** by **LisadiKaprio**, via
https://opengameart.org/content/codel-visual-novel-sprite

License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
attribution required. Credit: "Codel Visual Novel Sprite" by LisadiKaprio,
licensed under CC BY 4.0.

## Sam's sprite

`sprites/sam-*.webp` (6 expressions) are custom composites built from the
mix-and-match face layers (eyebrows / eyes / mouth / emotes) in the
clothed pose of the **"Male sprite for visual novels"** ("Mustafa") PSD by
**LisadiKaprio**, via https://opengameart.org/content/male-sprite-for-visual-novels.
Each expression was assembled by selecting a specific combination of the
source PSD's layer options and compositing them; no third-party
pre-rendered expression was used as-is. The source pack's unclothed
variant of the pose is not used anywhere in this project.

License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
attribution required. Credit: "Male sprite for visual novels" by
LisadiKaprio, licensed under CC BY 4.0.

## Noa's sprite

`sprites/noa-*.webp` are cropped and re-encoded from 3 of the 7
head/expression options ("neutral", "smile", "pissed" → used for
neutral/glitch, smile, and angry/shock/sad respectively) in the
**"casual" outfit** of **"Kuudere Visual Novel Sprite"** by
**LisadiKaprio**, via https://opengameart.org/content/kuudere-visual-novel-sprite.
The source pack's "pervert" and "super pervert" expression options are
not used anywhere in this project.

License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) —
attribution required. Credit: "Kuudere Visual Novel Sprite" by
LisadiKaprio, licensed under CC BY 4.0.

**Known issue:** Noa's chibi-proportioned, simpler-shaded style doesn't
match Yasmin's and Sam's more detailed rendering (both are LisadiKaprio
pieces of a higher fidelity tier). Since Noa is a supporting character
who appears in fewer scenes, this is a lower priority than the earlier
Sam/Yasmin mismatch it replaces — but a matching replacement would need
either a manually-downloaded itch.io pack or an AI-generated sprite from
the user, the same limitation noted previously.

## Music

| File | Used for | Source |
|---|---|---|
| `audio-cafe.mp3` | "warm" mood (street, café scenes) | "Sunset Plains" by Yoiyami, via https://opengameart.org/content/sunset-plains — CC0 |
| `audio-void.mp3` | "tense" mood (dim/night café, confrontation) | "Starfield Romance – CC0 Ambient / Emotional Space Theme" by Yoiyami, via https://opengameart.org — CC0 |

Both trimmed to a ~55s loop, faded, and re-encoded to MP3 for file size.

## Sound effects

| File | Used for | Source |
|---|---|---|
| `sfx/tick.wav` | typewriter blip | "5 Blip UI Sound Effects" by FunnyDude, via https://opengameart.org/content/5-blip-ui-sound-effects — CC0 |
| `sfx/select.wav` | choice selection | "Menu Selection Click" by NenadSimic, via https://opengameart.org/content/menu-selection-click — CC BY 3.0 |
| `sfx/glitch.wav` | screen-shake / impact stinger | "Frequency Static Sound Effects" by bretbernhoft, via https://opengameart.org/content/frequency-static-sound-effects — CC0 |
| `sfx/bell.wav` | door bell, played whenever a scene's narration mentions it | "Pleasing Bell Sound Effect" by Julie Damsgaard (Spring Spring), via https://opengameart.org/content/pleasing-bell-sound-effect — CC0 |
| `sfx/clink.wav` | cup/glass set down on the counter | "glass_02" from "100 CC0 SFX" by rubberduck, via https://opengameart.org/content/100-cc0-sfx — CC0 |

Attribution for the choice-select sound: "Menu Selection Click" by
NenadSimic, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Typography

UI chrome (titles, name plate, buttons, ending title) uses **Frank Ruhl
Libre**, a Hebrew-supporting literary serif from Google Fonts, licensed
under the [SIL Open Font License 1.1](https://openfontlicense.org/).
Body dialogue keeps **Heebo** (also OFL, via Google Fonts) for
readability. Loaded via Google's CDN — no font files are bundled in
this repo.

## Story

The plot (a guarded woman falls for a charismatic café owner who is
secretly a disgraced musician hiding under a new name, and who let his
former producer take the blame for a stage-fire that was actually his
fault) is an original adaptation of the central premise of Gaston
Leroux's *The Phantom of the Opera* (1910), which is in the public
domain. No text from the novel is reproduced; only the "brilliant
performer hiding behind a new identity, tied to a theater disaster"
structure is reused, recontextualized into a present-day café setting
with new characters, dialogue, and an added twist (who was actually at
fault for the fire) not present in the original novel.
