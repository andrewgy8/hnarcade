/**
 * Google Analytics tracking utilities
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track a game view event
 */
export function trackGameView(gameTitle: string, gamePath: string): void {
  trackEvent('view_game', {
    game_title: gameTitle,
    game_path: gamePath,
  });
}

/**
 * Track a search event
 */
export function trackSearch(searchTerm: string, resultCount: number): void {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
  });
}
