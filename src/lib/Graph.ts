import { NodeData, EdgeData, WireData, GraphData, mapEquals, Coord } from "./Data";
import { moveForward, moveBackward, moveToFront, moveToBack } from "./util";

class Graph {
  private _graphData: GraphData = new GraphData();
  private _nodeData: Map<number, NodeData>;
  private _wireData: Map<number, WireData>;
  private _edgeData: Map<number, EdgeData>;
  private maxNodeId: number;
  private maxEdgeId: number;
  private maxWireId: number;

  constructor(graph?: Graph) {
    this._graphData = graph?._graphData ?? new GraphData();
    this._nodeData = graph !== undefined ? graph._nodeData : new Map();
    this._edgeData = graph !== undefined ? graph._edgeData : new Map();
    this._wireData = graph !== undefined ? graph._wireData : new Map();
    this.maxNodeId = graph?.maxNodeId ?? -1;
    this.maxEdgeId = graph?.maxEdgeId ?? -1;
    this.maxWireId = graph?.maxWireId ?? -1;
  }

  public get graphData(): GraphData {
    return this._graphData;
  }

  public get nodes(): NodeData[] {
    return Array.from(this._nodeData.values());
  }

  public get edges(): EdgeData[] {
    return Array.from(this._edgeData.values());
  }

  public get wires(): WireData[] {
    return Array.from(this._wireData.values());
  }

  public node(id: number): NodeData | undefined {
    return this._nodeData.get(id);
  }

  public edge(id: number): EdgeData | undefined {
    return this._edgeData.get(id);
  }

  public wire(id: number): WireData | undefined {
    return this._wireData.get(id);
  }

  public get nodeIds(): number[] {
    return Array.from(this._nodeData.keys());
  }

  public get wireIds(): number[] {
    return Array.from(this._wireData.keys());
  }

  public get edgeIds(): number[] {
    return Array.from(this._edgeData.keys());
  }

  public get numNodes(): number {
    return this._nodeData.size;
  }

  public get numEdges(): number {
    return this._edgeData.size;
  }

  public get numWires(): number {
    return this._wireData.size;
  }

  public hasNode(id: number): boolean {
    return this._nodeData.has(id);
  }

  public hasEdge(id: number): boolean {
    return this._edgeData.has(id);
  }

  public hasWire(id: number): boolean {
    return this._wireData.has(id);
  }

  public setGraphData(d: GraphData): Graph {
    const g = new Graph(this);
    g._graphData = d;
    return g;
  }

  public addNodeWithData(d: NodeData): Graph {
    const g = new Graph(this);
    g._nodeData = new Map(this._nodeData);
    g._nodeData.set(d.id, d);
    if (d.id > g.maxNodeId) {
      g.maxNodeId = d.id;
    }
    return g;
  }

  public addEdgeWithData(d: EdgeData): Graph {
    const g = new Graph(this);
    g._edgeData = new Map(this._edgeData);
    g._edgeData.set(d.id, d);
    if (d.id > g.maxEdgeId) {
      g.maxEdgeId = d.id;
    }
    return g;
  }

  public addWireWithData(d: WireData): Graph {
    const g = new Graph(this);
    g._wireData = new Map(this._wireData);
    g._wireData.set(d.id, d);
    if (d.id > g.maxWireId) {
      g.maxWireId = d.id;
    }
    return g;
  }

  public updateNodeData(id: number, fn: (data: NodeData) => NodeData): Graph {
    const node = this._nodeData.get(id);
    if (node) {
      const g = new Graph(this);
      g._nodeData = new Map(this._nodeData);
      g._nodeData.set(id, fn(node));
      return g;
    } else {
      return this;
    }
  }

  public setNodeData(id: number, data: NodeData): Graph {
    const g = new Graph(this);
    g._nodeData = new Map(this._nodeData);
    g._nodeData.set(id, data);
    return g;
  }

  public mapNodeData(fn: (data: NodeData) => NodeData): Graph {
    const g = new Graph(this);
    g._nodeData = new Map(this._nodeData);
    const keys = Array.from(g._nodeData.keys());
    for (const key of keys) {
      g._nodeData.set(key, fn(g._nodeData.get(key)!));
    }
    return g;
  }

