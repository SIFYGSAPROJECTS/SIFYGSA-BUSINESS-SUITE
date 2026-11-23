'use client';

import React from 'react';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import type { OrdenCompraStepConfig } from '../data/ordenCompraSteps';

export interface WizardStepperProps {
  steps: OrdenCompraStepConfig[];
  currentStep: number;
  completedSteps: number[];
  errorSteps?: number[];
  isSaved?: boolean;
  isCompletedAll?: boolean;
  onStepClick: (stepNumber: number) => void;
  successBannerText?: string;
  isCurrentStepValid?: boolean;
}

/**
 * Adaptador del Stepper corporativo para el flujo de Nueva Orden de Compra.
 * Reutiliza el componente normativo '@/components/ui/Stepper'.
 */
export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStep,
  completedSteps,
  errorSteps = [],
  isSaved = false,
  isCompletedAll = false,
  onStepClick,
  successBannerText,
  isCurrentStepValid = true,
}) => {
  const mappedSteps: StepItem[] = steps.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
    shortTitle: s.shortTitle,
    description: s.description,
  }));

  return (
    <Stepper
      steps={mappedSteps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      errorSteps={errorSteps}
      isCompletedAll={isCompletedAll}
      onStepClick={onStepClick}
      isReadOnly={isSaved}
      stepLabelPrefix="Etapa"
      successBannerText={successBannerText}
      isCurrentStepValid={isCurrentStepValid}
      className="mb-6"
    />
  );
};

export default WizardStepper;
