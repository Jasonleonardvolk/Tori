import React, { createContext, useState, useContext } from 'react';

// Create context for selection state
const SelectionContext = createContext();

// Custom hook for using the selection context
export const useSelection = () => useContext(SelectionContext);

// Provider component
export const SelectionProvider = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectionMode, setSelectionMode] = useState('single');

  // Select an item
  const selectItem = (item) => {
    if (selectionMode === 'single') {
      setSelectedItems([item]);
    } else {
      // Multi-select mode - toggle item if already selected
      if (selectedItems.some(i => i.id === item.id)) {
        setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Set hover state
  const hoverItem = (item) => {
    setHoveredItem(item);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(selectionMode === 'single' ? 'multi' : 'single');
  };

  return (
    <SelectionContext.Provider
      value={{
        selectedItems,
        hoveredItem,
        selectionMode,
        selectItem,
        clearSelection,
        hoverItem,
        setHoveredItem,
        toggleSelectionMode,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export default SelectionContext;
