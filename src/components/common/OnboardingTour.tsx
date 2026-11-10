import React from 'react';
import { PacoChatModal, openPacoChat, startOnboardingTour } from '../chat/PacoChatModal';

export { openPacoChat, startOnboardingTour };

export interface OnboardingTourProps {
  onNavigate?: (path: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onNavigate }) => {
  return <PacoChatModal onNavigate={onNavigate} />;
};
