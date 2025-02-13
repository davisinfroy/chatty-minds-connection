
import { useState, useEffect, useCallback } from "react";

export function useEventSource() {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connect = useCallback((response: Response) => {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              setData(data);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    };

    readStream();
  }, []);

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return {
    data,
    error,
    connect,
  };
}
