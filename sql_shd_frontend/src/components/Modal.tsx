import type { ReactNode } from 'react';
import { XSquare } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="modal-overlay inset-0 bg-black/80 backdrop-blur-md fixed z-[100] flex items-center justify-center p-4 animate-fade-up" style={{ animationDuration: '0.2s' }} onClick={onClose}>
      <div 
        className="modal-content glass-panel corner-bracket max-w-2xl w-full p-0 overflow-hidden relative" 
        style={{ animation: 'borderPulse 3s infinite' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header bg-black/60 border-b border-primary/30 p-4 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <h2 className="font-orbitron tracking-widest text-primary m-0 flex items-center gap-3">
            <span className="w-2 h-2 bg-primary animate-pulse rounded-full"></span>
            {title}
          </h2>
          <button onClick={onClose} className="modal-close text-secondary hover:text-danger transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1 rounded hover:bg-danger/10">
            <XSquare size={24} />
          </button>
        </div>
        <div className="modal-body p-6 text-text-primary overflow-y-auto max-h-[70vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