  public updateEdgeData(id: number, fn: (data: EdgeData) => EdgeData): Graph {
    const edge = this._edgeData.get(id);
    if (edge) {
      const g = new Graph(this);
      g._edgeData = new Map(this._edgeData);
      g._edgeData.set(id, fn(edge));
      return g;
    } else {
      return this;
    }
  }

  public setEdgeData(id: number, data: EdgeData): Graph {
    const g = new Graph(this);
    g._edgeData = new Map(this._edgeData);
    g._edgeData.set(id, data);
    return g;
  }

  public mapEdgeData(fn: (data: EdgeData) => EdgeData): Graph {
    const g = new Graph(this);
    g._edgeData = new Map(this._edgeData);
    const keys = Array.from(g._edgeData.keys());
    for (const key of keys) {
      g._edgeData.set(key, fn(g._edgeData.get(key)!));
    }
    return g;
  }

  public updateWireData(id: number, fn: (data: WireData) => WireData): Graph {
    const wire = this._wireData.get(id);
    if (wire) {
      const g = new Graph(this);
      g._wireData = new Map(this._wireData);
      g._wireData.set(id, fn(wire));
      return g;
    } else {
      return this;
    }
  }

  public setWireData(id: number, data: WireData): Graph {
    const g = new Graph(this);
    g._wireData = new Map(this._wireData);
    g._wireData.set(id, data);
    return g;
  }

  public edgeSourceData(id: number): NodeData | undefined {
    const edge = this._edgeData.get(id);
    if (edge) {
      return this._nodeData.get(edge.source);
    } else {
      return undefined;
    }
  }

  public edgeTargetData(id: number): NodeData | undefined {
    const edge = this._edgeData.get(id);
    if (edge) {
      return this._nodeData.get(edge.target);
    } else {
      return undefined;
    }
  }

  public wireSource(id: number): number {
    const edge = this._edgeData.get(this._wireData.get(id)!.edges[0])!;
    return edge.source;
  }

  public wireTarget(id: number): number {
    const edge = this._edgeData.get(
      this._wireData.get(id)!.edges[this._wireData.get(id)!.edges.length - 1]
    )!;
    return edge.target;
  }

  public wireNodes(id: number): number[] {
    const wire = this._wireData.get(id);
    if (!wire) {
      return [];
    }
    const nodes: number[] = [];
    for (const e of wire!.edges) {
      if (nodes.length === 0) {
        nodes.push(this.edge(e)!.source);
      }
      nodes.push(this.edge(e)!.target);
    }
    return nodes;
  }

  public wireEdges(id: number): number[] {
    const wire = this._wireData.get(id);
    if (wire) {
      return wire.edges;
    }
    return [];
  }

  public removeNodes(nodes: Iterable<number>): Graph {
    const g = new Graph(this);
    g._nodeData = new Map(this._nodeData);
    g._edgeData = new Map(this._edgeData);
    const nodeSet = new Set(nodes);
    for (const n of nodeSet) {
      g._nodeData.delete(n);
    }

    for (const ed of g._edgeData.values()) {
      if (nodeSet.has(ed.source) || nodeSet.has(ed.target)) {
        g._edgeData.delete(ed.id);
      }
    }

    return g.fixWires();
  }

  public removeEdges(edges: Iterable<number>): Graph {
    const g = new Graph(this);
    g._edgeData = new Map(this._edgeData);
    const remove = Array.from(edges);
    for (const e of remove) {
      g._edgeData.delete(e);
    }
    return g.fixWires();
  }

  public removeWire(wireId: number): Graph {
    const g = new Graph(this);
    g._wireData = new Map(this._wireData);
    g._wireData.delete(wireId);
    return g;
  }

