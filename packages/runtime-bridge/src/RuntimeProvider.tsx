import React, { createContext, useContext, ReactNode } from 'react';
import { useAlanSocket, UseWebSocketReturn } from './useAlanSocket';
import { MessageHandler } from './types/websocket';

// Define the context type as the return value of useAlanSocket
export type RuntimeContextType = UseWebSocketReturn;

// Create a context with a default value
const RuntimeContext = createContext<RuntimeContextType | null>(null);

interface RuntimeProviderProps {
  children: ReactNode;
  onMessage?: (message: any) => void;
}

/**
 * RuntimeProvider component wraps the useAlanSocket hook and provides
 * its values through React Context.
 * 
 * This allows any component in the tree to access WebSocket functionality
 * without prop drilling.
 */
export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ 
  children,
  onMessage
}) => {
  // Create WebSocket connection with a default handler if none provided
  const socketContext = useAlanSocket(onMessage || ((message) => {
    console.log('Received WebSocket message:', message);
  }));
  
  return (
    <RuntimeContext.Provider value={socketContext}>
      {children}
    </RuntimeContext.Provider>
  );
};

/**
 * Hook to use the runtime context
 * 
 * @returns The WebSocket connection values from useAlanSocket
 * @throws Error if used outside of RuntimeProvider
 */
export const useRuntime = (): RuntimeContextType => {
  const context = useContext(RuntimeContext);
  
  if (context === null) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  
  return context;
};

export default RuntimeProvider;
