import { useContext, useState } from "react";
import { PathCostsContext } from "../../context/PathCostProvider";
import { Stack } from "@mui/material";

const Maximum = ({ nodes = [], edges = [] }) => {
  const [steps, setSteps] = useState([]);
  const [longestPath, setLongestPath] = useState([]);
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
    value: node.value || "∞",
    index,
  }));

  const parseValue = (val) => (val === "∞" ? -Infinity : Number(val)); // Changement: "∞" devient -Infinity

  const getNumericMatrix = () => {
    if (nodes.length === 0) return [];

    return normalizedNodes.map((sourceNode, i) => {
      return normalizedNodes.map((targetNode, j) => {
        if (i === j) return -Infinity; // Diagonale à -∞
        const edgeKey = `${sourceNode.id}-${targetNode.id}`;
        return parseValue(edgeMap[edgeKey] ?? -Infinity); // Valeur par défaut -Infinity
      });
    });
  };

  const formatMatrix = (matrix, k) => {
    if (!matrix || matrix.length === 0) return { k, matrix: [] };

    return {
      k,
      matrix: matrix.map((row, i) => {
        return row.map((val, j) => ({
          value: val === -Infinity ? "-∞" : val.toString(), // Formatage pour l'affichage
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
        if (i !== j && initialMatrix[i][j] !== -Infinity) {
          // Changement: vérifie si différent de -Infinity
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
            // Vérifier si les deux chemins existent avant d'additionner
            const canAdd =
              currentMatrix[i][k] !== -Infinity &&
              currentMatrix[k][j] !== -Infinity;
            const newValue = canAdd
              ? currentMatrix[i][k] + currentMatrix[k][j]
              : -Infinity;

            // Prendre le maximum entre la valeur actuelle et la nouvelle valeur
            if (newValue > currentMatrix[i][j]) {
              nextMatrix[i][j] = newValue;
              nextPred[i][j] = pred[k][j];
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
      setLongestPath(path);
      setPreviousPathCosts((prev) => [
        ...prev,
        {
          path: path.map((index) => `node-${index + 1}`),
        },
      ]);
      setPathCost(
        currentMatrix[0][n - 1] !== -Infinity ? currentMatrix[0][n - 1] : "-∞"
      );
    } else {
      setLongestPath([]);
      setPathCost("-∞");
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
    <div style={{ padding: 16 }}>
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
        Maximiser
      </button>

      {hasCalculated && (
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: 16,
            borderRadius: 4,
            marginBottom: 20,
            fontSize: "18px",
          }}
        >
          {longestPath.length > 0 ? (
            <Stack direction={"row"} gap={2} alignItems={"center"}>
              <p>Résultat :</p>
              <p>
                <strong>Coût total :</strong> {pathCost}
              </p>
              <p>
                <strong>Chemin maximal:</strong>{" "}
                {longestPath.map((node) => `X${node + 1}`).join(" → ")}
              </p>
            </Stack>
          ) : (
            <p>Aucun chemin trouvé de X1 à X{nodes.length}</p>
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
            flexWrap: "wrap",
            gap: 10,
            height: "100%",
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
      <div style={{ color: "#f44336", padding: 16 }}>
        Aucune donnée matricielle à afficher
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 30,
        border: "1px solid #e0e0e0",
        borderRadius: 4,
        padding: 16,
        backgroundColor: "#fff",
        width: 500,
      }}
    >
      <h3 style={{ marginTop: 0, color: "#1976d2" }}>{title}</h3>
      <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 200px)" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
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
                    minWidth: 50,
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
                        minWidth: 50,
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

export default Maximum;
