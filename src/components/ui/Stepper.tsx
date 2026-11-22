'use client';

import React from 'react';

export interface StepItem {
  id: string | number;
  number?: number;
  title: string;
  shortTitle?: string;
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
  showHeader?: boolean;
  stepLabelPrefix?: string; // 'Etapa' | 'Paso'
}

/**
 * Componente unificado Stepper (Indicador de Pasos Corporativo SIFYGSA)
 * Modelo normativo oficial basado en el patrón de "Agregar Proveedor":
 *
 * Características:
 * - Tarjeta contenedora con soporte integral modo claro / oscuro.
 * - Cabecera superior institucional:
 *   * Izquierda: Insignia numérica del paso actual, título ("Etapa / Paso X de N: Título") y descripción explicativa.
 *   * Derecha: Indicador de progreso general ("XX% Completado") con barra animada de gradiente.
 * - Pista de nodos conectados con líneas continuas:
 *   * Línea de fondo neutra.
 *   * Línea activa con gradiente esmeralda a azul corporativo (#1D4ED8) con animación suave.
 *   * PASO COMPLETADO: Círculo verde (bg-emerald-600) con palomita blanca (check), ring verde suave, título verde y badge "Listo".
 *   * PASO ACTUAL: Círculo azul (#1D4ED8), escala 110%, ring azul claro, título azul y badge "En curso".
 *   * PASO PENDIENTE: Círculo neutro con borde gris, número de paso, título y badge "Pendiente".
 *   * PASO CON ERROR: Borde e indicador rojo semántico con badge "Revisar".
 *   * PROCESO CONCLUIDO (isCompletedAll): Todos los nodos en verde con palomita y badge "Listo" / "Concluido".
 * - Accesibilidad WCAG 2.2 AA (aria-current, tooltips, etiquetas legibles).
 * - Diseño completamente responsivo en móviles, tablets y desktop.
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
  showHeader = false,
  stepLabelPrefix = 'Paso',
}) => {
  const totalSteps = steps.length;
  const currentStepConfig = steps[currentStep - 1] || steps[0];

  // Cálculo de porcentaje de progreso
  const progressPercent = isCompletedAll
    ? 100
    : totalSteps <= 1
    ? 100
    : Math.min(
        100,
        Math.max(0, Math.round(((currentStep - 1) / (totalSteps - 1 || 1)) * 100))
      );

  // Cálculo de porcentaje para posicionamiento de líneas conectoras
  const halfNodePercent = totalSteps > 0 ? 100 / (2 * totalSteps) : 0;
  const activeLineWidthPercent = isCompletedAll
    ? 100 - (100 / (totalSteps || 1))
    : totalSteps <= 1
    ? 100
    : Math.max(
        0,
        ((currentStep - 1) / (totalSteps - 1 || 1)) * (100 - 100 / totalSteps)
      );

  return (
    <div
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-3 px-3 sm:px-6 shadow-xs transition-colors ${className}`}
      aria-label="Progreso del asistente por pasos"
    >
      {/* ── BANNER DISCRETO DE ÉXITO CUANDO TODO EL PROCESO ESTÁ CONCLUIDO ── */}
      {isCompletedAll && (
        <div className="flex items-center gap-2 px-3.5 py-2 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
            check_circle
          </span>
          <span>
            {successBannerText ||
              'Proceso completado exitosamente. Todos los pasos han sido concluidos.'}
          </span>
        </div>
      )}

      {/* ── CABECERA SUPERIOR INSTITUCIONAL (OPCIONAL, OCULTA POR DEFECTO PARA MAXIMIZAR ESPACIO) ── */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 text-[11px] font-black">
                {currentStep}
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {stepLabelPrefix} {currentStep} de {totalSteps}:{' '}
                {currentStepConfig?.shortTitle || currentStepConfig?.title}
              </h2>
            </div>
            {currentStepConfig?.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStepConfig.description}
              </p>
            )}
          </div>

          {/* Indicador de Progreso en la Derecha */}
          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Progreso General
              </div>
              <div className="text-[11px] font-bold text-[#1D4ED8] dark:text-blue-400">
                {isCompletedAll ? '100%' : `${progressPercent}%`}{' '}
                {isCompletedAll ? 'Concluido' : 'Completado'}
              </div>
            </div>
            <div className="w-20 sm:w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-blue-600 to-[#1D4ED8] rounded-full transition-all duration-300"
                style={{ width: `${isCompletedAll ? 100 : progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PISTA DE NODOS CONECTADOS (COMPACTO Y MODERNO) ── */}
      <div className="relative px-1 sm:px-3 pt-1 pb-0.5">
        {/* Línea base de fondo (gris neutro) */}
        <div
          className="absolute top-4 h-0.5 bg-slate-200 dark:bg-slate-700/80 z-0 rounded-full"
          style={{
            left: `${halfNodePercent}%`,
            right: `${halfNodePercent}%`,
          }}
        />

        {/* Línea activa con degradado suave (verde a azul corporativo #1D4ED8) */}
        <div
          className={`absolute top-4 h-0.5 z-0 rounded-full transition-all duration-500 ${
            isCompletedAll
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-emerald-500 to-[#1D4ED8]'
          }`}
          style={{
            left: `${halfNodePercent}%`,
            width: `${activeLineWidthPercent}%`,
          }}
        />

        {/* Nodos de Pasos Distribuidos Equitativamente */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const stepNum = step.number ?? idx + 1;
            const isCurrent = !isCompletedAll && stepNum === currentStep;
            const isCompleted =
              isCompletedAll ||
              (!isCurrent &&
                (completedSteps.includes(stepNum) || stepNum < currentStep));
            const hasError = !isCompletedAll && errorSteps.includes(stepNum);
            const isLast = stepNum === totalSteps;
            const isConcluidoNode = isCompletedAll && isLast;

            // Navegación interactiva por clic
            const canClick = !isReadOnly && !isCurrent && !!onStepClick;

            // Determinación de etiqueta de estado
            let badgeText = 'Pendiente';
            let badgeStyle =
              'text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/50';

            if (isConcluidoNode) {
              badgeText = 'Concluido';
              badgeStyle =
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold';
            } else if (hasError) {
              badgeText = 'Revisar';
              badgeStyle =
                'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 font-semibold';
            } else if (isCurrent) {
              badgeText = 'En curso';
              badgeStyle =
                'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold';
            } else if (isCompleted) {
              badgeText = 'Listo';
              badgeStyle =
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold';
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
                className={`group flex flex-col items-center focus:outline-none transition-transform ${
                  canClick
                    ? 'cursor-pointer hover:scale-105'
                    : 'cursor-default'
                }`}
                style={{ width: `${100 / totalSteps}%` }}
                title={canClick ? `Ir a ${step.title}` : step.title}
              >
                {/* Círculo indicador compacto */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-50 dark:ring-emerald-950/50 shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-[#1D4ED8] text-white ring-2 ring-blue-100 dark:ring-blue-900/50 ring-offset-1 dark:ring-offset-slate-900 scale-105 shadow-blue-500/30'
                      : hasError
                      ? 'bg-white dark:bg-slate-800 text-red-600 border border-red-500 ring-2 ring-red-100 dark:ring-red-950/40'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 group-hover:border-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <span
                      className="material-symbols-outlined text-[16px] font-bold"
                      aria-hidden="true"
                    >
                      check
                    </span>
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                {/* Título y Badge del Paso */}
                <div className="mt-1 text-center px-1 max-w-[140px]">
                  <span
                    className={`block text-[11px] sm:text-xs font-semibold leading-tight transition-colors line-clamp-1 ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isCurrent
                        ? 'text-[#1D4ED8] dark:text-blue-400'
                        : hasError
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                    }`}
                  >
                    {step.title}
                  </span>

                  <span
                    className={`inline-block mt-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded-full ${badgeStyle}`}
                  >
                    {badgeText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stepper;
