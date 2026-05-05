'use client';

import { X, Trash2, Ban } from 'lucide-react';
import Image from 'next/image';
import { Owl } from './preferencias/Owl';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  coverUrl?: string | null;
  isSubmitting: boolean;
}

export default function CancelModal({ isOpen, onClose, onConfirm, title, coverUrl, isSubmitting }: CancelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative animate-fade-in-up overflow-hidden">

        {/* Red Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="bg-red-500 rounded-full p-2">
            <Ban size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Cancelar reserva</h3>
            <p className="text-red-100 text-sm">Tem certeza que deseja cancelar?</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors p-1 rounded-full hover:bg-red-500"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex items-center gap-6 px-6 py-6">
          {/* Owl mascot */}
          <div className="flex-shrink-0">
            <Owl estado="warning" size={140} />
          </div>

          {/* Text content */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Eita! Vai mesmo cancelar?</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              A coruja ficou triste... mas tudo bem, você pode reservar de novo quando quiser!
            </p>

            {/* Book card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden shadow-sm">
                <Image
                  src={coverUrl || '/covers/placeholder-icon.png'}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs">Você está cancelando esta reserva.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Manter reserva
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {isSubmitting ? 'Cancelando...' : 'Sim, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}
