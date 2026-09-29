import { createAdditionalRules } from './lesson-rule-extensions.js';
import { originalExercises } from './original-exercises.js';

// One authoritative graph inventory, including the directly transcribed book graphs.
const graphResponse = await fetch(new URL('./course/graphs.json', import.meta.url));
if (!graphResponse.ok) throw new Error('The lesson diagrams could not load.');
const graphs = await graphResponse.json();

// Lesson artwork follows the original PDF drawings, not the editor's palette.
// Curved motion follows X Daily ZX/PRODUCTION-STANDARDS.md: fixed leads,
// quintic easing, De Casteljau subdivision, and exact endpoint branches.
export const lessonPalette = Object.freeze({ Z: '#316f29', X: '#e04f48', H: '#f0cc4b', wire: '#211f1e' });
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b-a)*t;
const point = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const smooth = t => { t=clamp(t); return t*t*t*(10-15*t+6*t*t); };
const shift = (a, delta) => [a[0]+delta[0], a[1]+delta[1]];
const delta = (a, b) => [a[0]-b[0], a[1]-b[1]];
const number = n => Number(n.toFixed(5));
const xy = p => p.map(number).join(' ');
let sequence = 0;

function split(curve, t) {
  const [a,b,c,d]=curve, ab=point(a,b,t), bc=point(b,c,t), cd=point(c,d,t);
  const abc=point(ab,bc,t), bcd=point(bc,cd,t), middle=point(abc,bcd,t);
  return [[a,ab,abc,middle],[middle,bcd,cd,d]];
}
const at = (curve,t) => split(curve,t)[0][3];
const segment = (curve,a,b) => a===1 ? [curve[3],curve[3],curve[3],curve[3]] : split(split(curve,a)[1],(b-a)/(1-a))[0];
const line = (a,b) => [a,point(a,b,1/3),point(a,b,2/3),b];
const interpolateCurve = (a,b,t) => a.map((p,i)=>point(p,b[i],t));
const pathData = curves => curves.map((c,i)=>`${i?'':'M '+xy(c[0])+' '}C ${xy(c[1])} ${xy(c[2])} ${xy(c[3])}`).join(' ');
function wire(curves, extra='') {
  return `<path d="${pathData(curves)}" fill="none" stroke="${lessonPalette.wire}" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}
function phaseLabel(value) {
  if (typeof value==='string') return value;
  if (!value || value%4===0) return '';
  return ({1:'π/2','-1':'−π/2',2:'π','-2':'−π',3:'3π/2','-3':'−3π/2'})[value] || `${value}π/2`;
}
function spider(type,position,{radius=24,phase='',scale=1,labelOpacity=1,rotation=0}={}) {
  const label=phaseLabel(phase),r=radius;
  const wide=label.length>2 ? Math.max(1,label.length*.25) : 1;
  // The original lesson dots are slightly asymmetric ink shapes, without rims.
  const outline=`M ${-.96*r} ${-.04*r} C ${-.99*r} ${-.65*r} ${-.40*r} ${-1.10*r} ${.13*r} ${-1.03*r} C ${.81*r} ${-.99*r} ${1.05*r} ${-.44*r} ${.98*r} ${.20*r} C ${.91*r} ${.84*r} ${.30*r} ${1.06*r} ${-.19*r} ${1.01*r} C ${-.78*r} ${.96*r} ${-1.04*r} ${.55*r} ${-.96*r} ${-.04*r} Z`;
  const shape=type==='H' ? `<rect x="${-.58*r}" y="${-.58*r}" width="${1.16*r}" height="${1.16*r}" rx="3" fill="${lessonPalette.H}"/>` : `<path d="${outline}" transform="scale(${wide} 1)" fill="${lessonPalette[type]}"/>`;
  const text=label && type!=='H' ? `<text x="0" y="1" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="${radius*.91}" font-style="italic" opacity="${labelOpacity}">${escape(label)}</text>` : '';
  return `<g transform="translate(${xy(position)}) scale(${number(scale)})${rotation?` rotate(${number(rotation)})`:""}">${shape}${text}</g>`;
}
function svg(body,{label='ZX diagram',description='',viewBox='0 0 600 340',className=''}={}) {
  const id=`lesson-figure-${++sequence}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="lesson-diagram ${escape(className)}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${escape(label)}</title><desc id="${id}-desc">${escape(description)}</desc>${body}</svg>`;
}

