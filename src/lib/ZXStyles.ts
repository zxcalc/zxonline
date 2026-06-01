import { ZXNodeType } from "./Data";

export interface ZXNodeStyle {
  shape: "circle" | "rectangle";
  fill: string;
  stroke: string;
  strokeWidth: number;  // multiplier of sceneCoords.scale
  size: number;         // multiplier of base radius r
}

export const ZXNodeStyles: Record<ZXNodeType, ZXNodeStyle> = {
  [ZXNodeType.Z]: {
    shape: "circle",
    fill: "#00cc00",
    stroke: "#006600",
    strokeWidth: 0.025,
    size: 1.0,
  },
  [ZXNodeType.X]: {
    shape: "circle",
    fill: "#ff4444",
    stroke: "#990000",
    strokeWidth: 0.025,
    size: 1.0,
  },
  [ZXNodeType.Hadamard]: {
    shape: "rectangle",
    fill: "#ffff00",
    stroke: "#000000",
    strokeWidth: 0.025,
    size: 0.7,
  },
  [ZXNodeType.Boundary]: {
    shape: "circle",
    fill: "#000000",
    stroke: "none",
    strokeWidth: 0,
    size: 0.2,
  },
};