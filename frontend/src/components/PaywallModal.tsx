import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'session' | 'file' | 'chat';
  currentUsage: number;
  limit: number;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  action,
  currentUsage,
  limit
}) => {
  const { updateSubscription } = useAuth();

  if (!isOpen) return null;

  const getActionText = () => {
    switch (action) {
      case 'session':
        return 'create a new study session';
      case 'file':
        return 'upload another file';
      case 'chat':
        return 'use chat mode';
      default:
        return 'perform this action';
    }
  };

  const getLimitText = () => {
    switch (action) {
      case 'session':
        return '1 session per month';
      case 'file':
        return '1 file per session';
      case 'chat':
        return 'chat mode not available';
      default:
        return 'limited';
    }
  };

  const handleUpgrade = async () => {
    try {
      const success = await updateSubscription('pro');
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Free Plan Limit Reached
            </h2>
            <p className="text-gray-600 mb-4">
              You've reached your free plan limit and cannot {getActionText()}.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Usage:</span>
              <span className="text-sm font-medium">{currentUsage} / {limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Free plan: {getLimitText()}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Pro</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Unlimited study sessions</li>
                <li>✓ Unlimited file uploads</li>
                <li>✓ Full chat mode access</li>
                <li>✓ File deletion and management</li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">$9.99/month</p>
              <p className="text-sm text-gray-600 mb-4">Cancel anytime</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
              <button
                onClick={onClose}
                className="w-full text-gray-600 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 