const yankTop=[300,38],yankBottom=[300,302];
const yankInnerTop=point(yankTop,yankBottom,.075),yankInnerBottom=point(yankTop,yankBottom,.925);
const yankLeads=[line(yankTop,yankInnerTop),line(yankInnerBottom,yankBottom)];
const yankCurves=[
  [yankInnerTop,point(yankTop,yankBottom,.16),[361,159],[326,188]],
  [[326,188],[283,228],[299,131],[256,159]],
  [[256,159],[215,183],point(yankTop,yankBottom,.84),yankInnerBottom],
];
const yankStraight=yankCurves.map((_,i)=>line(point(yankCurves[0][0],yankCurves[2][3],i/3),point(yankCurves[0][0],yankCurves[2][3],(i+1)/3)));
function yankFrame(t) {
  const curves=t===0?yankCurves:t===1?yankStraight:yankCurves.map((c,i)=>interpolateCurve(c,yankStraight[i],smooth(t)));
  return wire([yankLeads[0],...curves,yankLeads[1]]);
}

const fusionJoin=[[235,115],[304,86],[288,231],[365,211]];
const fusionA=fusionJoin[0],fusionB=fusionJoin[3],fusionMeeting=at(fusionJoin,.5);
const fusionLegs=[
  {node:0,curve:[[138,40],[144,90],[182,104],fusionA]},
  {node:0,curve:[[241,35],[244,69],[236,84],fusionA]},
  {node:0,curve:[[110,298],[118,240],[147,163],fusionA]},
  {node:1,curve:[[483,42],[481,119],[425,192],fusionB]},
  {node:1,curve:[[299,303],[296,264],[327,231],fusionB]},
  {node:1,curve:[[488,299],[472,255],[416,224],fusionB]},
];
const inkDots = points => points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.4" fill="${lessonPalette.wire}"/>`).join('');
const fusionDots=inkDots([[178,60],[192,60],[206,60],[380,281],[394,281],[408,281]]);
function fusionFrame(t) {
  const u=smooth(t),a=at(fusionJoin,u/2),b=at(fusionJoin,1-u/2);
  const positions=t===1?[fusionMeeting,fusionMeeting]:[a,b];
  const wires=fusionLegs.map(({node,curve})=>{
    const movement=delta(positions[node],node===0?fusionA:fusionB);
    const direction=delta(curve[1],curve[0]),length=Math.hypot(...direction);
    const lead=shift(curve[0],direction.map(d=>d/length*18));
    return wire([line(curve[0],lead),[lead,curve[1],shift(curve[2],movement),positions[node]]]);
  }).join('');
  if(t===1)return wires+spider('Z',fusionMeeting,{phase:'α+β',radius:30})+fusionDots;
  const joining=wire([segment(fusionJoin,u/2,1-u/2)]);
  const phases=1-smooth((t-.60)/.23),sum=smooth((t-.82)/.18);
  const nodes=spider('Z',a,{phase:'α',radius:26+4*u,labelOpacity:phases})+spider('Z',b,{phase:'β',radius:26+4*u,labelOpacity:phases});
  return wires+joining+nodes+fusionDots+(sum ? `<text x="${number(fusionMeeting[0])}" y="${number(fusionMeeting[1]+1)}" text-anchor="middle" dominant-baseline="middle" font-style="italic" font-size="27.3" fill="#ffffff" opacity="${sum}">α+β</text>` : '');
}

const identityWire=[[296,38],[289,125],[306,226],[302,302]];
const identityPosition=at(identityWire,.49);
// The original Dock effect breaks one tight cloud into four puffs, then
// scattered cloudlets. Redraw that silhouette in the lesson's existing ink.
function cloudlet(position,radius,rotation=0,opacity=1,curl=true) {
  const outline='M -18 3 C -27 0 -25 -12 -16 -14 C -16 -24 -3 -26 2 -18 C 9 -26 21 -19 18 -10 C 28 -5 26 8 17 10 C 20 21 5 25 0 17 C -7 26 -21 20 -18 10 C -25 11 -27 5 -18 3 Z';
  const inside=curl?'<path d="M -10 3 C -14 -4 -4 -10 0 -4 C 5 -12 15 -6 11 1" fill="none"/>':'';
  return `<g transform="translate(${xy(position)}) rotate(${number(rotation)}) scale(${number(radius/25)})" opacity="${number(opacity)}" fill="#ffffff" stroke="${lessonPalette.wire}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${outline}"/>${inside}</g>`;
}
function poof(position,t,{radius=37}={}) {
  if(t<=0||t>=1)return '';
  const burst=1-Math.pow(1-clamp(t/.48),3),breakup=smooth((t-.30)/.42);
  const visible=smooth(t/.035)*(1-smooth((t-.67)/.33));
  const directions=[[-.75,-.68],[.67,-.73],[-.70,.64],[.77,.66]];
  let clouds=directions.map((d,i)=>{
    const centre=shift(position,d.map(v=>v*radius*(.37+.86*burst)));
    const r=radius*([.73,.68,.77,.71][i]-.22*burst);
    return cloudlet(centre,r,[-18,11,24,-9][i],visible*(1-breakup));
  }).join('');
  // A short central puff makes the first frame one overlapping smoke cloud.
  clouds+=cloudlet(position,radius*.65,7,visible*(1-smooth(t/.25)));
  clouds+=directions.map((d,i)=>[0,1,2].map(j=>{
    const angle=Math.atan2(d[1],d[0])+(j-1)*.35;
    const spread=radius*(.76+1.04*burst+(j===1?.12:-.10));
    const centre=shift(position,[Math.cos(angle)*spread,Math.sin(angle)*spread]);
    const r=radius*(j===1?.26:.15)*(1-.65*smooth((t-.55)/.45));
    return cloudlet(centre,r,i*29+j*43,visible*breakup*(j===1?1:1-.45*t),false);
  }).join('')).join('');
  return `<g data-poof="cloudlets">${clouds}</g>`;
}
function identityFrame(t) {
  const ink=wire([identityWire]);
  if(t<.26)return ink+spider('Z',identityPosition,{radius:27});
  return ink+poof(identityPosition,(t-.26)/.34,{radius:41});
}

