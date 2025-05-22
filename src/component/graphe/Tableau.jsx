import React, { useContext, useState } from "react";
import { PathCostsContext } from "../../context/PathCostProvider";
import { Stack } from "@mui/material";

const Tableau = ({ nodes = [], edges = [] }) => {
  const [steps, setSteps] = useState([]);
  const [shortestPath, setShortestPath] = useState([]);
  const [pathCost, setPathCost] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const { setPreviousPathCosts } = useContext(PathCostsContext);

  // Création de la map pour les poids des arêtes
  const edgeMap = edges.reduce((acc, edge) => {
    acc[`${edge.source}-${edge.target}`] = edge.value;
    return acc;
  }, {});

  const normalizedNodes = nodes.map((node, index) => ({
    id: node.id,
    label: node.label || `X${index + 1}`,
    value: node.value || "+∞",
    index,
  }));

  const parseValue = (val) => (val === "+∞" ? Infinity : Number(val));

  const getNumericMatrix = () => {
    if (nodes.length === 0) return [];

    return normalizedNodes.map((sourceNode, i) => {
      return normalizedNodes.map((targetNode, j) => {
        if (i === j) return "+∞"; // Diagonale à 0
        const edgeKey = `${sourceNode.id}-${targetNode.id}`;
        return parseValue(edgeMap[edgeKey] ?? Infinity);
      });
    });
  };

  const formatMatrix = (matrix, k) => {
    if (!matrix || matrix.length === 0) return { k, matrix: [] };

    return {
      k,
      matrix: matrix.map((row, i) => {
        return row.map((val, j) => ({
          value: val === Infinity ? "+∞" : val.toString(),
          id: `node-${i}-${j}`,
          originalValue: val,
        }));
      }),
    };
  };

  const demoucronAlgorithm = () => {
    const initialMatrix = getNumericMatrix();
    if (initialMatrix.length === 0) return [];

    const n = initialMatrix.length;
    const steps = [formatMatrix(initialMatrix, 1)];
    let currentMatrix = initialMatrix.map((row) => [...row]);

    // Matrice des prédecesseurs
    let pred = Array(n)
      .fill()
      .map(() => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && initialMatrix[i][j] < Infinity) {
          pred[i][j] = i;
        }
      }
    }

    for (let k = 1; k < n - 1; k++) {
      const nextMatrix = currentMatrix.map((row) => [...row]);
      let nextPred = pred.map((row) => [...row]);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const newValue = currentMatrix[i][k] + currentMatrix[k][j];
            if (newValue < currentMatrix[i][j]) {
              nextMatrix[i][j] = newValue;
              nextPred[i][j] = pred[k][j]; // Mise à jour du prédecesseur
            }
          }
        }
      }

      steps.push(formatMatrix(nextMatrix, k + 1));
      currentMatrix = nextMatrix;
      pred = nextPred;
    }

    const path = [];
    let current = n - 1;

    while (current !== null && current !== 0) {
      path.unshift(current);
      current = pred[0][current];
    }

    if (current === 0) {
      path.unshift(0);
      setShortestPath(path);
      setPreviousPathCosts((prev) => [
        ...prev,
        {
          path: path.map((index) => `node-${index + 1}`),
        },
      ]);
      setPathCost(currentMatrix[0][n - 1]);
    } else {
      setShortestPath([]);
      setPathCost(Infinity);
    }

    return steps;
  };

  const handleCalculate = () => {
    setHasCalculated(true);
    const result = demoucronAlgorithm();
    setSteps(result);
  };

  const initialMatrix =
    nodes.length > 0 ? formatMatrix(getNumericMatrix(), 0).matrix : [];

  return (
    <div>
      <Stack
        direction={{ xs: "column", md: "column" }}
        gap={{ xs: 2, md: 2 }}
        justifyContent={"space-between"}
        alignItems={{ xs: "centerlex-start", md: "flex-start" }}
        flexWrap="wrap"
        paddingTop={4}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          gap={{ xs: 2, md: 1 }}
          justifyContent={"space-between"}
          alignItems="center"
          flexWrap="wrap"
        >
          <span
            style={{
              marginBottom: 20,
              padding: "10px 16px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: "20px",
              width: 200,
              textAlign: "center",
            }}
          >
            RECHERCHE OPERATIONNELLE
          </span>
          <Stack style={{ color: "red" }} fontSize={{ xs: 16, md: 25 }}>
            Algorithme de DEMOUCRON
          </Stack>
          <span
            style={{
              marginBottom: 20,
              padding: "10px 16px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: "20px",
              width: 200,
              textAlign: "center",
            }}
          >
            Chemin de valeur optimale
          </span>
        </Stack>
        <Stack
          direction={{ xs: "column", md: "row" }}
          gap={{ xs: 2, md: 2 }}
          justifyContent={"space-between"}
          alignItems={"center"}
          flexWrap="wrap"
        >
          <button
            onClick={handleCalculate}
            style={{
              marginBottom: 20,
              padding: "10px 16px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "20px",
            }}
            disabled={nodes.length === 0}
          >
            Minimiser
          </button>
          <span></span>
          <span></span>
        </Stack>
      </Stack>
      {hasCalculated && (
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: { xs: 12, md: 16 },
            borderRadius: 4,
            marginBottom: { xs: 10, md: 20 },
            fontSize: { xs: "16px", md: "20px" },
          }}
        >
          {shortestPath.length > 0 ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={{ xs: 1, sm: 2 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              flexWrap="wrap"
              padding={2}
            >
              <div style={{ display: "flex", flexDirection: "row", gap: 2 }}>
                <p>Résultat :</p>
                <p>
                  <strong>Coût total :</strong> {pathCost}
                </p>
              </div>
              <p>
                <strong>Chemin minimal :</strong>{" "}
                {shortestPath.map((node) => `X${node + 1}`).join(" → ")}
              </p>
            </Stack>
          ) : (
            <p>Aucun chemin trouvé</p>
          )}
        </div>
      )}
      {steps.length === 0 ? (
        <MatrixDisplay
          matrix={initialMatrix}
          title="Matrice initiale D0"
          showChanges={false}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
            gap: 20,
            paddingTop: 10,
            alignItems: { xs: "center", md: "flex-start" },
          }}
        >
          {steps.map((step, index) => (
            <MatrixDisplay
              key={`step-${step.k}`}
              matrix={step.matrix}
              title={`Matrice D${step.k}`}
              showChanges={index > 0}
              referenceMatrix={steps[0].matrix}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MatrixDisplay = ({
  matrix = [],
  title,
  showChanges = false,
  referenceMatrix = [],
}) => {
  if (!matrix || matrix.length === 0 || !matrix[0]) {
    return (
      <div
        style={{
          color: "#f44336",
          padding: { xs: 12, md: 16 },
          textAlign: "center",
        }}
      >
        Aucune donnée matricielle à afficher
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: { xs: 20, md: 30 },
        border: "1px solid #e0e0e0",
        borderRadius: 4,
        padding: 10,
        backgroundColor: "#fff",
        width: { xs: "100%", sm: "80%", md: 500 },
        maxWidth: "100%",
        margin: { xs: "0 auto", md: "initial" },
        alignItems: { xs: "center", md: "flex-start" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#1976d2",
          fontSize: { xs: "18px", md: "20px" },
        }}
      >
        {title}
      </h3>
      <div
        style={{
          overflowX: "auto",
          maxHeight: { xs: "none", md: "calc(100vh - 200px)" },
          width: "100%",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: { xs: "14px", md: "16px" },
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: 8, width: 30 }}></th>
              {matrix[0].map((_, j) => (
                <th
                  key={`header-${j}`}
                  style={{
                    padding: 8,
                    textAlign: "center",
                    minWidth: { xs: 40, md: 50 },
                  }}
                >
                  {j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td
                  style={{
                    padding: 8,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => {
                  const isChanged =
                    showChanges &&
                    referenceMatrix?.[rowIndex]?.[colIndex] &&
                    cell.originalValue !==
                      referenceMatrix[rowIndex][colIndex].originalValue;

                  return (
                    <td
                      key={cell.id || `${rowIndex}-${colIndex}`}
                      style={{
                        border: "1px solid #ddd",
                        padding: 8,
                        textAlign: "center",
                        backgroundColor: isChanged ? "#ffeaa7" : "white",
                        fontWeight: isChanged ? "bold" : "normal",
                        minWidth: { xs: 40, md: 50 },
                      }}
                    >
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tableau;
