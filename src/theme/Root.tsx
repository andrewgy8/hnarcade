import type {ReactNode} from 'react';
import NewsletterBanner from '@site/src/components/NewsletterBanner';
import SearchTracker from '@site/src/components/SearchTracker';

interface Props {
  children: ReactNode;
}

export default function Root({children}: Props): JSX.Element {
  return (
    <>
      <SearchTracker />
      <NewsletterBanner />
      {children}
    </>
  );
}
