import React from 'react';

    type ScrollDirection = 'up' | 'down' | 'none';

    interface ScrollPositionHook {
      scrollPosition: number;
      scrollDirection: ScrollDirection;
      isScrolling: boolean;
    }

    export function useScrollPosition(threshold = 10): ScrollPositionHook {
      const [scrollPosition, setScrollPosition] = React.useState(0);
      const [scrollDirection, setScrollDirection] = React.useState<ScrollDirection>('none');
      const [isScrolling, setIsScrolling] = React.useState(false);
      const previousScrollPosition = React.useRef(0);
      const scrollingTimeout = React.useRef<number | null>(null);

      React.useEffect(() => {
        const handleScroll = () => {
          const currentScrollPosition = window.scrollY;
          
          // Update scroll position
          setScrollPosition(currentScrollPosition);
          
          // Determine scroll direction with threshold to avoid minor fluctuations
          if (Math.abs(currentScrollPosition - previousScrollPosition.current) >= threshold) {
            const newDirection = currentScrollPosition > previousScrollPosition.current ? 'down' : 'up';
            setScrollDirection(newDirection);
            previousScrollPosition.current = currentScrollPosition;
          }
          
          // Handle scroll state for animations
          setIsScrolling(true);
          
          // Clear previous timeout
          if (scrollingTimeout.current !== null) {
            window.clearTimeout(scrollingTimeout.current);
          }
          
          // Set new timeout to detect when scrolling stops
          scrollingTimeout.current = window.setTimeout(() => {
            setIsScrolling(false);
          }, 150) as unknown as number;
        };
        
        // Initialize previous scroll position
        previousScrollPosition.current = window.scrollY;
        
        // Add scroll event listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Clean up
        return () => {
          window.removeEventListener('scroll', handleScroll);
          if (scrollingTimeout.current !== null) {
            window.clearTimeout(scrollingTimeout.current);
          }
        };
      }, [threshold]);
      
      return { scrollPosition, scrollDirection, isScrolling };
    }
