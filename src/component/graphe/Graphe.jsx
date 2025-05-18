import React, { useState, useCallback, useContext } from "react";
import Tableau from "./Tableau";
import { Stack } from "@mui/material";
import { PathCostsContext } from "../../context/PathCostProvider";
import Maximum from "./Maximum";
// import { PathCostsContext } from "../../context/PathCostProvider";

const DynamicGraph = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nextNodeLabel, setNextNodeLabel] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [linkingNode, setLinkingNode] = useState(null);
  const [edgeValue, setEdgeValue] = useState("");
  const [newNode, setNewNode] = useState(false);

  // const { previousPathCosts, node } = useContext(PathCostsContext);
  // const [color, setColor] = useState(null);

  const handleAddNode = (e) => {
    setNewNode(false);
    if (nodes.length !== 0) return addNode(e);

    try {
      if (!nextNodeLabel.trim() || isNaN(nextNodeLabel)) return;

      const nodeCount = parseInt(nextNodeLabel);
      if (nodeCount <= 0) return;

      const svg = e?.currentTarget?.closest("svg");
      if (!svg) throw new Error("SVG container not found");

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const basePosition = pt.matrixTransform(svg.getScreenCTM().inverse());

      const newNodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `node-${i + 1}`,
        x: basePosition.x + i * 60,
        y: basePosition.y,
        label: `X${i + 1}`,
        value: (i + 1).toString(),
      }));

      setNodes((prev) => [...prev, ...newNodes]);
      setNextNodeLabel("");
    } catch (error) {
      console.error("Erreur lors de l'ajout de nœuds :", error);
    }
  };

  const addNode = (e) => {
    if (newNode) {
      const svg = e?.currentTarget?.closest("svg");
      if (!svg) throw new Error("SVG container not found");

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const basePosition = pt.matrixTransform(svg.getScreenCTM().inverse());

      const len = nodes.length;
      const newNodeObj = {
        id: `node-${len + 1}`,
        x: basePosition.x + len,
        y: basePosition.y,
        label: `X${len + 1}`,
        value: (len + 1).toString(),
      };

      setNodes((prev) => [...prev, newNodeObj]);
      setNextNodeLabel("");
      setNewNode(false);
    }
  };

  const handleDrag = useCallback(
    (e) => {
      if (!draggedNode) return;

      const svg = e.target.closest("svg");
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());

      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === draggedNode ? { ...node, x, y } : node
        )
      );
    },
    [draggedNode]
  );

  const handleDeleteNode = (id) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) =>
      edges.filter((edge) => edge.source !== id && edge.target !== id)
    );
    if (linkingNode === id) setLinkingNode(null);
    if (selectedNode === id) setSelectedNode(null);
  };

  const handleDeleteEdge = (sourceId, targetId) => {
    setEdges((edges) =>
      edges.filter(
        (edge) => !(edge.source === sourceId && edge.target === targetId)
      )
    );
  };
  const { lastPathCost } = useContext(PathCostsContext);
  // Vérifie si deux nœuds sont adjacents dans le chemin
  function isAdjacentInPath(path, sourceLabel, targetLabel) {
    const sourceIndex = path.indexOf(sourceLabel);
    const targetIndex = path.indexOf(targetLabel);

    return Math.abs(sourceIndex - targetIndex) === 1;
  }
  return (
    <div>
      <Stack
        direction="row"
        gap={2}
        style={{
          width: "100%",
          height: "100vh",
        }}
      >
        <div style={{ width: "40%" }}>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 10,
              background: "#fff",
              padding: 10,
              borderRadius: 5,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                type="number"
                value={nextNodeLabel}
                onChange={(e) => setNextNodeLabel(e.target.value)}
                placeholder="Entrer le nombre de nœuds"
                min={1}
                style={{
                  fontSize: 20,
                  borderColor: "lightblue",
                  borderRadius: 4,
                }}
              />
              <button
                onClick={() => {
                  setNewNode(true);
                }}
                style={{
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "25px",
                  float: "right",
                  padding: "10px 16px",
                }}
              >
                Ajouter un nœud
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <input
                type="number"
                value={edgeValue}
                onChange={(e) => setEdgeValue(e.target.value)}
                placeholder="Valeur du lien"
                min={1}
                style={{
                  fontSize: 20,
                  borderColor: "lightblue",
                  borderRadius: 4,
                }}
              />
              <span style={{ marginLeft: 10 }}>
                {linkingNode
                  ? `Cliquez sur un autre nœud pour relier à "${
                      nodes.find((n) => n.id === linkingNode)?.label
                    }"`
                  : "Sélectionnez un nœud pour commencer un lien"}
              </span>
            </div>
            <div style={{ marginTop: 10, fontSize: "14px", color: "#444" }}>
              💡 Ctrl + clic sur un **nœud** pour le supprimer
              <br />
              💡 Ctrl + clic sur une **arête** pour la supprimer
            </div>
          </div>

          <svg
            id="graph-svg"
            width="100%"
            height="100%"
            viewBox="0 0 1000 600"
            style={{ backgroundColor: "#f0f0f0", cursor: "crosshair" }}
            onClick={(e) => (newNode ? addNode(e) : handleAddNode(e))}
            onMouseMove={handleDrag}
            onMouseUp={() => setDraggedNode(null)}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
              </marker>
            </defs>

            {/* Arêtes */}
            {edges.map((edge, i) => {
              const source = nodes.find((n) => n.id === edge.source);
              const target = nodes.find((n) => n.id === edge.target);
              if (!source || !target) return null;

              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={
                      lastPathCost?.path &&
                      lastPathCost.path.includes(edge.source) &&
                      lastPathCost.path.includes(edge.target) &&
                      isAdjacentInPath(
                        lastPathCost.path,
                        edge.source,
                        edge.target
                      )
                        ? "red"
                        : "#666"
                    }
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.ctrlKey) handleDeleteEdge(source.id, target.id);
                    }}
                    style={{
                      cursor: "pointer",
                    }}
                  />
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    // textAnchor="middle"
                    fill="#d32f2f"
                    fontSize="14"
                  >
                    {edge.value || 1}
                  </text>
                </g>
              );
            })}

            {/* Nœuds */}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (e.ctrlKey) {
                    handleDeleteNode(node.id);
                    return;
                  }

                  if (linkingNode && linkingNode !== node.id) {
                    setEdges((prev) => [
                      ...prev,
                      {
                        source: linkingNode,
                        target: node.id,
                        value: edgeValue || "1",
                      },
                    ]);
                    setLinkingNode(null);
                    setEdgeValue("");
                  } else {
                    setLinkingNode(node.id);
                  }

                  setDraggedNode(node.id);
                  setSelectedNode(node.id);
                }}
                style={{ cursor: "move" }}
              >
                <circle
                  r="20"
                  fill={
                    lastPathCost?.path?.includes(node.id)
                      ? "yellow"
                      : selectedNode === node.id
                      ? "#FF9800"
                      : "#4CAF50"
                  }
                  stroke="#333"
                  strokeWidth="2"
                />
                <text
                  y="5"
                  textAnchor="middle"
                  fill={
                    lastPathCost?.path?.includes(node.id) ? "black" : "white"
                  }
                  fontSize="12"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div style={{ width: "60%", height: "100%", overflow: "auto" }}>
          <Tableau nodes={nodes} edges={edges} />
          <Maximum nodes={nodes} edges={edges} />
        </div>
      </Stack>
    </div>
  );
};

export default DynamicGraph;
