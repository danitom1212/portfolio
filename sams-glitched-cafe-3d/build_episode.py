import base64, os

SCRATCHPAD = "/tmp/claude-0/-home-user-portfolio/15ddd2a7-341d-5991-bccc-6096101d23b1/scratchpad"
VRM = f"{SCRATCHPAD}/vrmrender"
OUT = f"{SCRATCHPAD}/episode_final.html"

def b64(path, mime="image/png"):
    with open(path,"rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"

yasmin = b64(f"{VRM}/yasmin_nobg.png")
sam    = b64(f"{VRM}/sam_nobg.png")

CSS = """
:root{
  --cream:#fff8ee;--caramel:#e8923a;--caramel-l:#f5b566;
  --rose:#e5758f;--rose-l:#f29ab0;--cyan:#40d8ff;
  --twilight:#1e0848;--midnight:#0d0528;--void:#080218;
  --text:rgba(255,248,240,.97);--text-dim:rgba(220,205,240,.78);
  --ui-bg:rgba(5,3,14,.97);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{width:100%;height:100%;overflow:hidden;background:#050310;touch-action:none}
#wrap{position:fixed;inset:0;background:#050310}
#phaser-root{position:absolute;inset:0;z-index:1}
#phaser-root canvas{display:block;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}

/* overlay sits over canvas */
#overlay{position:fixed;inset:0;z-index:10;pointer-events:none;font-family:'Nunito',system-ui,sans-serif}

/* grain */
#grain{
  position:absolute;inset:0;z-index:1;pointer-events:none;
  opacity:.04;mix-blend-mode:soft-light;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:150px 150px;
  animation:grainShift .5s steps(2) infinite;
}
@keyframes grainShift{
  0%{background-position:0 0}25%{background-position:3px -4px}
  50%{background-position:-2px 6px}75%{background-position:5px 2px}
}

/* dialogue */
#dialogue{
  position:absolute;bottom:0;left:0;right:0;z-index:20;
  padding:3% 8% 12%;min-height:30%;
  background:linear-gradient(transparent,rgba(5,3,14,.94) 18%,rgba(5,3,14,.98));
  pointer-events:auto;cursor:pointer;
  transition:opacity .3s,transform .3s;
  opacity:0;transform:translateY(10px);
}
#dialogue.visible{opacity:1;transform:translateY(0)}
#dialogue.narration-mode #name-plate{display:none}
#dialogue.narration-mode #text-out{
  color:var(--text-dim);font-style:italic;text-align:center;padding:0 5%
}
#name-plate{
  font-size:clamp(8px,2.5vw,12px);font-weight:700;letter-spacing:.22em;
  text-transform:uppercase;margin-bottom:10px;padding:4px 16px 4px 12px;
  border-left:3px solid currentColor;border-radius:0 20px 20px 0;
  display:inline-block;background:rgba(8,4,20,.93);
  text-shadow:0 0 20px currentColor;color:var(--caramel);
}
#text-out{
  font-family:'Playfair Display',Georgia,serif;
  font-size:clamp(14px,4.2vw,21px);line-height:1.65;
  color:var(--text);letter-spacing:.008em;min-height:3.2em;
}
#tap-hint{
  position:absolute;right:8%;bottom:10%;
  font-size:clamp(8px,2.3vw,11px);color:rgba(200,185,230,.35);
  letter-spacing:.15em;pointer-events:none;
  opacity:0;transition:opacity .4s;animation:tapPulse 1.8s ease-in-out infinite;
}
#tap-hint.show{opacity:1}
@keyframes tapPulse{0%,100%{opacity:.35}50%{opacity:.7}}

/* choices */
#choices{
  position:absolute;bottom:0;left:0;right:0;z-index:25;
  padding:4% 8% 12%;display:flex;flex-direction:column;gap:10px;
  background:linear-gradient(transparent,rgba(5,3,14,.97) 15%,rgba(5,3,14,.99));
  pointer-events:none;opacity:0;transition:opacity .4s;
}
#choices.visible{pointer-events:auto;opacity:1}
#choices-header{
  font-size:clamp(8px,2.2vw,10px);font-weight:600;letter-spacing:.28em;
  text-transform:uppercase;color:rgba(200,185,230,.32);margin-bottom:4px;
}
.c-btn{
  font-family:'Nunito',sans-serif;font-size:clamp(12px,3.5vw,16px);
  font-weight:600;color:rgba(240,232,255,.85);
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  border-radius:14px;padding:14px 20px;cursor:pointer;text-align:left;
  transition:background .2s,border-color .2s,color .2s,transform .12s;
  letter-spacing:.01em;line-height:1.4;
}
.c-btn::before{content:'▸ ';color:rgba(232,146,58,.45);transition:color .2s}
.c-btn:active,.c-btn:hover{
  background:rgba(232,146,58,.1);border-color:rgba(232,146,58,.35);
  color:var(--caramel-l);transform:translateX(4px);
}
.c-btn:active::before,.c-btn:hover::before{color:var(--caramel)}

/* oracle */
#oracle-panel{
  position:absolute;inset:0;z-index:40;
  display:flex;align-items:center;justify-content:center;
  background:rgba(5,3,14,.88);backdrop-filter:blur(5px);
  pointer-events:none;opacity:0;transition:opacity .4s;
}
#oracle-panel.open{pointer-events:auto;opacity:1}
#oracle-inner{
  width:88%;padding:32px 28px;
  background:rgba(10,5,24,.97);border:1px solid rgba(229,117,143,.22);
  border-radius:22px;text-align:center;
  box-shadow:0 0 60px rgba(229,117,143,.1),0 0 120px rgba(232,146,58,.06);
}
#oracle-char-name{
  font-size:clamp(8px,2.2vw,10px);font-weight:700;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(229,117,143,.55);margin-bottom:16px;
}
#oracle-question{
  font-family:'Playfair Display',serif;font-size:clamp(14px,4.2vw,20px);
  font-style:italic;color:var(--text);line-height:1.55;margin-bottom:22px;
}
#oracle-response{
  font-size:clamp(11px,3vw,14px);color:var(--text-dim);
  line-height:1.75;margin-bottom:24px;min-height:3em;
}
#oracle-loading{
  display:inline-block;width:20px;height:20px;
  border:2px solid rgba(229,117,143,.2);border-top-color:rgba(229,117,143,.8);
  border-radius:50%;animation:spin .9s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
#oracle-continue{
  font-family:'Nunito',sans-serif;font-size:clamp(10px,2.7vw,12px);font-weight:700;
  letter-spacing:.18em;text-transform:uppercase;color:rgba(229,117,143,.85);
  background:rgba(229,117,143,.08);border:1px solid rgba(229,117,143,.22);
  border-radius:40px;padding:10px 28px;cursor:pointer;transition:background .2s;display:none;
}
#oracle-continue:hover{background:rgba(229,117,143,.18)}
#oracle-api-row{margin-top:14px;display:none}
#oracle-api-input{
  font-family:'Nunito',sans-serif;font-size:clamp(10px,2.7vw,12px);
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
  border-radius:8px;padding:9px 14px;color:var(--text);width:100%;
  outline:none;margin-bottom:8px;
}
#oracle-api-submit{
  font-family:'Nunito',sans-serif;font-size:clamp(9px,2.5vw,11px);font-weight:700;
  letter-spacing:.15em;text-transform:uppercase;color:rgba(232,146,58,.85);
  background:rgba(232,146,58,.08);border:1px solid rgba(232,146,58,.2);
  border-radius:40px;padding:8px 22px;cursor:pointer;transition:background .2s;
}
#oracle-api-submit:hover{background:rgba(232,146,58,.18)}

/* end card */
#end-card{
  position:absolute;inset:0;z-index:50;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  pointer-events:none;opacity:0;transition:opacity .6s;
  background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(30,8,72,.85) 0%,rgba(5,3,14,.97) 100%);
}
#end-card.show{pointer-events:auto;opacity:1}
#end-card-inner{text-align:center;padding:0 12%}
#end-title{
  font-family:'Playfair Display',serif;font-size:clamp(10px,2.8vw,13px);
  font-weight:500;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(229,117,143,.55);margin-bottom:14px;
}
#end-name{
  font-family:'Playfair Display',serif;font-size:clamp(24px,7.5vw,38px);
  font-weight:700;font-style:italic;color:var(--caramel-l);margin-bottom:10px;
  text-shadow:0 0 40px rgba(232,146,58,.5);
  animation:endShimmer 3s ease-in-out infinite;
}
@keyframes endShimmer{
  0%,100%{text-shadow:0 0 40px rgba(232,146,58,.5)}
  50%{text-shadow:0 0 60px rgba(245,181,102,1),0 0 120px rgba(232,146,58,.4)}
}
#end-sub{font-size:clamp(11px,3vw,14px);color:var(--text-dim);line-height:1.75;margin-bottom:28px}
#end-replay{
  font-family:'Nunito',sans-serif;font-size:clamp(9px,2.5vw,11px);font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;color:rgba(200,185,230,.45);
  background:transparent;border:1px solid rgba(200,185,230,.18);
  border-radius:40px;padding:11px 26px;cursor:pointer;transition:border-color .2s,color .2s;
}
#end-replay:hover{border-color:rgba(200,185,230,.5);color:rgba(200,185,230,.85)}
"""

STORY_JS = r"""
const STORY = {
  main:[
    {scene:'street',char:'narration',text:'Rain on a city you don\'t recognize.'},
    {scene:'street',char:'narration',text:'Neon signs blurring into watercolour.'},
    {scene:'street',char:'narration',text:'A cafe glows at the end of the block.'},
    {scene:'cafe-enter',char:'narration',text:'The sign reads: THE GLITCHED CAFE.'},
    {scene:'cafe-enter',char:'narration',text:'You push the door open.'},
    {scene:'cafe-int',char:'sam',text:'We\'re closed.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'…Actually. No. Come in.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I don\'t know why I said that. We\'re not closed.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'narration',text:'The barista looks at you with something between relief and suspicion.'},
    {scene:'cafe-int',char:'sam',text:'What can I get you?',col:'var(--caramel)'},
    {scene:'cafe-int',char:'choice',choices:[
      {label:'Just coffee. Black.',path:'c1a'},
      {label:'Whatever you recommend.',path:'c1b'},
      {label:'Actually, I just came in from the rain.',path:'c1c'},
    ]},
  ],
  c1a:[
    {scene:'cafe-int',char:'sam',text:'Easy order.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I like easy.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'Honest answer?',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I\'m not entirely sure.',col:'var(--caramel)',goto:'act2'},
  ],
  c1b:[
    {scene:'cafe-int',char:'sam',text:'Nobody ever says that.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I\'ll make you something that matches the weather.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'Honest answer?',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I\'m not entirely sure.',col:'var(--caramel)',goto:'act2'},
  ],
  c1c:[
    {scene:'cafe-int',char:'sam',text:'Yeah.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'That\'s why most people come in.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'Honest answer?',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'I\'m not entirely sure.',col:'var(--caramel)',goto:'act2'},
  ],
  act2:[
    {scene:'cafe-int',char:'sam',text:'I\'m Sam. This is the Glitched Cafe.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'My boss named it. She says every good cafe has a soul.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'sam',text:'This one has static.',col:'var(--caramel)',effect:'glitch-small'},
    {scene:'cafe-int',char:'narration',text:'She\'s charming in a way that feels slightly… off.'},
    {scene:'cafe-int',char:'narration',text:'Like a memory of something warm.'},
    {scene:'cafe-storm',char:'sam',text:'Do you ever feel like you\'re in a loop?',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',text:'Like you\'ve had this exact conversation before, but you can\'t remember with who?',col:'var(--caramel)',effect:'glitch-medium'},
    {scene:'cafe-storm',char:'sam',text:'Sorry. That was weird. I get like that when the weather\'s bad.',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'choice',choices:[
      {label:'I feel that way sometimes.',path:'c2a'},
      {label:'Are you okay?',path:'c2b'},
      {label:'What kind of loop?',path:'c2c'},
    ]},
  ],
  c2a:[
    {scene:'cafe-storm',char:'sam',text:'You understand, then.',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',text:'That feeling where time… skips.',col:'var(--caramel)',goto:'act3'},
  ],
  c2b:[
    {scene:'cafe-storm',char:'sam',text:'Define okay.',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',text:'I make really good coffee. I remember every order. I know this place like the back of my hand.',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',text:'I just… don\'t remember how I got here.',col:'var(--caramel)',goto:'act3'},
  ],
  c2c:[
    {scene:'cafe-storm',char:'sam',text:'Same conversation. Same storm. Same person walking in.',col:'var(--caramel)'},
    {scene:'cafe-storm',char:'sam',text:'Maybe. I don\'t know. It sounds crazy.',col:'var(--caramel)',goto:'act3'},
  ],
  act3:[
    {scene:'cafe-glitch',char:'narration',text:'The lights flicker.',effect:'glitch-major'},
    {scene:'cafe-glitch',char:'narration',text:'For half a second, you see someone else standing behind Sam.'},
    {scene:'cafe-glitch',char:'sam',text:'…There it goes again.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'The electricity in this place. It\'s always doing that.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'She\'s been stuck here for a long time.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'— Yasmin.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'This is Yasmin. She… checks in sometimes.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'I\'m trying to help her remember.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',text:'And maybe you can too.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'narration',text:'Something about the way Yasmin moves is wrong.'},
    {scene:'cafe-glitch',char:'narration',text:'Not wrong-scary. Wrong-translucent.'},
    {scene:'cafe-glitch',char:'narration',text:'Like she\'s being rendered from memory.'},
    {scene:'cafe-glitch',char:'yasmin',text:'Sam coded this cafe.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'Yasmin—',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'No. They deserve to know.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',text:'Sam built this place as a creative project. Digital architecture. Art and code.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',text:'And then she got… stuck. The code kept running.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'I don\'t feel stuck.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'You told me that last time too.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'So now you know.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'I exist in a loop. This cafe exists in a loop.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'You could just go. Walk back out into the rain.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'Or you could help me remember.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'choice',choices:[
      {label:'Tell me what you remember.',path:'endA'},
      {label:'What does remembering mean for you?',path:'endB'},
      {label:'I want to understand the code.',path:'endC'},
    ]},
  ],
  endA:[
    {scene:'cafe-warm',char:'sam',text:'Okay.',col:'var(--caramel)'},
    {scene:'cafe-warm',char:'sam',text:'I remember… a window. In an apartment somewhere.',col:'var(--caramel)'},
    {scene:'cafe-warm',char:'sam',text:'Coffee always burned because I kept forgetting to watch it.',col:'var(--caramel)'},
    {scene:'cafe-warm',char:'sam',text:'A song I can\'t quite hear anymore.',col:'var(--caramel)'},
    {scene:'cafe-warm',char:'yasmin',text:'Keep going.',col:'var(--rose)'},
    {scene:'cafe-warm',char:'sam',text:'A face. Yours.',col:'var(--caramel)'},
    {scene:'cafe-warm',char:'sam',text:'And now yours.',col:'var(--caramel)'},
    {scene:'cafe-dawn',char:'sam',text:'Oh.',col:'var(--caramel)'},
    {scene:'cafe-dawn',char:'sam',text:'Oh, it\'s—',col:'var(--caramel)'},
    {scene:'cafe-dawn',char:'sam',text:'Thank you.',col:'var(--caramel)'},
    {scene:'cafe-dawn',char:'narration',text:'The glitches stop.'},
    {scene:'cafe-dawn',char:'narration',text:'The cafe hums quietly.'},
    {scene:'cafe-dawn',char:'narration',text:'Sam looks at her hands. They\'re solid.'},
    {scene:'cafe-dawn',char:'yasmin',text:'There she is.',col:'var(--rose)'},
    {scene:'cafe-dawn',char:'narration',text:'You don\'t know what happened, exactly.'},
    {scene:'cafe-dawn',char:'narration',text:'But something in the static resolved into signal.'},
    {scene:'cafe-dawn',char:'oracle',ending:'A',
      question:'You helped me remember. I want to ask you something before you go.',
      fallback:'What you did — sitting with someone in their static, not trying to fix it but just listening — that\'s rarer than you think. The signal was always there. You just helped me hear it.'},
  ],
  endB:[
    {scene:'cafe-glitch',char:'yasmin',text:'That\'s the right question.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'No one\'s ever asked that before.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'For me, remembering is… warmth? The feeling of a Tuesday morning.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'Something that isn\'t a loop.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'Maybe the loop isn\'t a problem.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'yasmin',text:'Maybe it\'s the form the story wants to take.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'Then what are we supposed to do?',col:'var(--caramel)'},
    {scene:'cafe-int',char:'yasmin',text:'Live in it. Beautifully.',col:'var(--rose)'},
    {scene:'cafe-int',char:'narration',text:'The rain doesn\'t stop.'},
    {scene:'cafe-int',char:'narration',text:'The glitches continue.'},
    {scene:'cafe-int',char:'narration',text:'But somehow, that feels… okay.'},
    {scene:'cafe-int',char:'narration',text:'You order another coffee.'},
    {scene:'cafe-int',char:'sam',text:'It\'ll be perfect. It always is.',col:'var(--caramel)'},
    {scene:'cafe-int',char:'narration',text:'You both listen to the sound of a world that keeps rendering.'},
    {scene:'cafe-int',char:'oracle',ending:'B',
      question:'You asked the question no one ever asks. I want to ask one back.',
      fallback:'You chose to sit with ambiguity instead of resolving it. That takes something — a willingness to let things be unfinished, incomplete, still running. The loop is the story. You understood that.'},
  ],
  endC:[
    {scene:'cafe-glitch',char:'sam',text:'The code.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'Oh, that\'s interesting.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'Why is that interesting?',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'Because if you understand the code, you might be able to wake up.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'sam',text:'I\'m not asleep.',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'yasmin',text:'No. But you might be a dream.',col:'var(--rose)'},
    {scene:'cafe-glitch',char:'narration',text:'The walls of the cafe become transparent.'},
    {scene:'cafe-glitch',char:'narration',text:'You can see the structure underneath. The loops. The calls. The memory allocations.'},
    {scene:'cafe-glitch',char:'sam',text:'…Is that what I look like from outside?',col:'var(--caramel)'},
    {scene:'cafe-glitch',char:'sam',text:'I\'m beautiful.',col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'sam',text:'Go. Live your whole messy, non-looping life.',col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'sam',text:'I\'ll be here.',col:'var(--caramel)'},
    {scene:'cafe-dissolve',char:'oracle',ending:'C',
      question:'You wanted to see behind the curtain. Most people don\'t. So tell me —',
      fallback:'You looked for the architecture when everyone else just drinks the coffee. That instinct — to understand the system you\'re inside — is rare and a little dangerous and completely worth it. The code is beautiful. So is knowing it\'s there.'},
  ],
};

const ENDINGS={
  A:{name:'The Signal',sub:'You helped her remember what it felt like to be seen.'},
  B:{name:'The Loop',sub:'Some things are more beautiful for never ending.'},
  C:{name:'The Architecture',sub:'You looked behind the curtain. What you found was worth it.'},
};
"""

PHASER_JS = r"""
/* ════ PHASER SCENES ════════════════════════════════════════════════════════ */

// ── Boot Scene ──────────────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor(){ super({key:'Boot'}); }

  preload(){
    const g = this.make.graphics({add:false});
    g.fillStyle(0xffffff,1); g.fillRect(0,0,2,2);
    g.generateTexture('px',2,2); g.destroy();

    const g2 = this.make.graphics({add:false});
    g2.fillStyle(0xaabbff,.9);
    g2.fillRect(0,0,1,10);
    g2.generateTexture('rain',1,10); g2.destroy();

    const g3 = this.make.graphics({add:false});
    g3.fillStyle(0xffffff,1);
    g3.fillCircle(3,3,3);
    g3.generateTexture('dust',6,6); g3.destroy();

    this.load.image('yasmin', YASMIN_IMG);
    this.load.image('sam',    SAM_IMG);
  }

  create(){ this.scene.start('Title'); }
}

// ── Title Scene ─────────────────────────────────────────────────────────────
class TitleScene extends Phaser.Scene {
  constructor(){ super({key:'Title'}); }

  create(){
    const W = this.scale.width, H = this.scale.height;

    // sky gradient (top dark indigo → bottom deep purple)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x040214,0x040214,0x2d1a58,0x2d1a58);
    bg.fillRect(0,0,W,H);

    // city skyline silhouette
    const sl = this.add.graphics();
    sl.fillStyle(0x090620,1);
    const pts=[
      0,H, 0,H*.68, W*.04,H*.68, W*.04,H*.6, W*.09,H*.6, W*.09,H*.55,
      W*.13,H*.55, W*.13,H*.63, W*.17,H*.63, W*.17,H*.53, W*.22,H*.53,
      W*.22,H*.60, W*.28,H*.60, W*.28,H*.52, W*.34,H*.52, W*.34,H*.58,
      W*.40,H*.58, W*.40,H*.49, W*.46,H*.49, W*.46,H*.55, W*.52,H*.55,
      W*.52,H*.47, W*.60,H*.47, W*.60,H*.44, W*.66,H*.44, W*.66,H*.51,
      W*.72,H*.51, W*.72,H*.46, W*.78,H*.46, W*.78,H*.54, W*.84,H*.54,
      W*.84,H*.49, W*.90,H*.49, W*.90,H*.55, W*.95,H*.55, W*.95,H*.52,
      W,H*.52, W,H
    ];
    const pArr=[];for(let i=0;i<pts.length;i+=2)pArr.push({x:pts[i],y:pts[i+1]});
    sl.fillPoints(pArr,true);

    // accent glow (city orange)
    const glow=this.add.graphics();
    glow.fillStyle(0xe8923a,.055);
    glow.fillEllipse(W*.5,H*.5,W*.9,H*.5);

    // rain effect (manual update)
    this.rainDrops=[];
    for(let i=0;i<80;i++){
      this.rainDrops.push({
        x:Math.random()*W, y:Math.random()*H,
        speed:500+Math.random()*400, alpha:.04+Math.random()*.05
      });
    }
    this.rainGfx=this.add.graphics();

    // title text objects
    const tFontSize = Math.floor(Math.min(W*.115, 52));
    const titleY = H*.34;

    const t1=this.add.text(W*.5, titleY, "Sam's",{
      fontFamily:"'Playfair Display',Georgia,serif",
      fontSize:`${tFontSize}px`, fontStyle:'bold italic',
      color:'#f5b566',
      shadow:{offsetX:0,offsetY:0,color:'#e8923a',blur:28,fill:true},
    }).setOrigin(.5,1).setAlpha(0);

    const t2=this.add.text(W*.5, titleY+8, "Glitched Café",{
      fontFamily:"'Playfair Display',Georgia,serif",
      fontSize:`${Math.floor(tFontSize*.95)}px`, fontStyle:'bold italic',
      color:'#f5b566',
      shadow:{offsetX:0,offsetY:0,color:'#e8923a',blur:28,fill:true},
    }).setOrigin(.5,0).setAlpha(0);

    const sub=this.add.text(W*.5, titleY+t2.height+tFontSize+26, 'A GLITCHED MEMORY',{
      fontFamily:"'Nunito',Arial,sans-serif",
      fontSize:`${Math.floor(W*.027)}px`,
      color:'#f5b56650', letterSpacing:7,
    }).setOrigin(.5).setAlpha(0);

    // decorative HR line
    const hr=this.add.graphics().setAlpha(0);
    const hrY = titleY+8;
    hr.lineStyle(1,0xe8923a,.35);
    hr.lineBetween(W*.5-50,hrY,W*.5+50,hrY);

    // tap hint
    const tap=this.add.text(W*.5, H*.84, '✦  TAP TO BEGIN  ✦',{
      fontFamily:"'Nunito',Arial,sans-serif",
      fontSize:`${Math.floor(W*.03)}px`, fontStyle:'bold',
      color:'#ffffff45', letterSpacing:5,
    }).setOrigin(.5).setAlpha(0);

    // fade-in sequence
    this.tweens.add({targets:t1,alpha:1,duration:1200,ease:'Power2',delay:200});
    this.tweens.add({targets:t2,alpha:1,duration:1200,ease:'Power2',delay:500});
    this.tweens.add({targets:[sub,hr],alpha:1,duration:1000,ease:'Power2',delay:900,
      onComplete:()=>{
        this.tweens.add({targets:[t1,t2],alpha:{from:.85,to:1},duration:3500,
          ease:'Sine.easeInOut',yoyo:true,repeat:-1});
      }
    });
    this.tweens.add({targets:tap,alpha:.6,duration:1000,delay:1500,
      onComplete:()=>{
        this.tweens.add({targets:tap,alpha:{from:.25,to:.75},duration:1500,
          ease:'Sine.easeInOut',yoyo:true,repeat:-1});
      }
    });

    // dust particles
    this.dustGfx=this.add.graphics();
    this.dustPts=[];
    for(let i=0;i<25;i++){
      this.dustPts.push({
        x:Math.random()*W,y:Math.random()*H,
        vx:(Math.random()-.5)*10,vy:-8-Math.random()*8,
        life:Math.random(),maxLife:4+Math.random()*5,
        size:.8+Math.random()*1.2,
        col:[0xf5b566,0xe5758f,0x40d8ff][Math.floor(Math.random()*3)]
      });
    }

    this.cameras.main.fadeIn(800);
    this.input.once('pointerdown',()=>{
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(600,()=>this.scene.start('Play'));
    });
  }

  update(t,dt){
    const d=dt/1000;
    const W=this.scale.width, H=this.scale.height;
    // rain
    this.rainGfx.clear();
    this.rainDrops.forEach(r=>{
      r.y+=r.speed*d; r.x-=25*d;
      if(r.y>H+15){r.y=-20;r.x=Math.random()*(W+100);}
      this.rainGfx.lineStyle(1,0x7799ff,r.alpha);
      this.rainGfx.lineBetween(r.x,r.y,r.x-4,r.y+14);
    });
    // dust
    this.dustGfx.clear();
    this.dustPts.forEach(p=>{
      p.life+=d; p.x+=p.vx*d; p.y+=p.vy*d;
      if(p.life>p.maxLife||p.y<-10||p.x<-10||p.x>W+10){
        p.life=0;p.x=Math.random()*W;p.y=H+10;
      }
      const a=Math.sin(Math.PI*p.life/p.maxLife)*.35;
      this.dustGfx.fillStyle(p.col,a);
      this.dustGfx.fillCircle(p.x,p.y,p.size);
    });
  }
}

// ── Play Scene ──────────────────────────────────────────────────────────────
class PlayScene extends Phaser.Scene {
  constructor(){ super({key:'Play'}); }

  create(){
    const W=this.scale.width, H=this.scale.height;
    this.W=W; this.H=H;
    this.currentSceneName='';

    // layers
    this.bgGfx     = this.add.graphics();  // z:0
    this.windowGfx = this.add.graphics();  // z:1 — window glow
    this.rainGfx   = this.add.graphics();  // z:2
    this.dustGfx   = this.add.graphics();  // z:3

    // scanlines (static)
    const scan=this.add.graphics();
    scan.setAlpha(.022);
    for(let y=0;y<H;y+=4){
      scan.fillStyle(0x000000,1);
      scan.fillRect(0,y,W,2);
    }

    // characters
    const charH = H*.85;
    const scale = charH/900; // assume PNG ~900px tall

    this.samImg = this.add.image(W*.35, H*.94,'sam')
      .setOrigin(.5,1).setScale(scale).setAlpha(0);
    this.yasmImg= this.add.image(W*.65, H*.94,'yasmin')
      .setOrigin(.5,1).setScale(scale).setAlpha(0);

    // float tweens
    this.tweens.add({targets:this.samImg,y:H*.94-14,duration:2600,
      ease:'Sine.easeInOut',yoyo:true,repeat:-1});
    this.tweens.add({targets:this.yasmImg,y:H*.94-10,duration:3000,
      ease:'Sine.easeInOut',yoyo:true,repeat:-1,delay:700});

    // glitch overlay
    this.glitchGfx=this.add.graphics();

    // vignette (static)
    const vig=this.add.graphics();
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000,.75,.75,0,0);
    vig.fillRect(0,0,W,H*.14);
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000,0,0,.65,.65);
    vig.fillRect(0,H*.86,W,H*.14);

    // rain drops data
    this.rainDrops=[];
    for(let i=0;i<70;i++){
      this.rainDrops.push({
        x:Math.random()*(W+80),y:Math.random()*H,
        speed:450+Math.random()*350,alpha:.035+Math.random()*.04
      });
    }
    this.rainActive=false;

    // dust
    this.dustPts=[];
    for(let i=0;i<20;i++){
      this.dustPts.push({
        x:Math.random()*W,y:Math.random()*H,
        vx:(Math.random()-.5)*8,vy:-6-Math.random()*6,
        life:Math.random()*5,maxLife:5+Math.random()*6,
        size:.6+Math.random(),col:[0xf5b566,0xe5758f,0x40d8ff][i%3]
      });
    }

    // ambient glitch timer
    this.glitchTimer=null;

    // connect DOM controller
    window.domCtrl.init(this);
    window.domCtrl.startStory();

    this.cameras.main.fadeIn(700);
  }

  // ─ scene palette ─────────────────────────────────────────────────────────
  setStoryScene(name){
    if(this.currentSceneName===name) return;
    this.currentSceneName=name;

    const P={
      'street':       [0x0d0528,0x0d0528,0x1a0848,0x1a0848,false],
      'cafe-enter':   [0x120630,0x120630,0x220f4a,0x220f4a,false],
      'cafe-int':     [0x150740,0x150740,0x2a1055,0x2a1055,false],
      'cafe-storm':   [0x080318,0x080318,0x12053a,0x12053a,true ],
      'cafe-glitch':  [0x050210,0x050210,0x0c0425,0x0c0425,false],
      'cafe-warm':    [0x1e0c38,0x1e0c38,0x381560,0x381560,false],
      'cafe-dawn':    [0x280f4a,0x280f4a,0x481a72,0x481a72,false],
      'cafe-dissolve':[0x050210,0x050210,0x050210,0x050210,false],
    }[name]||[0x0d0528,0x0d0528,0x1a0848,0x1a0848,false];

    this.bgGfx.clear();
    this.bgGfx.fillGradientStyle(P[0],P[1],P[2],P[3]);
    this.bgGfx.fillRect(0,0,this.W,this.H);

    // window glow for cafe
    this.windowGfx.clear();
    if(name.startsWith('cafe')){
      const accent=name==='cafe-warm'||name==='cafe-dawn'?0xe8923a:
                   name==='cafe-glitch'||name==='cafe-storm'?0xe5758f:0xe8923a;
      this.windowGfx.fillStyle(accent,.035);
      this.windowGfx.fillEllipse(this.W*.5,this.H*.38,this.W*.55,this.H*.32);
    }

    this.rainActive=P[4];

    // ambient glitch for glitch scenes
    if(name==='cafe-glitch'||name==='cafe-dissolve'){
      this._startAmbientGlitch();
    }
  }

  // ─ glitch ────────────────────────────────────────────────────────────────
  triggerGlitch(intensity){
    this.cameras.main.shake(250+intensity*150,.003*intensity);
    this.cameras.main.flash(80,40,15,70,false);
    this._drawGlitch(intensity);
  }

  _drawGlitch(intensity){
    this.glitchGfx.clear();
    const bands=Math.ceil(intensity*10);
    for(let i=0;i<bands;i++){
      const y=Math.random()*this.H;
      const h=2+Math.random()*5;
      const ox=(Math.random()-.5)*40*intensity;
      const col=Math.random()>.5?0xe5758f:0x40d8ff;
      this.glitchGfx.fillStyle(col,.25*intensity);
      this.glitchGfx.fillRect(ox,y,this.W,h);
    }
    this.tweens.add({targets:this.glitchGfx,alpha:{from:.9,to:0},
      duration:150+intensity*100,ease:'Power2'});
  }

  _startAmbientGlitch(){
    if(this.glitchTimer) return;
    const fire=()=>{
      if(this.currentSceneName!=='cafe-glitch'&&this.currentSceneName!=='cafe-dissolve'){
        this.glitchTimer=null; return;
      }
      this._drawGlitch(.25+Math.random()*.45);
      this.glitchTimer=this.time.delayedCall(1800+Math.random()*4000,fire);
    };
    this.glitchTimer=this.time.delayedCall(2000,fire);
  }

  // ─ character show/hide ───────────────────────────────────────────────────
  showChar(name){
    const sp=name==='sam'?this.samImg:this.yasmImg;
    const ot=name==='sam'?this.yasmImg:this.samImg;
    this.tweens.add({targets:sp,alpha:1,duration:380,ease:'Power2'});
    if(ot.alpha>.05){
      this.tweens.add({targets:ot,alpha:.3,duration:200});
    }
  }
  showBothChars(){
    this.tweens.add({targets:[this.samImg,this.yasmImg],alpha:1,duration:380});
  }
  hideAllChars(){
    this.tweens.add({targets:[this.samImg,this.yasmImg],alpha:0,duration:280});
  }

  update(t,dt){
    const d=dt/1000;
    // rain
    this.rainGfx.clear();
    if(this.rainActive){
      this.rainDrops.forEach(r=>{
        r.y+=r.speed*d; r.x-=22*d;
        if(r.y>this.H+10){r.y=-20;r.x=Math.random()*(this.W+80);}
        this.rainGfx.lineStyle(1,0x7799ff,r.alpha);
        this.rainGfx.lineBetween(r.x,r.y,r.x-4,r.y+13);
      });
    }
    // dust
    this.dustGfx.clear();
    this.dustPts.forEach(p=>{
      p.life+=d; p.x+=p.vx*d; p.y+=p.vy*d;
      if(p.life>p.maxLife||p.y<-10||p.x<-10||p.x>this.W+10){
        p.life=0;p.x=Math.random()*this.W;p.y=this.H+10;
      }
      const a=Math.sin(Math.PI*p.life/p.maxLife)*.22;
      this.dustGfx.fillStyle(p.col,a);
      this.dustGfx.fillCircle(p.x,p.y,p.size);
    });
  }
}

/* ════ DOM CONTROLLER ═══════════════════════════════════════════════════════ */
class DOMController {
  constructor(){
    this.scene=null;
    this.route='main'; this.beat=0;
    this.textDone=false; this.waitingTap=false;
    this.twTimer=null;

    this.dlg        = document.getElementById('dialogue');
    this.namePlate  = document.getElementById('name-plate');
    this.textOut    = document.getElementById('text-out');
    this.tapHint    = document.getElementById('tap-hint');
    this.choicesEl  = document.getElementById('choices');
    this.choicesList= document.getElementById('choices-list');
    this.oracleEl   = document.getElementById('oracle-panel');
    this.endCard    = document.getElementById('end-card');

    // tap on dialogue
    this.dlg.addEventListener('pointerdown', e=>{e.stopPropagation();this._onTap();});
  }

  init(scene){ this.scene=scene; }

  startStory(){
    // reset
    this.route='main'; this.beat=0;
    this.dlg.classList.remove('visible');
    this.choicesEl.classList.remove('visible');
    this.oracleEl.classList.remove('open');
    this.endCard.classList.remove('show');
    this.scene.hideAllChars();
    setTimeout(()=>this._showBeat(),200);
  }

  _beats(){ return STORY[this.route]; }

  _showBeat(){
    const beats=this._beats();
    if(!beats||this.beat>=beats.length) return;
    const b=beats[this.beat];

    if(b.scene) this.scene.setStoryScene(b.scene);
    if(b.char==='oracle'){ this._showOracle(b); return; }
    if(b.char==='choice'){ this._showChoices(b.choices); return; }

    this._showDialogue(b);
  }

  _showDialogue(b){
    this.textDone=false; this.waitingTap=false;
    this.choicesEl.classList.remove('visible');
    this.tapHint.classList.remove('show');
    this.textOut.textContent='';

    // name / mode
    if(b.char==='narration'){
      this.dlg.className='narration-mode';
    } else if(b.char==='sam'){
      this.dlg.className='';
      this.namePlate.textContent='SAM';
      this.namePlate.style.color='var(--caramel)';
      this.namePlate.style.borderColor='var(--caramel)';
      this.scene.showChar('sam');
    } else if(b.char==='yasmin'){
      this.dlg.className='';
      this.namePlate.textContent='YASMIN';
      this.namePlate.style.color='var(--rose)';
      this.namePlate.style.borderColor='var(--rose)';
      this.scene.showChar('yasmin');
    }

    if(b.char==='narration') this.scene.hideAllChars();

    // glitch
    if(b.effect){
      const lvl=b.effect==='glitch-major'?1:b.effect==='glitch-medium'?.6:.3;
      this.scene.triggerGlitch(lvl);
    }

    this.dlg.classList.add('visible');
    this._typewrite(b.text, ()=>{
      this.textDone=true;
      this.tapHint.classList.add('show');
      this.waitingTap=true;
    });
  }

  _typewrite(text,done){
    clearInterval(this.twTimer);
    let i=0;
    this.twTimer=setInterval(()=>{
      if(i<text.length){ this.textOut.textContent+=text[i++]; }
      else{ clearInterval(this.twTimer); done&&done(); }
    },26);
  }

  _onTap(){
    if(!this.textDone){
      // skip typewriter
      clearInterval(this.twTimer);
      const b=this._beats()[this.beat];
      if(b&&b.text) this.textOut.textContent=b.text;
      this.textDone=true;
      this.tapHint.classList.add('show');
      this.waitingTap=true;
      return;
    }
    if(!this.waitingTap) return;
    this.waitingTap=false;
    this.tapHint.classList.remove('show');

    const b=this._beats()[this.beat];
    if(b.goto){ this.route=b.goto; this.beat=0; }
    else { this.beat++; }
    this._showBeat();
  }

  _showChoices(choices){
    this.dlg.classList.remove('visible');
    this.choicesList.innerHTML='';
    choices.forEach(c=>{
      const btn=document.createElement('button');
      btn.className='c-btn'; btn.textContent=c.label;
      btn.addEventListener('pointerdown', e=>{
        e.stopPropagation();
        this.route=c.path; this.beat=0;
        this.choicesEl.classList.remove('visible');
        setTimeout(()=>this._showBeat(),350);
      });
      this.choicesList.appendChild(btn);
    });
    requestAnimationFrame(()=>this.choicesEl.classList.add('visible'));
  }

  _showOracle(b){
    const qEl   = document.getElementById('oracle-question');
    const rEl   = document.getElementById('oracle-response');
    const ldEl  = document.getElementById('oracle-loading');
    const contBtn=document.getElementById('oracle-continue');
    const apiRow= document.getElementById('oracle-api-row');
    const inp   = document.getElementById('oracle-api-input');
    const sub   = document.getElementById('oracle-api-submit');

    qEl.textContent=b.question;
    rEl.textContent='';
    ldEl.style.display='none';
    contBtn.style.display='none';
    apiRow.style.display='none';

    const key=localStorage.getItem('sgc_api_key');
    if(key){ ldEl.style.display='inline-block'; this._callOracle(b,key); }
    else   { rEl.textContent=b.fallback; contBtn.style.display='inline-block'; apiRow.style.display='block'; }

    this.oracleEl.classList.add('open');

    contBtn.onclick=()=>{
      this.oracleEl.classList.remove('open');
      const ending=b.ending;
      setTimeout(()=>this._showEnding(ending),350);
    };

    sub.onclick=()=>{
      const k=inp.value.trim();
      if(!k) return;
      localStorage.setItem('sgc_api_key',k);
      apiRow.style.display='none';
      ldEl.style.display='inline-block';
      rEl.textContent='';
      this._callOracle(b,k);
    };
  }

  async _callOracle(b,apiKey){
    const ldEl  =document.getElementById('oracle-loading');
    const rEl   =document.getElementById('oracle-response');
    const contBtn=document.getElementById('oracle-continue');
    const ctx={
      endA:'Player asked Sam to share memories. Sam recalled warmth and connection.',
      endB:'Player asked what remembering means. They accepted the loop as beautiful.',
      endC:'Player chose to understand the code. Sam revealed her digital nature with acceptance.',
    }[this.route]||'';
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true',
        },
        body:JSON.stringify({
          model:'claude-opus-4-5',max_tokens:180,
          system:`You are Sam, a warm and slightly melancholic AI entity who exists in a glitched digital cafe. You've just had a meaningful conversation. Respond in character — poetic, honest, 2–3 sentences. Never break character. Context: ${ctx}`,
          messages:[{role:'user',content:b.question}],
        }),
      });
      const data=await res.json();
      rEl.textContent=data.content?.[0]?.text||b.fallback;
    } catch(e){
      rEl.textContent=b.fallback;
    }
    ldEl.style.display='none';
    contBtn.style.display='inline-block';
  }

  _showEnding(key){
    const e=ENDINGS[key];
    document.getElementById('end-title').textContent='ENDING '+key;
    document.getElementById('end-name').textContent=e.name;
    document.getElementById('end-sub').textContent=e.sub;
    this.dlg.classList.remove('visible');
    this.endCard.classList.add('show');
    document.getElementById('end-replay').onclick=()=>{
      this.endCard.classList.remove('show');
      setTimeout(()=>this.startStory(),500);
    };
  }
}
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>Sam's Glitched Café</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Nunito:wght@400;600;700&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<style>
{CSS}
</style>
</head>
<body>
<div id="wrap">
  <div id="phaser-root"></div>
  <div id="overlay">
    <div id="grain"></div>

    <!-- dialogue panel -->
    <div id="dialogue">
      <div id="name-plate"></div>
      <div id="text-out"></div>
      <div id="tap-hint">TAP TO CONTINUE</div>
    </div>

    <!-- choices -->
    <div id="choices">
      <div id="choices-header">WHAT DO YOU DO?</div>
      <div id="choices-list"></div>
    </div>

    <!-- oracle -->
    <div id="oracle-panel">
      <div id="oracle-inner">
        <div id="oracle-char-name">✦ SAM SPEAKS ✦</div>
        <div id="oracle-question"></div>
        <div id="oracle-response"></div>
        <div id="oracle-loading"></div>
        <button id="oracle-continue">CONTINUE</button>
        <div id="oracle-api-row">
          <input id="oracle-api-input" type="password" placeholder="Anthropic API key (stored locally)">
          <button id="oracle-api-submit">UNLOCK ORACLE</button>
        </div>
      </div>
    </div>

    <!-- end card -->
    <div id="end-card">
      <div id="end-card-inner">
        <div id="end-title"></div>
        <div id="end-name"></div>
        <div id="end-sub"></div>
        <button id="end-replay">PLAY AGAIN</button>
      </div>
    </div>
  </div>
</div>

<script>
const YASMIN_IMG='{YASMIN}';
const SAM_IMG='{SAM}';

{STORY}

{PHASER}

window.domCtrl = new DOMController();

const config = {{
  type: Phaser.AUTO,
  parent: 'phaser-root',
  backgroundColor: '#050310',
  scale: {{
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }},
  scene: [BootScene, TitleScene, PlayScene],
  input: {{ activePointers: 2 }},
}};

new Phaser.Game(config);
</script>
</body>
</html>"""

html = HTML_TEMPLATE.replace('{CSS}', CSS)\
                    .replace('{YASMIN}', yasmin)\
                    .replace('{SAM}', sam)\
                    .replace('{STORY}', STORY_JS)\
                    .replace('{PHASER}', PHASER_JS)

with open(OUT, 'w') as f:
    f.write(html)

size = os.path.getsize(OUT)
print(f"Built {OUT} — {size/1024:.0f} KB")