const hadamardWire=[[298,38],[305,119],[291,231],[304,302]];
function tangentAngle(curve,t){
  const u=1-t;
  const d=[0,1].map(i=>3*u*u*(curve[1][i]-curve[0][i])+6*u*t*(curve[2][i]-curve[1][i])+3*t*t*(curve[3][i]-curve[2][i]));
  return Math.atan2(d[1],d[0])*180/Math.PI-90;
}
function hadamardFrame(t) {
  const ink=wire([hadamardWire]);
  if(t===1)return ink;
  // Accelerate into face-to-face contact. A brief squash reads as an impact;
  // the two boxes then break apart, without ever shrinking into the wire.
  const travel=clamp(t/.42),approach=travel*travel*travel;
  const impact=clamp((t-.42)/.12),squash=Math.sin(Math.PI*impact);
  const recoil=.013*Math.sin(Math.PI*impact);
  const a=mix(.28,.45,approach)-recoil,b=mix(.72,.55,approach)+recoil;
  const box=(u,sign)=>`<g transform="translate(${xy(at(hadamardWire,u))}) rotate(${number(tangentAngle(hadamardWire,u)+sign*squash*3)}) scale(${number(1+squash*.18)} ${number(1-squash*.25)})">${spider('H',[0,0],{radius:24})}</g>`;
  let boxes=t<.51?box(a,-1)+box(b,1):'';
  if(t>=.51&&t<.82){
    const u=clamp((t-.51)/.31),spread=1-Math.pow(1-u,3),fade=1-smooth(u);
    const centre=at(hadamardWire,.5);
    boxes=Array.from({length:6},(_,i)=>{
      const angle=i*Math.PI/3+.3,dist=10+45*spread;
      const p=shift(centre,[Math.cos(angle)*dist,Math.sin(angle)*dist]);
      return `<rect x="-4" y="-4" width="8" height="8" rx="1.2" transform="translate(${xy(p)}) rotate(${number(i*31+spread*75)})" fill="${lessonPalette.H}" opacity="${number(fade)}"/>`;
    }).join('');
  }
  return ink+boxes+poof(at(hadamardWire,.5),(t-.50)/.29,{radius:27});
}

function hopfFrame(t) {
  const a=[225,170],b=[375,170];
  const upper=[a,[255,101],[345,101],b],lower=[a,[255,239],[345,239],b];
  const base=wire([line([80,170],a)])+wire([line(b,[520,170])]);
  let pair='',slash='';
  if(t<.43)pair=wire([upper])+wire([lower]);
  else if(t<1){
    const fall=smooth((t-.43)/.57),drop=110*fall,opacity=1-smooth((t-.56)/.44);
    // The cut pair falls as detached ink; spiders and their exterior legs stay put.
    pair=`<g opacity="${number(opacity)}" transform="translate(0 ${number(drop)})">${wire([segment(upper,.06,.94)])}${wire([segment(lower,.06,.94)])}</g>`;
  }
  if(t>.15&&t<.62){
    const slashT=smooth((t-.15)/.28),slashFade=1-smooth((t-.43)/.19);
    const curve=[[338,95],[318,142],[281,203],[263,248]];
    slash=wire([split(curve,slashT)[0]],`opacity="${number(slashFade)}"`);
  }
  return base+pair+slash+spider('Z',a,{radius:25})+spider('X',b,{radius:25});
}

