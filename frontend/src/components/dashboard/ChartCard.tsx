'use client';

import React, { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  children,
  subtitle,
  action,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div>
          {action || (
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};
