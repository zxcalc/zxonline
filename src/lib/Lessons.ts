import { Coord, EdgeData, NodeData, ZXNodeType } from "./Data";
import Graph from "./Graph";

const SPIDER_FUSION_LESSON = "spider-fusion";
const PI = "\u03c0";

function node(
  id: number,
  x: number,
  y: number,
  type: ZXNodeType,
  phase?: number,
  label?: string
): NodeData {
  let data = new NodeData().setId(id).setCoord(new Coord(x, y)).setType(type);
  if (phase !== undefined) {
    data = data.setPhase(phase, label);
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

export function initialGraphForLesson(lessonId?: string): Graph | undefined {
  if (lessonId !== SPIDER_FUSION_LESSON) {
    return undefined;
  }

  let graph = new Graph();

  [
    node(0, -5.2, 2.65, ZXNodeType.Boundary),
    node(1, -5.2, 0.55, ZXNodeType.Boundary),
    node(2, -3.55, 0.55, ZXNodeType.Z, 180, PI),
    node(3, -2.45, 1.9, ZXNodeType.Z, 90, `${PI}/2`),
    node(4, -1.45, 0.25, ZXNodeType.Z, -90, `-${PI}/2`),
    node(5, -3.55, -1.55, ZXNodeType.Z, -180, `-${PI}`),
    node(6, 0.05, 0.25, ZXNodeType.X, 180, PI),
    node(7, 0.9, -0.9, ZXNodeType.X, -180, `-${PI}`),
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
}

export function isLessonSolved(lessonId: string | undefined, graph: Graph): boolean {
  if (lessonId !== SPIDER_FUSION_LESSON) {
    return false;
  }

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
}
