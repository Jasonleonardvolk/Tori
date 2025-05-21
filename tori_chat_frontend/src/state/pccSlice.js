/**
 * PCC State Redux Slice
 * 
 * Manages the PCC state data in the Redux store.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  step: 0,
  phases: [],
  spins: [],
  energy: 0,
  history: {
    steps: [],
    energy: []
  },
  lastUpdate: null
};

const pccSlice = createSlice({
  name: 'pcc',
  initialState,
  reducers: {
    stateUpdate: (state, action) => {
      const { step, phases, spins, energy } = action.payload;
      
      // Update current state values
      state.step = step;
      state.phases = phases;
      state.spins = spins;
      state.energy = energy;
      state.lastUpdate = new Date().toISOString();
      
      // Add to history (keeping last 100 points)
      state.history.steps.push(step);
      state.history.energy.push(energy);
      
      // Limit history length to prevent memory issues
      const MAX_HISTORY = 100;
      if (state.history.steps.length > MAX_HISTORY) {
        state.history.steps = state.history.steps.slice(-MAX_HISTORY);
        state.history.energy = state.history.energy.slice(-MAX_HISTORY);
      }
    },
    
    clearHistory: (state) => {
      state.history = {
        steps: [],
        energy: []
      };
    },
    
    resetState: () => initialState
  }
});

// Export actions and reducer
export const { stateUpdate, clearHistory, resetState } = pccSlice.actions;
export default pccSlice.reducer;

// Selectors
export const selectPccState = (state) => state.pcc;
export const selectPccHistory = (state) => state.pcc.history;
export const selectPccEnergy = (state) => state.pcc.energy;
export const selectPccPhases = (state) => state.pcc.phases;
export const selectPccSpins = (state) => state.pcc.spins;
