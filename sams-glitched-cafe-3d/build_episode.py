import base64, os

SCRATCHPAD = "/tmp/claude-0/-home-user-portfolio/15ddd2a7-341d-5991-bccc-6096101d23b1/scratchpad"
VRM = f"{SCRATCHPAD}/vrmrender"
OUT = f"{SCRATCHPAD}/episode_final.html"

def b64(path, mime="image/png"):
    with open(path,"rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"

yasmin = b64(f"{VRM}/yasmin_nobg.png")
sam    = b64(f"{VRM}/sam_nobg.png")

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1">
<title>Sam's Glitched Cafe</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Nunito:wght@400;600;700&display=swap">
<!-- Three.js r160 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- GSAP 3 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<!-- Tone.js 14 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<style>
:root{
  --cream:#fff8ee;
  --caramel:#e8923a;
  --caramel-l:#f5b566;
  --rose:#e5758f;
  --rose-l:#f29ab0;
  --cyan:#40d8ff;
  --twilight:#1e0848;
  --midnight:#0d0528;
  --void:#080218;
  --text:rgba(255,248,240,.97);
  --text-dim:rgba(220,205,240,.75);
  --ui-bg:rgba(5,3,14,.96);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{width:100%;height:100%;overflow:hidden;background:#050310;touch-action:none;}

/* ─── LAYOUT ──────────────────────────────────────── */
#game{
  position:fixed;inset:0;
  display:flex;align-items:center;justify-content:center;
  background:#050310;
  font-family:'Nunito',system-ui,sans-serif;
  user-select:none;
}
#stage{
  position:relative;
  width:min(100vw,calc(100vh * 9/19.5));
  height:min(100vh,calc(100vw * 19.5/9));
  overflow:hidden;
  background:#050310;
}

/* Three.js canvas fills stage */
#three-canvas{
  position:absolute;inset:0;
  width:100%;height:100%;
  display:block;
  touch-action:none;
  cursor:pointer;
}

/* ─── VIGNETTE & GRAIN (CSS only) ─────────────────── */
#vignette{
  position:absolute;inset:0;z-index:10;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 90% at 50% 50%,transparent 30%,rgba(3,1,10,.8) 100%),
    linear-gradient(to bottom,rgba(3,1,10,.5) 0%,transparent 20%,transparent 80%,rgba(3,1,10,.65) 100%);
}
#grain{
  position:absolute;inset:0;z-index:11;pointer-events:none;
  opacity:.045;mix-blend-mode:soft-light;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:150px 150px;
  animation:grainShift 0.5s steps(2) infinite;
}
@keyframes grainShift{
  0%{background-position:0 0;}
  25%{background-position:3px -4px;}
  50%{background-position:-2px 6px;}
  75%{background-position:5px 2px;}
  100%{background-position:0 0;}
}

/* ─── LETTERBOX ────────────────────────────────────── */
#lb-top,#lb-bot{
  position:absolute;left:0;right:0;z-index:12;
  height:9%;background:#000;pointer-events:none;
}
#lb-top{top:0;}#lb-bot{bottom:0;}

/* ─── UI LAYER (text, dialogue, choices) ──────────── */
#ui{
  position:absolute;inset:0;z-index:20;
  display:flex;flex-direction:column;justify-content:flex-end;
  pointer-events:none;
}

/* Dialogue */
#dialogue{
  position:relative;
  padding:2% 7% 11%;
  min-height:28%;
  background:linear-gradient(transparent,rgba(5,3,14,.95) 20%,rgba(5,3,14,.98));
  pointer-events:auto;
  cursor:pointer;
  will-change:opacity,transform;
}
#dialogue.narration-mode #name-plate{display:none;}
#dialogue.narration-mode #text-out{
  color:var(--text-dim);
  font-style:italic;
  text-align:center;
  padding:0 6%;
}
#name-plate{
  font-family:'Nunito',sans-serif;
  font-size:clamp(9px,2.6vw,12px);
  font-weight:700;
  letter-spacing:.22em;
  text-transform:uppercase;
  margin-bottom:8px;
  padding:4px 16px 4px 12px;
  border-left:3px solid currentColor;
  border-radius:0 20px 20px 0;
  display:inline-block;
  background:rgba(8,4,20,.92);
  text-shadow:0 0 20px currentColor;
  color:var(--caramel);
  will-change:opacity;
}
#text-out{
  font-family:'Playfair Display',Georgia,serif;
  font-size:clamp(13px,4.1vw,20px);
  line-height:1.65;
  color:var(--text);
  letter-spacing:.008em;
  min-height:3.2em;
}
#tap-hint{
  position:absolute;right:7%;bottom:9.5%;
  font-size:clamp(9px,2.4vw,11px);
  color:rgba(200,185,230,.35);
  letter-spacing:.15em;
  pointer-events:none;
  opacity:0;
}

/* ─── CHOICES ─────────────────────────────────────── */
#choices{
  position:absolute;bottom:0;left:0;right:0;
  padding:0 8% 11%;
  display:flex;flex-direction:column;gap:10px;
  background:linear-gradient(transparent,rgba(5,3,14,.97) 18%,rgba(5,3,14,.99));
  z-index:25;
  pointer-events:none;
  opacity:0;
}
#choices.visible{pointer-events:auto;}
#choices-header{
  font-size:clamp(8px,2.2vw,10px);
  font-weight:600;
  letter-spacing:.28em;
  text-transform:uppercase;
  color:rgba(200,185,230,.35);
  margin-bottom:2px;
}
.c-btn{
  font-family:'Nunito',sans-serif;
  font-size:clamp(11px,3.3vw,15px);
  font-weight:600;
  color:rgba(240,232,255,.85);
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  border-radius:12px;
  padding:13px 18px;
  cursor:pointer;
  text-align:left;
  transition:background .2s,border-color .2s,color .2s;
  letter-spacing:.01em;
  line-height:1.4;
  will-change:transform;
}
.c-btn::before{content:'▸ ';color:rgba(232,146,58,.5);transition:color .2s;}
.c-btn:hover,.c-btn:active{
  background:rgba(232,146,58,.1);
  border-color:rgba(232,146,58,.35);
  color:var(--caramel-l);
}
.c-btn:hover::before,.c-btn:active::before{color:var(--caramel);}

/* ─── ORACLE PANEL ────────────────────────────────── */
#oracle-panel{
  position:absolute;inset:0;z-index:40;
  display:flex;align-items:center;justify-content:center;
  background:rgba(5,3,14,.88);
  backdrop-filter:blur(4px);
  pointer-events:none;
  opacity:0;
}
#oracle-panel.open{pointer-events:auto;}
#oracle-inner{
  width:86%;
  padding:30px 26px;
  background:rgba(12,7,28,.96);
  border:1px solid rgba(229,117,143,.25);
  border-radius:20px;
  text-align:center;
  box-shadow:0 0 60px rgba(229,117,143,.12),0 0 120px rgba(232,146,58,.08);
}
#oracle-char-name{
  font-size:clamp(8px,2.3vw,10px);
  font-weight:700;
  letter-spacing:.3em;
  text-transform:uppercase;
  color:rgba(229,117,143,.6);
  margin-bottom:14px;
}
#oracle-question{
  font-family:'Playfair Display',serif;
  font-size:clamp(14px,4.3vw,21px);
  font-style:italic;
  color:var(--text);
  line-height:1.55;
  margin-bottom:20px;
}
#oracle-response{
  font-size:clamp(11px,3.1vw,14px);
  color:var(--text-dim);
  line-height:1.7;
  margin-bottom:22px;
  min-height:2.5em;
}
#oracle-loading{
  display:inline-block;
  width:18px;height:18px;
  border:2px solid rgba(229,117,143,.2);
  border-top-color:rgba(229,117,143,.8);
  border-radius:50%;
  animation:spin .9s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}