  // after modifying or removing edges, cut wires into multiple pieces where edges are missing
  // or non-contiguous, and remove any empty wires
  private fixWires(): Graph {
    let g = new Graph(this);
    const wires = Array.from(g._wireData.values());

    for (const wd of wires) {
      // split wire into parts where edges are present and contiguous
      const wireParts: number[][] = [[]];
      for (const e of wd.edges) {
        let es = wireParts[wireParts.length - 1];
        if (g._edgeData.has(e)) {
          if (es.length > 0) {
            const lastE = g._edgeData.get(es[es.length - 1])!;
            if (lastE.target !== g._edgeData.get(e)!.source) {
              wireParts.push([]);
              es = wireParts[wireParts.length - 1];
            }
          }
          es.push(e);
        } else if (es.length > 0) {
          wireParts.push([]);
        }
      }

      if (wireParts[wireParts.length - 1].length === 0) {
        wireParts.pop();
      }

      if (wireParts.length === 0) {
        g = g.removeWire(wd.id);
        continue;
      }

      let wireId = wd.id;
      for (const part of wireParts) {
        // reuse the existing wire ID for the first part
        g = g.addWireWithData(new WireData().setId(wireId).setEdges(part));
        part.forEach(e => {
          g = g.updateEdgeData(e, ed => ed.setWire(wireId));
        });
        wireId = g.freshWireId;
      }
    }
    return g;
  }

  // reverse the direction of a wire
  public reverseWire(wireId: number): Graph {
    let graph = new Graph(this);
    const wd = this._wireData.get(wireId)!;
    graph = graph.updateWireData(wireId, w => w.setEdges(wd.edges.reverse()));
    for (const e of wd.edges) {
      graph = graph.updateEdgeData(e, ed => ed.reverse());
    }
    return graph;
  }

  // splits a wire with N edges into N wires with 1 edge each
  public splitWire(wireId: number): Graph {
    let graph = new Graph(this);
    const wd = this._wireData.get(wireId)!;

    if (wd.edges.length > 1) {
      graph = graph.updateWireData(wireId, w => w.setEdges(wd.edges.slice(0, 1)));
      for (const e of wd.edges.slice(1)) {
        const newWireId = graph.freshWireId;
        graph = graph.addWireWithData(new WireData().setId(newWireId).setEdges([e]));
        graph = graph.updateEdgeData(e, ed => ed.setWire(newWireId));
      }
    }

    return graph;
  }

  // join two wires that connect, reversing one of the wires if necessary
  // Returns undefined if the wires cannot be joined and always preserves the first wire ID
  private joinTwoWires(wire1: number, wire2: number): Graph | undefined {
    let graph = new Graph(this);
    const wd1 = this._wireData.get(wire1);
    const wd2 = this._wireData.get(wire2);

    if (wd1 === undefined || wd2 === undefined) {
      return undefined;
    }

    // there are four cases. Depending on how the wires connect, we may need to reverse
    // wire2 then either prepend or append its edges to wire1

    if (this.wireTarget(wire1) === this.wireSource(wire2)) {
      // I join two wires in the morning
      graph = graph.updateWireData(wire1, w => w.setEdges(wd1.edges.concat(wd2.edges)));
    } else if (this.wireSource(wire1) === this.wireTarget(wire2)) {
      // I join two wires at night
      graph = graph.updateWireData(wire1, w => w.setEdges(wd2.edges.concat(wd1.edges)));
    } else if (this.wireTarget(wire1) === this.wireTarget(wire2)) {
      // I join two wires in the afternoon
      graph = graph.reverseWire(wire2);
      graph = graph.updateWireData(wire1, w => w.setEdges(wd1.edges.concat(wd2.edges)));
    } else if (this.wireSource(wire1) === this.wireSource(wire2)) {
      // It makes me feel alright
      graph = graph.reverseWire(wire2);
      graph = graph.updateWireData(wire1, w => w.setEdges(wd2.edges.concat(wd1.edges)));
    } else {
      return undefined;
    }

    graph = graph.removeWire(wire2);
    for (const e of wd2.edges) {
      graph = graph.updateEdgeData(e, ed => ed.setWire(wire1));
    }

    return graph;
  }

  // attempt to join a collection of wires into a single wire, reversing wires if necessary
  public joinWires(wires: Iterable<number>): Graph {
    let graph = new Graph(this);

    let otherWires = Array.from(wires);
    if (otherWires.length === 0) {
      return this;
    }
    const wire = otherWires[0];
    otherWires = otherWires.slice(1);

    while (otherWires.length > 0) {
      const w = otherWires.find(w => {
        const g = graph.joinTwoWires(wire, w);
        if (g !== undefined) {
          graph = g;
          return true;
        } else {
          return false;
        }
      });

      if (w !== undefined) {
        otherWires = otherWires.filter(q => q !== w);
      } else {
        return this;
      }
    }
    return graph;
  }

