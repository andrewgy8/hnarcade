import { useEffect } from 'react';
import { trackSearch } from '@site/src/utils/analytics';

/**
 * Tracks search behavior by monitoring the search input
 * and result changes in the Docusaurus search plugin.
 */
export default function SearchTracker(): null {
  useEffect(() => {
    let searchTimeout: NodeJS.Timeout;

    // Monitor search input changes
    const handleSearchInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const searchTerm = target.value.trim();

      // Debounce search tracking (wait 1 second after user stops typing)
      clearTimeout(searchTimeout);

      if (searchTerm.length > 0) {
        searchTimeout = setTimeout(() => {
          // Count visible search results
          const resultElements = document.querySelectorAll(
            '.DocSearch-Dropdown .DocSearch-Hit, ' +
            '[class*="searchResultItem"], ' +
            '.search-result-match'
          );

          trackSearch(searchTerm, resultElements.length);
        }, 1000);
      }
    };

    // Track when search results are clicked
    const handleSearchResultClick = () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], .DocSearch-Input, [class*="searchInput"]'
      );

      if (searchInput?.value) {
        // Track the click with a special event
        trackSearch(searchInput.value.trim(), -1); // -1 indicates a click event
      }
    };

    // Add event listeners to search input (with some delay to ensure DOM is ready)
    const setupListeners = () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], .DocSearch-Input, [class*="searchInput"]'
      );

      if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
      }

      // Add click listeners to search results area
      const searchContainer = document.querySelector(
        '.DocSearch-Dropdown, [class*="searchResultsColumn"]'
      );

      if (searchContainer) {
        searchContainer.addEventListener('click', handleSearchResultClick);
      }
    };

    // Initial setup
    setupListeners();

    // Re-setup listeners when navigation occurs (for client-side routing)
    const observer = new MutationObserver(() => {
      setupListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(searchTimeout);
      observer.disconnect();

      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], .DocSearch-Input, [class*="searchInput"]'
      );

      if (searchInput) {
        searchInput.removeEventListener('input', handleSearchInput);
      }
    };
  }, []);

  return null;
}
