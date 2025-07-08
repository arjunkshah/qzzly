import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'session' | 'file' | 'chat';
  currentUsage: number;
  limit: number;
}

const PaywallModal = () => <></>;
export default PaywallModal; 