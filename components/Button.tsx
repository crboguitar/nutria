
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  // Added size prop to support button sizing
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center font-black transition-all active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200",
    ghost: "text-emerald-600 hover:bg-emerald-50",
    outline: "border-2 border-emerald-600 text-emerald-600"
  };

  // Size variations
  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-4 text-sm",
    lg: "px-8 py-5 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};
