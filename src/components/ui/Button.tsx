import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'orange' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  // Material Design 3 Pill Shape & Interaction State Layers
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer active:scale-[0.99]';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs font-semibold gap-1.5',
    md: 'h-10 px-4 text-xs sm:text-sm font-semibold gap-2',
    lg: 'h-11 px-5 text-sm sm:text-base font-semibold gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-xs hover:shadow-md shadow-emerald-600/20 dark:shadow-none',
    secondary: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/90 focus:ring-emerald-500',
    outline: 'border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus:ring-emerald-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus:ring-slate-400',
    orange: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-xs hover:shadow-md shadow-amber-500/20',
    blue: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-xs hover:shadow-md shadow-indigo-600/20',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

