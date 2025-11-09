import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Đang tải dữ liệu...' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
    <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
    <div className="flex items-center justify-center mb-4 text-gray-400">
      {icon ?? <AlertCircle className="w-12 h-12" />}
    </div>
    <h4 className="text-lg font-semibold text-gray-700 mb-1">{title}</h4>
    {description && <p className="text-sm text-gray-500">{description}</p>}
  </div>
);
