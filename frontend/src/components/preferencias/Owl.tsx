'use client';

import Image from 'next/image';

export type OWL_STATE =
  | 'welcome'
  | 'warning'
  | 'error'
  | 'success'
  | 'achievement'
  | 'reservation'
  | 'overdue';

const OWL_MAP: Record<OWL_STATE, string> = {
  welcome: '/mascot/owl-welcome.png',
  warning: '/mascot/owl-warning.png',
  error: '/mascot/owl-error.png',
  success: '/mascot/owl-success.png',
  achievement: '/mascot/owl-achievement.png',
  reservation: '/mascot/owl-reservation.png',
  overdue: '/mascot/owl-overdue.png',
};

interface OwlProps {
  estado: OWL_STATE;
  size?: number;
  className?: string;
}

export function Owl({ estado, size = 200, className = '' }: OwlProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={OWL_MAP[estado]}
        alt={`Coruja - ${estado}`}
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-2xl"
        priority
      />
    </div>
  );
}