  public reorderElements(
    nodes: Set<number>,
    wires: Set<number>,
    direction: "forward" | "backward" | "front" | "back"
  ): Graph {
    const g = new Graph(this);
    switch (direction) {
      case "forward":
        g._nodeData = moveForward(g._nodeData, nodes);
        g._wireData = moveForward(g._wireData, wires);
        break;
      case "backward":
        g._nodeData = moveBackward(g._nodeData, nodes);
        g._wireData = moveBackward(g._wireData, wires);
        break;
      case "front":
        g._nodeData = moveToFront(g._nodeData, nodes);
        g._wireData = moveToFront(g._wireData, wires);
        break;
      case "back":
        g._nodeData = moveToBack(g._nodeData, nodes);
        g._wireData = moveToBack(g._wireData, wires);
        break;
    }
    return g;
  }

  public subgraphFromNodes(nodes: Iterable<number>): Graph {
    const nodeSet = new Set(nodes);
    const nodeComp = this.nodeIds.filter(key => !nodeSet.has(key));
    return this.removeNodes(nodeComp);
  }

  // insert the other graph, setting fresh IDs where necessary
  public insertGraph(other: Graph): Graph {
    let g = new Graph(this);
    const ntab: { [key: number]: number } = {};
    const etab: { [key: number]: number } = {};
    const wtab: { [key: number]: number } = {};

    for (const [id, data] of other._nodeData) {
      ntab[id] = g._nodeData.has(id) ? g.freshNodeId : id;
      g = g.addNodeWithData(data.setId(ntab[id]));
    }

    for (const [id, data] of other._edgeData) {
      etab[id] = g._edgeData.has(id) ? g.freshEdgeId : id;
      const d = data.setId(etab[id]).setSource(ntab[data.source]).setTarget(ntab[data.target]);
      g = g.addEdgeWithData(d);
    }

    for (const [id, data] of other._wireData) {
      wtab[id] = g.hasWire(id) ? g.freshWireId : id;
      const d = data.setId(wtab[id]).setEdges(data.edges.map(e => etab[e]));
      g = g.addWireWithData(d);
    }

    g = g.mapEdgeData(d => (!this.hasEdge(d.id) ? d.setWire(wtab[d.wire]) : d));

    return g;
  }

  // shift all nodes by the given offsets
  public shiftGraph(dx: number, dy: number): Graph {
    return this.mapNodeData(d => d.setCoord(d.coord.shift(dx, dy)));
  }

  // merge nodes that are at identical positions within the given selection
  public mergeNodes(sel: Set<number>): Graph {
    let g = new Graph(this);
    const posMap: Map<string, number[]> = new Map();
    const mergeMap: Map<number, number> = new Map();

    for (const n of g.nodes) {
      const key = `${Math.round(n.coord.x * 40)},${Math.round(n.coord.y * 40)}`;
      if (!posMap.has(key)) {
        posMap.set(key, [n.id]);
      } else {
        posMap.get(key)!.push(n.id);
      }
    }

    const removeNodes = [];
    for (let ids of posMap.values()) {
      if (ids.length > 1) {
        ids.reverse();

        // the merge target is chosen to be the frontmost selected node, if any
        const target = ids.find(id => sel.has(id));
        ids = ids.filter(id => id !== target);
        if (target !== undefined) {
          for (const id of ids) {
            mergeMap.set(id, target);
          }
          removeNodes.push(...ids);
        }
      }
    }

    for (const e of g.edges) {
      if (mergeMap.has(e.source) || mergeMap.has(e.target)) {
        const newSource = mergeMap.get(e.source) ?? e.source;
        const newTarget = mergeMap.get(e.target) ?? e.target;
        const newEdge = e.setSource(newSource).setTarget(newTarget);
        const createsLoop = e.source !== e.target && newSource === newTarget;

        // only keep the edge if it doesn't already exist and it isn't creating a new self-loop
        if (!createsLoop && g.edges.find(ed => newEdge.hasSameData(ed)) === undefined) {
          g = g.setEdgeData(e.id, newEdge);
        } else {
          g = g.removeEdges([e.id]);
        }
      }
    }

    g = g.removeNodes(removeNodes);
    return g;
  }

