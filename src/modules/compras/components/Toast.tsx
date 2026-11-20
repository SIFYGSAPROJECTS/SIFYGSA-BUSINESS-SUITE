'use client';

import React from 'react';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: string;
}

interface ToastProps {
  toast: ToastState;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast.show) return null;

  const getIcon = () => {
    if (toast.icon) return toast.icon;
    switch (toast.type) {
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'success':
      default:
        return 'task_alt';
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'error':
        return 'border-[#EF4444] text-[#EF4444]';
      case 'info':
        return 'border-[#3B82F6] text-[#3B82F6]';
      case 'success':
      default:
        return 'border-[#10B981] text-[#10B981]';
    }
  };

  return (
    <div
      className="fixed top-20 right-6 z-50 transition-all duration-300 animate-slide-in pointer-events-auto"
      style={{
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="bg-[#111827] text-white border border-[#374151] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md">
        <span className={`material-symbols-outlined text-[22px] ${getBorderColor()}`}>
          {getIcon()}
        </span>
        <span className="font-body-sm text-sm text-gray-100 flex-1">
          {toast.message}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-2"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

