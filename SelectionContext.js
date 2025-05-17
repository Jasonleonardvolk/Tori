// ALAN IDE – SelectionContext for shared selection state (Story 1.5)
// Author: Cascade (2025-05-07)
// Provides a React context for selection/group state sync across canvas, editor, and panels

import React, { createContext, useContext, useState } from "react";

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [selected, setSelected] = useState([]); // array of node ids
  return (
    <SelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}
