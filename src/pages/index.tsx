import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
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
