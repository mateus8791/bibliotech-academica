'use client';

import React, { useState, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { notify } from '@/lib/toast';
import { FaUpload, FaSpinner, FaDownload, FaFileCsv, FaInfoCircle, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

import { useAuth } from '@/contexts/AuthContext'; 
import api from '@/services/api'; 

// --- CORREÇÃO APLICADA AQUI ---
// Corrigido para apontar para o local real dos seus componentes UI
// (conforme o print 'image_ac23fc.png')
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/app/dashboard/emprestimos/components/ui/dialog"; 
import { Button } from "@/app/dashboard/emprestimos/components/ui/button";
// --- FIM DA CORREÇÃO ---


interface ImportResult {
    message: string;
    errors?: string[];
}

export function ImportLivrosModal() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { usuario } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setImportResult(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
        const errorMsg = rejectedFiles[0].errors[0].code === 'file-invalid-type'
            ? 'Apenas arquivos .csv são permitidos.'
            : rejectedFiles[0].errors[0].code === 'file-too-large'
            ? 'Arquivo muito grande (máx 10MB).'
            : 'Arquivo inválido.';
        notify.error(errorMsg);
        setFile(null);
    } else if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    } else {
        setFile(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file || !usuario) {
      notify.error('Por favor, selecione um ficheiro CSV e certifique-se de estar logado.');
      return;
    }
    setIsLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/livros/importar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const resultData: ImportResult = response.data;
      setImportResult(resultData);

      if (resultData.errors && resultData.errors.length > 0) {
           notify.warning(`Importação concluída com ${resultData.errors.length} erro(s). Verifique os detalhes no modal.`);
      } else {
          notify.success(resultData.message || 'Livros importados com sucesso!');
      }

    } catch (error: any) {
      console.error("Erro na importação:", error);
      const errorMsg = error.response?.data?.message || error.message || "Erro desconhecido ao importar o arquivo.";
      setImportResult({ message: `Falha na importação: ${errorMsg}` });
      notify.error(`Erro na importação: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnOpenChange = (open: boolean) => {
      if (!open) {
          setFile(null);
          setIsLoading(false);
          setImportResult(null);
      }
      setIsOpen(open);
  };

  const columns = ['titulo', 'isbn', 'ano_publicacao', 'num_paginas', 'sinopse', 'quantidade_disponivel', 'capa_url', 'autores', 'categorias'];

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"> 
          <FaUpload className="mr-2 h-4 w-4" /> Importar Livros (CSV)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-white text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Importar Livros via CSV</DialogTitle>
          <DialogDescription>
            Faça o upload de um ficheiro CSV (.csv) para adicionar múltiplos livros. Use o modelo para referência.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input {...getInputProps()} disabled={isLoading} />
            <div className="flex flex-col items-center justify-center">
              <FaUpload className="text-4xl text-gray-400 mb-3" />
              {file ? (
                 <div className="flex items-center space-x-2">
                    <FaFileCsv className="text-green-600"/>
                    <p className="text-green-600 font-semibold">{file.name}</p>
                    {!isLoading && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); setImportResult(null); }}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            disabled={isLoading}
                            aria-label="Remover arquivo selecionado"
                        >
                            <FaTimes/>
                        </button>
                    )}
                 </div>
              ) : (
                <p className="text-gray-500">
                  {isDragActive ? 'Solte o ficheiro aqui...' : 'Arraste e solte o ficheiro CSV ou clique para selecionar'}
                </p>
              )}
               <p className="text-xs text-gray-400 mt-1">Máximo de 10MB</p>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/templates/modelo_livros.csv"
              download="modelo_livros.csv"
              className="text-sm text-blue-600 hover:underline inline-flex items-center"
            >
              <FaDownload className="mr-2" />
              Baixar modelo CSV
            </a>
          </div>

          <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" />
              Colunas esperadas (cabeçalhos):
            </h3>
            <div className="flex flex-wrap gap-2">
              {columns.map(col => (
                <span key={col} className="bg-gray-200 text-gray-700 text-xs font-mono py-1 px-2 rounded">
                  {col}
                </span>
              ))}
            </div>
             <p className="text-xs text-gray-500 mt-2">Os cabeçalhos devem corresponder (ignora maiúsculas/minúsculas). Use vírgula (,) como separador. Múltiplos autores/categorias: separe com vírgula na mesma célula (ex: "Autor A, Autor B").</p>
          </div>

           {importResult && (
                <div className={`mt-4 p-4 rounded-md ${importResult.errors && importResult.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-start mb-2">
                        {importResult.errors && importResult.errors.length > 0 ? (
                            <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                            <FaCheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <p className={`text-sm font-medium ${importResult.errors && importResult.errors.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                            {importResult.message}
                        </p>
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                        <div className="ml-7 mt-1 max-h-32 overflow-y-auto border-t border-red-200 pt-2">
                            <p className="text-xs text-red-700 font-semibold mb-1">Detalhes dos erros:</p>
                            <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                                {importResult.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={isLoading || !file}>
            {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaFileCsv className="mr-2" />}
            {isLoading ? 'Importando...' : 'Confirmar Importação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

