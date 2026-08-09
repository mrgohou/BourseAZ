import React from 'react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };

  return (
    <div className={`p-4 rounded-xl border ${styles[type]} text-sm ${className}`} role="alert">
      {title && <div className="font-bold mb-1">{title}</div>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
};
