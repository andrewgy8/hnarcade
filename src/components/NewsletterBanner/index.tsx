import {useState, useEffect} from 'react';
import styles from './styles.module.css';

const STORAGE_KEY = 'hn-arcade-newsletter-dismissed';

export default function NewsletterBanner(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show banner if not previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsVisible(!dismissed);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <p className={styles.bannerText}>
        The week's best indie games from Hacker News
      </p>
      <form
        action="https://buttondown.email/api/emails/embed-subscribe/andrewgy8"
        method="post"
        target="popupwindow"
        className={styles.bannerForm}
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
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss newsletter banner"
      >
        ×
      </button>
    </div>
  );
}
