// Arquivo: frontend/src/components/ConfirmDeleteModal.tsx (Versão Melhorada)
'use client';

import { X, AlertTriangle } from 'lucide-react';

// 1. Adicionamos 'itemName' à interface de propriedades
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string; // Adicionamos como opcional
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName, // 2. Recebemos a propriedade aqui
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-start">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Confirmar Exclusão
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {/* 3. Usamos o itemName para uma mensagem dinâmica */}
                Você tem certeza que deseja excluir
                {itemName ? <strong className="font-semibold"> "{itemName}"</strong> : ' este item'}?
                <br/>
                Esta ação não poderá ser desfeita.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            Excluir
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}