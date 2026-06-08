import React, {type ReactNode, useState, useEffect, useMemo} from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useCurrentSidebarCategory, useDocById} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import DocCardList from '@theme/DocCardList';
import DocPaginator from '@theme/DocPaginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import Heading from '@theme/Heading';
import type {Props} from '@theme/DocCategoryGeneratedIndexPage';

import styles from './styles.module.css';

// Google Analytics gtag function type
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, any>
    ) => void;
  }
}

function DocCategoryGeneratedIndexPageMetadata({
  categoryGeneratedIndex,
}: Props): ReactNode {
  return (
    <PageMetadata
      title={categoryGeneratedIndex.title}
      description={categoryGeneratedIndex.description}
      keywords={categoryGeneratedIndex.keywords}
      // TODO `require` this?
      image={useBaseUrl(categoryGeneratedIndex.image)}
    />
  );
}

type SortMode = 'default' | 'date' | 'alphabetical' | 'alphabeticalDesc' | 'popular';

function DocCategoryGeneratedIndexPageContent({
  categoryGeneratedIndex,
}: Props): ReactNode {
  const category = useCurrentSidebarCategory();

  // State for sort mode with localStorage persistence
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gamesSortMode');
      // Migrate old "random" value to "default"
      if (saved === 'random') {
        localStorage.setItem('gamesSortMode', 'default');
        return 'default';
      }
      return (saved as SortMode) || 'default';
    }
    return 'default';
  });

  // State for selected tags with localStorage persistence
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gamesSelectedTags');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save sort preference to localStorage and track with Google Analytics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamesSortMode', sortMode);

      // Track sort mode change with Google Analytics
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'sort_games', {
          event_category: 'Games',
          event_label: sortMode,
          sort_mode: sortMode,
        });
      }
    }
  }, [sortMode]);

  // Save tag selection to localStorage and track with Google Analytics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamesSelectedTags', JSON.stringify(selectedTags));

      // Track tag filter changes with Google Analytics
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'filter_games', {
          event_category: 'Games',
          event_label: selectedTags.length > 0 ? selectedTags.join(',') : 'none',
          selected_tags: selectedTags,
          filter_count: selectedTags.length,
        });
      }
    }
  }, [selectedTags]);

  // Extract all unique tags from all games
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    category.items.forEach((item: any) => {
      const tags = item.customProps?.tags;
      if (Array.isArray(tags)) {
        tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [category.items]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Clear all tag filters
  const clearTagFilters = () => {
    // Track clear action with Google Analytics
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'clear_filters', {
        event_category: 'Games',
        event_label: 'clear_all',
        previous_filter_count: selectedTags.length,
      });
    }
    setSelectedTags([]);
  };

  // Filter and sort items based on current mode
  const sortedItems = useMemo(() => {
    let items = [...category.items];

    // Apply tag filtering if any tags are selected
    if (selectedTags.length > 0) {
      items = items.filter((item: any) => {
        const itemTags = item.customProps?.tags;
        if (!Array.isArray(itemTags)) return false;
        // Show games that have ALL of the selected tags (AND logic)
        return selectedTags.every((tag) => itemTags.includes(tag));
      });
    }

    if (sortMode === 'date') {
      // Sort by dateAdded (most recent first)
      return items.sort((a, b) => {
        const dateA = (a as any).customProps?.dateAdded as string | undefined;
        const dateB = (b as any).customProps?.dateAdded as string | undefined;

        if (dateA && dateB) {
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        if (!dateA && dateB) return 1;
        if (dateA && !dateB) return -1;
        return 0;
      });
    } else if (sortMode === 'alphabetical') {
      // Sort alphabetically by label/title (A-Z)
      return items.sort((a, b) => {
        const labelA = (a as any).label || '';
        const labelB = (b as any).label || '';
        return labelA.localeCompare(labelB, 'en', { sensitivity: 'base' });
      });
    } else if (sortMode === 'alphabeticalDesc') {
      // Sort reverse alphabetically by label/title (Z-A)
      return items.sort((a, b) => {
        const labelA = (a as any).label || '';
        const labelB = (b as any).label || '';
        return labelB.localeCompare(labelA, 'en', { sensitivity: 'base' });
      });
    } else if (sortMode === 'popular') {
      // Sort by HN points (most popular first)
      return items.sort((a, b) => {
        const pointsA = (a as any).customProps?.points as number | undefined;
        const pointsB = (b as any).customProps?.points as number | undefined;

        if (pointsA !== undefined && pointsB !== undefined) {
          return pointsB - pointsA; // Descending order
        }
        if (pointsA === undefined && pointsB !== undefined) return 1;
        if (pointsA !== undefined && pointsB === undefined) return -1;
        return 0;
      });
    } else {
      // Sort by sidebar_position (random order)
      return items.sort((a, b) => {
        const posA = (a as any).customProps?.sidebarPosition as number | undefined;
        const posB = (b as any).customProps?.sidebarPosition as number | undefined;

        if (posA !== undefined && posB !== undefined) {
          return posA - posB;
        }
        if (posA === undefined && posB !== undefined) return 1;
        if (posA !== undefined && posB === undefined) return -1;
        return 0;
      });
    }

    return items;
  }, [category.items, sortMode, selectedTags]);

  return (
    <div className={styles.generatedIndexPage}>
      <DocVersionBanner />
      <DocBreadcrumbs />
      <DocVersionBadge />
      <header>
        <Heading as="h1" className={styles.title}>
          {categoryGeneratedIndex.title}
        </Heading>
        {categoryGeneratedIndex.description && (
          <p>{categoryGeneratedIndex.description}</p>
        )}
      </header>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <span className={styles.filterLabel}>Filter by tags:</span>
            {selectedTags.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={clearTagFilters}
              >
                Clear all ({selectedTags.length})
              </button>
            )}
          </div>
          <div className={styles.tagButtons}>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? styles.tagButtonActive : styles.tagButton}
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Sort by:</span>
        <button
          className={sortMode === 'default' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => setSortMode('default')}
          aria-pressed={sortMode === 'default'}
        >
          Default
        </button>
        <button
          className={sortMode === 'date' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => setSortMode('date')}
          aria-pressed={sortMode === 'date'}
        >
          Most Recent
        </button>
        <button
          className={sortMode === 'popular' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => setSortMode('popular')}
          aria-pressed={sortMode === 'popular'}
        >
          HN Ranking
        </button>
        <button
          className={sortMode === 'alphabetical' || sortMode === 'alphabeticalDesc' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => {
            // Toggle between A-Z and Z-A
            if (sortMode === 'alphabetical') {
              setSortMode('alphabeticalDesc');
            } else if (sortMode === 'alphabeticalDesc') {
              setSortMode('alphabetical');
            } else {
              setSortMode('alphabetical');
            }
          }}
          aria-pressed={sortMode === 'alphabetical' || sortMode === 'alphabeticalDesc'}
        >
          {sortMode === 'alphabeticalDesc' ? 'Z-A' : 'A-Z'}
        </button>
      </div>

      {/* Results count */}
      {selectedTags.length > 0 && (
        <div className={styles.resultsCount}>
          Showing {sortedItems.length} {sortedItems.length === 1 ? 'game' : 'games'}
        </div>
      )}

      <article className="margin-top--lg">
        <DocCardList items={sortedItems} className={styles.list} />
      </article>
      <footer className="margin-top--md">
        <DocPaginator
          previous={categoryGeneratedIndex.navigation.previous}
          next={categoryGeneratedIndex.navigation.next}
        />
      </footer>
    </div>
  );
}

export default function DocCategoryGeneratedIndexPage(props: Props): ReactNode {
  return (
    <>
      <DocCategoryGeneratedIndexPageMetadata {...props} />
      <DocCategoryGeneratedIndexPageContent {...props} />
    </>
  );
}
