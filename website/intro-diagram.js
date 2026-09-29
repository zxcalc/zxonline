// The introductory circuit is translated gate by gate, without simplifying it.
// All wires, gate positions, and CNOT incidences are identical at both endpoints.
export function createIntroRule({ wire, spider, line, smooth, mix, lessonPalette }) {
  const ink = lessonPalette.wire;
  const rows = [52, 155, 258];
  const columns = [90, 180, 290, 380, 470];
  const rightOffset = 640;
  let maskSequence = 0;
  const fmt = value => Number(value.toFixed(5));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // The first control is on the bottom wire and its target is on the top.
  // Its vertical wire crosses the middle wire with no control, target or spider.
  const gates = [
    { id:'s', at:[columns[0],rows[0]], kind:'box', label:'S', type:'Z', phase:'π/2', group:0 },
    { id:'x1', at:[columns[0],rows[1]], kind:'box', label:'X', type:'X', phase:'π', group:0 },
    { id:'t', at:[columns[0],rows[2]], kind:'box', label:'T', type:'Z', phase:'π/4', group:0 },
    { id:'target1', at:[columns[1],rows[0]], kind:'target', type:'X', group:1 },
    { id:'control1', at:[columns[1],rows[2]], kind:'control', type:'Z', group:1 },
    { id:'h1', at:[columns[2],rows[0]], kind:'box', label:'H', type:'H', group:2 },
    { id:'control2', at:[columns[2],rows[1]], kind:'control', type:'Z', group:2 },
    { id:'target2', at:[columns[2],rows[2]], kind:'target', type:'X', group:2 },
    { id:'tdg', at:[columns[3],rows[0]], kind:'box', label:'T†', type:'Z', phase:'−π/4', group:3 },
    { id:'x2', at:[columns[3],rows[1]], kind:'box', label:'X', type:'X', phase:'π', group:3 },
    { id:'h2', at:[columns[4],rows[0]], kind:'box', label:'H', type:'H', group:4 },
  ];

  // Each horizontal wire passes through the same row coordinates at every gate.
  // Small opposite control-point offsets give the ink a restrained curved line.
  function wires(offset) {
    const result = rows.map((y,row) => {
      const xs = [25,...columns,530];
      return wire(xs.slice(0,-1).map((x,index) => {
        const end=xs[index+1], bend=(index%2 ? -1 : 1)*(row+1)*.7;
        return [[x+offset,y],[mix(x,end,1/3)+offset,y+bend],[mix(x,end,2/3)+offset,y-bend],[end+offset,y]];
      }));
    });
    result.push(wire([[[180+offset,52],[179+offset,120],[181+offset,190],[180+offset,258]]]));
    result.push(wire([[[290+offset,155],[292+offset,185],[288+offset,228],[290+offset,258]]]));
    return result.join('');
  }

  const boxPath = 'M -21 -22 C -7 -23 9 -22 21 -21 C 22 -8 21 9 20 22 C 6 23 -8 22 -21 21 C -22 8 -21 -9 -21 -22 Z';
  function conventional(gate) {
    if(gate.kind==='control') return `<circle r="6" fill="${ink}"/>`;
    if(gate.kind==='target') return `<circle r="13" fill="none" stroke="${ink}" stroke-width="3.25"/><path d="M -9 0 H 9 M 0 -9 V 9" fill="none" stroke="${ink}" stroke-width="3.25" stroke-linecap="round"/>`;
    return `<path d="${boxPath}" fill="none" stroke="${ink}" stroke-width="3.25" stroke-linejoin="round"/><text x="0" y="1" text-anchor="middle" dominant-baseline="middle" fill="${ink}" font-size="${gate.label==='T†'?22:25}" font-style="italic">${escape(gate.label)}</text>`;
  }
  function localProgress(gate,t) {
    if(t===0||t===1) return t;
    return smooth(Math.max(0,Math.min(1,(t-gate.group*.13)/.48)));
  }
  function circuit(offset,t,translate) {
    const maskId=`intro-gate-mask-${++maskSequence}`;
    const holes=gates.map(gate=>{
      const u=translate?localProgress(gate,t):0;
      if(u===1||gate.kind==='control') return '';
      const shape=gate.kind==='box'?`<path d="${boxPath}"/>`:'<circle r="13"/>';
      return `<g transform="translate(${gate.at[0]+offset} ${gate.at[1]})" fill="#000000" opacity="${fmt(1-u)}">${shape}</g>`;
    }).join('');
    const definitions=`<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="${offset}" y="0" width="600" height="310"><rect x="${offset}" y="0" width="600" height="310" fill="#ffffff"/>${holes}</mask></defs>`;
    const nodes=gates.map(gate=>{
      const u=translate?localProgress(gate,t):0;
      const at=[gate.at[0]+offset,gate.at[1]];
      const before=u===1?'':`<g data-circuit-gate="${gate.id}" transform="translate(${at.join(' ')})" opacity="${fmt(1-u)}">${conventional(gate)}</g>`;
      const after=u===0?'':`<g data-zx-generator="${gate.id}" opacity="${fmt(u)}">${spider(gate.type,at,{radius:gate.type==='H'?25:18,phase:gate.phase||'',scale:mix(.72,1,u)})}</g>`;
      return before+after;
    }).join('');
    return definitions+`<g data-intro-wires="${translate?'translation':'reference'}" mask="url(#${maskId})">${wires(offset)}</g>`+nodes;
  }

  return {
    title:'A circuit written with spiders and wires',
    description:'The same three-qubit circuit in two notations. S becomes a green π/2 spider; X becomes a red π spider; T and T dagger become green π/4 and −π/4 spiders; H becomes a yellow box. Each controlled NOT has a green control and a red target. The bottom-to-top controlled NOT crosses the middle wire without connecting to it. The second controlled NOT goes from the middle wire to the bottom wire. No circuit gate is simplified or moved.',
    viewBox:'0 0 1200 310',
    frame(progress) {
      const t=Math.max(0,Math.min(1,progress));
      const arrow=wire([line([568,155],[620,155])])+wire([line([609,147],[620,155]),line([620,155],[609,163])]);
      return `<g data-intro-reference="true">${circuit(0,0,false)}</g>`+arrow+`<g data-intro-translation="true">${circuit(rightOffset,t,true)}</g>`;
    },
  };
}
