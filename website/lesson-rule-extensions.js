// The remaining original lesson rules. Geometry uses the accepted lesson renderer;
// no palette, typography, controls, or puzzle-solution sequences are introduced here.
// Curved leg subdivision follows the Daily ZX motion sources and their fixed-lead
// convention. Image 010's missing colour flip is corrected in the mathematical endpoint.
export function createAdditionalRules(helpers) {
  const {wire,spider,line,at,point,smooth,mix,shift,delta,split,segment,lessonPalette}=helpers;
  const centre=[300,170];
  const radius=25;
  const clamp=t=>Math.max(0,Math.min(1,t));
  const bent=(a,b,bend=0)=>{
    const d=delta(b,a),length=Math.hypot(...d)||1,offset=[-d[1]/length*bend,d[0]/length*bend];
    return [a,shift(point(a,b,1/3),offset),shift(point(a,b,2/3),offset),b];
  };
  function legParts(curve) {
    const direction=delta(curve[1],curve[0]),length=Math.hypot(...direction);
    const lead=shift(curve[0],direction.map(v=>v/length*18));
    return [line(curve[0],lead),[lead,curve[1],curve[2],curve[3]]];
  }
  function exterior(curve,end=curve[3],handle=shift(curve[2],delta(end,curve[3]))) {
    const [lead,tail]=legParts(curve);
    return wire([lead,[tail[0],tail[1],handle,end]]);
  }

  const ink=lessonPalette?.wire || '#211f1e';
  const palette=lessonPalette || {Z:'#316f29',X:'#e04f48',H:'#f0cc4b'};
  const easeOut=t=>1-Math.pow(1-clamp(t),3);
  const reverse=c=>[...c].reverse();
  const morphCurve=(a,b,t)=>a.map((p,i)=>point(p,b[i],t));
  const tangent=(c,t)=>{
    const u=1-t;
    return [0,1].map(i=>3*u*u*(c[1][i]-c[0][i])+6*u*t*(c[2][i]-c[1][i])+3*t*t*(c[3][i]-c[2][i]));
  };
  function boxOn(curve,t,radius=25) {
    const p=at(curve,t),v=tangent(curve,t),angle=Math.atan2(v[1],v[0])*180/Math.PI;
    return `<g transform="rotate(${angle} ${p[0]} ${p[1]})">${spider('H',p,{radius})}</g>`;
  }
  function dots(x,y) {
    return [-9,0,9].map(dx=>`<circle cx="${x+dx}" cy="${y}" r="2.4" fill="${ink}"/>`).join('');
  }
  function blendColour(a,b,t) {
    const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
    const aa=rgb(a),bb=rgb(b);
    return '#'+aa.map((v,i)=>Math.round(mix(v,bb[i],t)).toString(16).padStart(2,'0')).join('');
  }
  function morphPiece(type,pos,morph,{width=11.2,height=33.6,radius=27,balloon=1}={}) {
    const u=clamp(morph),w=width/2,h=height/2,r=radius*balloon;
    if(u===1 && balloon===1)return spider(type,pos,{radius,phase:1});
    const a=[[-w,0],[-w,-h],[-w,-h],[0,-h],[w,-h],[w,-h],[w,0],[w,h],[w,h],[0,h],[-w,h],[-w,h],[-w,0]];
    const b=[[-.96*r,-.04*r],[-.99*r,-.65*r],[-.40*r,-1.10*r],[.13*r,-1.03*r],[.81*r,-.99*r],[1.05*r,-.44*r],[.98*r,.20*r],[.91*r,.84*r],[.30*r,1.06*r],[-.19*r,1.01*r],[-.78*r,.96*r],[-1.04*r,.55*r],[-.96*r,-.04*r]];
    const ps=a.map((v,i)=>point(v,b[i],u));
    const d=`M ${ps[0].join(' ')} `+[1,4,7,10].map(i=>`C ${ps[i].join(' ')} ${ps[i+1].join(' ')} ${ps[i+2].join(' ')}`).join(' ')+' Z';
    const fill=blendColour(palette.H,palette[type],smooth(u));
    return `<g transform="translate(${pos.join(' ')})"><path d="${d}" fill="${fill}"/><text x="0" y="1" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="${radius*.91}" font-style="italic" opacity="${smooth((u-.48)/.40)}">π/2</text></g>`;
  }
  function poof(pos,t) {
    if(t<=0||t>=1)return '';
    const opacity=Math.sin(Math.PI*t),r=27+17*t;
    return Array.from({length:6},(_,i)=>{
      const a=i*Math.PI/3-.2,d=[Math.cos(a),Math.sin(a)];
      return wire([line(shift(pos,d.map(x=>x*r)),shift(pos,d.map(x=>x*(r+5))))],`opacity="${opacity}"`);
    }).join('');
  }

  // Image 005: unlike colours remain distinct even when brought together.
  // This is a geometric comparison, deliberately not a fusion rewrite.
  const oppositeJoin=[[230,112],[305,87],[286,236],[371,216]];
  const oppositeLegs=[
    {n:0,c:[[126,39],[131,86],[174,103],oppositeJoin[0]]},
    {n:0,c:[[242,33],[246,72],[236,84],oppositeJoin[0]]},
    {n:0,c:[[105,303],[116,244],[142,169],oppositeJoin[0]]},
    {n:1,c:[[485,38],[485,122],[430,196],oppositeJoin[3]]},
    {n:1,c:[[299,307],[296,267],[327,235],oppositeJoin[3]]},
    {n:1,c:[[493,300],[476,257],[419,227],oppositeJoin[3]]},
  ];
  function oppositeFrame(t) {
    t=clamp(t);
    const excursion=.24*smooth(t<.5?t*2:(1-t)*2);
    const a=at(oppositeJoin,excursion),b=at(oppositeJoin,1-excursion);
    const outside=oppositeLegs.map(({n,c})=>exterior(c,n===0?a:b)).join('');
    return outside+wire([segment(oppositeJoin,excursion,1-excursion)])+
      spider('Z',a,{radius:27,phase:'α'})+spider('X',b,{radius:27,phase:'β'})+dots(188,66)+dots(405,280);
  }

  // Image 009: one H splits into three connected pieces. The side pieces
  // shoot outward and round into green spiders; the middle balloons into red.
  // Horizontal orientation makes the requested left/right separation immediate.
  const decompositionWire=line([95,170],[505,170]);
  function decompositionFrame(t) {
    t=clamp(t);
    const fixed=wire([decompositionWire]);
    if(t===0)return fixed+spider('H',[300,170],{radius:29});
    const spread=easeOut((t-.06)/.56),morph=smooth((t-.10)/.72);
    const distance=mix(11.2,88,spread);
    const balloon=1+.13*Math.sin(Math.PI*smooth((t-.20)/.80));
    return fixed+morphPiece('Z',[300-distance,170],morph)+
      morphPiece('X',[300,170],morph,{balloon})+
      morphPiece('Z',[300+distance,170],morph);
  }

  // Image 010: a Hadamard travels along the actual incoming cubic to the spider.
  // At contact the colour flips and one box leaves on each remaining leg.
  const colourLegs=[
    [[147,294],[206,296],[284,234],centre],
    [[170,40],[173,101],[242,150],centre],
    [[449,40],[443,112],[356,150],centre],
  ];
  const colourPaths=colourLegs.map(c=>legParts(c)[1]);
  const colourInk=colourLegs.map(c=>exterior(c)).join('');
  function colourFrame(t) {
    t=clamp(t);
    if(t<.43) {
      const position=mix(.24,1,smooth(t/.43));
      return colourInk+spider('Z',centre,{radius:28})+boxOn(colourPaths[0],position);
    }
    const impact=clamp((t-.43)/.19),decay=1-impact;
    const shake=[3.5*Math.sin(impact*Math.PI*4)*decay,1.9*Math.sin(impact*Math.PI*6)*decay];
    const position=1-.61*easeOut((t-.43)/.48);
    return colourInk+spider('X',shift(centre,shake),{radius:28})+
      boxOn(colourPaths[1],position)+boxOn(colourPaths[2],position);
  }

  // Image 016: the unary red state enters the green spider, then two red states
  // leave along its two remaining curves. Subdivision keeps their wires attached.
  const copyCentre=[348,170];
  const copyLegs=[
    [[100,76],[180,72],[273,99],copyCentre],
    [[100,264],[182,269],[273,241],copyCentre],
  ];
  const copyParts=copyLegs.map(legParts);
  const copyIncoming=[[476,160],[432,164],[385,174],copyCentre];
  function copyFrame(t) {
    t=clamp(t);
    if(t<.5) {
      const u=smooth(t*2),state=at(copyIncoming,u);
      return copyLegs.map(c=>exterior(c)).join('')+wire([split(copyIncoming,u)[1]])+
        spider('Z',copyCentre,{radius:27})+spider('X',state,{radius:27});
    }
    const u=t===1?1:smooth(t*2-1),cut=1-.48*u;
    const paths=copyParts.map(([lead,tail])=>wire([lead,split(tail,cut)[0]])).join('');
    return paths+copyParts.map(([,tail])=>spider('X',at(tail,cut),{radius:27})).join('');
  }

  // Image 018, PQS (3.56): the bottom pair disappears; the top positions
  // survive. Their colours flip so each old green boundary reaches the new
  // red spider and vice versa. Lower wires reroute without moving boundaries.
  const squareStart={a:[220,102],b:[380,102],c:[220,238],d:[380,238]};
  const squareLegs=[
    [[118,36],[146,68],[183,90],squareStart.a],
    [[482,36],[454,68],[417,90],squareStart.b],
    [[118,304],[146,272],[220,278],squareStart.c],
    [[482,304],[454,272],[380,278],squareStart.d],
  ];
  const squareTop=bent(squareStart.a,squareStart.b,-18);
  const squareUpLeft=reverse(bent(squareStart.a,squareStart.c,18));
  const squareUpRight=reverse(bent(squareStart.b,squareStart.d,-18));
  function reroutedLower(index,u) {
    const [lead,tail]=legParts(squareLegs[index]);
    const source=index===2?[tail,squareUpLeft,squareTop]:[tail,squareUpRight,reverse(squareTop)];
    const end=index===2?squareStart.b:squareStart.a;
    const target=[tail[0],tail[1],index===2?[350,173]:[250,173],end];
    const targetParts=[segment(target,0,.4),segment(target,.4,.75),segment(target,.75,1)];
    return wire([lead,...source.map((curve,i)=>morphCurve(curve,targetParts[i],u))]);
  }
  function squareFrame(t) {
    t=clamp(t);
    const vanish=smooth((t-.14)/.28),route=smooth((t-.31)/.62);
    const outside=exterior(squareLegs[0])+exterior(squareLegs[1])+reroutedLower(2,route)+reroutedLower(3,route);
    const lower=vanish===1?'':wire([bent(squareStart.c,squareStart.d,18)],`opacity="${1-vanish}"`);
    const topNodes=spider(t<.36?'Z':'X',squareStart.a,{radius})+spider(t<.36?'X':'Z',squareStart.b,{radius});
    const bottomNodes=vanish===1?'':spider('X',squareStart.c,{radius,scale:1-vanish})+spider('Z',squareStart.d,{radius,scale:1-vanish});
    const puff=poof(squareStart.c,(t-.17)/.31)+poof(squareStart.d,(t-.17)/.31);
    return outside+wire([squareTop])+lower+topNodes+bottomNodes+puff;
  }

  // Image 020: the reverse rule is a true K2,2 expansion, not two disconnected
  // pairs. All four mixed-colour connections remain in the endpoint.
  const expansionStart={a:[222,170],b:[378,170]};
  const expansionEnd={p:[224,102],q:[224,238],r:[376,102],s:[376,238]};
  const expansionLegs=[
    {old:'a',next:'p',c:[[92,102],[143,101],[197,127],expansionStart.a],final:[189,102]},
    {old:'a',next:'q',c:[[92,238],[143,239],[197,213],expansionStart.a],final:[189,238]},
    {old:'b',next:'r',c:[[508,102],[457,101],[403,127],expansionStart.b],final:[411,102]},
    {old:'b',next:'s',c:[[508,238],[457,239],[403,213],expansionStart.b],final:[411,238]},
  ];
  // One eased transit carries green through the stationary red spider. The
  // cubic overshoots to the right and rounds back into its final column; it
  // never stops at contact or restarts with a new velocity.
  const expansionTransit=[[222,170],[290,170],[620,170],[376,170]];
  let expansionContactLow=0,expansionContactHigh=.6;
  for(let i=0;i<48;i++) {
    const middle=(expansionContactLow+expansionContactHigh)/2;
    if(at(expansionTransit,middle)[0]<expansionStart.b[0])expansionContactLow=middle;
    else expansionContactHigh=middle;
  }
  const expansionContact=(expansionContactLow+expansionContactHigh)/2;
  function expansionFrame(t) {
    t=clamp(t);
    const u=smooth(t),contact=expansionStart.b,green=at(expansionTransit,u);
    if(u<expansionContact) {
      return expansionLegs.map(({old,c})=>exterior(c,old==='a'?green:contact)).join('')+
        wire([line(green,contact)])+spider('Z',green,{radius})+spider('X',contact,{radius});
    }
    // Both copies begin exactly superimposed at contact. They peel apart on
    // continuous arcs, without fades, jumps or a second launch. Red holds its
    // position until green has visibly emerged on the far side.
    const opening=smooth((u-expansionContact)/(1-expansionContact));
    const release=smooth((u-.60)/.40);
    const redX=mix(contact[0],expansionEnd.p[0],release);
    const p={p:[redX,170-68*release],q:[redX,170+68*release],
      r:[green[0],170-68*opening],s:[green[0],170+68*opening]};
    const outside=expansionLegs.map(({old,next,c,final})=>{
      const following=shift(c[2],delta(p[next],expansionStart[old]));
      const resolved=shift(final,delta(p[next],expansionEnd[next]));
      return exterior(c,p[next],point(following,resolved,opening));
    }).join('');
    const inside=wire([bent(p.p,p.r,-18*opening)])+wire([line(p.p,p.s)])+
      wire([line(p.q,p.r)])+wire([bent(p.q,p.s,18*opening)]);
    // Green stays behind the red silhouettes throughout the crossing.
    return outside+inside+spider('Z',p.r,{radius})+spider('Z',p.s,{radius})+
      spider('X',p.p,{radius})+spider('X',p.q,{radius});
  }

  return {
    opposite:{frame:oppositeFrame,title:'Opposite colours',description:'A green and a red spider approach and return. They remain separate; opposite colours do not fuse.'},
    decomposition:{frame:decompositionFrame,title:'Colour-change box',description:'One Hadamard box becomes a green π/2 spider, a red π/2 spider, and a green π/2 spider on the same wire, up to nonzero global scalar.'},
    colour:{frame:colourFrame,title:'Colour change',description:'A Hadamard enters a green spider. The spider changes to red and one Hadamard appears on each of the other legs.'},
    copy:{frame:copyFrame,title:'Copy',description:'A blank red endpoint passes into a blank green spider and copies onto its two other legs.'},
    square:{frame:squareFrame,title:'Square popping',description:'The two bottom spiders disappear. Their wires reroute to the two fixed top spiders, whose colours flip to preserve the correct boundary connections.'},
    expansion:{frame:expansionFrame,title:'Spider expansion',description:'The green spider moves behind the fixed red spider. Four mixed-colour connections emerge, then the expanded diagram settles left. Exterior boundaries stay fixed.'},
  };
}
