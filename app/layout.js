import './globals.css';

export const metadata = { title: 'Ticketing System' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
