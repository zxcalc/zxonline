import { useState, useEffect, useContext } from "preact/hooks";
import { ZXNodeType } from "../lib/Data";
import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import StylePanel from "./StylePanel";
import Toolbar from "./Toolbar";
import Splitpane from "./Splitpane";



const ZXEditor = () => {
  const [graph, setGraph] = useState<Graph>(new Graph());
  const [enabled, setEnabled] = useState<boolean>(true);
  const [tool, setTool] = useState<GraphTool>("select");
  const [currentPhase, setCurrentPhase] = useState<[number, number] | undefined>(undefined);
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState<string>("");
  const [currentNodeType, setCurrentNodeType] = useState<ZXNodeType>(ZXNodeType.Boundary);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(new Set());
  const [showSecondPanel, setShowSecondPanel] = useState<boolean>(true);

  const updateFromGui = (tikz: string) => {
    // stub
  };

  const toggleStylePanel = (show: boolean | undefined = undefined) => {
    if (show !== undefined) {
      setShowSecondPanel(show);
    } else {
      setShowSecondPanel(!showSecondPanel);
    }
  };

const handleCurrentNodePhaseChanged = (phase: number | undefined) => {
    if (selectedNodes.size === 1 && graph !== undefined) {
      const [n] = selectedNodes;
      const g = graph.updateNodeData(n, d => d.setPhase(phase));
      setCurrentPhase(g.node(n)?.phase);
      setCurrentPhaseLabel(g.node(n)?.phaseLabel ?? "");
      handleGraphChange(g, true);
    }
  };

  const handlePhaseLabelChanged = (label: string) => {
    if (label.trim() === "") {
      handleCurrentNodePhaseChanged(undefined);
    } else {
      const degrees = parseFloat(label);
      if (!isNaN(degrees)) {
        handleCurrentNodePhaseChanged(degrees);
      }
    }
  };

  const handleNodeTypeChanged = (type: ZXNodeType, apply: boolean) => {
    setCurrentNodeType(type);
    if (apply) {
      const g = graph.mapNodeData(d =>
        selectedNodes.has(d.id) ? d.setType(type) : d
      );
      handleGraphChange(g, true);
    }
    document.getElementById("graph-editor")?.focus();
  };

  // handle a graph change from the graph editor. "commit" says the document should be updated
  // and an undo step registered.
  const handleGraphChange = (g: Graph, commit: boolean) => {
    setGraph(g);

    if (commit) {
      const value = g.tikz();
      updateFromGui(value);
    }
  };

  const handleSelectionChanged = (selectedNodes: Set<number>, selectedEdges: Set<number>) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);

    if (selectedNodes.size === 1) {
      const [n] = selectedNodes;
      setCurrentPhase(graph.node(n)?.phase);
      setCurrentPhaseLabel(graph.node(n)?.phaseLabel ?? "");
      
    } else {
      setCurrentPhase(undefined);
      setCurrentPhaseLabel("");
    }
  };

  return (
    <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal" showSecondPanel={showSecondPanel}>
        <div
          style={{
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Toolbar
            tool={tool}
            onToolChanged={t => {
              setTool(t);
              document.getElementById("graph-editor")?.focus();
            }}
          />
          <div style={{ flex: "1 1 auto", minHeight: 0 }}>
            <GraphEditor
              tool={tool}
              onToolChanged={setTool}
              enabled={enabled}
              graph={graph}
              onGraphChange={handleGraphChange}
              selectedNodes={selectedNodes}
              selectedEdges={selectedEdges}
              onSelectionChanged={handleSelectionChanged}
              currentNodeType={currentNodeType}
              toggleStylePanel={toggleStylePanel}
            />
          </div>
        </div>
        <StylePanel
          currentNodeType={currentNodeType}
          currentPhase={currentPhase}
          currentPhaseLabel={currentPhaseLabel}
          onNodeTypeChanged={handleNodeTypeChanged}
          onPhaseChanged={handleCurrentNodePhaseChanged}
          onPhaseLabelChanged={handlePhaseLabelChanged}
        />
      </Splitpane>
    </div>
  );
};

export default ZXEditor;