const rules={
  yanking:{frame:yankFrame,title:'Yanking',description:'A bent wire becomes straight while both endpoints remain fixed.'},
  fusion:{frame:fusionFrame,title:'Spider fusion',description:'Two connected green spiders meet along their curved wire. Their phases add; every exterior wire remains attached.'},
  identity:{frame:identityFrame,title:'Identity',description:'One zero-phase spider with exactly two legs vanishes in a small puff. Its resolved wire stays fixed.'},
  hadamard:{frame:hadamardFrame,title:'Colour-change cancellation',description:'Two adjacent colour-change boxes collide and dissipate. The wire stays fixed.'},
  hopf:{frame:hopfFrame,title:'Leg chop',description:'A slash cuts the two parallel wires, which fall and fade. Both spiders and their exterior wires stay fixed.'},
};
const aliases={'image-002':'yanking','image-004':'fusion','image-007':'identity','image-012':'hadamard','image-014':'hopf',E01:'yanking',E03:'fusion',E05:'identity',E07:'hadamard',E11:'hopf',yank:'yanking',HH:'hadamard'};
const helpers={ wire,spider,line,at,point,smooth,mix,shift,delta,split,segment,lessonPalette };
Object.assign(rules,createAdditionalRules(helpers));
Object.assign(aliases,{'image-005':'opposite','image-009':'decomposition','image-010':'colour','image-016':'copy','image-018':'square','image-020':'expansion'});
const ruleName = name => aliases[String(name).replace(/\.png$/,'')] || name;
export const availableRules=Object.freeze(Object.keys(rules));

/** One literal rule only. Progress zero/one returns the exact static endpoint. */
export function ruleDiagram(name,{progress=0,label=''}={}) {
  const rule=rules[ruleName(name)];
  if(!rule)throw new RangeError(`No approved lesson animation: ${name}`);
  return svg(rule.frame(clamp(progress)),{label:label||rule.title,description:rule.description,viewBox:rule.viewBox||'0 0 600 340'});
}

function graphCurves(g,index) {
  const [a,b]=g.edges[index],p=g.positions[a],q=g.positions[b];
  const authored=g.curves?.[index];
  if(authored) return typeof authored[0]?.[0]==='number' ? [authored] : authored;
  const route=g.routing?.[index];
  if(route?.length) {
    const ps=[p,...route,q];
    return ps.slice(0,-1).map((p1,i)=>{
      const p0=ps[Math.max(0,i-1)],p2=ps[i+1],p3=ps[Math.min(ps.length-1,i+2)];
      return [p1,[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6],p2];
    });
  }
  const group=g.edges.map((e,i)=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)?i:-1).filter(i=>i>=0);
  if(a===b)return [[p,[p[0]+70,p[1]-95],[p[0]-70,p[1]-95],p]];
  const rank=group.indexOf(index)-(group.length-1)/2;
  if(rank) {
    const d=delta(q,p),length=Math.hypot(...d)||1,offset=[-d[1]/length*rank*70,d[0]/length*rank*70];
    return [[p,shift(point(p,q,1/3),offset),shift(point(p,q,2/3),offset),q]];
  }
  if(Math.abs(p[0]-q[0])<2||Math.abs(p[1]-q[1])<2)return [line(p,q)];
  // A fixed horizontal tangent at the outer boundary, opening into the fork.
  const dx=q[0]-p[0];
  return [[p,[p[0]+dx*.42,p[1]],[q[0]-dx*.42,q[1]],q]];
}
/** Static book exercise artwork. Boundary identity stays in graph data, never as visible labels. */
export function drawGraph(g,{label='ZX diagram'}={}) {
  const edges=g.edges.map((_,i)=>wire(graphCurves(g,i))).join('');
  const nodes=Object.entries(g.nodes).map(([id,[type,phase]])=>{
    let rotation=0;
    if(type==='H'){
      const index=g.edges.findIndex(e=>e.includes(id));
      if(index>=0){
        const curves=graphCurves(g,index),atStart=g.edges[index][0]===id;
        rotation=tangentAngle(atStart?curves[0]:curves.at(-1),atStart?0:1);
      }
    }
    return spider(type,g.positions[id],{radius:19,phase,rotation});
  }).join('');
  return svg(edges+nodes,{label,viewBox:Array.isArray(g.viewBox)?g.viewBox.join(' '):(g.viewBox||'0 0 600 400'),description:'ZX diagram. Wires join only at spiders; a crossing without a spider is not a junction.'});
}
export function diagram(id,{which='start',label=''}={}) {
  const pair=typeof id==='string'?graphs[id]:id;
  if(!pair)throw new RangeError(`Unknown lesson graph: ${id}`);
  return drawGraph(pair[['goal','after','target'].includes(which)?'goal':'start']||pair,{label:label||'ZX diagram'});
}


