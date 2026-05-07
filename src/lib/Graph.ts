import { NodeData, EdgeData, GraphData, mapEquals, Coord } from "./Data";
import { moveForward, moveBackward, moveToFront, moveToBack } from "./util";

class Graph {
  private _graphData: GraphData = new GraphData();
  private _nodeData: Map<number, NodeData>;
  private _edgeData: Map<number, EdgeData>;
  private maxNodeId: number;
  private maxEdgeId: number;

  constructor(graph?: Graph) {
    this._graphData = graph?._graphData ?? new GraphData();
    this._nodeData = graph !== undefined ? graph._nodeData : new Map();
    this._edgeData = graph !== undefined ? graph._edgeData : new Map();
    this.maxNodeId = graph?.maxNodeId ?? -1;
    this.maxEdgeId = graph?.maxEdgeId ?? -1;
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

  public node(id: number): NodeData | undefined {
    return this._nodeData.get(id);
  }

  public edge(id: number): EdgeData | undefined {
    return this._edgeData.get(id);
  }

  public get nodeIds(): number[] {
    return Array.from(this._nodeData.keys());
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

  public hasNode(id: number): boolean {
    return this._nodeData.has(id);
  }

  public hasEdge(id: number): boolean {
    return this._edgeData.has(id);
  }

  public hasPoints(id: number): boolean {
    const edge = this._edgeData.get(id);
    return edge !== undefined && edge.points.length > 0;
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

    return g;
  }

  public removeEdges(edges: Iterable<number>): Graph {
    const g = new Graph(this);
    g._edgeData = new Map(this._edgeData);
    const remove = Array.from(edges);
    for (const e of remove) {
      g._edgeData.delete(e);
    }
    return g;
  }
// Split edge by converting points to nodes.
public splitEdge(edgeId: number): Graph {
  let g = new Graph(this);
  const edge = g._edgeData.get(edgeId);
  if (!edge || edge.points.length === 0) return this;

  const points = edge.points;
  let prevNodeId = edge.source;

  // remove original edge
  g = g.removeEdges([edgeId]);

  // create a new node and edge for each intermediate point
  for (let i = 0; i < points.length; i++) {
    const newNodeId = g.freshNodeId;
    const newNode = new NodeData()
      .setId(newNodeId)
      .setCoord(points[i]);
    g = g.addNodeWithData(newNode);

    const newEdgeId = g.freshEdgeId;
    const newEdge = new EdgeData()
      .setId(newEdgeId)
      .setSource(prevNodeId)
      .setTarget(newNodeId);
    g = g.addEdgeWithData(newEdge);

    prevNodeId = newNodeId;
  }

  // final edge from last new node to original target
  const finalEdge = new EdgeData()
    .setId(g.freshEdgeId)
    .setSource(prevNodeId)
    .setTarget(edge.target);
  g = g.addEdgeWithData(finalEdge);

  return g;
}

  // join two edges that connect
  // Returns undefined if the edges cannot be joined and always preserves the first edge ID
  private joinTwoEdges(edge1: number, edge2: number): Graph | undefined {
  const ed1 = this._edgeData.get(edge1);
  const ed2 = this._edgeData.get(edge2);

  if (ed1 === undefined || ed2 === undefined) return undefined;

  let newSource: number;
  let newTarget: number;
  let newPoints: Coord[];
  let sharedNode: number;

  const n1s = ed1.source, n1t = ed1.target;
  const n2s = ed2.source, n2t = ed2.target;

  if (n1t === n2s) {
    sharedNode = n1t;
    newSource = n1s;
    newTarget = n2t;
    const sharedCoord = this._nodeData.get(sharedNode)!.coord;
    newPoints = [...ed1.points, sharedCoord, ...ed2.points];
  } else if (n2t === n1s) {
    sharedNode = n1s;
    newSource = n2s;
    newTarget = n1t;
    const sharedCoord = this._nodeData.get(sharedNode)!.coord;
    newPoints = [...ed2.points, sharedCoord, ...ed1.points];
  } else if (n1t === n2t) {
    sharedNode = n1t;
    newSource = n1s;
    newTarget = n2s;
    const sharedCoord = this._nodeData.get(sharedNode)!.coord;
    newPoints = [...ed1.points, sharedCoord, ...[...ed2.points].reverse()];
  } else if (n1s === n2s) {
    sharedNode = n1s;
    newSource = n1t;
    newTarget = n2t;
    const sharedCoord = this._nodeData.get(sharedNode)!.coord;
    newPoints = [...[...ed1.points].reverse(), sharedCoord, ...ed2.points];
  } else {
    return undefined;
  }

  const mergedEdge = new EdgeData()
    .setId(ed1.id)
    .setSource(newSource)
    .setTarget(newTarget)
    .setPoints(newPoints);

  let graph = new Graph(this);
  graph = graph.removeEdges([edge2]);
  graph = graph.removeNodes([sharedNode]);
  graph = graph.setEdgeData(ed1.id, mergedEdge);

  return graph;
}

// Join groups of edges by selected subgroupings - can convert back only to continuous grouping.
public joinEdges(edges: Iterable<number>): Graph {
  let graph = new Graph(this);
  let remaining = Array.from(edges);

  // LOCAL SIMPLIFICATION MODE: joins all contiguous subgroups independently
  // To revert to BAIL OUT MODE: replace this entire while block with the following:
  //
  // let otherEdges = remaining.slice(1);
  // const edge = remaining[0];
  // if (remaining.length === 0) return this;
  // while (otherEdges.length > 0) {
  //   const e = otherEdges.find(e => {
  //     const g = graph.joinTwoEdges(edge, e);
  //     if (g !== undefined) { graph = g; return true; }
  //     return false;
  //   });
  //   if (e !== undefined) { otherEdges = otherEdges.filter(q => q !== e); }
  //   else { return this; }
  // }
  // return graph;

  while (remaining.length > 0) {
    const edge = remaining[0];
    remaining = remaining.slice(1);

    let found = true;
    while (found) {
      found = false;
      remaining.find(e => {
        const g = graph.joinTwoEdges(edge, e);
        if (g !== undefined) {
          graph = g;
          remaining = remaining.filter(q => q !== e);
          found = true;
          return true;
        }
        return false;
      });
    }
  }

  return graph;
}

  public reorderElements(
    nodes: Set<number>,
    edges: Set<number>,
    direction: "forward" | "backward" | "front" | "back"
  ): Graph {
    const g = new Graph(this);
    switch (direction) {
      case "forward":
        g._nodeData = moveForward(g._nodeData, nodes);
        g._edgeData = moveForward(g._edgeData, edges);
        break;
      case "backward":
        g._nodeData = moveBackward(g._nodeData, nodes);
        g._edgeData = moveBackward(g._edgeData, edges);
        break;
      case "front":
        g._nodeData = moveToFront(g._nodeData, nodes);
        g._edgeData = moveToFront(g._edgeData, edges);
        break;
      case "back":
        g._nodeData = moveToBack(g._nodeData, nodes);
        g._edgeData = moveToBack(g._edgeData, edges);
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

    for (const [id, data] of other._nodeData) {
      ntab[id] = g._nodeData.has(id) ? g.freshNodeId : id;
      g = g.addNodeWithData(data.setId(ntab[id]));
    }

    for (const [id, data] of other._edgeData) {
      etab[id] = g._edgeData.has(id) ? g.freshEdgeId : id;
      const d = data.setId(etab[id]).setSource(ntab[data.source]).setTarget(ntab[data.target]);
      g = g.addEdgeWithData(d);
    }
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
  }

  public equals(other: Graph): boolean {
    return (
      mapEquals(this._nodeData, other._nodeData) &&
      mapEquals(this._edgeData, other._edgeData) &&
      this.maxNodeId === other.maxNodeId &&
      this.maxEdgeId === other.maxEdgeId
    );
  }

  // LaTeX visualisation
  public tikzWithPosition(
  node?: number,
  edge?: number
): [string, { line: number; column: number } | undefined] {
  let position: { line: number; column: number } | undefined = undefined;

  let result = "\\begin{tikzpicture}\n";
  result += "\t\\begin{pgfonlayer}{nodelayer}\n";
  for (const d of this.nodes) {
    if (d) {
      const dt = d.tikz();
      result += "\t\t\\node " + dt;

      if (node === d.id) {
        const lines = result.split("\n");
        position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
      }

      if (dt !== "") result += " ";
      result += `(${d.id}) at (${d.coord.x}, ${d.coord.y}) {${d.label}};\n`;
    }
  }
  result += "\t\\end{pgfonlayer}\n";
  result += "\t\\begin{pgfonlayer}{edgelayer}\n";

  for (const d of this.edges) {
    const dt = d.tikz();
    const edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";

    result += `\t\t\\draw ${dt}`;

    if (edge === d.id) {
      const lines = result.split("\n");
      position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
    }

    if (dt !== "") result += " ";

    // if edge has intermediate points, chain them with 'to'
    result += `${d.sourceRef}`;
    for (const p of d.points) {
      result += ` to (${p.x}, ${p.y})`;
    }
    result += ` to${edgeNode} ${d.targetRef};\n`;
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
