import posthog from 'posthog-js';

export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, eventParams);
  }
}

export function trackGameView(gameTitle: string, gamePath: string): void {
  trackEvent('view_game', {
    game_title: gameTitle,
    game_path: gamePath,
  });
}

export function trackSearch(searchTerm: string, resultCount: number): void {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
  });
}
