import { useEffect } from 'react';
import type {ReactNode} from 'react';
import posthog from 'posthog-js';
import NewsletterBanner from '@site/src/components/NewsletterBanner';
import SearchTracker from '@site/src/components/SearchTracker';

interface Props {
  children: ReactNode;
}

export default function Root({children}: Props): JSX.Element {
  useEffect(() => {
    posthog.init('REPLACE_WITH_YOUR_POSTHOG_API_KEY', {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
    });
  }, []);

  return (
    <>
      <SearchTracker />
      <NewsletterBanner />
      {children}
    </>
  );
}
