import { useEffect, useState, useRef } from "react";

/**
 * Custom hook for handling Server-Sent Events (SSE)
 * 
 * @param url The SSE endpoint URL
 * @param initialData Initial data to use before SSE connection is established
 * @param options Additional options for configuring the SSE connection
 * @returns The latest data received from the SSE stream
 */
export function useSSE<T>(
  url: string, 
  initialData: T | null = null,
  options: {
    enabled?: boolean;
    withCredentials?: boolean;
    onMessage?: (data: T) => void;
    onError?: (error: Event) => void;
    reconnectOnError?: boolean;
    reconnectInterval?: number;
  } = {}
): {
  data: T | null;
  error: Event | null;
  status: 'connecting' | 'open' | 'closed' | 'error';
} {
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<Event | null>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    enabled = true,
    withCredentials = false,
    onMessage,
    onError,
    reconnectOnError = true,
    reconnectInterval = 5000
  } = options;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    function setupEventSource() {
      if (!enabled) {
        setStatus('closed');
        return;
      }

      setStatus('connecting');
      
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        // Create new EventSource connection
        const eventSource = new EventSource(url, { withCredentials });
        eventSourceRef.current = eventSource;
        
        // Set up event handlers
        eventSource.onopen = () => {
          setStatus('open');
          setError(null);
        };
        
        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data) as T;
            setData(parsedData);
            onMessage?.(parsedData);
          } catch (err) {
            console.error("Error parsing SSE data:", err);
          }
        };
        
        eventSource.onerror = (event) => {
          setStatus('error');
          setError(event);
          onError?.(event);
          
          // Close and clean up on error
          eventSource.close();
          eventSourceRef.current = null;
          
          // Attempt to reconnect if enabled
          if (reconnectOnError) {
            timeoutId = setTimeout(setupEventSource, reconnectInterval);
          }
        };
        
        // Clean up function to remove event source when component unmounts
        return () => {
          eventSource.close();
          eventSourceRef.current = null;
          clearTimeout(timeoutId);
        };
      } catch (err) {
        console.error("Error setting up EventSource:", err);
        setStatus('error');
        
        // Attempt to reconnect if enabled
        if (reconnectOnError) {
          timeoutId = setTimeout(setupEventSource, reconnectInterval);
        }
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
    
    const cleanup = setupEventSource();
    
    return () => {
      cleanup?.();
      clearTimeout(timeoutId);
    };
  }, [url, enabled, withCredentials, onMessage, onError, reconnectOnError, reconnectInterval]);

  return { data, error, status };
}
