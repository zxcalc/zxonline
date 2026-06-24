import { Coord, EdgeData, NodeData, ZXNodeType } from "./Data";
import Graph from "./Graph";

const SPIDER_FUSION_LESSON = "spider-fusion";
const IDENTITY_REMOVAL_LESSON = "identity-removal";
const YANKING_LESSON = "yanking";

function node(id: number, x: number, y: number, type: ZXNodeType, phase?: number): NodeData {
  let data = new NodeData().setId(id).setCoord(new Coord(x, y)).setType(type);
  if (phase !== undefined) {
    data = data.setPhase(phase);
  }
  return data;
}

function edge(id: number, source: number, target: number, bend?: number): EdgeData {
  let data = new EdgeData().setId(id).setSource(source).setTarget(target);
  if (bend !== undefined) {
    data = data.setBend(bend);
  }
  return data;
}

function bentEdge(id: number, source: number, target: number, points: [number, number][]): EdgeData {
  return new EdgeData()
    .setId(id)
    .setSource(source)
    .setTarget(target)
    .setPoints(points.map(([x, y]) => new Coord(x, y)));
}

export function initialGraphForLesson(lessonId?: string): Graph | undefined {
  if (lessonId === YANKING_LESSON) {
    let graph = new Graph();

    [
      node(0, -4.0, 2.0, ZXNodeType.Boundary),
      node(1, -4.0, -2.0, ZXNodeType.Boundary),
      node(2, -2.0, 2.0, ZXNodeType.Boundary),
      node(3, -2.0, -2.0, ZXNodeType.Boundary),
      node(4, 0.0, 2.0, ZXNodeType.Boundary),
      node(5, 0.0, -2.0, ZXNodeType.Boundary),
    ].forEach((data) => {
      graph = graph.addNodeWithData(data);
    });

    // Two wires, each bent with routing points the learner shakes out.
    graph = graph.addEdgeWithData(
      bentEdge(0, 0, 1, [[-2.0,1.2],[-1.6, 0.0],[-2.0,-1.2]]) // bow
    );
    graph = graph.addEdgeWithData(
      bentEdge(1, 2, 3, [[0.0, 0.0]])              // single bow
    );
    graph = graph.addEdgeWithData(
      bentEdge(2, 4, 5, [[-2.2, 0.0]])             // single bow
    );

    return graph;
  } else if (lessonId === SPIDER_FUSION_LESSON) {
    let graph = new Graph();
    [
      node(0, -5.2, 2.65, ZXNodeType.Boundary),
      node(1, -5.2, 0.55, ZXNodeType.Boundary),
      node(2, -3.55, 0.55, ZXNodeType.Z, 180),
      node(3, -2.45, 1.9, ZXNodeType.Z, 90),
      node(4, -1.45, 0.25, ZXNodeType.Z, 270),
      node(5, -3.55, -1.55, ZXNodeType.Z, 180),
      node(6, 0.05, 0.25, ZXNodeType.X, 180),
      node(7, 0.9, -0.9, ZXNodeType.X, 180),
    ].forEach((data) => {
      graph = graph.addNodeWithData(data);
    });

    [
      edge(0, 0, 3, 18),
      edge(1, 1, 2),
      edge(2, 2, 3),
      edge(3, 2, 4, 28),
      edge(4, 3, 4),
      edge(5, 3, 6, -32),
      edge(6, 4, 6),
      edge(7, 2, 5),
      edge(8, 5, 7, 38),
      edge(9, 6, 7, -58),
    ].forEach((data) => {
      graph = graph.addEdgeWithData(data);
    });

    return graph;
  } else if (lessonId === IDENTITY_REMOVAL_LESSON) {
    let graph = new Graph();

    // Currently: boundary — id(Z,180) — id(X,0) — id(Z,180) — boundary
    [
      node(0, -5.0, 1.0, ZXNodeType.Boundary),
      node(1, 3.0, 1.0, ZXNodeType.Boundary),
      node(2, -3.0, 1.0, ZXNodeType.Z, 180),  
      node(3, 1.0, 1.0, ZXNodeType.Z, 180),
      node(4, -1.0, 2.0, ZXNodeType.X, 0),   
    ].forEach((data) => {
      graph = graph.addNodeWithData(data);
    });

    [
      edge(0, 0, 2),
      edge(1, 2, 4),
      edge(2, 4, 3),
      edge(3, 3, 1),
    ].forEach((data) => {
      graph = graph.addEdgeWithData(data);
    });

    return graph;
  } 
}

