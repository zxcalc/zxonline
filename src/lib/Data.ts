// import { Map, List, ValueObject } from "immutable";

import { isValidPropertyVal } from "./TikzParser";

function mapEquals<K, V>(m1: Map<K, V> | undefined, m2: Map<K, V> | undefined): boolean {
  if (m1 === undefined || m2 === undefined) {
    return m1 === m2;
  }
  if (m1.size !== m2.size) {
    return false;
  }
  for (const [k, v] of m1.entries()) {
    // if "v" has an "equals" method, use it
    if (v && typeof (v as any).equals === "function") {
      if (!m2.has(k) || !(m2.get(k) as any).equals(v)) {
        return false;
      }
    } else if (!m2.has(k) || m2.get(k) !== v) {
      return false;
    }
  }
  return true;
}

function arrayEquals<T>(a1: T[] | undefined, a2: T[] | undefined): boolean {
  if (a1 === undefined || a2 === undefined) {
    return a1 === a2;
  }
  for (let i = 0; i < a1.length; i++) {
    const v1 = a1[i];
    const v2 = a2[i];
    if (v1 && typeof (v1 as any).equals === "function") {
      if (!(v2 && (v2 as any).equals(v1))) {
        return false;
      }
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
}

export enum ZXNodeType {
  Z = "Z",
  X = "X",
  Boundary = "Boundary",
  Hadamard = "Hadamard"
}

class Coord {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public equals(other: Coord): boolean {
    return this._x === other._x && this._y === other._y;
  }

  public hashCode(): number {
    return ((this._x * 397) ^ this._y) | 0;
  }

  public shift(dx: number, dy: number, precision?: number): Coord {
    if (precision !== undefined) {
      const x = Math.round((this._x + dx) * precision) / precision;
      const y = Math.round((this._y + dy) * precision) / precision;
      return new Coord(x, y);
    } else {
      return new Coord(this._x + dx, this._y + dy);
    }
  }

  public snapToGrid(div: number): Coord {
    return new Coord(Math.round(this._x * div) / div, Math.round(this._y * div) / div);
  }
}

function wrapPropertyVal(val: string): string {
  return !val.includes("\n") && isValidPropertyVal(val) ? val : `{${val}}`;
}

class Data<T extends Data<T>> {
  protected _id: number;
  protected _map: Map<string, string | undefined>;

  constructor(data?: T) {
    this._id = data?._id ?? -1;
    if (data !== undefined) {
      this._map = new Map<string, string | undefined>(data._map);
    } else {
      this._map = new Map<string, string | undefined>();
    }
  }

  public equals(other: T): boolean {
    return this._id === other._id && mapEquals(this._map, other._map);
  }

  public get id(): number {
    return this._id;
  }

  public property(key: string): string | undefined {
    return this._map.get(key);
  }

  public propertyInt(key: string): number | undefined {
    const val = this.property(key);
    return val !== undefined ? parseInt(val, 10) : undefined;
  }

  public propertyFloat(key: string): number | undefined {
    const val = this.property(key);
    return val !== undefined ? parseFloat(val) : undefined;
  }

  public hasKey(key: string): boolean {
    return this._map.has(key);
  }

  public setId(id: number): T {
    const d = new (this.constructor as any)(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: any): T {
    const d = new (this.constructor as any)(this);
    d._map.set(key, value.toString());
    return d;
  }

  public setAtom(key: string): T {
    const d = new (this.constructor as any)(this);
    d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): T {
    const d = new (this.constructor as any)(this);
    d._map.delete(key);
    return d;
  }

  public toString(): string {
    if (this._map.size === 0) {
      return "";
    } else {
      let s = "[";
      let first = true;

      for (const [key, val] of this._map.entries()) {
        if (!first) {
          s += ", ";
        } else {
          first = false;
        }

        if (val !== undefined) {
          s += `${wrapPropertyVal(key)}=${wrapPropertyVal(val)}`;
        } else {
          s += `${wrapPropertyVal(key)}`;
        }
      }

      s += "]";
      return s;
    }
  }

  public tikz(): string {
    return this.toString();
  }
}

class GraphData extends Data<GraphData> {
  constructor(data?: GraphData) {
    super(data);
  }
}

class NodeData extends Data<NodeData> {
  private _phase: [number, number] | undefined;
  private _coord: Coord;
  private _type: ZXNodeType;

  public constructor(data?: NodeData) {
    super(data);
    this._phase = data?._phase;
    this._coord = data?._coord ?? new Coord(0, 0);
    this._type = data?._type ?? ZXNodeType.Boundary;
  }

  public equals(other: NodeData): boolean {
      return (
        super.equals(other) &&
        this._coord.equals(other._coord) &&
        this._type === other._type &&
        this._phase?.[0] === other._phase?.[0] &&
        this._phase?.[1] === other._phase?.[1]
      );
  }

  public get coord(): Coord {
    return this._coord;
  }

  public setCoord(coord: Coord): NodeData {
    const d = new NodeData(this);
    d._coord = coord;
    return d;
  }

  public get type(): ZXNodeType {
    return this._type;
  }

  public setType(type: ZXNodeType): NodeData {
    const d = new NodeData(this);
    d._type = type;
    return d;
  }

  public setPhase(phase: number | undefined): NodeData {
    const d = new NodeData(this);
    d._phase = this.degreesToPhase(phase);
    return d;
  }

  public get phase(): [number, number] | undefined {
    return this._phase;
  }

  public get phaseLabel(): string {
    if (!this._phase) return "";
    const [p, q] = this._phase;
    const degrees = (p / q) * 180;
    return `${degrees}°`;
  }

  public reflect(center: number, horizontal: boolean): NodeData {
    return this.setCoord(
      new Coord(
        horizontal ? 2 * center - this.coord.x : this.coord.x,
        !horizontal ? 2 * center - this.coord.y : this.coord.y
      )
    );
  }

  private degreesToPhase(degrees: number | undefined): [number, number] | undefined {
    if (degrees === undefined) return undefined;
    if (degrees === 0) return [0,1];
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(Math.abs(Math.round(degrees)), 180);
    return [Math.round(degrees) / g, 180 / g];
  }
}

class EdgeData extends Data<EdgeData> {
  private _source: number;
  private _target: number;
  private _points: Coord[];
  private _sourceAnchor?: string;
  private _targetAnchor?: string;
  private _edgeNode?: NodeData;

  constructor(data?: EdgeData) {
    super(data);
    this._source = data?._source ?? -1;
    this._target = data?._target ?? -1;
    this._points = data?._points ?? [];
    this._sourceAnchor = data?._sourceAnchor;
    this._targetAnchor = data?._targetAnchor;
    this._edgeNode = data?._edgeNode;
  }

  public equals(other: EdgeData): boolean {
    return this.id === other.id && this.hasSameData(other);
  }

  public hasSameData(other: EdgeData): boolean {
    return (
      mapEquals(this._map, other._map) &&
      this._source === other._source &&
      this._target === other._target &&
      this._points === other._points &&
      this._sourceAnchor === other._sourceAnchor &&
      this._targetAnchor === other._targetAnchor &&
      (this._edgeNode === other._edgeNode ||
        (this._edgeNode !== undefined &&
          other._edgeNode !== undefined &&
          this._edgeNode.equals(other._edgeNode)))
    );
  }

  public get source(): number {
    return this._source;
  }

  public get target(): number {
    return this._target;
  }

  public get isSelfLoop(): boolean {
    return this._source === this._target;
  }

  public get points(): Coord[] {
    return this._points;
  }

  public get sourceAnchor(): string | undefined {
    return this._sourceAnchor;
  }

  public get targetAnchor(): string | undefined {
    return this._targetAnchor;
  }

  public get edgeNode(): NodeData | undefined {
    return this._edgeNode;
  }

  public setSource(source: number): EdgeData {
    const d = new EdgeData(this);
    d._source = source;
    return d;
  }

  public setTarget(target: number): EdgeData {
    const d = new EdgeData(this);
    d._target = target;
    return d;
  }

  public setPoints(points: Coord[]): EdgeData {
    const d = new EdgeData(this);
    d._points = points;
    return d;
  }

  public setSourceAnchor(sourceAnchor: string | undefined): EdgeData {
    const d = new EdgeData(this);
    d._sourceAnchor = sourceAnchor;
    return d;
  }

  public setTargetAnchor(targetAnchor: string | undefined): EdgeData {
    const d = new EdgeData(this);
    d._targetAnchor = targetAnchor;
    return d;
  }

  public setEdgeNode(edgeNode: NodeData | undefined): EdgeData {
    const d = new EdgeData(this);
    d._edgeNode = edgeNode;
    return d;
  }

  public addPoint(coord: Coord): EdgeData {
    const d = new EdgeData(this);
    d._points = [...d._points, coord];
    return d;
  }

  public removePoint(index: number): EdgeData {
    const d = new EdgeData(this);
    d._points = d._points.filter((_, i) => i !== index);
    return d;
  }

  public get sourceRef(): string {
    return this._sourceAnchor ? `(${this._source}.${this._sourceAnchor})` : `(${this._source})`;
  }

  public get targetRef(): string {
    return this._targetAnchor ? `(${this._target}.${this._targetAnchor})` : `(${this._target})`;
  }

  public get basicBendMode(): boolean {
    return this.property("in") === undefined || this.property("out") === undefined;
  }

  public get bend(): number {
    let bend: number | undefined;
    if (this.hasKey("bend left")) {
      bend = -(this.propertyInt("bend left") ?? 30);
    } else if (this.hasKey("bend right")) {
      bend = this.propertyInt("bend right") ?? 30;
    }

    return bend ?? 0;
  }

  public setBend(bend: number): EdgeData {
    let d = new EdgeData(this).unset("bend left").unset("bend right");
    if (bend === -30) {
      d = d.setAtom("bend left");
    } else if (bend === 30) {
      d = d.setAtom("bend right");
    } else if (bend < 0) {
      d = d.setProperty("bend left", -bend);
    } else if (bend > 0) {
      d = d.setProperty("bend right", bend);
    }
    return d;
  }

  // public wireProperties(): EdgeData {
  //   return new EdgeData(this).unset("style");
  // }

  public reflect(horizontal: boolean): EdgeData {
    if (this.basicBendMode) {
      return this.setBend(-this.bend);
    } else {
      let inAngle = this.propertyFloat("in") ?? 0;
      let outAngle = this.propertyFloat("out") ?? 0;

      if (horizontal) {
        inAngle = inAngle > 0 ? 180 - inAngle : -180 - inAngle;
        outAngle = outAngle > 0 ? 180 - outAngle : -180 - outAngle;
      } else {
        inAngle = -inAngle;
        outAngle = -outAngle;
      }
      return this.setProperty("in", inAngle).setProperty("out", outAngle);
    }
  }

  public reverse(): EdgeData {
    const d = this.basicBendMode
      ? this.setBend(-this.bend)
      : this.setProperty("in", this.propertyFloat("out") ?? 0).setProperty(
        "out",
        this.propertyFloat("in") ?? 0
      );
    [d._source, d._target] = [d._target, d._source];
    return d;
  }
}

type ArrowTipStyle = "pointer" | "flat" | "none";

class StyleData extends Data<StyleData> {
  private _name: string;

  constructor(data?: StyleData) {
    super(data);
    this._name = data?._name ?? "none";
  }

  public get isNone(): boolean {
    return this._name === "none";
  }

  public get isEdgeStyle(): boolean {
    return (
      this.hasKey("-") ||
      this.hasKey("->") ||
      this.hasKey("-|") ||
      this.hasKey("<-") ||
      this.hasKey("<->") ||
      this.hasKey("<-|") ||
      this.hasKey("|-") ||
      this.hasKey("|->") ||
      this.hasKey("|-|")
    );
  }

  public get arrowHead(): ArrowTipStyle {
    if (this.hasKey("->") || this.hasKey("<->") || this.hasKey("|->")) {
      return "pointer";
    } else if (this.hasKey("-|") || this.hasKey("<-|") || this.hasKey("|-|")) {
      return "flat";
    } else {
      return "none";
    }
  }

  public get arrowTail(): ArrowTipStyle {
    if (this.hasKey("<-") || this.hasKey("<->") || this.hasKey("<-|")) {
      return "pointer";
    } else if (this.hasKey("|-") || this.hasKey("|->") || this.hasKey("|-|")) {
      return "flat";
    } else {
      return "none";
    }
  }

  private clearArrowTips(): StyleData {
    const d = new StyleData(this);
    d._map.delete("-");
    d._map.delete("->");
    d._map.delete("-|");
    d._map.delete("<-");
    d._map.delete("<->");
    d._map.delete("<-|");
    d._map.delete("|-");
    d._map.delete("|->");
    d._map.delete("|-|");
    return d;
  }

  public setArrowHead(style: ArrowTipStyle): StyleData {
    let s: string;
    const tail = this.arrowTail;
    if (tail === "pointer") {
      s = "<-";
    } else if (tail === "flat") {
      s = "|-";
    } else {
      s = "-";
    }

    if (style === "pointer") {
      s += ">";
    } else if (style === "flat") {
      s += "|";
    }

    return this.clearArrowTips().setAtom(s);
  }

  public setArrowTail(style: ArrowTipStyle): StyleData {
    let s: string;
    if (style === "pointer") {
      s = "<-";
    } else if (style === "flat") {
      s = "|-";
    } else {
      s = "-";
    }

    const head = this.arrowHead;
    if (head === "pointer") {
      s += ">";
    } else if (head === "flat") {
      s += "|";
    }

    return this.clearArrowTips().setAtom(s);
  }

  public equals(other: StyleData): boolean {
    return super.equals(other) && this._name === other._name;
  }

  public get name(): string {
    return this._name;
  }

  public setName(name: string): StyleData {
    const d = new StyleData(this);
    d._name = name;
    return d;
  }
}

export { mapEquals, arrayEquals, GraphData, NodeData, EdgeData, Coord, StyleData };
