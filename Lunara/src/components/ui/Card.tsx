import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sage' | 'olive';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
  const baseStyles = 'rounded-2xl p-6 shadow-[var(--dash-card-shadow)] border border-dash-border';
  const variantStyles = {
    default: 'bg-dash-card',
    sage: 'bg-sage',
    olive: 'bg-olive',
  };

  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>{children}</div>;
};
