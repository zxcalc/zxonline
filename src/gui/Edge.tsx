import { useMemo, useContext } from "preact/hooks";
import { Coord, EdgeData, NodeData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { clipEndpoints, catmullRomToBezier } from "../lib/curve";
import ConfigContext from "./ConfigContext";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  selected?: boolean;
  highlighted?: boolean;
  onPointerDown?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  onEdgePointPointerDown?: (pointIndex: number) => void;
  sceneCoords: SceneCoords;
}

const WIRE_COLOR = "black";

const Edge = ({
  data,
  sourceData,
  targetData,
  selected,
  highlighted,
  onPointerDown,
  onMouseOver,
  onMouseOut,
  onEdgePointPointerDown,
  sceneCoords,
}: EdgeProps) => {
  const config = useContext(ConfigContext);

  // Endpoints clipped to each node's drawn boundary. The wire heads toward its
  // first routing point (or the target centre if none) leaving the source, and
  // arrives from its last routing point (or source centre) at the target, so
  // the clip direction follows the actual curve.
  const firstToward = data.points.length > 0 ? data.points[0] : targetData.coord;
  const lastToward =
    data.points.length > 0 ? data.points[data.points.length - 1] : sourceData.coord;
  const [c1Coord, c2Coord] = useMemo(
    () => clipEndpoints(sourceData, targetData, firstToward, lastToward),
    [sourceData, targetData, firstToward, lastToward]
  );

  const strokeWidth = sceneCoords.scale * 0.035;

  // Screen-space sequence: clipped source, routing points, clipped target.
  const c1 = sceneCoords.coordToScreen(c1Coord);
  const c2 = sceneCoords.coordToScreen(c2Coord);
  const mid = data.points.map(p => sceneCoords.coordToScreen(p));
  const pts = [c1, ...mid, c2];

  // Phantom endpoints for Catmull-Rom: reflect the first/last real neighbour
  // across the endpoint so the curve's entry/exit tangent points along the
  // wire. With no routing points this makes the curve a straight line.
  const reflect = (a: Coord, b: Coord): Coord =>
    new Coord(2 * a.x - b.x, 2 * a.y - b.y);
  const phantomStart = reflect(pts[0], pts[1]);
  const phantomEnd = reflect(pts[pts.length - 1], pts[pts.length - 2]);
  const allPoints = [phantomStart, ...pts, phantomEnd];

  // One cubic Bézier segment per span between real points.
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < allPoints.length - 2; i++) {
    const p0 = allPoints[i - 1];
    const p1 = allPoints[i];
    const p2 = allPoints[i + 1];
    const p3 = allPoints[i + 2];
    const [bcp1, bcp2] = catmullRomToBezier(p0, p1, p2, p3);
    d += ` C${bcp1.x},${bcp1.y} ${bcp2.x},${bcp2.y} ${p2.x},${p2.y}`;
  }

  return (
    <g onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <g onPointerDown={onPointerDown}>
        {/* highlight halo (selection drives this via the highlighted prop) */}
        <path
          d={d}
          stroke="rgb(150, 200, 255)"
          stroke-width={strokeWidth * 5}
          fill="none"
          style={{
            opacity: highlighted ? 0.4 : 0,
            transition: config.getConfigBool("enableAnimations")
              ? "opacity 0.2s ease-out"
              : "none",
          }}
        />
        {/* the wire */}
        <path d={d} stroke={WIRE_COLOR} stroke-width={strokeWidth} fill="none" />
      </g>

      {/* routing-point handles (X marks) when selected or highlighted */}
      {(selected || highlighted) && (
        <g>
          {data.points.map((p, i) => {
            const screenP = sceneCoords.coordToScreen(p);
            const r = 0.07 * sceneCoords.scale;
            const clickBox = 3;
            return (
              <g key={i} onPointerDown={() => onEdgePointPointerDown?.(i)}>
                <rect
                  x={screenP.x - r * clickBox}
                  y={screenP.y - r * clickBox}
                  width={r * 2 * clickBox}
                  height={r * 2 * clickBox}
                  fill="transparent"
                  stroke="none"
                />
                <line
                  x1={screenP.x - r}
                  y1={screenP.y - r}
                  x2={screenP.x + r}
                  y2={screenP.y + r}
                  stroke="blue"
                  stroke-width={2}
                />
                <line
                  x1={screenP.x + r}
                  y1={screenP.y - r}
                  x2={screenP.x - r}
                  y2={screenP.y + r}
                  stroke="blue"
                  stroke-width={2}
                />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

export default Edge;
