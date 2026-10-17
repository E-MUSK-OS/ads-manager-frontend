'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/toast';
import { ActiveAccountProvider } from '@/lib/useActiveAccount';

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ToastProvider>
        <ActiveAccountProvider>
          {children}
        </ActiveAccountProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}
