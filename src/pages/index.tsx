import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';
import Layout from '@theme/Layout';

import styles from './index.module.css';

// Rounded down to the nearest 10 so the hero reads "270+" rather than an exact figure.
function useRoundedGameCount(): number {
  const docs = useAllDocsData().default.versions[0].docs;
  const count = docs.filter((doc) => doc.id.startsWith('games/')).length;
  return Math.floor(count / 10) * 10;
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const gameCount = useRoundedGameCount();
  return (
    <header className={styles.heroBanner}>
      {/* decorative corner brackets */}
      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerTopRight} />
      <div className={styles.cornerBottomLeft} />
      <div className={styles.cornerBottomRight} />

      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <p className={styles.heroCount}>{gameCount}+ games and counting</p>
        <div className={styles.divider} />
        <div className={styles.buttons}>
          <Link
            className={styles.arcadeButtonPrimary}
            to="/games/category/games">
            Browse Games
          </Link>
          <Link
            className={styles.arcadeButtonSecondary}
            to="/games/submit">
            Submit a Game
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      description="A directory of games from Hacker News Show HN posts."
      wrapperClassName={styles.homepageWrapper}>
      <HomepageHeader />
    </Layout>
  );
}
