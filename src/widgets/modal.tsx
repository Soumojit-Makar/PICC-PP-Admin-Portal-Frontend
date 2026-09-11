import React from 'react';
import type { ModalProps } from '../shared/types/modal';

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="
            fixed inset-0 z-50 
            flex items-center justify-center 
            bg-black/50 
            w-screen min-h-screen 
            overflow-y-auto
            p-4
        ">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-3xl shadow-2xl overflow-hidden rounded-lg border dark:border-gray-850">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 bg-secondary dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-gray-800">
                    {title && (
                        <div className="text-md font-semibold text-secondary_text">
                            {title}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="text-secondary_text hover:text-gray-700 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 text-gray-700 dark:text-gray-200 dark:bg-[#1e1e1e]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
