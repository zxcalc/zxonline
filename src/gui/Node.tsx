import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { NodeData, ZXNodeType } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { ZXNodeStyles } from "../lib/ZXStyles"
import ConfigContext from "./ConfigContext";

interface NodeProps {
  data: NodeData;
  selected?: boolean;
  highlight?: boolean;
  sceneCoords: SceneCoords;
}

const Node = ({ data, selected, highlight, sceneCoords }: NodeProps) => {
  const config = useContext(ConfigContext);
  const coord = sceneCoords.coordToScreen(data.coord);
  const r = sceneCoords.scale * 0.2;
  const nodeStyle = ZXNodeStyles[data.type];
  const nodeR = r * nodeStyle.size;
  const strokeWidth = sceneCoords.scale * nodeStyle.strokeWidth;

  const labelRef = useRef<SVGTextElement>(null);
  const [labelWidth, setLabelWidth] = useState<number>(0);

  useEffect(() => {
    setLabelWidth(labelRef.current?.getComputedTextLength() ?? 0);
  }, [data, labelRef]);

  const renderShape = () => {
    if (nodeStyle.shape === "rectangle") {
      return (
        <rect
          x={-nodeR}
          y={-nodeR}
          width={2 * nodeR}
          height={2 * nodeR}
          fill={nodeStyle.fill}
          stroke={nodeStyle.stroke}
          stroke-width={strokeWidth}
        />
      );
    } else {
      return (
        <circle
          r={nodeR}
          fill={nodeStyle.fill}
          stroke={nodeStyle.stroke}
          stroke-width={strokeWidth}
        />
      );
    }
  };

  const renderSelection = () => {
    if (nodeStyle.shape === "rectangle") {
      return (
        <rect
          x={-nodeR - 4}
          y={-nodeR - 4}
          width={2 * (nodeR + 4)}
          height={2 * (nodeR + 4)}
          fill="rgba(150, 200, 255, 0.4)"
          style={{
            pointerEvents: "none",
            opacity: selected ? 1 : 0,
            transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
          }}
        />
      );
    } else {
      return (
        <circle
          r={nodeR + 4}
          fill="rgba(150, 200, 255, 0.4)"
          style={{
            pointerEvents: "none",
            opacity: selected ? 1 : 0,
            transition: config.getConfigBool("enableAnimations") ? "opacity 0.2s ease-out" : "none",
          }}
        />
      );
    }
  };

  const renderHighlight = () => {
    if (!highlight) return null;
    if (nodeStyle.shape === "rectangle") {
      return (
        <rect
          x={-nodeR}
          y={-nodeR}
          width={2 * nodeR}
          height={2 * nodeR}
          stroke="rgb(100, 0, 200)"
          fill="none"
          stroke-width={4}
        />
      );
    } else {
      return (
        <circle
          r={nodeR}
          stroke="rgb(100, 0, 200)"
          fill="none"
          stroke-width={4}
        />
      );
    }
  };

  return (
    <g id={`node-${data.id}`} transform={`translate(${coord.x}, ${coord.y})`}>
      {renderShape()}
      {data.phaseLabel !== "" && (
        <g>
          <rect
            x={-labelWidth / 2 - 2}
            y={-r * 0.4 - 2}
            width={labelWidth + 4}
            height={r * 0.8 + 4}
            fill="white"
            opacity={0.8}
            style={{ pointerEvents: "none" }}
          />
          <text
            ref={labelRef}
            x={0}
            y={0}
            text-anchor="middle"
            alignment-baseline="middle"
            font-family="monospace"
            font-size={r * 0.8}
            font-weight="bold"
            style={{ cursor: "default", pointerEvents: "none" }}
          >
            {data.phaseLabel}
          </text>
        </g>
      )}
      {renderSelection()}
      {renderHighlight()}
    </g>
  );
};

export default Node;