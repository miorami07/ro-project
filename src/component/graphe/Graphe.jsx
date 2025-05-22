import React, { useState, useCallback, useContext } from "react";
import Tableau from "./Tableau";
import { Box, Button, Input, Stack, Typography } from "@mui/material";
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
        x: basePosition.x + i * 30,
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

  function isAdjacentInPath(path, sourceLabel, targetLabel) {
    const sourceIndex = path.indexOf(sourceLabel);
    const targetIndex = path.indexOf(targetLabel);

    return Math.abs(sourceIndex - targetIndex) === 1;
  }
  return (
    <Stack
      width={"100%"}
      height={{ xs: "100vh", md: "100vh" }}
      direction={{ xs: "column", md: "row" }}
      gap={2}
    >
      <Stack
        direction="column"
        width={{ xs: "90%", md: "100%" }}
        height="100vh"
        spacing={2}
        padding={{ xs: 2, md: 4 }}
        marginRight={{ xs: 10, md: 2 }}
        border={{ xs: "'1px solid red", md: 0 }}
      >
        <Box
          sx={{
            background: "#fff",
            borderRadius: 2,
            boxShadow: 2,
            p: 2,
          }}
        >
          <Stack direction="column" spacing={2}>
            <Stack
              direction={{ xs: "row", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Input
                type="number"
                value={nextNodeLabel}
                onChange={(e) => setNextNodeLabel(e.target.value)}
                placeholder="Entrer le nombre de nœuds"
                inputProps={{ min: 1 }}
                sx={{
                  fontSize: "16px",
                  border: "1px solid lightblue",
                  borderRadius: 1,
                  padding: 1,
                  width: { xs: "50%", sm: "50%" },
                }}
              />
              <Button
                onClick={() => setNewNode(true)}
                variant="contained"
                sx={{
                  backgroundColor: "green",
                  color: "white",
                  fontSize: { xs: "12px", md: "16px" },
                  px: { xs: 2, md: 3 },
                  py: { xs: 1, md: 1.5 },
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  boxShadow: "0 0 5px 5px rgb(0, 0,0, 0.1)",
                }}
              >
                Ajouter un nœud
              </Button>
            </Stack>

            <Stack
              direction={{ xs: "row", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "center", md: "center" }}
              justifyContent="space-between"
            >
              <Input
                type="number"
                value={edgeValue}
                onChange={(e) => setEdgeValue(e.target.value)}
                placeholder="Valeur du lien"
                inputProps={{ min: 1 }}
                sx={{
                  fontSize: "16px",
                  border: "1px solid lightblue",
                  borderRadius: 1,
                  padding: 1,
                  width: { xs: "100%", sm: "50%" },
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 14, md: 16 },
                  width: { xs: "100%", sm: "50%" },
                }}
              >
                {linkingNode
                  ? `Cliquez sur un autre nœud pour relier à "${
                      nodes.find((n) => n.id === linkingNode)?.label
                    }"`
                  : "Sélectionnez un nœud pour commencer un lien"}
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: { xs: 12, md: 14 }, color: "#444" }}>
              💡 Ctrl + clic sur un **nœud** pour le supprimer <br />
              💡 Ctrl + clic sur une **arête** pour la supprimer
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            height: { xs: "20vh", md: "100vh" },
            overflowX: "auto",
            overflowY: "hidden",
            border: "1px solid #ccc",
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
            }}
          >
            <svg
              id="graph-svg"
              viewBox="0 0 500 500"
              preserveAspectRatio="xMidYMid meet"
              style={{
                backgroundColor: "#f0f0f0",
                width: "100%",
                height: { xs: "50vh", md: "100%" },
                cursor: "crosshair",
              }}
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
                      strokeWidth="3"
                      markerEnd="url(#arrowhead)"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.ctrlKey) handleDeleteEdge(source.id, target.id);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2}
                      fill="#d32f2f"
                      fontSize="20"
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
                    r="15"
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
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </Box>
        </Box>
      </Stack>

      <Stack
        style={{
          height: { xs: "50vh", md: "100%" },
          overflow: "auto",
          boxSizing: "border-box",
          width: "100%",
        }}
        paddingTop={{ xs: 0, md: 4 }}
        direction={"column"}
        gap={2}
      >
        <Tableau nodes={nodes} edges={edges} />
        <Maximum nodes={nodes} edges={edges} />
      </Stack>
    </Stack>
  );
};

export default DynamicGraph;
