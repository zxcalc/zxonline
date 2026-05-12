import { useContext, useMemo, useState } from "preact/hooks";
import { Coord, EdgeData, NodeData, StyleData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { colorToHex } from "../lib/color";
import { computeControlPoints, tangent, catmullRomToBezier } from "../lib/curve";
import Styles from "../lib/Styles";
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
  onControlPointPointerDown?: (cp: 1 | 2) => void;
  onEdgePointPointerDown?: (pointIndex: number) => void;
  sceneCoords: SceneCoords;
}

const Edge = ({
  data,
  sourceData,
  targetData,
  selected,
  highlighted,
  onPointerDown,
  onMouseOver,
  onMouseOut,
  onControlPointPointerDown,
  onEdgePointPointerDown,
  sceneCoords,
}: EdgeProps) => {
  const config = useContext(ConfigContext);
  const styles = config.styles();
  const style = styles.style(data.property("style"));
  const computed = useMemo(
    () => computeControlPoints(styles, sourceData, targetData, data),
    [styles, sourceData, targetData, data]
  );
  let [c1, c2, cp1, cp2] = computed[0];
  let cpDist = computed[1];
  const bezier = computed[2];

  let dashArray: string | undefined = undefined;
  if (style.hasKey("dashed")) {
    dashArray = `${0.1 * sceneCoords.scale} ${0.0333 * sceneCoords.scale}`;
  } else if (style.hasKey("dotted")) {
    dashArray = `${0.05 * sceneCoords.scale} ${0.0143 * sceneCoords.scale}`;
  }

  let arrowTail: Coord[] | undefined = undefined;
  if (style.arrowTail !== "none") {
    const tt = tangent([c1, c2, cp1, cp2], 0.0, 0.1);
    if (style.arrowTail === "flat") {
      arrowTail = [c1.shift(-tt.y, tt.x), c1, c1.shift(tt.y, -tt.x)];
    } else if (style.arrowTail === "pointer") {
      arrowTail = [c1.shift(tt.x - tt.y, tt.x + tt.y), c1, c1.shift(tt.x + tt.y, -tt.x + tt.y)];
    }
  }

  let arrowHead: Coord[] | undefined = undefined;
  if (style.arrowHead !== "none") {
    const ht = tangent([c1, c2, cp1, cp2], 1.0, 0.9);
    if (style.arrowHead === "flat") {
      arrowHead = [c2.shift(-ht.y, ht.x), c2, c2.shift(ht.y, -ht.x)];
    } else if (style.arrowHead === "pointer") {
      arrowHead = [c2.shift(ht.x - ht.y, ht.x + ht.y), c2, c2.shift(ht.x + ht.y, -ht.x + ht.y)];
    }
  }

  const basicBendMode = !data.hasKey("in") && !data.hasKey("out");
  const controlColor1 = basicBendMode ? "blue" : "rgb(0,100,0)";
  const controlColor2 = basicBendMode ? "rgba(100,100,255,0.2)" : "rgba(0,150,0,0.2)";
  const strokeWidth = sceneCoords.scale * 0.035;
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";

  // map coords to screen
  const nodeCoord1 = sceneCoords.coordToScreen(sourceData.coord);
  const nodeCoord2 = sceneCoords.coordToScreen(targetData.coord);
  cpDist *= sceneCoords.scale;
  [c1, c2, cp1, cp2] = [c1, c2, cp1, cp2].map(p => sceneCoords.coordToScreen(p));
  arrowTail = arrowTail?.map(p => sceneCoords.coordToScreen(p));
  arrowHead = arrowHead?.map(p => sceneCoords.coordToScreen(p));

  return (
    <g onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <g onPointerDown={onPointerDown}>
        {bezier ? (
          (() => {
            const screenPoints = data.points.map(p => sceneCoords.coordToScreen(p));

            // full point sequence including phantom endpoints
            const allPoints = [cp1, c1, ...screenPoints, c2, cp2];

            let d = `M${c1.x},${c1.y}`;

            // iterate over each segment between actual points (c1 → ... → c2)
            for (let i = 1; i < allPoints.length - 2; i++) {
              const p0 = allPoints[i - 1];
              const p1 = allPoints[i];
              const p2 = allPoints[i + 1];
              const p3 = allPoints[i + 2];
              const [bcp1, bcp2] = catmullRomToBezier(p0, p1, p2, p3);
              d += ` C${bcp1.x},${bcp1.y} ${bcp2.x},${bcp2.y} ${p2.x},${p2.y}`;
            }

            return (
              <g>
                <path
                  d={d}
                  stroke="rgb(150, 200, 255)"
                  stroke-width={strokeWidth * 5}
                  fill="none"
                  style={{
                    opacity: highlighted ? 0.4 : 0,
                    transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
                  }}
                />
                <path
                  d={d}
                  stroke={drawColor}
                  stroke-width={strokeWidth}
                  stroke-dasharray={dashArray}
                  fill="none"
                />
              </g>
            );
          })()
          // Bezier code:
          // <g>
          //   <path
          //     d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
          //     stroke="rgb(150, 200, 255)"
          //     stroke-width={strokeWidth * 5}
          //     fill="none"
          //     style={{
          //       opacity: highlighted ? 0.4 : 0,
          //       transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
          //     }}
          //   />
          //   <path
          //     d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
          //     stroke={drawColor}
          //     stroke-width={strokeWidth}
          //     stroke-dasharray={dashArray}
          //     fill="none"
          //   />
          // </g>
        ) : (
          <g>
            <polyline
              points={[c1, ...data.points.map(p => sceneCoords.coordToScreen(p)), c2]
                .map(p => `${p.x},${p.y}`)
                .join(" ")}
              stroke="rgb(150, 200, 255)"
              stroke-width={strokeWidth * 5}
              fill="none"
              stroke-linejoin="round"
              style={{
                opacity: highlighted ? 0.4 : 0,
                transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
              }}
            />
            <polyline
              points={[c1, ...data.points.map(p => sceneCoords.coordToScreen(p)), c2]
                .map(p => `${p.x},${p.y}`)
                .join(" ")}
              stroke={drawColor}
              stroke-width={strokeWidth}
              stroke-dasharray={dashArray}
              fill="none"
              stroke-linejoin="round"
            />
          </g>
        )}
        {arrowHead !== undefined && (
          <path
            d={`M${arrowHead[0].x},${arrowHead[0].y} L${arrowHead[1].x},${arrowHead[1].y} L${arrowHead[2].x},${arrowHead[2].y}`}
            stroke={drawColor}
            stroke-width={strokeWidth}
            fill="none"
          />
        )}
        {arrowTail !== undefined && (
          <path
            d={`M${arrowTail[0].x},${arrowTail[0].y} L${arrowTail[1].x},${arrowTail[1].y} L${arrowTail[2].x},${arrowTail[2].y}`}
            stroke={drawColor}
            stroke-width={strokeWidth}
            fill="none"
          />
        )}
      </g>
      <g
        style={{
          pointerEvents: "none",
          opacity: selected ? 1 : 0,
          transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
        }}
      >
        <circle
          cx={nodeCoord1.x}
          cy={nodeCoord1.y}
          r={cpDist}
          fill="none"
          stroke-width={2}
          style={{
            stroke: controlColor2,
            transition: config.getConfigBool("enableAnimations") ? "stroke 0.2s ease-out" : "none",
          }}
        />
        <line
          x1={nodeCoord1.x}
          y1={nodeCoord1.y}
          x2={cp1.x}
          y2={cp1.y}
          stroke-width={2}
          style={{
            stroke: controlColor1,
            transition: config.getConfigBool("enableAnimations") ? "stroke 0.2s ease-out" : "none",
          }}
        />
        <circle
          cx={nodeCoord2.x}
          cy={nodeCoord2.y}
          r={cpDist}
          fill="none"
          stroke-width={2}
          style={{
            stroke: controlColor2,
            transition: config.getConfigBool("enableAnimations") ? "stroke 0.2s ease-out" : "none",
          }}
        />
        <line
          x1={nodeCoord2.x}
          y1={nodeCoord2.y}
          x2={cp2.x}
          y2={cp2.y}
          stroke-width={2}
          style={{
            stroke: controlColor1,
            transition: config.getConfigBool("enableAnimations") ? "stroke 0.3s ease-out" : "none",
          }}
        />
      </g>
      {selected && (
        <g>
          <circle
            cx={cp1.x}
            cy={cp1.y}
            r={0.1 * sceneCoords.scale}
            fill="rgba(255, 255, 255, 0.8)"
            stroke={controlColor1}
            stroke-width={2}
            onPointerDown={() => onControlPointPointerDown?.(1)}
          />
          <circle
            cx={cp2.x}
            cy={cp2.y}
            r={0.1 * sceneCoords.scale}
            fill="rgba(255, 255, 255, 0.8)"
            stroke={controlColor1}
            stroke-width={2}
            onPointerDown={() => onControlPointPointerDown?.(2)}
          />
        </g>
      )}
      {(selected || highlighted) && (
        <g>
          {data.points.map((p, i) => {
            const screenP = sceneCoords.coordToScreen(p);
            const r = 0.07 * sceneCoords.scale;
            const click_box = 3
            return (
              <g key={i} onPointerDown={() => onEdgePointPointerDown?.(i)}>
                <rect
                  x={screenP.x - r * click_box}
                  y={screenP.y - r * click_box}
                  width={r * 2 * click_box}
                  height={r * 2 * click_box}
                  fill="transparent"
                  stroke="none"
                />
                <line
                  x1={screenP.x - r} y1={screenP.y - r}
                  x2={screenP.x + r} y2={screenP.y + r}
                  stroke="blue" stroke-width={2}
                />
                <line
                  x1={screenP.x + r} y1={screenP.y - r}
                  x2={screenP.x - r} y2={screenP.y + r}
                  stroke="blue" stroke-width={2}
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
