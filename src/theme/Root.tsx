import type {ReactNode} from 'react';
import NewsletterBanner from '@site/src/components/NewsletterBanner';

interface Props {
  children: ReactNode;
}

export default function Root({children}: Props): JSX.Element {
  return (
    <>
      <NewsletterBanner />
      {children}
    </>
  );
}
