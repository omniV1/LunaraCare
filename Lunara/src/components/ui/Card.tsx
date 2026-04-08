/**
 * @module components/ui/Card
 * Themed container card used across dashboards, forms, and content sections.
 * Supports default, sage, and olive color variants.
 */
import React from 'react';

/** Props for {@link Card}. */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sage' | 'olive';
}

/** Renders a rounded, shadowed card container with theme-aware styling. */
export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
  const baseStyles = 'rounded-2xl p-6 shadow-[var(--dash-card-shadow)] border border-dash-border';
  const variantStyles = {
    default: 'bg-dash-card',
    sage: 'bg-sage',
    olive: 'bg-olive',
  };

  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>{children}</div>;
};
