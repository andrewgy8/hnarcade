/**
 * Custom DocCard component with screenshot support.
 * Swizzled from @docusaurus/theme-classic
 */

import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import { usePluralForm } from '@docusaurus/theme-common';
import isInternalUrl from '@docusaurus/isInternalUrl';
import { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';

import type { Props } from '@theme/DocCard';
import Heading from '@theme/Heading';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';

import styles from './styles.module.css';

function useCategoryItemsPlural() {
  const { selectMessage } = usePluralForm();
  return (count: number) =>
    selectMessage(
      count,
      translate(
        {
          message: '1 item|{count} items',
          id: 'theme.docs.DocCard.categoryDescription.plurals',
          description:
            'The default description for a category card in the generated index about how many items this category includes',
        },
        { count },
      ),
    );
}

function CardContainer({
  className,
  href,
  children,
}: {
  className?: string;
  href: string;
  children: ReactNode;
}): ReactNode {
  return (
    <Link
      href={href}
      className={clsx('card', styles.cardContainer, className)}>
      {children}
    </Link>
  );
}

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function CardLayout({
  className,
  href,
  icon,
  title,
  description,
  screenshot,
}: {
  className?: string;
  href: string;
  icon: ReactNode;
  title: string;
  description?: string;
  screenshot?: string;
}): ReactNode {
  // Support both external URLs and local paths
  const screenshotUrl = screenshot
    ? (isExternalUrl(screenshot) ? screenshot : useBaseUrl(screenshot))
    : null;

  return (
    <CardContainer href={href} className={clsx(className, !screenshotUrl && styles.cardNoImage)}>
      {screenshotUrl && (
        <div className={styles.cardImageContainer}>
          <img
            src={screenshotUrl}
            alt={`${title} screenshot`}
            className={styles.cardImage}
            loading="lazy"
          />
        </div>
      )}
      <div className={styles.cardContent}>
        <Heading
          as="h2"
          className={clsx('text--truncate', styles.cardTitle)}
          title={title}>
          {title}
        </Heading>
        {description && (
          <p
            className={clsx(styles.cardDescription)}
            title={description}>
            {description}
          </p>
        )}
      </div>
    </CardContainer>
  );
}

function CardCategory({ item }: { item: PropSidebarItemCategory }): ReactNode {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useCategoryItemsPlural();

  if (!href) {
    return null;
  }

  return (
    <CardLayout
      className={item.className}
      href={href}
      icon="🗃️"
      title={item.label}
      description={item.description ?? categoryItemsPlural(item.items.length)}
    />
  );
}

function CardLink({ item }: { item: PropSidebarItemLink }): ReactNode {
  const icon = isInternalUrl(item.href) ? '📄️' : '🔗';
  const doc = useDocById(item.docId ?? undefined);

  // Get screenshot from doc frontmatter
  const screenshot = doc?.frontMatter?.screenshot as string | undefined;

  return (
    <CardLayout
      className={item.className}
      href={item.href}
      icon={icon}
      title={item.label}
      description={item.description ?? doc?.description}
      screenshot={screenshot}
    />
  );
}

export default function DocCard({ item }: Props): ReactNode {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
