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

type SortMode = 'date' | 'random';

function DocCategoryGeneratedIndexPageContent({
  categoryGeneratedIndex,
}: Props): ReactNode {
  const category = useCurrentSidebarCategory();

  // State for sort mode with localStorage persistence
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gamesSortMode');
      return (saved === 'random' ? 'random' : 'date') as SortMode;
    }
    return 'date';
  });

  // Save sort preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamesSortMode', sortMode);
    }
  }, [sortMode]);

  // Sort items based on current mode
  const sortedItems = useMemo(() => {
    const items = [...category.items];

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
  }, [category.items, sortMode]);

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

      {/* Sort controls */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Sort by:</span>
        <button
          className={sortMode === 'date' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => setSortMode('date')}
          aria-pressed={sortMode === 'date'}
        >
          Most Recent
        </button>
        <button
          className={sortMode === 'random' ? styles.sortButtonActive : styles.sortButton}
          onClick={() => setSortMode('random')}
          aria-pressed={sortMode === 'random'}
        >
          Random
        </button>
      </div>

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