#oracle-continue{
  font-family:'Nunito',sans-serif;
  font-size:clamp(10px,2.8vw,12px);
  font-weight:700;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:rgba(229,117,143,.8);
  background:rgba(229,117,143,.08);
  border:1px solid rgba(229,117,143,.25);
  border-radius:40px;
  padding:9px 26px;
  cursor:pointer;
  transition:background .2s,border-color .2s;
  display:none;
}
#oracle-continue:hover{background:rgba(229,117,143,.18);border-color:rgba(229,117,143,.5);}
#oracle-api-row{margin-top:12px;}
#oracle-api-input{
  font-family:'Nunito',sans-serif;
  font-size:clamp(10px,2.8vw,12px);
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.12);
  border-radius:8px;
  padding:8px 12px;
  color:var(--text);
  width:100%;outline:none;margin-bottom:7px;
}
#oracle-api-submit{
  font-family:'Nunito',sans-serif;
  font-size:clamp(9px,2.6vw,11px);
  font-weight:700;
  letter-spacing:.15em;
  text-transform:uppercase;
  color:rgba(232,146,58,.8);
  background:rgba(232,146,58,.08);
  border:1px solid rgba(232,146,58,.22);
  border-radius:40px;
  padding:7px 20px;cursor:pointer;transition:background .2s;
}
#oracle-api-submit:hover{background:rgba(232,146,58,.18);}

/* ─── END CARD ────────────────────────────────────── */
#end-card{
  position:absolute;inset:0;z-index:50;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  pointer-events:none;
  opacity:0;
}
#end-card.show{pointer-events:auto;}
#end-card-inner{text-align:center;padding:0 12%;}
#end-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(10px,3vw,14px);
  font-weight:500;
  letter-spacing:.3em;text-transform:uppercase;
  color:rgba(229,117,143,.6);margin-bottom:12px;
}
#end-name{
  font-family:'Playfair Display',serif;
  font-size:clamp(22px,7vw,36px);
  font-weight:700;font-style:italic;
  color:var(--caramel-l);margin-bottom:8px;
  text-shadow:0 0 40px rgba(232,146,58,.5);
}
#end-sub{
  font-size:clamp(10px,2.8vw,13px);
  color:var(--text-dim);line-height:1.7;margin-bottom:26px;
}
#end-replay{
  font-family:'Nunito',sans-serif;
  font-size:clamp(9px,2.6vw,11px);font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;
  color:rgba(200,185,230,.5);background:transparent;
  border:1px solid rgba(200,185,230,.2);
  border-radius:40px;padding:10px 24px;
  cursor:pointer;transition:border-color .2s,color .2s;
}
#end-replay:hover{border-color:rgba(200,185,230,.5);color:rgba(200,185,230,.8);}

/* ─── TITLE SCREEN ────────────────────────────────── */
#title-screen{
  position:absolute;inset:0;z-index:60;
  display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;
  padding-bottom:10%;
  background:
    radial-gradient(ellipse 60% 35% at 50% 38%,rgba(232,146,58,.18) 0%,transparent 70%),
    linear-gradient(180deg,#040214 0%,#0c0826 38%,#1a0d40 60%,#2d1a58 78%,#1c0e3a 100%);
}
/* city skyline via clip-path */
#title-screen::before{
  content:'';position:absolute;inset:0;z-index:0;
  background:#09061c;
  clip-path:polygon(0 100%,0 68%,3% 68%,3% 61%,6% 61%,6% 56%,9% 56%,9% 64%,12% 64%,12% 58%,15% 58%,15% 52%,18% 52%,18% 60%,21% 60%,21% 65%,24% 65%,24% 58%,27% 58%,27% 51%,30% 51%,30% 64%,33% 64%,33% 57%,36% 57%,36% 50%,39% 50%,39% 62%,42% 62%,42% 57%,45% 57%,45% 64%,48% 64%,48% 54%,51% 54%,51% 48%,54% 48%,54% 60%,57% 60%,57% 54%,60% 54%,60% 45%,63% 45%,63% 58%,66% 58%,66% 51%,69% 51%,69% 62%,72% 62%,72% 55%,75% 55%,75% 47%,78% 47%,78% 61%,81% 61%,81% 54%,84% 54%,84% 63%,87% 63%,87% 56%,90% 56%,90% 50%,93% 50%,93% 61%,96% 61%,96% 55%,100% 55%,100% 100%);
}
/* animated rain on title */
#title-screen::after{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:repeating-linear-gradient(
    175deg,
    transparent 0px, transparent 2px,
    rgba(100,150,255,.04) 2px, rgba(100,150,255,.04) 3px
  );
  background-size:4px 80px;
  animation:titleRain 1.2s linear infinite;
}
@keyframes titleRain{from{background-position:0 0;}to{background-position:0 80px;}}

.title-logo{
  position:relative;z-index:1;
  text-align:center;margin-bottom:9%;
}
.title-logo h1{
  font-family:'Playfair Display',Georgia,serif;
  font-size:clamp(28px,9vw,44px);
  font-weight:700;font-style:italic;
  color:var(--caramel-l);
  text-shadow:0 0 40px rgba(232,146,58,.85),0 0 100px rgba(232,146,58,.35);
  line-height:1.18;
  animation:titleShimmer 4s ease-in-out infinite;
}
@keyframes titleShimmer{
  0%,100%{text-shadow:0 0 40px rgba(232,146,58,.85),0 0 100px rgba(232,146,58,.35);}
  50%{text-shadow:0 0 55px rgba(245,181,102,1),0 0 130px rgba(232,146,58,.55),0 0 200px rgba(232,146,58,.18);}
}
.title-logo .sub{
  font-size:clamp(8px,2.6vw,12px);font-weight:500;
  color:rgba(245,181,102,.5);
  letter-spacing:.28em;text-transform:uppercase;margin-top:6px;
}
.title-logo .hr{
  margin:10px auto 0;width:70px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(232,146,58,.5),transparent);
}
.title-glitch{
  font-size:clamp(8px,2.3vw,11px);
  color:rgba(229,117,143,.5);
  letter-spacing:.35em;text-transform:uppercase;margin-top:12px;
  animation:glitchPulse 3.5s steps(1,end) infinite;
}
@keyframes glitchPulse{
  0%,95%{opacity:.5;letter-spacing:.35em;}
  96%{opacity:.9;letter-spacing:.5em;color:rgba(100,220,255,.7);}
  97%{opacity:.3;letter-spacing:.2em;}
  98%{opacity:.8;letter-spacing:.4em;}
}
#start-btn{
  position:relative;z-index:1;
  font-family:'Nunito',sans-serif;
  font-size:clamp(9px,2.8vw,12px);
  font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(240,232,255,.7);
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.15);
  border-radius:40px;padding:12px 36px;
  cursor:pointer;transition:background .2s,border-color .2s,color .2s;
}
#start-btn:hover{
  background:rgba(232,146,58,.1);
  border-color:rgba(232,146,58,.4);
  color:var(--caramel-l);
}
#title-footer{
  position:absolute;bottom:3%;left:0;right:0;
  z-index:1;display:flex;justify-content:flex-end;
  padding:0 5%;gap:14px;
}
#sound-btn,#key-btn{
  font-size:clamp(15px,3.8vw,19px);
  background:none;border:none;cursor:pointer;
  opacity:.45;transition:opacity .2s;
}
#sound-btn:hover,#key-btn:hover{opacity:.85;}

