'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface ProcessStepItem {
  id: string;
  stepNumber: number;
  label: string;
  isDone: boolean;
  description?: string;
}

interface ProcessStepperProps {
  steps: ProcessStepItem[];
  currentStepIndex: number;
  errorStepIndex?: number | null;
  onSelectStep: (index: number) => void;
  ariaLabel?: string;
}

/**
 * Stepper corporativo estándar SIFYGSA (sin barra inferior redundante).
 * - Verde (`Listo` + check): cuando todos los campos obligatorios (*) de la etapa están completos.
 * - Azul (`En curso`): etapa activa con campos obligatorios pendientes.
 * - Neutro (`Pendiente`): etapa inactiva con campos obligatorios pendientes.
 * - Rojo (`Revisar`): etapa con validación pendiente al intentar guardar.
 */
export const ProcessStepper: React.FC<ProcessStepperProps> = ({
  steps,
  currentStepIndex,
  errorStepIndex = null,
  onSelectStep,
  ariaLabel = 'Progreso de etapas'
}) => {
  const currentStepObj = steps[currentStepIndex] || steps[0];
  const completedCount = steps.filter((s) => s.isDone).length;

  return (
    <div className="rrhh-stepper-card" aria-label={ariaLabel}>
      {/* Vista Desktop / Tablet amplia (líneas individuales por segmento, estilo estándar Suite) */}
      <div className="rrhh-stepper-desktop">
        {steps.map((step, idx) => {
          const isDone = step.isDone;
          const isCurrent = currentStepIndex === idx;
          const hasErr = errorStepIndex === idx && !isDone;
          const nextStep = idx < steps.length - 1 ? steps[idx + 1] : null;

          const statusText = hasErr
            ? 'Revisar'
            : isDone
            ? 'Listo'
            : isCurrent
            ? 'En curso'
            : 'Pendiente';

          const stateClass = hasErr
            ? 'is-error'
            : isDone && isCurrent
            ? 'is-done is-current'
            : isDone
            ? 'is-done'
            : isCurrent
            ? 'is-current'
            : '';

          let segmentClass = 'is-pending';
          if (nextStep) {
            if (isDone && nextStep.isDone) {
              segmentClass = 'is-done';
            } else if (isDone && currentStepIndex === idx + 1) {
              segmentClass = 'is-done-to-current';
            } else if (isDone) {
              segmentClass = 'is-done';
            }
          }

          return (
            <div key={step.id} className="rrhh-stepper-item">
              {nextStep && (
                <div
                  aria-hidden="true"
                  className={`rrhh-stepper-segment ${segmentClass}`}
                />
              )}

              <button
                type="button"
                onClick={() => onSelectStep(idx)}
                className="rrhh-stepper-node"
                aria-current={isCurrent ? 'step' : undefined}
                title={`Ir a Etapa ${step.stepNumber}: ${step.label}`}
              >
                <div className={`rrhh-stepper-circle ${stateClass}`}>
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : step.stepNumber}
                </div>
                <span className={`rrhh-stepper-title ${stateClass}`}>
                  {step.label}
                </span>
                <span className={`rrhh-stepper-badge ${stateClass}`}>
                  {statusText}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Vista Compacta Automática (Móvil o Zoom 150%-200%) */}
      {currentStepObj && (
        <div className="rrhh-stepper-compact">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <div
                className={`rrhh-stepper-circle ${
                  currentStepObj.isDone ? 'is-done' : 'is-current'
                }`}
                style={{ width: '36px', height: '36px', flexShrink: 0, transform: 'none' }}
              >
                {currentStepObj.isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : currentStepObj.stepNumber}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)'
                  }}
                >
                  Etapa {currentStepIndex + 1} de {steps.length}
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {currentStepObj.label}
                </div>
              </div>
            </div>

            <span
              className={`rrhh-stepper-badge ${completedCount === steps.length ? 'is-done' : 'is-current'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.65rem', marginTop: 0, flexShrink: 0 }}
            >
              {completedCount} de {steps.length} listos
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {steps.map((step, idx) => {
              const isCurrent = currentStepIndex === idx;
              const isDone = step.isDone;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  style={{
                    flex: '1 1 36px',
                    height: '28px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: isCurrent
                      ? '1.5px solid var(--primary)'
                      : isDone
                      ? '1px solid var(--success-border)'
                      : '1px solid var(--border)',
                    backgroundColor: isCurrent
                      ? 'var(--primary)'
                      : isDone
                      ? 'var(--success-bg)'
                      : 'var(--surface-alt)',
                    color: isCurrent
                      ? '#ffffff'
                      : isDone
                      ? 'var(--success-text)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title={step.label}
                >
                  {isDone ? '✓' : step.stepNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
