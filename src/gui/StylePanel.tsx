import { NodeData, ZXNodeType } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { SVGAttributes } from "preact";
import { useContext } from "preact/hooks";
import Node from "./Node";
import ConfigContext from "./ConfigContext";

interface StylePanelProps {
  currentNodeType: ZXNodeType | undefined;
  currentPhase: [number, number] | undefined;
  currentPhaseLabel: string;
  onNodeTypeChanged: (type: ZXNodeType, apply: boolean) => void;
  onPhaseChanged: (phase: number | undefined) => void;
  onPhaseLabelChanged: (label: string) => void;
}

const StylePanel = ({
  currentNodeType,
  currentPhase,
  currentPhaseLabel,
  onNodeTypeChanged: setNodeType,
  onPhaseChanged: setPhase,
  onPhaseLabelChanged: setPhaseLabelChanged,
}: StylePanelProps) => {
  const config = useContext(ConfigContext);
  const sceneCoords = new SceneCoords()
    .setZoom(0)
    .setLeft(0.35)
    .setRight(0.35)
    .setUp(0.25)
    .setDown(0.25);

  const labelProps: SVGAttributes<SVGTextElement> = {
    x: 22,
    y: 38,
    "text-anchor": "middle",
    "alignment-baseline": "middle",
    "font-size": "10px",
    "font-style": "italic",
  };

  // Node type options — drives the node selector previews.
  const nodeTypes = [
    { type: ZXNodeType.Z, label: "Z" },
    { type: ZXNodeType.X, label: "X" },
    { type: ZXNodeType.Boundary, label: "B" },
    { type: ZXNodeType.Hadamard, label: "H" },
  ];

  // Phase only applies to spiders (Z / X).
  const phaseEnabled =
    currentNodeType === ZXNodeType.Z || currentNodeType === ZXNodeType.X;

  const phaseInvalid =
    currentPhaseLabel !== "" && isNaN(parseFloat(currentPhaseLabel));

  return (
    <div
      style={{
        padding: "10px",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Phase input */}
      <div
        style={{
          marginBottom: "10px",
          marginTop: "2px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
          Phase (degrees)
        </div>
        <input
          id="phase-field"
          type="number"
          step="15"
          value={phaseEnabled ? currentPhaseLabel.replace("°", "") : ""}
          onInput={e =>
            setPhaseLabelChanged((e.target as HTMLInputElement).value)
          }
          onKeyDown={e => {
            if (e.key === "Enter") {
              document.getElementById("graph-editor")?.focus();
            }
          }}
          disabled={!phaseEnabled}
          className={phaseInvalid ? "error" : ""}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {/* Node type selector */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
          Node type
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {nodeTypes.map(({ type, label }) => (
            <a
              key={type}
              href="#"
              draggable={false}
              title={type}
              onClick={e => {
                e.preventDefault();
                setNodeType(type, true);
              }}
              style={{ outline: "none" }}
            >
              <svg
                width={sceneCoords.screenWidth}
                height={sceneCoords.screenHeight + 12}
                style={{ margin: "5px", borderWidth: 0 }}
              >
                <rect
                  x={1}
                  y={1}
                  width={43}
                  height={43}
                  fill="rgba(150, 200, 255, 0.4)"
                  stroke="rgba(150, 200, 255, 0.8)"
                  stroke-width={1}
                  style={{
                    pointerEvents: "none",
                    opacity: currentNodeType === type ? 1 : 0,
                    transition: config.getConfigBool("enableAnimations")
                      ? "opacity 0.15s ease-out"
                      : "none",
                  }}
                />
                <Node
                  data={new NodeData().setType(type)}
                  sceneCoords={sceneCoords}
                />
                <text {...labelProps}>{label}</text>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StylePanel;
