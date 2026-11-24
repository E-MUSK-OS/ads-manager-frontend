import React from 'react';
import { MarketingThemeProvider } from '@/components/marketing/ThemeContext';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingThemeProvider>{children}</MarketingThemeProvider>;
}
