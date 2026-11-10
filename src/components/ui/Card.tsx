import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'elevated',
}) => {
  const variantStyles = {
    elevated: 'bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 shadow-xs hover:shadow-md',
    outlined: 'bg-white dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-700/80 shadow-none',
    filled: 'bg-slate-100/80 dark:bg-slate-800/60 border border-transparent shadow-none',
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} rounded-3xl p-5 sm:p-6 transition-all duration-200 ease-out ${
        hoverable ? 'hover:border-emerald-500/60 dark:hover:border-emerald-500/60 cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200',
    warning: 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200',
    error: 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200',
    success: 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200',
  };

  return (
    <div className={`p-4 rounded-2xl border ${styles[type]} text-xs sm:text-sm ${className}`} role="alert">
      {title && <div className="font-bold mb-1">{title}</div>}
      <div className="leading-relaxed font-medium">{children}</div>
    </div>
  );
};