export const originalExerciseIds=Object.freeze(Object.keys(originalExercises));

/** Exercise artwork never interpolates from its start to its answer. */
export function exerciseDiagram(name,{variant='pair',label='Exercise diagram'}={}) {
  const key=String(name).replace(/\.png$/,'');
  const exercise=originalExercises[key];
  if(!exercise) throw new RangeError(`Unknown original exercise: ${name}`);
  if(variant==='start'||!exercise.goal) return drawGraph(exercise.start,{label});
  if(variant==='goal') return drawGraph(exercise.goal,{label:'Goal diagram'});
  return `<div class="lesson-art-pair">${drawGraph(exercise.start,{label})}<span aria-hidden="true">→</span>${drawGraph(exercise.goal,{label:'Goal diagram'})}</div>`;
}

function mountArtwork(container,{render,still,label,autoplay=true,interactive=true,duration=1550,hold=650}) {
  const doc=container.ownerDocument,win=doc.defaultView;
  const media=win.matchMedia('(prefers-reduced-motion: reduce)');
  const host=doc.createElement(interactive?'button':'div');
  host.className='lesson-rule';
  if(interactive){host.type='button';host.setAttribute('aria-label',label);}
  container.replaceChildren(host);
  const slide=container.closest('.deck .slide');
  let raf=0,start=null,played=false,disposed=false,visible=false;
  const active=()=>!slide||slide.classList.contains('is-active');
  const draw=t=>{host.innerHTML=render(t);};
  const cancel=()=>{if(raf)win.cancelAnimationFrame(raf);raf=0;start=null;};
  const staticFrame=()=>{host.innerHTML=still?still():render(1);};
  function tick(now) {
    if(disposed)return;
    if(!visible||!active()||doc.hidden){cancel();draw(1);return;}
    start??=now;
    const t=clamp((now-start-hold)/duration);
    draw(t);
    if(t<1)raf=win.requestAnimationFrame(tick);else{raf=0;start=null;}
  }
  function replay() {
    cancel();played=true;
    if(media.matches){staticFrame();return;}
    draw(0);raf=win.requestAnimationFrame(tick);
  }
  function maybePlay(){if(autoplay&&!played&&visible&&active()&&!doc.hidden&&!media.matches)replay();}
  function preferenceChanged(){
    cancel();
    if(media.matches)staticFrame();
    else {played=false;draw(0);maybePlay();}
    win.dispatchEvent(new Event('resize'));
  }
  if(interactive)host.addEventListener('click',replay);
  media.addEventListener('change',preferenceChanged);
  const observer=new win.IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.2);
    if(!visible&&raf){cancel();draw(1);}else maybePlay();
  },{threshold:[0,.2]});observer.observe(container);
  const mutation=slide?new win.MutationObserver(()=>{if(!active()&&raf){cancel();draw(1);}else maybePlay();}):null;
  if(slide)mutation.observe(slide,{attributes:true,attributeFilter:['class']});
  const visibility=()=>{if(doc.hidden&&raf){cancel();draw(1);}else maybePlay();};
  doc.addEventListener('visibilitychange',visibility);
  if(media.matches)staticFrame();else draw(0);
  return ()=>{disposed=true;cancel();observer.disconnect();mutation?.disconnect();host.removeEventListener('click',replay);media.removeEventListener('change',preferenceChanged);doc.removeEventListener('visibilitychange',visibility);};
}

/** In Learn, click the artwork to replay. Overview figures retain their navigation. */
export function mountRule(container,name,{autoplay=true,interactive=true}={}) {
  const key=ruleName(name),rule=rules[key];
  if(!rule)throw new RangeError(`No approved lesson animation: ${name}`);
  const render=t=>ruleDiagram(key,{progress:t});
  const still=()=>key==='intro'?render(1):key==='opposite'?render(0):`<div class="lesson-art-pair">${render(0)}<span aria-hidden="true">=</span>${render(1)}</div>`;
  return mountArtwork(container,{render,still,label:`Replay ${rule.title.toLowerCase()} animation`,autoplay,interactive});
}

/** Every exercise goal is static; the embedded editor owns the interactions. */
export function mountExercise(container,name,{variant='pair',label='Exercise diagram'}={}) {
  container.innerHTML=exerciseDiagram(name,{variant,label});
  return ()=>{};
}
