'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

import SupportButton from './dashboard/emprestimos/components/SupportButton';
import NotificationPopup from '@/components/NotificationPopup';
import HeartbeatProvider from '@/components/HeartbeatProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

const metadataObject: Metadata = {
  title: 'BiblioTech',
  description: 'Seu sistema de gerenciamento de biblioteca',
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { usuario, notifications, loading } = useAuth();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      usuario &&
      usuario.tipo_usuario === 'aluno' &&
      notifications &&
      (notifications.overdueBooks > 0 || notifications.showInactivityWarning)
    ) {
      const dismissedKey = `notification_dismissed_${usuario.id}`;
      const isDismissed = sessionStorage.getItem(dismissedKey);
      if (!isDismissed) {
        setShowNotificationPopup(true);
      }
    } else if (!loading) {
      setShowNotificationPopup(false);
    }
  }, [notifications, usuario, loading]);

  const handleCloseNotification = () => {
    setShowNotificationPopup(false);
    if (usuario) {
      const dismissedKey = `notification_dismissed_${usuario.id}`;
      sessionStorage.setItem(dismissedKey, 'true');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <>
      {children}

      {usuario && usuario.tipo_usuario === 'aluno' && <SupportButton />}

      {usuario && notifications && (
        <NotificationPopup
          isOpen={showNotificationPopup}
          onClose={handleCloseNotification}
          overdueCount={notifications.overdueBooks}
          daysInactive={notifications.daysInactive}
          showInactivityWarning={notifications.showInactivityWarning}
        />
      )}

      {/* Toaster do Sonner — substitui o ToastContainer do react-toastify */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        expand={true}
        visibleToasts={5}
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'inherit',
            width: '360px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>{String(metadataObject.title)}</title>
        <meta name="description" content={metadataObject.description || ''} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <HeartbeatProvider>
                <NotificationProvider>
                  <LayoutContent>{children}</LayoutContent>
                </NotificationProvider>
              </HeartbeatProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
