import { useState, useEffect, useContext } from "preact/hooks";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import {
  isValidDelimString,
  parseTikzStyles,
} from "../lib/TikzParser";
import StylePanel from "./StylePanel";
import Styles from "../lib/Styles";
import Toolbar from "./Toolbar";
import Splitpane from "./Splitpane";
import ConfigContext from "./ConfigContext";



const ZXEditor = () => {
  const [graph, setGraph] = useState<Graph>(new Graph());
  const [enabled, setEnabled] = useState<boolean>(true);
  const [tool, setTool] = useState<GraphTool>("select");
  const [currentNodeLabel, setCurrentNodeLabel] = useState<string | undefined>(undefined);
  const [currentNodeStyle, setCurrentNodeStyle] = useState<string>("none");
  const [currentEdgeStyle, setCurrentEdgeStyle] = useState<string>("none");
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(new Set());
  const [showSecondPanel, setShowSecondPanel] = useState<boolean>(true);

  const config = useContext(ConfigContext);
  const styles = config.styles();


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

  const handleCurrentNodeLabelChanged = (label: string) => {
    // console.log("label changed to", label);
    if (selectedNodes.size === 1) {
      setCurrentNodeLabel(label);

      if (graph !== undefined && isValidDelimString("{" + label + "}")) {
        const [n] = selectedNodes;
        const g = graph.updateNodeData(n, d => d.setLabel(label));
        handleGraphChange(g, true);
      }
    }
  };

  const handleNodeStyleChanged = (style: string, apply: boolean) => {
    setCurrentNodeStyle(style);
    if (apply) {
      let g = graph;
      g = g.mapEdgeData(d => {
        let d1 = d;
        if (selectedNodes.has(d.source)) {
          const oldStyle = g.node(d.source)?.property("style");
          if (style === "none" && oldStyle !== "none" && d1.sourceAnchor === undefined) {
            d1 = d1.setSourceAnchor("center");
          } else if (style !== "none" && oldStyle === "none" && d1.sourceAnchor === "center") {
            d1 = d1.setSourceAnchor(undefined);
          }
        }

        if (selectedNodes.has(d.target)) {
          const oldStyle = g.node(d.target)?.property("style");
          if (style === "none" && oldStyle !== "none" && d1.targetAnchor === undefined) {
            d1 = d1.setTargetAnchor("center");
          } else if (style !== "none" && oldStyle === "none" && d1.targetAnchor === "center") {
            d1 = d1.setTargetAnchor(undefined);
          }
        }
        return d1;
      });

      g = g.mapNodeData(d => (selectedNodes.has(d.id) ? d.setProperty("style", style) : d));

      handleGraphChange(g, true);
    }

    document.getElementById("graph-editor")?.focus();
  };

  const handleEdgeStyleChanged = (style: string, apply: boolean) => {
    setCurrentEdgeStyle(style);
    if (apply) {
      const g = graph.mapEdgeData(d => {
        if (selectedEdges.has(d.id)) {
          if (style === "none") {
            return d.unset("style");
          } else {
            return d.setProperty("style", style);
          }
        }
        return d;
      });
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
      setCurrentNodeLabel(graph.node(n)?.label);
    } else {
      setCurrentNodeLabel(undefined);
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
              styles={styles}
              currentNodeStyle={currentNodeStyle}
              currentEdgeStyle={currentEdgeStyle}
              toggleStylePanel={toggleStylePanel}
            />
          </div>
        </div>
        <StylePanel
          editMode={false}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onNodeStyleChanged={handleNodeStyleChanged}
          onEdgeStyleChanged={handleEdgeStyleChanged}
          currentNodeLabel={currentNodeLabel}
          onCurrentNodeLabelChanged={handleCurrentNodeLabelChanged}
        />
      </Splitpane>
    </div>
  );
};

export default ZXEditor;