  public reflectNodes(nodeIds: Set<number>, horizontal: boolean): Graph {
    if (nodeIds.size === 0) {
      return this;
    }

    // find the center coordinate
    let min = Infinity;
    let max = -Infinity;
    for (const n of this.nodes) {
      if (nodeIds.has(n.id)) {
        min = Math.min(min, horizontal ? n.coord.x : n.coord.y);
        max = Math.max(max, horizontal ? n.coord.x : n.coord.y);
      }
    }
    const center = (min + max) / 2;

    return this.mapNodeData(d =>
      nodeIds.has(d.id) ? d.reflect(center, horizontal) : d
    ).mapEdgeData(d =>
      nodeIds.has(d.source) && nodeIds.has(d.target) ? d.reflect(horizontal) : d
    );
  }

  public reverseEdges(edgeIds: Set<number>): Graph {
    return this.mapEdgeData(d => (edgeIds.has(d.id) ? d.reverse() : d));
  }

  public get freshNodeId(): number {
    return this.maxNodeId + 1;
  }

  public get freshEdgeId(): number {
    return this.maxEdgeId + 1;
  }

  public get freshWireId(): number {
    return this.maxWireId + 1;
  }

  /** This function inherits any identical data from the provided graph
   *
   * This helps reactive components recognise the same data via Object.is() after the graph
   * has been re-parsed.
   */
  public inheritDataFrom(other: Graph) {
    for (const [key, d] of other._nodeData.entries()) {
      if (this._nodeData.get(key)?.equals(d)) {
        this._nodeData.set(key, d);
      }
    }

    for (const [key, d] of other._edgeData.entries()) {
      if (this._edgeData.get(key)?.equals(d)) {
        this._edgeData.set(key, d);
      }
    }

    for (const [key, d] of other._wireData.entries()) {
      if (this._wireData.get(key)?.equals(d)) {
        this._wireData.set(key, d);
      }
    }
  }

  public equals(other: Graph): boolean {
    return (
      mapEquals(this._nodeData, other._nodeData) &&
      mapEquals(this._edgeData, other._edgeData) &&
      mapEquals(this._wireData, other._wireData) &&
      this.maxNodeId === other.maxNodeId &&
      this.maxEdgeId === other.maxEdgeId &&
      this.maxWireId === other.maxWireId
    );
  }

  public tikzWithPosition(
    node?: number,
    edge?: number
  ): [string, { line: number; column: number } | undefined] {
    let position: { line: number; column: number } | undefined = undefined;
    const wire = edge ? this.edge(edge)?.wire : undefined;

    let result = "\\begin{tikzpicture}\n";
    result += "\t\\begin{pgfonlayer}{nodelayer}\n";
    for (const d of this.nodes.values()) {
      if (d) {
        const dt = d.tikz();
        result += "\t\t\\node " + dt;

        if (node === d.id) {
          // return the position of the end of the property list
          const lines = result.split("\n");
          position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
        }

        if (dt !== "") {
          result += " ";
        }

        result += `(${d.id}) at (${d.coord.x}, ${d.coord.y}) {${d.label}};\n`;
      }
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\t\\begin{pgfonlayer}{edgelayer}\n";
    for (const wd of this.wires) {
      for (const [i, e] of wd.edges.entries()) {
        const d = this.edge(e)!;
        const edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";

        if (i === 0) {
          const dt = d.tikz();
          result += `\t\t\\draw ${dt}`;

          if (wire === wd.id) {
            // return the position of the end of the edge property list
            const lines = result.split("\n");
            position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
          }

          if (dt !== "") {
            result += " ";
          }

          result += `${d.sourceRef} to${edgeNode} ${d.targetRef}`;
        } else {
          const targetRef =
            i === wd.edges.length - 1 && d.target === this.edge(wd.edges[0])!.source
              ? "cycle"
              : d.targetRef;

          // wireProperties does not contain "style", which is inherited from the first edge in the wire
          result += ` to${d.wireProperties().tikz()}${edgeNode} ${targetRef}`;
        }
      }
      result += ";\n";
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\\end{tikzpicture}\n";
    return [result, position];
  }

  public tikz(): string {
    return this.tikzWithPosition()[0];
  }
}

export default Graph;
