import './style.css';
/* Nuclear Fuel Assembly — deterministic frame-driven explainer
   34s · 30fps · frames 0..1019. Every visual state is a pure function of frame. */
const TOTAL = 1020, FPS = 30;
const C = { bg:'#0B1019', panel:'#111A2A', steel:'#344257', steel2:'#4A5E7A', bone:'#E8EEF6', dim:'#8EA2BC', cyan:'#00E5FF', gold:'#FFD166', violet:'#9D4EDD' };

type Phase = { start:number; end:number; n:string; title:string; sub:string; tag:string };
const PHASES: Phase[] = [
  { start:0,   end:149,  n:'01', title:'Reveal: fuel rods and grids', sub:'A bundle of rods, held in alignment by spacer grids. Coolant moves through the open channels between rods.', tag:'MACRO VIEW · ASSEMBLY SCALE' },
  { start:150, end:299,  n:'02', title:'Cladding and the pellet concept', sub:'Each rod is a sealed tube. Inside it, a stack of ceramic uranium dioxide (UO\u2082) pellets. The section is cut along the rod, not pulled apart.', tag:'SCALE CHANGE · SINGLE ROD SECTION · NOT TO SCALE' },
  { start:300, end:509,  n:'03', title:'Neutron moderation, schematically', sub:'A fast neutron loses energy in collisions with water between the rods. Slowed to thermal energy, it can sustain fission in a pellet.', tag:'LABELED SCHEMATIC · SLOW MOTION · NOT TO SCALE' },
  { start:510, end:749,  n:'04', title:'Burnup, qualitatively', sub:'Over time in the core, fissile material is consumed and fission products accumulate in the pellet. Output falls gradually. No values are shown, by design.', tag:'TIME COMPRESSION · MONTHS SHOWN IN SECONDS · QUALITATIVE ONLY' },
  { start:750, end:1019, n:'05', title:'Pull back to the core lattice', sub:'One assembly among many. The lattice, coolant pathway, and sensing points form the complete system. The sequence ends on that stable view.', tag:'MACRO VIEW · CORE SCALE · COMPLETE SYSTEM' },
];
const phaseFor = (f:number) => PHASES.find(p => f>=p.start && f<=p.end) ?? PHASES[4];
const clamp = (v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;
const ss = (t:number)=>{ t=clamp(t); return t*t*(3-2*t); };
const local = (f:number,p:Phase)=> clamp((f-p.start)/Math.max(1,(p.end-p.start)));
/* crossfade weight for a phase: fades in/out over 18 frames at boundaries */
const weight = (f:number,p:Phase)=>{
  const inn = p.start===0 ? 1 : ss((f-(p.start-14))/18);
  const out = p.end===TOTAL-1 ? 1 : 1-ss((f-(p.end-4))/18);
  return clamp(Math.min(inn,out));
};
/* deterministic pseudo-random from seed (no Math.random in render) */
const rnd = (s:number)=>{ const x = Math.sin(s*127.1+311.7)*43758.5453; return x-Math.floor(x); };

/* ---------- DOM ---------- */
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<header class="topbar">
  <a class="brand" href="./"><span class="brand-mark">KG</span><span>KINETIC GAIN <em>Nuclear Power Systems · p210</em></span></a>
  <nav><a href="#explainer">Explainer</a><a href="#diagram">Diagram</a><a href="#mindmap">Mindmap</a><a href="#article">Article</a></nav>
  <span class="badge">34s · 30 fps · 1,020 frames</span>
</header>

<section class="hero">
  <div class="hero-copy">
    <p class="kicker">ANATOMY MOTION EXPLAINER · FULL CLEANED EXPANSION</p>
    <h1>A nuclear fuel assembly, <span>explained in 34 seconds.</span></h1>
    <p class="lede">Rods and grids. A sealed cladding tube around ceramic UO<sub>2</sub> pellets. A neutron slowed by water until it can sustain fission. Fuel that changes with use. Then out again, to the lattice the assembly lives in. Every scale change is labeled. Nothing on this stage claims a specification it cannot support.</p>
    <div class="hero-cta"><button id="heroPlay" class="btn gold">▶ &nbsp;Play the 34 seconds</button><a class="btn ghost" href="#diagram">Read the diagram ↓</a></div>
    <dl class="specs">
      <div><dt>Duration</dt><dd>34.0 s</dd></div><div><dt>Timeline</dt><dd>Frames 0–1019</dd></div>
      <div><dt>Fuel form</dt><dd>Generic UO<sub>2</sub> ceramic</dd></div><div><dt>Reference</dt><dd><a href="https://www.nrc.gov/reading-rm/basic-ref/students/fuel.html" target="_blank" rel="noopener">U.S. NRC, nuclear fuel ↗</a></dd></div>
    </dl>
  </div>
  <figure class="hero-media"><img src="./assets/hero-nuclear-fuel-assembly.jpg" alt="Illustrated cutaway of a nuclear fuel assembly showing fuel rods, spacer grids, and a sectioned rod with ceramic pellets" /><figcaption>Illustrative hero image. Explanatory colors are defined in the legend below the stage. Not a design drawing.</figcaption></figure>
</section>

<main id="explainer" class="stage-wrap">
  <div class="stage-head">
    <div><p class="kicker">DETERMINISTIC TIMELINE</p><h2>The stage</h2><p class="muted">Scrub any frame. The same frame always draws the same picture, because the picture is a function of the frame number, not of wall-clock time.</p></div>
    <div class="legend">
      <span><i style="--c:${C.cyan}"></i>Cyan · primary pathway</span>
      <span><i style="--c:${C.gold}"></i>Gold · actuation / energy</span>
      <span><i style="--c:${C.violet}"></i>Violet · sensing / state change</span>
      <span><i style="--c:${C.steel2}"></i>Steel · hardware</span>
    </div>
  </div>

  <div class="player fx-layer">
    <canvas id="stage" width="1280" height="720" aria-label="Animated anatomy diagram of a nuclear fuel assembly"></canvas>
    <div class="controls">
      <button id="playBtn" class="btn gold" aria-label="Play or pause">▶ Play</button>
      <button id="restartBtn" class="btn ghost" aria-label="Restart">↺ Frame 0</button>
      <input id="scrub" type="range" min="0" max="1019" step="1" value="0" aria-label="Scrub frame" />
      <output id="readout" class="mono">f 0000 · 00.00s · Phase 01</output>
    </div>
    <div class="chapters" role="group" aria-label="Jump to phase">
      ${PHASES.map((p,i)=>`<button data-phase="${i}" class="chip"><b>${p.n}</b> ${p.title.split(':')[0]}<small>${(p.start/FPS).toFixed(0)}–${((p.end+1)/FPS).toFixed(0)}s · f${p.start}–${p.end}</small></button>`).join('')}
    </div>
    <p id="phaseCaption" class="caption" aria-live="polite"></p>
  </div>

  <div class="notes">
    <article><h3>Sectional views, not disassembly</h3><p>The rod in Phase 02 is shown cut along its length. Pellets stay in stack order, the cladding stays a tube, and the plenum stays at the top. The drawing changes the viewing plane. It does not pretend parts float apart in service.</p></article>
    <article><h3>What the colors are not</h3><p>Cyan, gold, and violet are explanatory overlays. They mark pathway, energy, and state. They are not literal emission, heat color, or radiation made visible.</p></article>
    <article><h3>What is deliberately absent</h3><p>No enrichment figures. No failure mechanisms. No invented dimensions, temperatures, or performance claims. Where physics cannot be drawn faithfully at this scale, Phase 03 says so and switches to a labeled schematic.</p></article>
  </div>
</main>

<section class="band" id="diagram">
  <p class="kicker">STATIC COMPANION</p><h2>One rod, one assembly, one core</h2>
  <p class="muted wide">The same three scales the animation visits, held still for reading. Generic forms only, after the U.S. Nuclear Regulatory Commission's student reference on nuclear fuel.</p>
  <div class="diagram-card">
  <svg viewBox="0 0 1180 430" role="img" aria-label="Diagram comparing a fuel pellet stack inside a clad rod, a fuel assembly, and a core lattice">
    <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#00E5FF"/></marker></defs>
    <rect x="10" y="10" width="360" height="410" rx="14" fill="#111A2A" stroke="#344257"/>
    <text x="30" y="42" fill="#E8EEF6" font-family="Space Grotesk" font-size="17" font-weight="700">A · ROD SECTION</text>
    <text x="30" y="64" fill="#8EA2BC" font-size="12" font-family="JetBrains Mono">cut along length · not to scale</text>
    <rect x="150" y="86" width="70" height="286" rx="16" fill="none" stroke="#7E93AD" stroke-width="5"/>
    <rect x="88" y="96" width="46" height="20" fill="#1B2940"/><text x="30" y="110" fill="#9D4EDD" font-size="12">plenum + spring</text>
    ${Array.from({length:7},(_,i)=>`<rect x="160" y="${132+i*32}" width="50" height="26" rx="8" fill="${i%2?'#FFD166':'#E8B95A'}" opacity="${0.65+ (i%3)*0.12}"/><rect x="160" y="${132+i*32}" width="50" height="3" fill="#0B1019" opacity=".35"/>`).join('')}
    <text x="232" y="210" fill="#FFD166" font-size="13">UO₂ pellet stack</text>
    <text x="232" y="292" fill="#E8EEF6" font-size="13">cladding tube</text><text x="232" y="310" fill="#8EA2BC" font-size="11">(sealed)</text>
    <path d="M228 286 L216 268" stroke="#344257"/>
    <rect x="10" y="10" width="360" height="410" rx="14" fill="none"/>
    <rect x="405" y="10" width="360" height="410" rx="14" fill="#111A2A" stroke="#344257"/>
    <text x="425" y="42" fill="#E8EEF6" font-family="Space Grotesk" font-size="17" font-weight="700">B · ASSEMBLY</text>
    <text x="425" y="64" fill="#8EA2BC" font-size="12" font-family="JetBrains Mono">schematic subset of rods</text>
    ${Array.from({length:7},(_,i)=>`<rect x="${452+i*40}" y="96" width="18" height="250" rx="8" fill="#4A5E7A" stroke="#7E93AD"/>`).join('')}
    ${[150,225,300].map(y=>`<rect x="438" y="${y}" width="294" height="20" rx="5" fill="#344257" stroke="#00E5FF" stroke-opacity=".55"/><text x="600" y="${y+38}" fill="#8EA2BC" font-size="11" text-anchor="middle">spacer grid</text>`).join('')}
    <path d="M585 372 L585 96" stroke="#00E5FF" stroke-width="3" marker-end="url(#ar)"/><text x="598" y="240" fill="#00E5FF" font-size="12">coolant pathway</text>
    <text x="425" y="398" fill="#8EA2BC" font-size="12">top + bottom nozzles close the bundle</text>
    <rect x="800" y="10" width="360" height="410" rx="14" fill="#111A2A" stroke="#344257"/>
    <text x="820" y="42" fill="#E8EEF6" font-family="Space Grotesk" font-size="17" font-weight="700">C · CORE LATTICE (TOP)</text>
    <text x="820" y="64" fill="#8EA2BC" font-size="12" font-family="JetBrains Mono">one assembly highlighted</text>
    ${Array.from({length:25},(_,i)=>{const x=838+(i%5)*62,y=92+Math.floor(i/5)*56;const hot=i===12;return `<rect x="${x}" y="${y}" width="48" height="42" rx="6" fill="${hot?'#2A1E3F':'#1B2940'}" stroke="${hot?'#FFD166':'#344257'}" stroke-width="${hot?3:1.5}"/><circle cx="${x+24}" cy="${y+21}" r="5" fill="${hot?'#FFD166':'#4A5E7A'}"/>`}).join('')}
    <circle cx="980" cy="382" r="6" fill="#9D4EDD"/><text x="994" y="387" fill="#9D4EDD" font-size="12">sensing point (schematic)</text>
    <text x="820" y="410" fill="#8EA2BC" font-size="11">gold assembly = the one followed through this explainer</text>
  </svg>
  </div>
  <figure class="wide-media"><img src="./assets/illustration-core-lattice.jpg" alt="Illustrated top view of a reactor core lattice of fuel assemblies with coolant pathways" /><figcaption>Illustrative lattice image. Geometry is representative. It is not a core loading map for any reactor.</figcaption></figure>
</section>

<section class="band" id="mindmap">
  <p class="kicker">SYSTEM MAP</p><h2>How the ideas connect</h2>
  <p class="muted wide">Read outward from the assembly. Each branch is one phase of the animation, in the order the camera takes you.</p>
  <div class="mindmap" role="img" aria-label="Mindmap linking fuel assembly structure to pellets, moderation, burnup, and the core lattice">
    <svg viewBox="0 0 1180 520">
      ${[[590,260,300,80],[590,260,880,80],[590,260,300,440],[590,260,880,440],[590,260,590,70]].map(([x1,y1,x2,y2])=>`<path d="M${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" fill="none" stroke="#344257" stroke-width="2.5"/>`).join('')}
      <g font-family="Space Grotesk"><rect x="440" y="218" width="300" height="84" rx="16" fill="#FFD166"/><text x="590" y="252" text-anchor="middle" font-size="20" font-weight="700" fill="#0B1019">NUCLEAR FUEL</text><text x="590" y="276" text-anchor="middle" font-size="20" font-weight="700" fill="#0B1019">ASSEMBLY</text></g>
      ${[
        [300,80,'#00E5FF','01 · STRUCTURE','rods · spacer grids','nozzles · coolant channels'],
        [880,80,'#FFD166','02 · ROD INTERIOR','UO₂ pellet stack','cladding · plenum'],
        [590,70,'#9D4EDD','03 · MODERATION','water slows neutrons','thermal neutron → fission'],
        [300,440,'#9D4EDD','04 · BURNUP','fissile content falls','fission products build up'],
        [880,440,'#00E5FF','05 · CORE LATTICE','many assemblies','coolant + sensing as one system'],
      ].map(([x,y,c,t,a,b])=>`<g font-family="Space Grotesk"><circle cx="${x}" cy="${y}" r="58" fill="#111A2A" stroke="${c}" stroke-width="3"/><text x="${x}" y="${Number(y)-14}" text-anchor="middle" font-size="14" font-weight="700" fill="${c}">${t}</text><text x="${x}" y="${Number(y)+10}" text-anchor="middle" font-size="11.5" fill="#E8EEF6">${a}</text><text x="${x}" y="${Number(y)+28}" text-anchor="middle" font-size="11.5" fill="#8EA2BC">${b}</text></g>`).join('')}
    </svg>
  </div>
</section>

<section class="band product" >
  <p class="kicker">PRODUCT SUMMARY</p><h2>What this is, and what would make it better</h2>
  <div class="grid10">
    ${[
      ['1 · Product','A 34-second, frame-accurate anatomy explainer that turns a static NRC fuel description into a causal visual sequence.'],
      ['2 · Who it is for','Students, new nuclear technicians, energy-curious readers, and instructors who need a defensible first model before detail.'],
      ['3 · Why it wins','It labels its own limits on stage. Scale changes, slow motion, and time compression are announced, so trust survives the simplifications.'],
      ['4 · Structure','Macro, micro, schematic, time, macro. The assembly never fully disappears, so each new scale stays causally attached to the last.'],
      ['5 · Discovery','Search-led article, one canonical explainer page, a still diagram for image search, and a mindmap that travels as a single shareable visual.'],
      ['6 · Engagement','Scrubbing, chapter jumps, and a deterministic frame readout invite inspection instead of passive viewing.'],
      ['7 · Conversion','The useful next step is the full article and the source reference, not a form. Trust is the conversion asset at this stage.'],
      ['8 · How it makes money','As a reusable explainer unit in a paid nuclear-systems curriculum or licensed training library. This page makes no sales claim.'],
      ['9 · Launch','Static site, no backend, no user data collected. Publish, verify every frame range, then submit the canonical URL for indexing.'],
      ['10 · Improvement','Add instructor narration, keyboard frame stepping, and a printable rod-section worksheet. Measure completion by phase, not pageviews alone.'],
    ].map(([t,d])=>`<article><h3>${t}</h3><p>${d}</p></article>`).join('')}
  </div>
  <p class="reuse"><strong>Reuse note.</strong> The same five-phase camera grammar, macro to micro to schematic to time to system, transfers directly to a steam generator, a turbine stage, or a spent-fuel cask. Swap the hardware model and keep the labeling discipline.</p>
</section>

<section class="band" id="article">
  <p class="kicker">READ THE FULL PIECE</p><h2>From pellet to lattice, in plain language</h2>
  <p class="wide muted">The complete Medium-ready article ships in this repository as <a href="https://github.com/mizcausevic-dev/nuclear-fuel-assembly/blob/main/article/medium-article-Cursor.md" target="_blank" rel="noopener"><code>article/medium-article-Cursor.md</code></a>. It covers what a fuel assembly is, why the pellet-and-cladding design matters, how moderation makes fission sustainable, what burnup changes over a cycle, and where this explainer deliberately stops. Working brief, not a certified engineering reference. Verify subject-specific details before publication.</p>
  <div class="hero-cta"><a class="btn gold" href="https://github.com/mizcausevic-dev/nuclear-fuel-assembly/blob/main/article/medium-article-Cursor.md" target="_blank" rel="noopener">Read the article on GitHub ↗</a><a class="btn ghost" href="https://www.nrc.gov/reading-rm/basic-ref/students/fuel.html" target="_blank" rel="noopener">NRC source ↗</a></div>
</section>

<footer>
  <p><strong>Sources and scope.</strong> Mechanism reference: U.S. Nuclear Regulatory Commission, <a href="https://www.nrc.gov/reading-rm/basic-ref/students/fuel.html" target="_blank" rel="noopener">Nuclear Fuel</a> (student reference). Camera moves, palette, cutaways, and timing are original illustrative directions. This explainer is not a certified design, simulation result, or claim about a specific commercial implementation. Generic UO<sub>2</sub> ceramic only. No enrichment or failure content.</p>
  <p class="mono">Kinetic Gain LLC · Nuclear Power Systems · p210 · Frames 0–1019 @ 30 fps · Built in code, deterministic per frame</p>
</footer>`;

/* ---------- Canvas renderer ---------- */
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const ctx = canvas.getContext('2d')!;
const W=1280,H=720;
function rr(x:number,y:number,w:number,h:number,r:number,fill?:string|CanvasGradient,stroke?:string,lw=1){
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
}
function txt(s:string,x:number,y:number,size=16,color=C.bone,align:CanvasTextAlign='left',weight=600,font='Space Grotesk'){
  ctx.fillStyle=color; ctx.font=`${weight} ${size}px "${font}", sans-serif`; ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillText(s,x,y);
}
function label(s:string,sub:string,x:number,y:number,tx:number,ty:number,color:string){
  ctx.strokeStyle=color; ctx.globalAlpha=.85; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x+(x<tx?118:-118),y); ctx.lineTo(x,y); ctx.stroke(); ctx.globalAlpha=1;
  ctx.beginPath(); ctx.arc(tx,ty,4,0,7); ctx.fillStyle=color; ctx.fill();
  const wdt=Math.max(ctx.measureText(s).width+22,120);
  rr(x<tx? x-wdt+118 : x-118, y-20, wdt, sub?52:40, 9, 'rgba(11,16,25,.88)', color, 1.2);
  txt(s, x<tx? x-wdt+130 : x-106, y-6, 14.5, C.bone,'left',700);
  if(sub) txt(sub, x<tx? x-wdt+130 : x-106, y+14, 11.5, C.dim,'left',400,'JetBrains Mono');
}
function arrow(x:number,y:number,len:number,color:string,head=7){
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-len); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x,y-len-head*1.8); ctx.lineTo(x-head*.65,y-len); ctx.lineTo(x+head*.65,y-len); ctx.closePath(); ctx.fill();
}
function drawBackground(f:number){
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0D1422'); g.addColorStop(1,C.bg);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(142,162,188,.07)'; ctx.lineWidth=1;
  for(let x=0;x<=W;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<=H;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // slow deterministic scan glow (not decorative particles: a stage light tied to frame)
  const sx=(f%1020)/1020*W; const rg=ctx.createRadialGradient(sx,80,10,sx,80,340);
  rg.addColorStop(0,'rgba(0,229,255,.05)'); rg.addColorStop(1,'rgba(0,229,255,0)');
  ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
}
function drawAssembly(cx:number,cy:number,s:number,opt:{reveal?:number; highlightRod?:number; ghost?:number; power?:number}={}){
  const reveal=opt.reveal??1, power=opt.power??1;
  ctx.save(); ctx.translate(cx,cy); ctx.scale(s,s); ctx.globalAlpha*= (opt.ghost??1);
  // nozzles
  ctx.fillStyle=C.steel; ctx.strokeStyle='#7E93AD'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-118,-252); ctx.lineTo(118,-252); ctx.lineTo(82,-208); ctx.lineTo(-82,-208); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-82,208); ctx.lineTo(82,208); ctx.lineTo(118,252); ctx.lineTo(-118,252); ctx.closePath(); ctx.fill(); ctx.stroke();
  txt('TOP NOZZLE',0,-230,11,'#B9C8DC','center',600,'JetBrains Mono');
  txt('BOTTOM NOZZLE',0,230,11,'#B9C8DC','center',600,'JetBrains Mono');
  const rods=9, rw=17, gap=11;
  for(let i=0;i<rods;i++){
    const appear = ss((reveal*1.25) - i*0.035);
    if(appear<=0) continue;
    const x=-((rods-1)*(rw+gap))/2 + i*(rw+gap);
    const depth = 1 - Math.abs(i-(rods-1)/2)/14;
    ctx.globalAlpha = (opt.ghost??1)*appear*depth;
    const grad=ctx.createLinearGradient(x,0,x+rw,0);
    grad.addColorStop(0,'#2A3A52'); grad.addColorStop(.45,'#5A708F'); grad.addColorStop(1,'#26344A');
    rr(x,-204,rw,408,8,grad, i===opt.highlightRod? C.gold:'#7E93AD', i===opt.highlightRod?3:1.2);
    if(power>0.02){ ctx.fillStyle=`rgba(255,209,102,${.16*power*appear})`; rr(x+3,-196,rw-6,392,6,`rgba(255,209,102,${.14*power})`); }
  }
  ctx.globalAlpha=(opt.ghost??1);
  // spacer grids
  [-118,-8,102].forEach((y,gi)=>{
    const a=ss(reveal*1.4 - .35 - gi*.12); if(a<=0) return; ctx.globalAlpha=(opt.ghost??1)*a;
    rr(-132,y,264,26,6,'rgba(52,66,87,.92)',C.cyan,1.4);
    for(let i=0;i<rods;i++){ const x=-((rods-1)*(rw+gap))/2 + i*(rw+gap); rr(x-1,y+3,rw+2,20,4,undefined,'rgba(0,229,255,.35)',1); }
    txt('SPACER GRID',142,y+13,10.5,C.cyan,'left',600,'JetBrains Mono');
  });
  ctx.globalAlpha=(opt.ghost??1);
  // coolant arrows (cyan pathway) deterministic by frame via power of reveal
  ctx.restore();
}
/* Phase scenes */
function scene1(f:number){
  const p=PHASES[0], t=local(f,p);
  drawAssembly(470,368, 1.02, {reveal:ss(t*1.15)});
  // coolant arrows
  const rise = (f*1.6)%150;
  ctx.globalAlpha=ss(t);
  for(let i=0;i<5;i++){ const x=355+i*58, y=560-((rise+i*34)%300); arrow(x,y,44,C.cyan,6); }
  ctx.globalAlpha=1;
  if(f>28) label('Fuel rods','sealed tubes, in parallel',760,150,520,120,C.gold);
  if(f>52) label('Spacer grids','hold spacing + alignment',760,268,590,258,C.cyan);
  if(f>78) label('Coolant channels','primary pathway, upward',760,392,505,430,C.cyan);
  if(f>104) label('Top + bottom nozzles','close the bundle',760,505,520,610,C.steel2);
  txt('The unit that gets handled, loaded, and replaced as one piece.',470,668,15,C.dim,'center',400);
}
function scene2(f:number){
  const p=PHASES[1], t=local(f,p);
  drawAssembly(215,368,.62,{highlightRod:4, ghost:.55});
  label('This rod, sectioned →','same rod, new viewing plane',330,120,250,180,C.gold);
  const x=640,y=92,w=150,h=470;
  // sectional rod
  ctx.save(); ctx.globalAlpha=ss(t*1.2);
  rr(x,y,w,h,54,'#16233A','#8EA2BC',3);
  rr(x+10,y+10,w-20,h-20,46,'#0D1626');
  // plenum + spring
  txt('PLENUM',x+w/2,y+42,11,C.violet,'center',600,'JetBrains Mono');
  ctx.strokeStyle=C.violet; ctx.lineWidth=2.5; ctx.beginPath();
  for(let i=0;i<7;i++){ const yy=y+58+i*9; ctx.lineTo(x+w/2+((i%2)?16:-16),yy); } ctx.stroke();
  txt('spring (schematic)',x+w/2,y+132,10.5,C.dim,'center',400,'JetBrains Mono');
  // pellets
  const n=8; for(let i=0;i<n;i++){
    const a=ss(t*1.5 - i*.07); if(a<=0) continue; ctx.globalAlpha=a;
    const py=y+158+i*36;
    rr(x+22,py,w-44,30,10, i%2? '#FFD166':'#E5B95C', '#0B1019',1);
    ctx.fillStyle='rgba(11,16,25,.28)'; ctx.fillRect(x+22,py+13,w-44,3);
  }
  ctx.globalAlpha=1;
  txt('UO₂ PELLETS',x+w/2,y+h+24,12,C.gold,'center',700,'JetBrains Mono');
  ctx.restore();
  if(f>168) label('Cladding','sealed tube wall',930,180,x+w-4,240,C.steel2);
  if(f>190) label('Ceramic UO₂ pellets','stacked, generic form',930,300,x+w-4,330,C.gold);
  if(f>216) label('Pellet–clad gap','thin, shown enlarged',930,420,x+w-4,430,C.cyan);
  if(f>240) label('Plenum + spring','space at the rod top',930,532,x+w/2,y+66,C.violet);
  txt('Sectional view. The rod is cut along its length. Parts do not separate in service.',640,668,15,C.dim,'center',400);
}
function scene3(f:number){
  const p=PHASES[2];
  drawAssembly(150,368,.5,{ghost:.20});
  // schematic panel
  rr(330,84,830,500,18,'rgba(17,26,42,.92)',C.violet,1.6);
  txt('SCHEMATIC — MODERATION AND FISSION',360,116,17,C.violet,'left',700);
  txt('distances, energies, and times are not to scale',360,140,11.5,C.dim,'left',400,'JetBrains Mono');
  // water molecules field (deterministic positions)
  for(let i=0;i<16;i++){
    const mx=400+rnd(i*3)*300, my=190+rnd(i*7)*300;
    ctx.globalAlpha=.85; ctx.beginPath(); ctx.arc(mx,my,13,0,7); ctx.fillStyle='#274B66'; ctx.fill(); ctx.strokeStyle=C.cyan; ctx.lineWidth=1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(mx-11,my-8,6,0,7); ctx.arc(mx+11,my-8,6,0,7); ctx.fillStyle='#BFEFFF'; ctx.fill();
  }
  txt('WATER (MODERATOR)',430,545,12,C.cyan,'left',700,'JetBrains Mono');
  // neutron journey: cycle 150 frames
  const cyc=((f-p.start)%150)/150;
  const seg=(a:number,b:number)=>clamp((cyc-a)/(b-a));
  let nx=380, ny=300;
  const pts:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[[380,300],[500,240],[590,330],[665,265],[760,300]];
  const pos=(tt:number)=>{ const fl=Math.min(3,Math.floor(tt*4)), fr=tt*4-fl; return [lerp(pts[fl][0],pts[fl+1][0],ss(fr)), lerp(pts[fl][1],pts[fl+1][1],ss(fr))] as const; };
  // trail
  ctx.beginPath(); for(let i=0;i<=40;i++){ const [px,py]=pos(cyc*i/40); i?ctx.lineTo(px,py):ctx.moveTo(px,py);} 
  ctx.strokeStyle= cyc<.72? C.gold:C.cyan; ctx.lineWidth=2.5; ctx.setLineDash([7,6]); ctx.stroke(); ctx.setLineDash([]);
  [nx,ny]=[...pos(cyc)];
  // collisions shrink markers
  [1,2,3].forEach((k)=>{ const [px,py]=pts[k]; ctx.beginPath(); ctx.arc(px,py,9,0,7); ctx.strokeStyle=C.cyan; ctx.lineWidth=2; ctx.stroke(); });
  const speedLabel = cyc<.35?'FAST NEUTRON': cyc<.72?'LOSING ENERGY PER COLLISION':'THERMAL NEUTRON';
  ctx.beginPath(); ctx.arc(nx,ny,10,0,7); ctx.fillStyle=cyc<.72?C.gold:C.cyan; ctx.fill();
  txt(speedLabel,nx,ny-28,12.5,cyc<.72?C.gold:C.cyan,'center',700,'JetBrains Mono');
  // pellet + nucleus
  rr(880,205,230,210,16,'rgba(255,209,102,.10)',C.gold,2);
  txt('INSIDE A PELLET',995,232,12,C.gold,'center',700,'JetBrains Mono');
  const fission = seg(.74,1);
  if(fission<.55){
    ctx.beginPath(); ctx.arc(995,325,38,0,7); ctx.fillStyle='#3A2B52'; ctx.fill(); ctx.strokeStyle=C.violet; ctx.lineWidth=3; ctx.stroke();
    txt('U',995,325,22,C.bone,'center',700);
    txt('heavy nucleus (schematic)',995,382,10.5,C.dim,'center',400,'JetBrains Mono');
  } else {
    const sp=ss((fission-.55)/.45)*46;
    [[-1,-0.4],[1,-0.3],[0.2,1],[-0.5,0.8]].forEach(([dx,dy],i)=>{
      ctx.beginPath(); ctx.arc(995+dx*sp,325+dy*sp, i<2?24:9,0,7); ctx.fillStyle=i<2?'#FFD166':C.cyan; ctx.fill();
    });
    ctx.strokeStyle=C.gold; ctx.lineWidth=2.5;
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; ctx.beginPath(); ctx.moveTo(995+Math.cos(a)*34,325+Math.sin(a)*34); ctx.lineTo(995+Math.cos(a)*(52+sp*.4),325+Math.sin(a)*(52+sp*.4)); ctx.stroke(); }
    txt('FISSION',995,445,15,C.gold,'center',700,'JetBrains Mono');
    txt('fragments + neutrons + energy',995,466,11,C.dim,'center',400,'JetBrains Mono');
  }
  if(f>340) label('1 · Fast neutron leaves a fission','gold = energy in motion',380,640,420,320,C.gold);
  txt('Slow motion. A real neutron history is far faster and is not being simulated here.',640,668,15,C.dim,'center',400);
}
function scene4(f:number){
  const p=PHASES[3], t=local(f,p);
  drawAssembly(150,368,.5,{ghost:.16, power:1-t*.55});
  txt('THREE MOMENTS IN ONE ROD',360,108,16,C.bone,'left',700);
  const stages=[['EARLIER','fresh pellet'],['MID-LIFE','in use'],['LATER','spent down']];
  stages.forEach(([name,sub],si)=>{
    const x=370+si*235, active = t>= si/3;
    const amt = si===0? t*.33 : si===1? .33+t*.33 : .66+t*.34;
    rr(x,150,190,330,16,'#111A2A', active? C.gold:C.steel, active?2.4:1.4);
    txt(name,x+95,182,14,active?C.gold:C.dim,'center',700,'JetBrains Mono'); txt(sub,x+95,204,11,C.dim,'center',400);
    // pellet disc with accumulating fission products (violet dots)
    ctx.beginPath(); ctx.arc(x+95,300,58,0,7); ctx.fillStyle= si===0?'#E5B95C': si===1?'#B98F4E':'#7A6748'; ctx.fill(); ctx.strokeStyle=C.gold; ctx.stroke();
    const dots=Math.floor(amt*46);
    for(let i=0;i<dots;i++){ const a=rnd(i*13+si)*Math.PI*2, r=rnd(i*29)*48; ctx.beginPath(); ctx.arc(x+95+Math.cos(a)*r,300+Math.sin(a)*r,3.2,0,7); ctx.fillStyle=C.violet; ctx.fill(); }
    txt(si===0?'fissile content: higher':si===1?'fissile content: falling':'fissile content: lower',x+95,392,11.5,C.bone,'center',600);
    txt(si===0?'products: few':si===1?'products: building':'products: accumulated',x+95,414,11,C.violet,'center',400,'JetBrains Mono');
    if(si<2){ txt('→',x+212,300,26,C.dim,'center',700); }
  });
  // qualitative curve
  rr(360,505,660,110,14,'rgba(17,26,42,.95)',C.violet,1.4);
  txt('RELATIVE OUTPUT (QUALITATIVE, NO VALUES)',382,530,11.5,C.violet,'left',700,'JetBrains Mono');
  ctx.beginPath(); const gx=382,gy=592,gw=610;
  for(let i=0;i<=50;i++){ const xx=gx+i/50*gw, yy=gy-8 - ss(i/50)*0 - (1-Math.pow(1-i/50,1.4))*44*Math.min(1,t*1.4); i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
  ctx.strokeStyle=C.violet; ctx.lineWidth=3; ctx.stroke();
  ctx.strokeStyle='rgba(142,162,188,.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+gw,gy); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy-58); ctx.stroke();
  txt('time in core →',gx+gw,gy+18,10.5,C.dim,'right',400,'JetBrains Mono');
  txt('Burnup rises as fissile material is consumed. This explainer shows direction, not a rate.',640,668,15,C.dim,'center',400);
}
function scene5(f:number){
  const p=PHASES[4], t=local(f,p);
  const shrink=ss(t*1.1);
  // lattice top view
  const cols=7,rows=5,cw=92,ch=78,ox=200,oy=130;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const x=ox+c*cw, y=oy+r*ch, isHero=(r===2&&c===3);
    const a=ss(shrink*1.3 - (Math.abs(r-2)+Math.abs(c-3))*.08); if(a<=0) continue;
    ctx.globalAlpha=a;
    rr(x,y,cw-12,ch-12,10, isHero?'#2A1E3F':'#16233A', isHero?C.gold:C.steel, isHero?3:1.5);
    for(let d=0;d<9;d++){ ctx.beginPath(); ctx.arc(x+18+(d%3)*22, y+16+Math.floor(d/3)*18, 4.5,0,7); ctx.fillStyle=isHero?C.gold:'#5A708F'; ctx.fill(); }
    if(isHero) txt('THIS ASSEMBLY',x+(cw-12)/2,y+ch+4,10.5,C.gold,'center',700,'JetBrains Mono');
  }
  ctx.globalAlpha=1;
  // coolant + sensing overlays
  if(f>830){ arrow(1120,470,120,C.cyan,7); txt('COOLANT\nPATHWAY',1120,505,11,C.cyan,'center',700,'JetBrains Mono'); }
  if(f>870){ [[260,190],[1020,250],[620,470],[900,540]].forEach(([x,y],i)=>{ const pr=.6+.4*Math.sin(f/18+i); ctx.beginPath(); ctx.arc(x,y,7*pr+3,0,7); ctx.fillStyle=C.violet; ctx.fill(); }); txt('SENSING POINTS (SCHEMATIC)',860,610,11.5,C.violet,'left',700,'JetBrains Mono'); }
  // side elevation mini
  if(f>900){ rr(180,545,360,82,12,'rgba(17,26,42,.9)',C.steel,1.4); for(let i=0;i<12;i++) rr(200+i*27,562,13,48,5,'#4A5E7A'); txt('CORE, SIDE ELEVATION (SCHEMATIC)',360,642,10,C.dim,'center',600,'JetBrains Mono'); }
  if(f>950){
    rr(390,58,500,46,23,'rgba(255,209,102,.14)',C.gold,1.6);
    txt('COMPLETE SYSTEM · STABLE END VIEW',640,81,15,C.gold,'center',700,'JetBrains Mono');
  }
  txt('One assembly only matters as part of the lattice. That is where the sequence leaves it.',640,688,15,C.dim,'center',400);
}
function drawHUD(f:number){
  const p=phaseFor(f);
  rr(28,24,560,74,14,'rgba(11,16,25,.86)',C.steel,1.2);
  txt(`PHASE ${p.n} / 05`,48,50,11.5,C.cyan,'left',700,'JetBrains Mono');
  txt(p.title,48,76,19,C.bone,'left',700);
  rr(872,24,380,74,14,'rgba(11,16,25,.86)',C.steel,1.2);
  txt(`FRAME ${String(f).padStart(4,'0')} / 1019`,892,50,11.5,C.dim,'left',600,'JetBrains Mono');
  txt(`${(f/FPS).toFixed(2)}s  ·  30 fps`,892,76,17,C.bone,'left',700,'JetBrains Mono');
  // progress + phase ticks
  rr(28,640,1224,10,5,'#1B2940');
  rr(28,640,1224*(f/(TOTAL-1)),10,5,C.cyan);
  PHASES.forEach(ph=>{ const x=28+1224*(ph.start/(TOTAL-1)); ctx.fillStyle=C.gold; ctx.fillRect(x,634,2,22); });
  rr(28,104,Math.min(620,p.tag.length*7.4+24),30,15,'rgba(157,78,221,.16)',C.violet,1.1);
  txt(p.tag,42,119,10.5,C.violet,'left',700,'JetBrains Mono');
}
function render(f:number){
  ctx.clearRect(0,0,W,H); drawBackground(f);
  const scenes=[scene1,scene2,scene3,scene4,scene5];
  PHASES.forEach((p,i)=>{ const wgt=weight(f,p); if(wgt<=0.01) return; ctx.save(); ctx.globalAlpha=wgt; scenes[i](f); ctx.restore(); });
  drawHUD(f);
}

/* ---------- Playback: frame clock, not wall clock ---------- */
let frame = (()=>{ const q=new URLSearchParams(location.search).get('frame'); const v=q?parseInt(q,10):0; return Number.isFinite(v)? clamp(v,0,TOTAL-1):0; })();
let playing=false, acc=0, last=performance.now();
const scrub=document.querySelector<HTMLInputElement>('#scrub')!;
const readout=document.querySelector<HTMLOutputElement>('#readout')!;
const playBtn=document.querySelector<HTMLButtonElement>('#playBtn')!;
const caption=document.querySelector<HTMLParagraphElement>('#phaseCaption')!;
const chips=Array.from(document.querySelectorAll<HTMLButtonElement>('.chip'));
function syncUI(){
  scrub.value=String(frame);
  const p=phaseFor(frame);
  readout.textContent=`f ${String(frame).padStart(4,'0')} · ${(frame/FPS).toFixed(2)}s · Phase ${p.n}`;
  caption.innerHTML=`<strong>Phase ${p.n}. ${p.title}.</strong> ${p.sub} <span class="mono dim">${p.tag}</span>`;
  chips.forEach((c,i)=>c.classList.toggle('active', PHASES[i]===p));
  playBtn.textContent = playing? '⏸ Pause':'▶ Play';
}
function draw(){ render(frame); syncUI(); }
function loop(now:number){
  const dt=Math.min(100, now-last); last=now;
  if(playing){
    acc+=dt;
    const step=1000/FPS;
    while(acc>=step){ acc-=step; frame = frame>=TOTAL-1? TOTAL-1 : frame+1; if(frame>=TOTAL-1){ playing=false; } }
    draw();
  }
  requestAnimationFrame(loop);
}
playBtn.addEventListener('click',()=>{ if(frame>=TOTAL-1) frame=0; playing=!playing; draw(); });
document.querySelector('#heroPlay')!.addEventListener('click',()=>{ frame=0; playing=true; document.querySelector('#explainer')!.scrollIntoView({behavior:'smooth'}); draw(); });
document.querySelector('#restartBtn')!.addEventListener('click',()=>{ frame=0; playing=false; draw(); });
scrub.addEventListener('input',()=>{ frame=parseInt(scrub.value,10); playing=false; draw(); });
chips.forEach((c,i)=>c.addEventListener('click',()=>{ frame=PHASES[i].start; playing=true; draw(); }));
addEventListener('keydown',(e)=>{ if(e.code==='Space' && (e.target as HTMLElement).tagName!=='INPUT'){ e.preventDefault(); playing=!playing; draw(); } if(e.code==='ArrowRight'){ frame=clamp(frame+1,0,TOTAL-1); draw(); } if(e.code==='ArrowLeft'){ frame=clamp(frame-1,0,TOTAL-1); draw(); } });
if(matchMedia('(prefers-reduced-motion: reduce)').matches){ playing=false; frame=0; } else if(!new URLSearchParams(location.search).has('frame')) { playing=true; }
draw(); requestAnimationFrame(loop);
(window as unknown as {__NF__:{frames:number;fps:number;render:(f:number)=>void}}).__NF__={frames:TOTAL,fps:FPS,render:(f:number)=>{frame=clamp(Math.round(f),0,TOTAL-1); draw();}};
