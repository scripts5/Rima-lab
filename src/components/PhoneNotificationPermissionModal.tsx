import React from 'react';
import { AppPermissionsModal } from './AppPermissionsModal';

interface PhoneNotificationPermissionModalProps {
  currentStreak?: number;
}

export const PhoneNotificationPermissionModal: React.FC<PhoneNotificationPermissionModalProps> = ({
  currentStreak = 3,
}) => {
  return <AppPermissionsModal currentStreak={currentStreak} />;
};
