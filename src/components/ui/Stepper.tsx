'use client';

import React from 'react';

export interface StepItem {
  id: string | number;
  number?: number;
  title: string;
  description?: string;
  badgeLabel?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-based index
  completedSteps?: number[];
  errorSteps?: number[];
  isCompletedAll?: boolean; // When all steps are finished
  onStepClick?: (stepNumber: number) => void;
  isReadOnly?: boolean;
  className?: string;
  successBannerText?: string;
}

/**
 * Componente compartido Stepper (Indicador de Pasos Corporativo SIFYGSA)
 * Basado en la referencia de "Alta de Proveedores" (Identificación / Contacto / Fiscal).
 *
 * Características:
 * - Círculos conectados por líneas conectoras:
 *   * Completado: círculo verde (bg-emerald-600) con palomita blanca, ring verde suave, etiqueta verde y badge "Listo".
 *   * Actual: círculo azul de marca (#1D4ED8), escala 110%, ring azul claro, etiqueta azul y badge "En curso".
 *   * Pendiente: círculo neutro gris con número, etiqueta gris y badge "Pendiente".
 *   * Con Error: borde rojo semántico, badge "Revisar".
 *   * Concluido (isCompletedAll): todos en verde con palomita, último paso "Concluido" y banner de éxito superior discreto.
 * - Líneas conectoras: tramos completados en verde, tramo al paso actual degradado de verde a azul, siguientes en gris.
 * - Clics solo en pasos completados (excepto si isReadOnly).
 * - Variante compacta responsiva para dispositivos móviles.
 * - WCAG 2.2 AA / Accesibilidad con aria-current="step" y soporte para modo claro/oscuro.
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  errorSteps = [],
  isCompletedAll = false,
  onStepClick,
  isReadOnly = false,
  className = '',
  successBannerText,
}) => {
  const totalSteps = steps.length;
  const currentStepConfig = steps[currentStep - 1] || steps[0];
  const progressPercent = isCompletedAll
    ? 100
    : Math.round(((currentStep - 1) / (totalSteps - 1 || 1)) * 100);

  return (
    <div
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors ${className}`}
      aria-label="Progreso del asistente por pasos"
    >
      {/* ── BANNER DE ÉXITO DISCRETO CUANDO EL MÓDULO ESTÁ CONCLUIDO ── */}
      {isCompletedAll && (
        <div className="flex items-center gap-2 px-3.5 py-2 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-[19px] text-emerald-600 dark:text-emerald-400">
            check_circle
          </span>
          <span>{successBannerText || 'Proceso completado exitosamente. Todos los pasos han sido concluidos.'}</span>
        </div>
      )}

      {/* ── VISTA DESKTOP / TABLET (Círculos con líneas conectoras y badges de estado) ── */}
      <div className="hidden sm:block relative pt-2 pb-1">
        {/* Línea base de fondo (gris neutro) */}
        <div className="absolute top-7 left-10 right-10 sm:left-14 sm:right-14 h-1 bg-slate-200 dark:bg-slate-700/80 z-0 rounded-full" />

        {/* Línea activa con degradado (verde a azul de marca #1D4ED8) o verde completo si está concluido */}
        <div
          className={`absolute top-7 left-10 sm:left-14 h-1 z-0 rounded-full transition-all duration-500 ${
            isCompletedAll
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-emerald-500 to-[#1D4ED8]'
          }`}
          style={{
            width: isCompletedAll
              ? `calc(100% - 7rem)`
              : `calc(${((currentStep - 1) / (totalSteps - 1 || 1)) * 100}% - ${
                  currentStep === 1 ? '0rem' : '2.5rem'
                })`,
          }}
        />

        {/* Nodos de Pasos */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const stepNum = step.number ?? idx + 1;
            const isCurrent = !isCompletedAll && stepNum === currentStep;
            const isCompleted = isCompletedAll || completedSteps.includes(stepNum) || stepNum < currentStep;
            const hasError = !isCompletedAll && errorSteps.includes(stepNum);
            const isLast = stepNum === totalSteps;
            const isConcluidoNode = isCompletedAll && isLast;

            // Clickeable solo si fue completado, no es el actual y no estamos en solo lectura
            const canClick = isCompleted && !isReadOnly && !isCurrent && !!onStepClick;

            // Determinación de etiqueta de badge
            let badgeText = 'Pendiente';
            let badgeStyle = 'text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/50';

            if (isConcluidoNode) {
              badgeText = 'Concluido';
              badgeStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold';
            } else if (hasError) {
              badgeText = 'Revisar';
              badgeStyle = 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 font-semibold';
            } else if (isCurrent) {
              badgeText = 'En curso';
              badgeStyle = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold';
            } else if (isCompleted) {
              badgeText = 'Listo';
              badgeStyle = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 font-semibold';
            }

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (canClick && onStepClick) onStepClick(stepNum);
                }}
                disabled={!canClick}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Paso ${stepNum}: ${step.title}. Estado: ${badgeText}`}
                className={`group flex flex-col items-center focus:outline-none transition-all ${
                  canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
                style={{ width: `${100 / totalSteps}%` }}
                title={
                  canClick
                    ? `Regresar a ${step.title}`
                    : isCompletedAll
                    ? 'Proceso concluido'
                    : isCurrent
                    ? 'Paso actual en curso'
                    : step.title
                }
              >
                {/* Círculo indicador */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                    isConcluidoNode || (isCompleted && !isCurrent)
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/50 shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-[#1D4ED8] text-white ring-4 ring-blue-100 dark:ring-blue-900/50 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow-blue-500/30'
                      : hasError
                      ? 'bg-white dark:bg-slate-800 text-red-600 border-2 border-red-500 ring-4 ring-red-100 dark:ring-red-950/40'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <span
                      className="material-symbols-outlined text-[20px] font-bold"
                      aria-hidden="true"
                    >
                      check
                    </span>
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                {/* Título y Badge del Paso */}
                <div className="mt-2 text-center px-1 max-w-[130px]">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold leading-tight transition-colors line-clamp-2 ${
                      isCompleted && !isCurrent
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isCurrent
                        ? 'text-[#1D4ED8] dark:text-blue-400'
                        : hasError
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>

                  <span
                    className={`inline-block mt-1 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-transparent ${badgeStyle}`}
                  >
                    {badgeText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VISTA RESPONSIVA MÓVIL (Compacta: "Paso X de N" con círculo activo y progreso) ── */}
      <div className="sm:hidden flex items-center justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md ${
              isCompletedAll
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/50'
                : 'bg-[#1D4ED8] text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
            }`}
          >
            {isCompletedAll ? (
              <span className="material-symbols-outlined text-[20px]">check</span>
            ) : (
              <span>{currentStep}</span>
            )}
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isCompletedAll ? 'Concluido' : `Paso ${currentStep} de ${totalSteps}`}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isCompletedAll ? 'Proceso Finalizado' : currentStepConfig?.title}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCompletedAll
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            {isCompletedAll ? '100% Completado' : `${progressPercent}%`}
          </span>
          <span className="text-[10px] text-slate-400">
            {isCompletedAll ? 'Listo' : 'En curso'}
          </span>
        </div>
      </div>

      {/* Barra de progreso inferior fina */}
      <div
        className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isCompletedAll
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-emerald-500 to-[#1D4ED8]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default Stepper;
