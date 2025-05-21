/**
 * PCC State Management
 * 
 * This module defines a simple state interface for PCC data.
 */

// PCC state interface
export type Pcc = { 
  phases: number[];  // Phase values
  spins: number[];   // Spin values (±1) 
  energy: number;    // System energy
  step: number;      // Current simulation step
};

// Initial state
export const initialPccState: Pcc = {
  phases: [],
  spins: [],
  energy: 0,
  step: 0
};

// Action types
export const SET_PCC = 'pcc/setPcc';

// Action creators
export const setPcc = (pccState: Pcc) => ({
  type: SET_PCC,
  payload: pccState
});

// Reducer
export default function pccReducer(state = initialPccState, action: any): Pcc {
  switch (action.type) {
    case SET_PCC:
      return action.payload;
    default:
      return state;
  }
}
