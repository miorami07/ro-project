import { createContext, useState, useMemo } from "react";

export const PathCostsContext = createContext();

export const PathCostsProvider = ({ children }) => {
  const [previousPathCosts, setPreviousPathCosts] = useState([]);
  const [nodes, setNodes] = useState([]);

  // Calcul du dernier chemin
  const lastPathCost = useMemo(() => {
    return previousPathCosts.length > 0
      ? previousPathCosts[previousPathCosts.length - 1]
      : null;
  }, [previousPathCosts]);

  const value = {
    previousPathCosts,
    setPreviousPathCosts,
    nodes,
    setNodes,
    lastPathCost, // Ajouté ici
  };

  return (
    <PathCostsContext.Provider value={value}>
      {children}
    </PathCostsContext.Provider>
  );
};
