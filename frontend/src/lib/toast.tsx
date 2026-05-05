'use client';

/**
 * Sistema de toasts do BiblioTech usando Sonner.
 * Cada tipo usa a imagem de coruja correspondente de /public/mascot/.
 */

import { toast } from 'sonner';

const BASE_STYLE: React.CSSProperties = {
  minHeight: '72px',
  padding: '14px 18px',
  alignItems: 'center',
  gap: '14px',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
};

const WELCOME_STYLE: React.CSSProperties = {
  minHeight: '96px',
  padding: '18px 22px',
  alignItems: 'center',
  gap: '16px',
  fontSize: '16px',
  fontWeight: 600,
  borderRadius: '14px',
  boxShadow: '0 12px 32px rgba(124,58,237,0.18)',
  background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
  borderLeft: '5px solid #7C3AED',
};

function OwlIcon({ src, alt, size = 52 }: { src: string; alt: string; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

export const notify = {
  /** Ação bem-sucedida (empréstimo, devolução, cadastro) */
  success: (msg: string) =>
    toast.success(msg, {
      icon: <OwlIcon src="/mascot/owl-success.png" alt="sucesso" />,
      style: { ...BASE_STYLE, borderLeft: '5px solid #16A34A' },
    }),

  /** Aviso geral (prazo chegando, inatividade) */
  warning: (msg: string) =>
    toast.warning(msg, {
      icon: <OwlIcon src="/mascot/owl-warning.png" alt="aviso" />,
      style: { ...BASE_STYLE, borderLeft: '5px solid #F97316' },
    }),

  /** Erro ou falha */
  error: (msg: string) =>
    toast.error(msg, {
      icon: <OwlIcon src="/mascot/owl-error.png" alt="erro" />,
      style: { ...BASE_STYLE, borderLeft: '5px solid #DC2626' },
    }),

  /** Prazo vencido / livro atrasado */
  overdue: (msg: string) =>
    toast.error(msg, {
      icon: <OwlIcon src="/mascot/owl-overdue.png" alt="atrasado" />,
      style: { ...BASE_STYLE, borderLeft: '5px solid #991B1B' },
      duration: 7000,
    }),

  /** Reserva disponível */
  reservation: (msg: string) =>
    toast.info(msg, {
      icon: <OwlIcon src="/mascot/owl-reservation.png" alt="reserva" />,
      style: { ...BASE_STYLE, borderLeft: '5px solid #2563EB' },
    }),

  /** Conquista desbloqueada */
  achievement: (msg: string) =>
    toast(msg, {
      icon: <OwlIcon src="/mascot/owl-achievement.png" alt="conquista" />,
      style: {
        ...BASE_STYLE,
        borderLeft: '5px solid #EAB308',
        background: '#FEFCE8',
      },
      duration: 6000,
    }),

  /** Boas-vindas ao login */
  welcome: (msg: string) =>
    toast(msg, {
      icon: <OwlIcon src="/mascot/owl-welcome.png" alt="bem-vindo" size={64} />,
      style: WELCOME_STYLE,
      duration: 5000,
    }),

  /** Informação genérica */
  info: (msg: string) =>
    toast.info(msg, {
      style: { ...BASE_STYLE, borderLeft: '5px solid #2563EB' },
    }),
};
