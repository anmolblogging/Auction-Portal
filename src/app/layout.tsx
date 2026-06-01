import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sports Auction Room',
  description: 'Host live fantasy sports auctions with friends. Bid on players, build your squad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
