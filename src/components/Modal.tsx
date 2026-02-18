'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-handle" />
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
