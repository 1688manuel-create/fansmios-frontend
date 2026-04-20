"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  type?: 'SUCCESS' | 'ERROR' | 'INFO' | 'CONFIRM';
  showInput?: boolean;
  placeholder?: string;
  confirmText?: string;
  onConfirm?: (input?: string) => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [inputValue, setInputValue] = useState('');

  const showModal = (opts: ModalOptions) => {
    setOptions(opts);
    setInputValue('');
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setOptions(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {isOpen && options && (
        <UniversalModal 
          options={options} 
          hideModal={hideModal} 
          inputValue={inputValue} 
          setInputValue={setInputValue} 
        />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal debe usarse dentro de un ModalProvider");
  return context;
};

// --- COMPONENTE VISUAL (La Carrocería de Lujo) ---
import { XCircle, CheckCircle, AlertCircle, Info, PiggyBank } from 'lucide-react';

const UniversalModal = ({ options, hideModal, inputValue, setInputValue }: any) => {
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              {options.type === 'SUCCESS' && <CheckCircle className="text-green-500 w-6 h-6" />}
              {options.type === 'ERROR' && <XCircle className="text-red-500 w-6 h-6" />}
              {options.type === 'CONFIRM' && <PiggyBank className="text-blue-500 w-6 h-6" />}
              {(!options.type || options.type === 'INFO') && <Info className="text-purple-500 w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{options.title}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{options.message}</p>
            </div>
          </div>
        </div>

        {options.showInput && (
          <input
            autoFocus
            type="text"
            className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-red-500 transition-all mb-6 font-medium"
            placeholder={options.placeholder || "Escribe aquí..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}

        <div className="flex gap-3">
          <button onClick={hideModal} className="flex-1 py-4 px-4 rounded-2xl border border-white/10 text-gray-500 font-bold text-sm hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (options.onConfirm) options.onConfirm(inputValue);
              hideModal();
            }}
            className="flex-1 py-4 px-4 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
          >
            {options.confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};