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

## Yasmin and Sam: 3D characters

`assets/models/yasmin.vrm` and `assets/models/sam.vrm` are the
**"Base Female"** and **"Base Male"** VRoid Studio sample avatars,
released by VRoid (Pixiv) itself under **CC0** (public domain — no
attribution required), via https://opengameart.org/content/vroid-studio-cc0-models.
Rendered live in the browser with Three.js (loaded from a CDN, MIT
licensed): a standing pose, idle breathing sway, blinking, and
emotion-driven facial blend shapes are all done procedurally in
`character3d.js` — no animation clips are bundled. The original files
(~15-17MB each) were re-encoded for this project: unused normal-map and
thumbnail images were stripped and the remaining textures downscaled,
with no visible quality loss at in-game size, to fit the size budget of
the single-file demo build.

Both models use their stock VRoid hair color/outfit rather than a
custom recolor to match Yasmin/Sam's established look — a follow-up,
not a blocker.

The illustrated 2D sprites that previously covered these two roles
(Codel by LisadiKaprio for Yasmin, a custom composite from the Mustafa
PSD by LisadiKaprio for Sam) have been retired now that both render in
3D; Noa still uses the 2D path below.

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

**Known issue:** Noa is now the only 2D-illustrated character on stage
next to two 3D-rendered ones (Yasmin, Sam) — a bigger mismatch than the
earlier art-fidelity gap it replaces. Bringing her into 3D too would
mean sourcing or generating a third VRM model and is a natural next
step, not done here yet.

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