export function isLessonSolved(lessonId: string | undefined, graph: Graph): boolean {

  if (lessonId === YANKING_LESSON) {
    // Solved when the wires are all straight (no routing points) and the
    // diagram is intact (didn't just delete everything).
    if (graph.numEdges !== 3 || graph.numNodes !== 6) return false;
    return graph.edges.every((e) => e.points.length === 0);
  } else if (lessonId === SPIDER_FUSION_LESSON) {
    const zNodes = graph.nodes.filter((data) => data.type === ZXNodeType.Z);
    const xNodes = graph.nodes.filter((data) => data.type === ZXNodeType.X);
    const boundaries = graph.nodes.filter((data) => data.type === ZXNodeType.Boundary);

    if (
      graph.numNodes !== 4 ||
      graph.numEdges !== 5 ||
      zNodes.length !== 1 ||
      xNodes.length !== 1 ||
      boundaries.length !== 2 ||
      zNodes[0].phase !== undefined ||
      xNodes[0].phase !== undefined
    ) {
      return false;
    }

    const zId = zNodes[0].id;
    const xId = xNodes[0].id;
    const boundaryIds = new Set(boundaries.map((data) => data.id));
    let boundaryToZ = 0;
    let zToX = 0;

    for (const data of graph.edges) {
      const connectsZAndX =
        (data.source === zId && data.target === xId) ||
        (data.source === xId && data.target === zId);
      const connectsBoundaryAndZ =
        (boundaryIds.has(data.source) && data.target === zId) ||
        (boundaryIds.has(data.target) && data.source === zId);

      if (connectsZAndX) {
        zToX += 1;
      } else if (connectsBoundaryAndZ) {
        boundaryToZ += 1;
      } else {
        return false;
      }
    }
    return boundaryToZ === 2 && zToX === 3;
  } else if (lessonId === IDENTITY_REMOVAL_LESSON) {
    const hasNoIdentities = graph.nodes.every((d) => !isIdentitySpider(graph, d));
    if (!hasNoIdentities) return false;

    const zNodes = graph.nodes.filter((d) => d.type === ZXNodeType.Z);
    const xNodes = graph.nodes.filter((d) => d.type === ZXNodeType.X);
    const boundaries = graph.nodes.filter((d) => d.type === ZXNodeType.Boundary);

    // Expected solved structure: boundary — — boundary
    if (
      graph.numNodes !== 2 ||
      graph.numEdges !== 1 ||
      zNodes.length !== 0 ||
      xNodes.length !== 0 ||
      boundaries.length !== 2
    ) {
      return false;
    }


    const boundaryIds = new Set(boundaries.map((b) => b.id));
    let boundaryToB = 0;

    for (const e of graph.edges) {
      const bb =
        (boundaryIds.has(e.source) && boundaryIds.has(e.target));
      if (bb) boundaryToB += 1;
      else return false;
    }

    return boundaryToB === 1;
  }

  return false;
}

function isIdentitySpider(graph: Graph, data: NodeData): boolean {
  const isSpider = data.type === ZXNodeType.Z || data.type === ZXNodeType.X;
  if (!isSpider || data.phase !== undefined) {
    return false;
  }
  let degree = 0;
  for (const e of graph.edges) {
    if (e.source === data.id) degree += 1;
    if (e.target === data.id) degree += 1;
  }
  return degree === 2;
}