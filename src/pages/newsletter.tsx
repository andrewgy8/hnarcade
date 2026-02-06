import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import styles from './newsletter.module.css';

export default function Newsletter(): ReactNode {
  return (
    <Layout
      title="Newsletter"
      description="Subscribe to get the week's best indie games from Hacker News.">
      <main className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Newsletter</h1>
          <p className={styles.description}>
            Get the week's best indie games from Hacker News delivered to your inbox.
          </p>
          <form
            action="https://buttondown.email/api/emails/embed-subscribe/andrewgy8"
            method="post"
            target="popupwindow"
            className={styles.form}
          >
            <input type="hidden" name="tag" value="" />
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              className={styles.emailInput}
            />
            <button type="submit" className={styles.subscribeButton}>
              Subscribe
            </button>
          </form>
          <p className={styles.note}>
            No spam. No BS. Unsubscribe anytime.
          </p>
        </div>
      </main>
    </Layout>
  );
}
