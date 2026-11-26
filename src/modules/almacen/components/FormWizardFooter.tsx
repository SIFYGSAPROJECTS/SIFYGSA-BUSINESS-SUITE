'use client';

import React from 'react';

export interface FormWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  isValid: boolean;
  missingFields?: string[];
  onContinue: () => void;
  onPrevious?: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  continueText?: string;
  finalText?: string;
  continueIcon?: string;
  finalIcon?: string;
  isSavingDraft?: boolean;
  lastSavedText?: string;
  onInvalidClick?: () => void;
  helperText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isLastStep?: boolean;
  className?: string;
  extraLeftActions?: React.ReactNode;
}

/**
 * Pie de navegación fijo estandarizado para asistentes y formularios en el módulo de Almacén.
 * Cumple con las directrices normativas:
 * - Siempre visible en la misma posición (fixed bottom).
 * - Botón "Continuar" / Final con estado dinámico en tiempo real (deshabilitado si faltan obligatorios).
 * - Tooltip interactivo con los campos faltantes al hacer hover sobre el botón deshabilitado.
 * - Texto auxiliar discreto junto al botón que se oculta al estar válido.
 * - Clic en botón deshabilitado dispara `onInvalidClick` para resaltar errores y enfocar el primer campo.
 * - Botones "Anterior" y "Guardar Borrador" siempre habilitados.
 */
export const FormWizardFooter: React.FC<FormWizardFooterProps> = ({
  currentStep,
  totalSteps,
  isValid,
  missingFields = [],
  onContinue,
  onPrevious,
  onSaveDraft,
  onCancel,
  continueText = 'Continuar',
  finalText = 'Guardar Registro',
  continueIcon = 'arrow_forward',
  finalIcon = 'check_circle',
  isSavingDraft = false,
  lastSavedText,
  onInvalidClick,
  helperText = 'Completa los campos obligatorios (*) para continuar',
  cancelText = 'Cancelar Operación',
  showCancel = true,
  isLastStep,
  className = '',
  extraLeftActions,
}) => {
  const lastStep = isLastStep !== undefined ? isLastStep : currentStep === totalSteps;
  const displayText = lastStep ? finalText : continueText;
  const displayIcon = lastStep ? finalIcon : continueIcon;

  const handleContinueClick = (e: React.MouseEvent) => {
    if (!isValid) {
      e.preventDefault();
      e.stopPropagation();
      if (onInvalidClick) {
        onInvalidClick();
      }
      return;
    }
    onContinue();
  };

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-8 py-3.5 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)] transition-colors ${className}`}
      aria-label="Barra de acciones del formulario"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Lado Izquierdo: Guardar Borrador / Acciones Secundarias */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
              title="Guardar borrador de la sesión"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isSavingDraft ? 'sync' : 'save'}
              </span>
              <span>{isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}</span>
            </button>
          )}

          {lastSavedText && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden md:inline">
              {lastSavedText}
            </span>
          )}

          {extraLeftActions}
        </div>

        {/* Centro: Opción Cancelar */}
        {showCancel && onCancel && (
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          </div>
        )}

        {/* Lado Derecho: Navegación de Etapas (Anterior / Continuar / Guardar) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Botón Anterior */}
          {onPrevious && (
            <button
              type="button"
              disabled={currentStep <= 1}
              onClick={onPrevious}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-colors border shadow-xs ${
                currentStep <= 1
                  ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              <span>Anterior</span>
            </button>
          )}

          {/* Texto auxiliar discreto cuando faltan obligatorios */}
          {!isValid && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hidden lg:inline-block animate-fadeIn">
              {helperText}
            </span>
          )}

          {/* Contenedor con Tooltip del Botón Continuar / Final */}
          <div className="relative group">
            {!isValid && missingFields.length > 0 && (
              <div
                role="tooltip"
                className="pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full right-0 mb-2.5 w-64 p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs shadow-2xl border border-slate-700 z-50 animate-fadeIn"
              >
                <div className="font-bold text-[11px] text-amber-400 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  Faltan {missingFields.length} {missingFields.length === 1 ? 'campo obligatorio' : 'campos obligatorios'}:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 max-h-40 overflow-y-auto">
                  {missingFields.map((field, idx) => (
                    <li key={idx} className="truncate" title={field}>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={handleContinueClick}
              aria-disabled={!isValid}
              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs ${
                isValid
                  ? 'bg-[#1D4ED8] hover:bg-blue-700 text-white shadow-md active:scale-98 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/70 dark:border-slate-700 cursor-not-allowed opacity-75'
              }`}
            >
              <span>{displayText}</span>
              <span className="material-symbols-outlined text-[17px]">
                {displayIcon}
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FormWizardFooter;
