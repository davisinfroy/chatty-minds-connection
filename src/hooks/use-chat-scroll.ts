
import { useEffect, RefObject } from "react";

interface UseChatScrollProps {
  containerRef: RefObject<HTMLElement>;
  messages: any[];
  isLoading: boolean;
}

export function useChatScroll({
  containerRef,
  messages,
  isLoading,
}: UseChatScrollProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const smoothScroll = () => {
      const { scrollHeight, clientHeight } = container;
      container.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    };

    smoothScroll();
  }, [messages, isLoading, containerRef]);
}
