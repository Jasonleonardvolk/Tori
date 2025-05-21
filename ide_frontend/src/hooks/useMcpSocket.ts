/**
 * MCP WebSocket Hook
 * 
 * Custom hook for connecting to the MCP server WebSocket endpoint
 * and providing PCC state updates.
 */

import { useEffect, useState, useCallback } from "react";
import { Pcc, initialPccState } from "../state/pccSlice";

/**
 * Hook to establish WebSocket connection to MCP server.
 * 
 * @param url WebSocket URL (defaults to localhost)
 * @returns Current PCC state
 */
export function useMcpSocket(url = "ws://127.0.0.1:8787/ws") {
  const [pccState, setPccState] = useState<Pcc>(initialPccState);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(url);
    
    // Connection opened
    ws.onopen = () => {
      console.log("MCP WebSocket connection established");
      setConnected(true);
    };
    
    // Handle incoming messages
    ws.onmessage = (event) => {
      try {
        // Parse JSON message
        const data = JSON.parse(event.data);
        
        // Update state
        setPccState(data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    // Handle errors
    ws.onerror = (error) => {
      console.error("MCP WebSocket error:", error);
      setConnected(false);
    };
    
    // Handle connection close
    ws.onclose = () => {
      console.log("MCP WebSocket connection closed");
      setConnected(false);
    };
    
    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, [url]);
  
  return { pccState, connected };
}