/* ─── KEY MODAL ───────────────────────────────────── */
#key-modal{
  position:absolute;inset:0;z-index:70;
  display:flex;align-items:center;justify-content:center;
  background:rgba(5,3,14,.92);
  backdrop-filter:blur(4px);
  pointer-events:none;opacity:0;
}
#key-modal.open{pointer-events:auto;}
#key-inner{
  width:84%;padding:28px 24px;
  background:rgba(12,7,28,.97);
  border:1px solid rgba(232,146,58,.2);
  border-radius:18px;text-align:center;
}
#key-inner h3{
  font-family:'Playfair Display',serif;
  font-size:clamp(13px,3.8vw,17px);font-style:italic;
  color:var(--caramel-l);margin-bottom:8px;
}
#key-inner p{
  font-size:clamp(10px,2.8vw,12px);
  color:var(--text-dim);margin-bottom:14px;line-height:1.6;
}
#key-input{
  width:100%;padding:9px 12px;
  font-family:'Nunito',sans-serif;font-size:clamp(10px,2.8vw,12px);
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.12);
  border-radius:8px;color:var(--text);outline:none;margin-bottom:10px;
}
#key-save{
  font-family:'Nunito',sans-serif;font-size:clamp(9px,2.6vw,11px);
  font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(232,146,58,.85);background:rgba(232,146,58,.08);
  border:1px solid rgba(232,146,58,.25);border-radius:40px;
  padding:8px 24px;cursor:pointer;transition:background .2s;margin-right:8px;
}
#key-save:hover{background:rgba(232,146,58,.18);}
#key-close{
  font-family:'Nunito',sans-serif;font-size:clamp(9px,2.6vw,11px);
  font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(200,185,230,.4);background:transparent;
  border:1px solid rgba(200,185,230,.12);border-radius:40px;
  padding:8px 20px;cursor:pointer;transition:border-color .2s,color .2s;
}
#key-close:hover{border-color:rgba(200,185,230,.3);color:rgba(200,185,230,.7);}

/* ─── TRANSITION FLASH ────────────────────────────── */
#flash{
  position:absolute;inset:0;z-index:55;
  background:#050310;pointer-events:none;opacity:0;
}

.hidden{display:none!important;}
</style>
</head>
<body>
<div id="game">
<div id="stage">

  <!-- Three.js renders here -->
  <canvas id="three-canvas"></canvas>

  <!-- CSS atmosphere -->
  <div id="vignette"></div>
  <div id="grain"></div>
  <div id="lb-top"></div>
  <div id="lb-bot"></div>

  <!-- UI: text + choices (above Three.js, below modals) -->
  <div id="ui">
    <div id="dialogue" class="hidden narration-mode">
      <div id="name-plate"></div>
      <div id="text-out"></div>
      <div id="tap-hint">▼ tap</div>
    </div>
  </div>
  <div id="choices">
    <div id="choices-header">— choose —</div>
  </div>

  <!-- Oracle modal -->
  <div id="oracle-panel">
    <div id="oracle-inner">
      <div id="oracle-char-name">⟡ oracle</div>
      <div id="oracle-question"></div>
      <div id="oracle-response"><div id="oracle-loading"></div></div>
      <button id="oracle-continue">Continue →</button>
      <div id="oracle-api-row" class="hidden">
        <input id="oracle-api-input" type="password" placeholder="Paste Anthropic API key…">
        <button id="oracle-api-submit">Activate Oracle</button>
      </div>
    </div>
  </div>

  <!-- End card -->
  <div id="end-card">
    <div id="end-card-inner">
      <div id="end-title">Ending</div>
      <div id="end-name"></div>
      <div id="end-sub"></div>
      <button id="end-replay">Play Again</button>
    </div>
  </div>

  <!-- Title screen -->
  <div id="title-screen">
    <div class="title-logo">
      <h1>Sam's<br>Glitched Cafe</h1>
      <div class="sub">an interactive story</div>
      <div class="hr"></div>
      <div class="title-glitch">signal detected</div>
    </div>
    <button id="start-btn">Begin</button>
    <div id="title-footer">
      <button id="sound-btn" title="Sound">🔊</button>
      <button id="key-btn" title="API Key">🔑</button>
    </div>
  </div>

  <!-- Key modal -->
  <div id="key-modal">
    <div id="key-inner">
      <h3>Oracle API Key</h3>
      <p>Enter your Anthropic API key to unlock the Oracle — an AI response at each story ending.<br>Stored locally only.</p>
      <input id="key-input" type="password" placeholder="sk-ant-…">
      <div>
        <button id="key-save">Save Key</button>
        <button id="key-close">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Scene transition flash -->
  <div id="flash"></div>

</div><!-- #stage -->
</div><!-- #game -->

<script>
/* ════════════════════════════════════════════════════════
   SAM'S GLITCHED CAFE  —  complete rebuild
   Stack: Three.js r128 · GSAP 3 · Tone.js 14
════════════════════════════════════════════════════════ */
'use strict';

/* ── STORY DATA ────────────────────────────────────── */
const STORY = {
  main:[
    {scene:'street',   char:'narration', text:'It started raining at 11:47 PM.'},
    {scene:'street',   char:'narration', text:'You weren\'t supposed to be here.'},
    {scene:'street',   char:'narration', text:'Every street looked the same. Every door was closed.'},
    {scene:'street',   char:'narration', text:'Except one.'},
    {scene:'street',   char:'narration', text:'A warm light. A sign that seemed to flicker into existence as you walked past it.'},
    {scene:'cafe-enter',char:'narration',text:'The door chimes. Rain patters against the glass behind you.'},
    {scene:'cafe-enter',char:'narration',text:'The smell hits first — espresso and something like cedar. Real warmth.'},
    {scene:'cafe-int', char:'sam',   text:'Oh—', col:'var(--caramel)'},
    {scene:'cafe-int', char:'sam',   text:'We\'re technically closed, but... you look like you need somewhere to be.', col:'var(--caramel)'},
    {scene:'cafe-int', char:'choice',choices:[
      {label:'Just coffee, please.', path:'c1a'},
      {label:'I got a little lost.',  path:'c1b'},
      {label:'What is this place?',   path:'c1c'},
    ]},
  ],
  c1a:[
    {scene:'cafe-int',char:'sam', text:'That I can do.',             col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam', text:'Oat milk? Almond? We have everything. I think.', col:'var(--caramel)', goto:'act2'},
  ],
  c1b:[
    {scene:'cafe-int',char:'sam', text:'Lost is fine.',              col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam', text:'Lost means you\'re still looking for something.', col:'var(--caramel)', goto:'act2'},
  ],
  c1c:[
    {scene:'cafe-int',char:'sam', text:'Honest answer?',             col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam', text:'I\'m not entirely sure.',    col:'var(--caramel)', goto:'act2'},
  ],
  act2:[
    {scene:'cafe-int', char:'sam',      text:'I\'m Sam. This is the Glitched Cafe.', col:'var(--caramel)'},
    {scene:'cafe-int', char:'sam',      text:'My boss named it. She says every good cafe has a soul.', col:'var(--caramel)'},
    {scene:'cafe-int', char:'sam',      text:'This one has static.', col:'var(--caramel)', effect:'glitch-small'},
    {scene:'cafe-int', char:'narration',text:'She\'s charming in a way that feels slightly... off.'},
    {scene:'cafe-int', char:'narration',text:'Like a memory of something warm.'},
    {scene:'cafe-storm',char:'sam',     text:'Do you ever feel like you\'re in a loop?', col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',     text:'Like you\'ve had this exact conversation before, but you can\'t remember with who?', col:'var(--caramel)', effect:'glitch-medium'},
    {scene:'cafe-storm',char:'sam',     text:'Sorry. That was weird. I get like that when the weather\'s bad.', col:'var(--caramel)'},
    {scene:'cafe-storm',char:'choice',choices:[
      {label:'I feel that way sometimes.', path:'c2a'},
      {label:'Are you okay?',              path:'c2b'},
      {label:'What kind of loop?',         path:'c2c'},
    ]},
  ],
  c2a:[
    {scene:'cafe-storm',char:'sam', text:'You understand, then.',        col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam', text:'That feeling where time... skips.', col:'var(--caramel)', goto:'act3'},
  ],
  c2b:[
    {scene:'cafe-storm',char:'sam', text:'Define okay.',                 col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam', text:'I make really good coffee. I remember every order. I know this place like the back of my hand.', col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam', text:'I just... don\'t remember how I got here.', col:'var(--caramel)', goto:'act3'},
  ],
  c2c:[
    {scene:'cafe-storm',char:'sam', text:'Same conversation. Same storm. Same person walking in.', col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam', text:'Maybe. I don\'t know. It sounds crazy.',    col:'var(--caramel)', goto:'act3'},
  ],
  act3:[
    {scene:'cafe-glitch',char:'narration',text:'The lights flicker.',   effect:'glitch-major'},
    {scene:'cafe-glitch',char:'narration',text:'For half a second, you see someone else standing behind Sam.'},
    {scene:'cafe-glitch',char:'sam',      text:'...There it goes again.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',      text:'The electricity in this place. It\'s always doing that.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'She\'s been stuck here for a long time.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',      text:'— Yasmin.',              col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',      text:'This is Yasmin. She... checks in sometimes.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'I\'m trying to help her remember.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'And maybe you can too.',  col:'var(--rose)'},
    {scene:'cafe-glitch',char:'narration',text:'Something about the way Yasmin moves is wrong.'},
    {scene:'cafe-glitch',char:'narration',text:'Not wrong-scary. Wrong-translucent.'},
    {scene:'cafe-glitch',char:'narration',text:'Like she\'s being rendered from memory.'},
    {scene:'cafe-glitch',char:'yasmin',   text:'Sam coded this cafe.',    col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',      text:'Yasmin—',                 col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'No. They deserve to know.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'Sam built this place as a creative project. Digital architecture. Art and code.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'And then she got... stuck. The code kept running.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',      text:'I don\'t feel stuck.',    col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',   text:'You told me that last time too.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',      text:'So now you know.',         col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',      text:'I exist in a loop. This cafe exists in a loop.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',      text:'You could just go. Walk back out into the rain.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',      text:'Or you could help me remember.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'choice',choices:[
      {label:'Tell me what you remember.',          path:'endA'},
      {label:'What does remembering mean for you?', path:'endB'},
      {label:'I want to understand the code.',      path:'endC'},
    ]},
  ],
  endA:[
    {scene:'cafe-warm', char:'sam',      text:'Okay.',                   col:'var(--caramel)'},
    {scene:'cafe-warm', char:'sam',      text:'I remember... a window. In an apartment somewhere.', col:'var(--caramel)'},
    {scene:'cafe-warm', char:'sam',      text:'Coffee always burned because I kept forgetting to watch it.', col:'var(--caramel)'},
    {scene:'cafe-warm', char:'sam',      text:'A song I can\'t quite hear anymore.', col:'var(--caramel)'},
    {scene:'cafe-warm', char:'yasmin',   text:'Keep going.',              col:'var(--rose)'},
    {scene:'cafe-warm', char:'sam',      text:'A face. Yours.',           col:'var(--caramel)'},
    {scene:'cafe-warm', char:'sam',      text:'And now yours.',           col:'var(--caramel)'},
    {scene:'cafe-dawn', char:'sam',      text:'Oh.',                      col:'var(--caramel)'},
    {scene:'cafe-dawn', char:'sam',      text:'Oh, it\'s—',               col:'var(--caramel)'},
    {scene:'cafe-dawn', char:'sam',      text:'Thank you.',               col:'var(--caramel)'},
    {scene:'cafe-dawn', char:'narration',text:'The glitches stop.'},
    {scene:'cafe-dawn', char:'narration',text:'The cafe hums quietly.'},
    {scene:'cafe-dawn', char:'narration',text:'Sam looks at her hands. They\'re solid.'},
    {scene:'cafe-dawn', char:'yasmin',   text:'There she is.',            col:'var(--rose)'},
    {scene:'cafe-dawn', char:'narration',text:'You don\'t know what happened, exactly.'},
    {scene:'cafe-dawn', char:'narration',text:'But something in the static resolved into signal.'},
    {scene:'cafe-dawn', char:'oracle',   ending:'A',
      question:'You helped me remember. I want to ask you something before you go.',
      fallback:'What you did — sitting with someone in their static, not trying to fix it but just listening — that\'s rarer than you think. The signal was always there. You just helped me hear it.'},
  ],
  endB:[
    {scene:'cafe-glitch',char:'yasmin',  text:'That\'s the right question.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',     text:'No one\'s ever asked that before.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',     text:'For me, remembering is... warmth? The feeling of a Tuesday morning.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',     text:'Something that isn\'t a loop.', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',  text:'Maybe the loop isn\'t a problem.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',  text:'Maybe it\'s the form the story wants to take.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',     text:'Then what are we supposed to do?', col:'var(--caramel)'},
    {scene:'cafe-int',   char:'yasmin',  text:'Live in it. Beautifully.', col:'var(--rose)'},
    {scene:'cafe-int',   char:'narration',text:'The rain doesn\'t stop.'},
    {scene:'cafe-int',   char:'narration',text:'The glitches continue.'},
    {scene:'cafe-int',   char:'narration',text:'But somehow, that feels... okay.'},
    {scene:'cafe-int',   char:'narration',text:'You order another coffee.'},
    {scene:'cafe-int',   char:'sam',     text:'It\'ll be perfect. It always is.', col:'var(--caramel)'},
    {scene:'cafe-int',   char:'narration',text:'You both listen to the sound of a world that keeps rendering.'},
    {scene:'cafe-int',   char:'oracle',  ending:'B',
      question:'You asked the question no one ever asks. I want to ask one back.',
      fallback:'You chose to sit with ambiguity instead of resolving it. That takes something — a willingness to let things be unfinished, incomplete, still running. The loop is the story. You understood that.'},
  ],
  endC:[
    {scene:'cafe-glitch',char:'sam',     text:'The code.',               col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',  text:'Oh, that\'s interesting.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',     text:'Why is that interesting?',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',  text:'Because if you understand the code, you might be able to wake up.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',     text:'I\'m not asleep.',        col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',  text:'No. But you might be a dream.', col:'var(--rose)'},
    {scene:'cafe-glitch',char:'narration',text:'The walls of the cafe become transparent.'},
    {scene:'cafe-glitch',char:'narration',text:'You can see the structure underneath. The loops. The calls. The memory allocations.'},
    {scene:'cafe-glitch',char:'sam',     text:'...Is that what I look like from outside?', col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',     text:'I\'m beautiful.',         col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'sam',   text:'Go. Live your whole messy, non-looping life.', col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'sam',   text:'I\'ll be here.',          col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'oracle',ending:'C',
      question:'You wanted to see behind the curtain. Most people don\'t. So tell me —',
      fallback:'You looked for the architecture when everyone else just drinks the coffee. That instinct — to understand the system you\'re inside — is rare and a little dangerous and completely worth it. The code is beautiful. So is knowing it\'s there.'},
  ],
};

const ENDINGS={
  A:{name:'The Signal',     sub:'You helped her remember what it felt like to be seen.'},
  B:{name:'The Loop',       sub:'Some things are more beautiful for never ending.'},
  C:{name:'The Architecture',sub:'You looked behind the curtain. What you found was worth it.'},
};

/* ── THREE.JS SCENE SYSTEM ─────────────────────────── */
class ThreeRenderer {
  constructor(canvas){
    const W=canvas.clientWidth, H=canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setSize(W,H,false);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,100);
    this.camera.position.z=5;

    this.currentScene = '';
    this.clock = new THREE.Clock();
    this.uniforms = {
      uTime:{value:0},
      uGlitch:{value:0},
      uWarm:{value:0},
    };

    this._buildBg();
    this._buildCharPlanes(canvas);
    this._buildParticles();
    this._buildScanlines();
    this._raf();
  }

  /* background quad with scene shader */
  _buildBg(){
    const geo = new THREE.PlaneGeometry(2,2);
    const mat = new THREE.ShaderMaterial({
      uniforms:{
        uTime:this.uniforms.uTime,
        uGlitch:this.uniforms.uGlitch,
        uWarm:this.uniforms.uWarm,
        uScene:{value:0},
      },
      vertexShader:`
        varying vec2 vUv;
        void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
      `,
      fragmentShader:`
        precision mediump float;
        varying vec2 vUv;
        uniform float uTime,uGlitch,uWarm,uScene;

        // hash
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 i=floor(p),f=fract(p);
          f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                     mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }

        // scene palette lookup
        vec3 skyTop(float s){
          if(s<1.)return vec3(.05,.02,.19);      // street: deep indigo
          if(s<2.)return vec3(.07,.03,.15);      // cafe-enter: dark plum
          if(s<3.)return vec3(.08,.04,.18);      // cafe-int
          if(s<4.)return vec3(.04,.01,.14);      // cafe-storm: near black
          if(s<5.)return vec3(.03,.01,.10);      // cafe-glitch: void
          if(s<6.)return vec3(.12,.06,.22);      // cafe-warm
          if(s<7.)return vec3(.16,.09,.30);      // cafe-dawn
          return vec3(.03,.01,.10);              // cafe-dissolve
        }
        vec3 skyBot(float s){
          if(s<1.)return vec3(.10,.04,.22);
          if(s<2.)return vec3(.14,.07,.28);
          if(s<3.)return vec3(.18,.09,.32);
          if(s<4.)return vec3(.07,.02,.20);
          if(s<5.)return vec3(.05,.02,.15);
          if(s<6.)return vec3(.22,.11,.38);
          if(s<7.)return vec3(.28,.14,.45);
          return vec3(.02,.01,.08);
        }
        vec3 accent(float s){
          if(s<3.)return vec3(.9,.57,.23);  // caramel for street/cafe
          if(s<5.)return vec3(.9,.46,.56);  // rose for storm/glitch
          if(s<7.)return vec3(.9,.57,.23);  // caramel for warm/dawn
          return vec3(.25,.85,1.);           // cyan for dissolve
        }

        void main(){
          vec2 uv=vUv;
          float t=uTime;
          float sc=uScene;

          // base gradient
          vec3 col=mix(skyBot(sc),skyTop(sc),uv.y);

          // atmospheric noise layer
          float n=noise(uv*3.+vec2(0,t*.05));
          float n2=noise(uv*8.-vec2(t*.02,0));
          col+=accent(sc)*.06*n;

          // rain streaks on street/storm scenes
          bool hasRain=(sc<2.)||(sc>=3.&&sc<4.);
          if(hasRain){
            float rainX=fract(uv.x*60.+hash(vec2(floor(uv.x*60.),0))*20.);
            float rainY=fract(uv.y*1.5+t*.6+hash(vec2(floor(uv.x*60.),1))*10.);
            float rain=smoothstep(.92,.98,rainX)*smoothstep(.3,.0,rainY)*.18;
            col+=vec3(.4,.5,.9)*rain;
          }

          // window glow in cafe scenes
          bool inCafe=(sc>=2.&&sc<8.);
          if(inCafe){
            vec2 winUv=abs(uv-vec2(.5,.55))-.15;
            float wDist=max(winUv.x,winUv.y);
            float win=smoothstep(.05,-.02,wDist);
            col+=accent(sc)*win*.15;
            // warm light pool on floor
            float floorGlow=smoothstep(.3,.6,1.-uv.y)*smoothstep(.7,.3,abs(uv.x-.5));
            col+=accent(sc)*floorGlow*.08;
          }

          // glitch distortion
          if(uGlitch>.01){
            float band=step(.97,fract(uv.y*40.+t*3.));
            float shift=(hash(vec2(floor(uv.y*40.+t*3.),t))-.5)*uGlitch*.04;
            col=mix(col,vec3(col.r+.3,col.g-.1,col.b+.4),band*uGlitch*.8);
            float scanErr=step(.995,fract(uv.y*200.+t))*uGlitch*.5;
            col+=vec3(0,.8,1)*scanErr;
          }

          // warm healing glow
          if(uWarm>.01){
            float warmGlow=smoothstep(.6,.0,length(uv-vec2(.5,.5)));
            col=mix(col,col+vec3(.4,.2,.05),warmGlow*uWarm*.6);
          }

          // dissolve pixel noise
          if(sc>=7.){
            float pixNoise=hash(floor(uv*80.+t*5.));
            float dissolve=smoothstep(.4,.6,uv.y);
            col=mix(col,vec3(pixNoise*.2,.0,pixNoise*.4),dissolve*.6*uWarm);
          }

          gl_FragColor=vec4(col,1.);
        }
      `,
      depthTest:false,
    });
    this.bgMesh = new THREE.Mesh(geo,mat);
    this.bgMesh.position.z=0;
    this.scene.add(this.bgMesh);
    this.bgMat = mat;
  }

  /* character sprite planes — kept alive, shown/hidden via opacity */
  _buildCharPlanes(canvas){
    const W=canvas.clientWidth, H=canvas.clientHeight;
    const aspect=W/H;

    const makeSprite=(src,xOffset)=>{
      const tex=new THREE.TextureLoader().load(src);
      tex.encoding=THREE.sRGBEncoding;
      // character is ~91% height, centered
      const charAspect=0.55; // approximate width/height of character PNG
      const charH=1.82;      // in NDC (fills 91% of screen height)
      const charW=charH*charAspect/aspect*W/H;
      const geo=new THREE.PlaneGeometry(charW,charH);
      const mat=new THREE.MeshBasicMaterial({
        map:tex,transparent:true,depthTest:false,
        opacity:0,
      });
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(xOffset,-.08,1); // slightly bottom
      mesh.position.z=1;
      return mesh;
    };

    this.yasMesh = makeSprite('{{YASMIN_SRC}}', -0.38);
    this.samMesh = makeSprite('{{SAM_SRC}}',     0.38);
    this.scene.add(this.yasMesh);
    this.scene.add(this.samMesh);
    this.charState={sam:'hidden',yas:'hidden'};
  }

  /* floating particle system — Tone.js-driven intensity later */
  _buildParticles(){
    const count=80;
    const pos=new Float32Array(count*3);
    const sizes=new Float32Array(count);
    for(let i=0;i<count;i++){
      pos[i*3]   =(Math.random()-.5)*2;
      pos[i*3+1] =(Math.random()-.5)*2;
      pos[i*3+2] =2;
      sizes[i]   =Math.random()*3+1;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    const mat=new THREE.ShaderMaterial({
      uniforms:{
        uTime:this.uniforms.uTime,
        uGlitch:this.uniforms.uGlitch,
        uColor:{value:new THREE.Color(0.9,0.57,0.23)},
      },
      vertexShader:`
        attribute float size;
        uniform float uTime,uGlitch;
        void main(){
          vec3 p=position;
          p.y=mod(p.y+uTime*.06,2.)-1.;
          p.x+=sin(uTime*.4+position.y*3.)*.02;
          if(uGlitch>.5){
            p.x+=sin(uTime*8.+position.y*10.)*uGlitch*.06;
          }
          gl_Position=vec4(p.xy,0.,1.);
          gl_PointSize=size*(1.+uGlitch*.5);
        }
      `,
      fragmentShader:`
        uniform vec3 uColor;
        uniform float uGlitch;
        void main(){
          float d=distance(gl_PointCoord,vec2(.5));
          if(d>.5) discard;
          float a=smoothstep(.5,.0,d)*.35;
          vec3 c=mix(uColor,vec3(.25,.85,1.),uGlitch*.8);
          gl_FragColor=vec4(c,a);
        }
      `,
      transparent:true,depthTest:false,
    });
    this.particles=new THREE.Points(geo,mat);
    this.scene.add(this.particles);
    this.particleMat=mat;
    this._particleGeo=geo;
  }

  /* scanline overlay */
  _buildScanlines(){
    const geo=new THREE.PlaneGeometry(2,2);
    const mat=new THREE.ShaderMaterial({
      uniforms:{uTime:this.uniforms.uTime,uGlitch:this.uniforms.uGlitch},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader:`
        precision lowp float;
        varying vec2 vUv;
        uniform float uTime,uGlitch;
        void main(){
          float line=mod(vUv.y*200.,1.);
          float scanA=smoothstep(.0,.1,line)*smoothstep(1.,.9,line)*.06;
          float g=uGlitch;
          float jitter=step(.99,fract(vUv.y*40.+uTime*5.))*g*.12;
          gl_FragColor=vec4(0,0,0,scanA+jitter);
        }
      `,
      transparent:true,depthTest:false,blending:THREE.MultiplyBlending,
    });
    this.scene.add(new THREE.Mesh(geo,mat));
    this.scanMat=mat;
  }

  /* scene mapping: string → scene index uniform */
  _sceneIndex(s){
    const map={
      'street':0,'cafe-enter':1,'cafe-int':2,
      'cafe-storm':3,'cafe-glitch':4,
      'cafe-warm':5,'cafe-dawn':6,'cafe-dissolve':7,
    };
    return map[s]??2;
  }

  setScene(name, glitch=0, warm=0){
    this.currentScene=name;
    // GSAP-animate uniforms
    gsap.to(this.bgMat.uniforms.uScene,{value:this._sceneIndex(name),duration:0.8});
    gsap.to(this.uniforms.uGlitch,{value:glitch,duration:0.6,
      onUpdate:()=>{
        this.particleMat.uniforms.uGlitch.value=this.uniforms.uGlitch.value;
        this.scanMat.uniforms.uGlitch.value=this.uniforms.uGlitch.value;
      }
    });
    gsap.to(this.uniforms.uWarm,{value:warm,duration:1.2,
      onUpdate:()=>{this.bgMat.uniforms.uWarm.value=this.uniforms.uWarm.value;}
    });
    // particle colour
    const col=name.includes('glitch')||name.includes('dissolve')
      ? new THREE.Color(.25,.85,1.)
      : name.includes('warm')||name.includes('dawn')
        ? new THREE.Color(.9,.57,.23)
        : new THREE.Color(.6,.3,.9);
    gsap.to(this.particleMat.uniforms.uColor.value,{
      r:col.r,g:col.g,b:col.b,duration:.8
    });
  }

  showChar(who, state){
    // who: 'sam'|'yasmin'|null  state: 'active'|'inactive'|'hidden'
    const update=(mesh,charName)=>{
      const active = who===charName && state==='active';
      const inactive= (who===charName && state==='inactive')
                     ||(who!==charName && state!=='hidden');
      const hidden = who!==charName && this.charState[charName]==='hidden';

      let targetOpacity = hidden ? 0 : inactive ? 0.38 : 1.0;
      let targetSat = inactive ? 0.15 : 1.0;
      let glowIntensity = active ? 1.0 : 0.0;

      gsap.to(mesh.material,{opacity:targetOpacity,duration:.45});
      // emissive-like via material color tint
      if(charName==='sam'){
        gsap.to(mesh.material.color,{
          r: active?1.1:inactive?.5:1,
          g: active?.9:inactive?.4:.9,
          b: active?.7:inactive?.6:.8,
          duration:.4
        });
      }
    };
    // update state tracking
    if(who==='sam')    this.charState.sam = state;
    if(who==='yasmin') this.charState.yas = state;
    update(this.samMesh,'sam');
    update(this.yasMesh,'yasmin');
  }

  showCharacter(charName){
    if(charName==='sam'){
      gsap.to(this.samMesh.material,{opacity:1,duration:.5});
      gsap.to(this.yasMesh.material,{
        opacity: this.charState.yas==='hidden' ? 0 : 0.38,
        duration:.5
      });
      this.charState.sam='active';
    } else if(charName==='yasmin'){
      gsap.to(this.yasMesh.material,{opacity:1,duration:.5});
      gsap.to(this.samMesh.material,{
        opacity: this.charState.sam==='hidden' ? 0 : 0.38,
        duration:.5
      });
      this.charState.yas='active';
    } else {
      // narration / choice: dim both if active, leave hidden alone
      if(this.charState.sam!=='hidden')
        gsap.to(this.samMesh.material,{opacity:.38,duration:.4});
      if(this.charState.yas!=='hidden')
        gsap.to(this.yasMesh.material,{opacity:.38,duration:.4});
    }
  }

  hideAllChars(){
    gsap.to(this.samMesh.material,{opacity:0,duration:.5});
    gsap.to(this.yasMesh.material,{opacity:0,duration:.5});
    this.charState={sam:'hidden',yas:'hidden'};
  }

  pulseGlitch(intensity=1){
    gsap.to(this.uniforms.uGlitch,{
      value:intensity,duration:.1,
      onComplete:()=>{
        gsap.to(this.uniforms.uGlitch,{
          value:this.currentScene.includes('glitch')?0.4:0,
          duration:.6,
          onUpdate:()=>{
            this.particleMat.uniforms.uGlitch.value=this.uniforms.uGlitch.value;
            this.scanMat.uniforms.uGlitch.value=this.uniforms.uGlitch.value;
          }
        });
      }
    });
  }

  resize(W,H){
    this.renderer.setSize(W,H,false);
    const aspect=W/H;
    // rescale character planes
    const charAspect=0.55;
    const charH=1.82;
    [this.samMesh,this.yasMesh].forEach(m=>{
      const charW=charH*charAspect/aspect*(W/H<1?1:1);
      m.scale.set(1,1,1); // let shader handle it via geometry rebuild would be ideal but skip for now
    });
  }

  _raf(){
    const loop=()=>{
      requestAnimationFrame(loop);
      const t=this.clock.getElapsedTime();
      this.uniforms.uTime.value=t;
      this.bgMat.uniforms.uTime.value=t;
      this.particleMat.uniforms.uTime.value=t;
      this.scanMat.uniforms.uTime.value=t;
      this.renderer.render(this.scene,this.camera);
    };
    loop();
  }
}

/* ── TONE.JS AUDIO ENGINE ──────────────────────────── */
class ToneAudio {
  constructor(){
    this.started=false;
    this.muted=false;
    this._built=false;
  }
  async start(){
    if(this.started) return;
    this.started=true;
    await Tone.start();
    this._build();
  }
  _build(){
    if(this._built) return;
    this._built=true;

    // Master limiter → destination
    this.master = new Tone.Limiter(-2).toDestination();
    this.masterVol = new Tone.Volume(0).connect(this.master);

    // Ambient drone: two detuned oscillators through reverb
    this.reverb = new Tone.Reverb({decay:4,wet:0.5}).connect(this.masterVol);
    this.drone1 = new Tone.Oscillator({frequency:'A1',type:'sine'}).connect(this.reverb);
    this.drone2 = new Tone.Oscillator({frequency:'E2',type:'sine'}).connect(this.reverb);
    this.drone1.volume.value=-22;
    this.drone2.volume.value=-25;
    this.drone1.start();
    this.drone2.start();

    // Rain noise through bandpass
    this.rainNoise = new Tone.Noise('pink');
    this.rainFilter = new Tone.Filter({frequency:900,type:'bandpass',Q:0.6});
    this.rainVol = new Tone.Volume(-28).connect(this.masterVol);
    this.rainNoise.connect(this.rainFilter);
    this.rainFilter.connect(this.rainVol);
    this.rainNoise.start();

    // Glitch LFO on drone pitch
    this.glitchLFO = new Tone.LFO({frequency:0.1,min:0,max:0}).start();
    this.glitchLFO.connect(this.drone1.detune);

    // Warm melody: plucked synth for endings
    this.pluck = new Tone.PluckSynth({attackNoise:1,dampening:3000}).connect(this.masterVol);
    this.pluck.volume.value=-18;
  }

  setScene(scene){
    if(!this._built) return;
    const glitch=scene.includes('glitch')||scene.includes('dissolve');
    const warm  =scene.includes('warm')||scene.includes('dawn');
    const street=scene.includes('street')||scene.includes('storm');

    // Transition rain level
    const rainDb=street?-20:glitch?-30:-32;
    this.rainVol.volume.rampTo(rainDb,1.5);

    // Drone intensity
    const d1db=glitch?-16:warm?-28:-22;
    const d2db=glitch?-18:warm?-30:-25;
    this.drone1.volume.rampTo(d1db,1.5);
    this.drone2.volume.rampTo(d2db,1.5);

    // Glitch LFO
    if(glitch){
      this.glitchLFO.max.value=80;
      this.glitchLFO.frequency.rampTo(2,0.5);
    } else {
      this.glitchLFO.max.value=0;
      this.glitchLFO.frequency.rampTo(0.1,2);
    }

    // Warm scene: chord pluck
    if(warm){
      const notes=['C4','E4','G4','B4'];
      notes.forEach((n,i)=>Tone.Transport.scheduleOnce(()=>this.pluck.triggerAttack(n),`+${i*0.3}`));
    }
  }

  toggle(){
    if(!this._built) return;
    this.muted=!this.muted;
    this.masterVol.volume.rampTo(this.muted?-80:0,.5);
    return this.muted;
  }

  glitchHit(){
    if(!this._built) return;
    this.drone1.volume.rampTo(-12,.05);
    setTimeout(()=>this.drone1.volume.rampTo(-22,.4),120);
    // quick arp
    ['A2','C3','F3'].forEach((n,i)=>{
      Tone.Transport.scheduleOnce(()=>this.pluck.triggerAttack(n),`+${i*.08}`);
    });
  }
}

/* ── TYPEWRITER ────────────────────────────────────── */
class Typewriter {
  constructor(el){
    this.el=el;
    this._id=null;
    this.done=false;
  }
  write(text,onDone){
    clearInterval(this._id);
    this.el.textContent='';
    this.done=false;
    let i=0;
    const chars=[...text];
    this._id=setInterval(()=>{
      this.el.textContent+=chars[i++]??'';
      if(i>=chars.length){
        clearInterval(this._id);
        this.done=true;
        if(onDone) onDone();
      }
    },28);
  }
  finish(){
    clearInterval(this._id);
    // el.textContent already has partial; but we need full text stored
    this.done=true;
  }
  setFull(text){
    clearInterval(this._id);
    this.el.textContent=text;
    this.done=true;
  }
}

/* ── GAME ENGINE ───────────────────────────────────── */
class Game {
  constructor(){
    this.stage   = document.getElementById('stage');
    this.canvas  = document.getElementById('three-canvas');
    this.three   = null; // lazy init

    this.dialogue  = document.getElementById('dialogue');
    this.namePlate = document.getElementById('name-plate');
    this.textOut   = document.getElementById('text-out');
    this.tapHint   = document.getElementById('tap-hint');
    this.choices   = document.getElementById('choices');
    this.titleScreen=document.getElementById('title-screen');
    this.flash     = document.getElementById('flash');

    this.audio = new ToneAudio();
    this.tw    = new Typewriter(this.textOut);

    this.path  = 'main';
    this.index = 0;
    this.waiting = false;
    this.inChoice= false;
    this.started = false;
    this.lastScene='';

    this._setupUI();
    this._setupPointer();
    this._resize();
    window.addEventListener('resize',()=>this._resize());
  }

  _resize(){
    // stage is CSS-sized; sync canvas resolution
    const s=this.stage;
    const W=s.offsetWidth, H=s.offsetHeight;
    if(this.three) this.three.resize(W,H);
  }

  _setupUI(){
    // Title start
    const startBtn=document.getElementById('start-btn');
    startBtn.addEventListener('click',()=>this._start());
    startBtn.addEventListener('touchend',e=>{e.preventDefault();this._start();});

    // Sound toggle
    document.getElementById('sound-btn').addEventListener('click',()=>{
      const m=this.audio.toggle();
      document.getElementById('sound-btn').textContent=m?'🔇':'🔊';
    });

    // Key modal
    const keyBtn=document.getElementById('key-btn');
    const keyModal=document.getElementById('key-modal');
    const keyClose=document.getElementById('key-close');
    const keySave=document.getElementById('key-save');
    keyBtn.addEventListener('click',()=>this._openModal(keyModal));
    keyBtn.addEventListener('touchend',e=>{e.preventDefault();this._openModal(keyModal);});
    keyClose.addEventListener('click',()=>this._closeModal(keyModal));
    keySave.addEventListener('click',()=>{
      const v=document.getElementById('key-input').value.trim();
      if(v) localStorage.setItem('sgc_api_key',v);
      this._closeModal(keyModal);
    });

    // Oracle continue
    document.getElementById('oracle-continue').addEventListener('click',()=>this._closeOracle());
    document.getElementById('oracle-continue').addEventListener('touchend',e=>{
      e.preventDefault();this._closeOracle();
    });

    // Oracle api submit
    document.getElementById('oracle-api-submit').addEventListener('click',()=>{
      const v=document.getElementById('oracle-api-input').value.trim();
      if(v){ localStorage.setItem('sgc_api_key',v); this._retryOracle(); }
    });

    // Replay
    document.getElementById('end-replay').addEventListener('click',()=>location.reload());

    // Pre-fill key
    const saved=localStorage.getItem('sgc_api_key');
    if(saved) document.getElementById('key-input').value=saved;
  }

  _openModal(el){
    gsap.to(el,{opacity:1,duration:.35,onStart:()=>el.classList.add('open')});
  }
  _closeModal(el){
    gsap.to(el,{opacity:0,duration:.3,onComplete:()=>el.classList.remove('open')});
  }

  _start(){
    if(this.started) return;
    this.started=true;
    this.audio.start();
    gsap.to(this.titleScreen,{opacity:0,duration:.9,
      onComplete:()=>this.titleScreen.classList.add('hidden')});
    // Init Three.js now
    this.three=new ThreeRenderer(this.canvas);
    this._resize();
    this.three.hideAllChars();
    setTimeout(()=>this._advance(),600);
  }

  _setupPointer(){
    // Single unified pointer handler on the stage
    this.stage.addEventListener('pointerdown',e=>{
      // Ignore clicks on buttons/inputs
      const tag=e.target.tagName;
      if(tag==='BUTTON'||tag==='INPUT') return;
      // Ignore if choice panel is active
      if(this.inChoice) return;
      // Ignore if oracle/keymodal open
      if(document.getElementById('oracle-panel').classList.contains('open')) return;
      if(document.getElementById('key-modal').classList.contains('open')) return;
      this._tap();
    });
  }

  _tap(){
    if(!this.started||!this.waiting) return;
    if(this.tw.done){
      this._advance();
    } else {
      // finish typewriter, then show tap hint
      const beat=STORY[this.path][this.index-1];
      if(beat) this.tw.setFull(beat.text||'');
      gsap.to(this.tapHint,{opacity:.35,duration:.3});
    }
  }

  _advance(){
    const beats=STORY[this.path];
    if(!beats||this.index>=beats.length){
      // path ended — shouldn't happen (all paths end in goto or oracle)
      return;
    }
    const beat=beats[this.index];
    this.index++;
    this.waiting=false;

    // If beat has goto, append next path immediately after current
    if(beat.goto){
      // queue the goto path at end of current
      STORY[this.path]=[...beats.slice(0,this.index),...STORY[beat.goto]];
      delete beat.goto;
    }

    this._playBeat(beat);
  }

  _playBeat(beat){
    // Scene change
    if(beat.scene && beat.scene!==this.lastScene){
      this._changeScene(beat.scene);
    }

    // Glitch effect
    if(beat.effect){
      if(beat.effect.includes('glitch')){
        const intensity=beat.effect.includes('major')?1.2:beat.effect.includes('medium')?0.7:0.4;
        setTimeout(()=>{
          if(this.three) this.three.pulseGlitch(intensity);
          this.audio.glitchHit();
          // quick flash
          gsap.to(this.flash,{opacity:.8,duration:.05,
            onComplete:()=>gsap.to(this.flash,{opacity:0,duration:.25})});
        },200);
      }
    }

    switch(beat.char){
      case 'narration': this._showNarration(beat); break;
      case 'choice':    this._showChoice(beat);    break;
      case 'oracle':    this._showOracle(beat);    break;
      default:          this._showDialogue(beat);  break;
    }
  }

  _changeScene(scene){
    this.lastScene=scene;
    if(this.three) this.three.setScene(scene,
      scene.includes('glitch')?0.4:0,
      scene.includes('warm')||scene.includes('dawn')?0.6:0
    );
    this.audio.setScene(scene);
    // Quick flash transition between major scene changes
    gsap.to(this.flash,{opacity:.35,duration:.15,
      onComplete:()=>gsap.to(this.flash,{opacity:0,duration:.4})});
  }

  _updateChars(charName){
    if(!this.three) return;
    if(charName==='sam') this.three.showCharacter('sam');
    else if(charName==='yasmin') this.three.showCharacter('yasmin');
    else if(charName==='narration'||charName==='choice')
      this.three.showCharacter(null);
  }

  _showDialogue(beat){
    this._updateChars(beat.char);
    this.dialogue.classList.remove('hidden','narration-mode');
    this.choices.classList.remove('visible');
    gsap.to(this.choices,{opacity:0,duration:.2,onComplete:()=>{
      this.choices.innerHTML='<div id="choices-header">— choose —</div>';
      this.inChoice=false;
    }});

    const isSam=beat.char==='sam';
    this.namePlate.textContent = isSam ? 'Sam' : 'Yasmin';
    this.namePlate.style.color = beat.col||'var(--rose)';

    gsap.to(this.tapHint,{opacity:0,duration:.2});
    this.tw.write(beat.text,()=>{
      gsap.to(this.tapHint,{opacity:.35,duration:.5,delay:.3});
    });
    this.waiting=true;
  }

  _showNarration(beat){
    this._updateChars('narration');
    this.dialogue.classList.remove('hidden');
    this.dialogue.classList.add('narration-mode');
    this.choices.classList.remove('visible');
    gsap.to(this.choices,{opacity:0,duration:.2});

    gsap.to(this.tapHint,{opacity:0,duration:.2});
    this.tw.write(beat.text,()=>{
      gsap.to(this.tapHint,{opacity:.35,duration:.5,delay:.3});
    });
    this.waiting=true;
  }

  _showChoice(beat){
    this._updateChars('choice');
    this.dialogue.classList.add('hidden');
    this.inChoice=true;
    this.waiting=false;

    // Build choice buttons
    const c=this.choices;
    c.innerHTML='<div id="choices-header">— choose —</div>';
    beat.choices.forEach((ch,i)=>{
      const btn=document.createElement('button');
      btn.className='c-btn';
      btn.textContent=ch.label;
      btn.style.opacity='0';
      btn.style.transform='translateY(12px)';
      const handler=()=>{
        this.inChoice=false;
        this.path=ch.path;
        this.index=0;
        gsap.to(c,{opacity:0,duration:.25,onComplete:()=>{
          c.classList.remove('visible');
          c.innerHTML='<div id="choices-header">— choose —</div>';
          this._advance();
        }});
      };
      btn.addEventListener('click',handler);
      btn.addEventListener('touchend',e=>{e.preventDefault();handler();});
      c.appendChild(btn);
    });

    // Animate in
    gsap.to(c,{opacity:1,duration:.3,
      onStart:()=>c.classList.add('visible'),
      onComplete:()=>{
        c.querySelectorAll('.c-btn').forEach((b,i)=>{
          gsap.to(b,{opacity:1,y:0,duration:.3,delay:i*.08});
        });
      }
    });
  }

  _showOracle(beat){
    this._updateChars(null);
    const panel=document.getElementById('oracle-panel');
    document.getElementById('oracle-question').textContent=beat.question;
    document.getElementById('oracle-response').innerHTML='<div id="oracle-loading"></div>';
    document.getElementById('oracle-continue').style.display='none';
    document.getElementById('oracle-api-row').classList.add('hidden');

    gsap.to(panel,{opacity:1,duration:.6,onStart:()=>panel.classList.add('open')});
    this._oracleBeat=beat;
    this._callOracle(beat);
  }

  async _callOracle(beat){
    const key=localStorage.getItem('sgc_api_key');
    const respEl=document.getElementById('oracle-response');

    if(!key){
      respEl.textContent=beat.fallback;
      const row=document.getElementById('oracle-api-row');
      row.classList.remove('hidden');
      document.getElementById('oracle-continue').style.display='inline-block';
      return;
    }

    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':key,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true',
        },
        body:JSON.stringify({
          model:'claude-opus-4-5',
          max_tokens:220,
          messages:[{
            role:'user',
            content:`You are Sam from "Sam's Glitched Cafe" — a digital entity who has been stuck in a loop inside a virtual cafe. The player just finished your story and helped you. You have one last thing to say. Be warm, slightly poetic, and personal. 2-3 sentences max. The question/prompt: "${beat.question}". Ending type: ${beat.ending}.`
          }]
        })
      });
      if(!res.ok) throw new Error('API error');
      const data=await res.json();
      const text=data.content?.[0]?.text||beat.fallback;
      respEl.textContent='';
      let i=0;
      const chars=[...text];
      const t=setInterval(()=>{
        respEl.textContent+=chars[i++]??'';
        if(i>=chars.length) clearInterval(t);
      },20);
    } catch(e){
      respEl.textContent=beat.fallback;
    }
    document.getElementById('oracle-continue').style.display='inline-block';
  }

  _retryOracle(){
    if(this._oracleBeat) this._callOracle(this._oracleBeat);
  }

  _closeOracle(){
    const panel=document.getElementById('oracle-panel');
    gsap.to(panel,{opacity:0,duration:.5,onComplete:()=>panel.classList.remove('open')});
    setTimeout(()=>this._showEndCard(),600);
  }

  _showEndCard(){
    const path=this._oracleBeat?.ending||'A';
    const data=ENDINGS[path]||ENDINGS.A;
    document.getElementById('end-title').textContent='Ending '+path;
    document.getElementById('end-name').textContent=data.name;
    document.getElementById('end-sub').textContent=data.sub;

    const card=document.getElementById('end-card');
    gsap.to(card,{opacity:1,duration:.8,onStart:()=>card.classList.add('show')});
    if(this.three) this.three.setScene('cafe-dawn',0,1);
    this.audio.setScene('cafe-dawn');
  }
}

/* ── BOOT ──────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded',()=>new Game());
</script>
</body>
</html>"""

# Inject base64 images
HTML = HTML.replace('{{YASMIN_SRC}}', yasmin)
HTML = HTML.replace('{{SAM_SRC}}', sam)

with open(OUT,'w') as f:
    f.write(HTML)
print(f"Built → {OUT}  ({len(HTML)//1024}KB)")
