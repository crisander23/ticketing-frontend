// components/ui/Input.js
'use client';

import React from 'react';

/**
 * Props:
 * - variant: 'default' | 'glass'
 * - startIcon: React component (e.g., Mail from lucide-react)
 * - endAdornment: React node (e.g., a button for show/hide)
 * - error: string | boolean (adds error styles)
 */
export default function Input({
  variant = 'default',
  startIcon: StartIcon,
  endAdornment,
  error = false,
  className = '',
  ...props
}) {
  const base =
    'w-full rounded-lg text-sm outline-none transition ' +
    'focus:ring-2 focus:ring-indigo-300/40';

  const variants = {
    default:
      'bg-white text-gray-900 border border-[var(--line, rgba(0,0,0,0.08))] ' +
      'placeholder:text-gray-400',
    glass:
      'bg-white/8 text-white border border-white/15 placeholder:text-white/40 ' +
      'backdrop-blur focus:border-indigo-300/50',
  };

  const errorCls =
    error
      ? 'border-rose-400/70 focus:ring-rose-300/40'
      : '';

  const padding = StartIcon ? 'pl-10 pr-10' : 'px-3';
  const rightPad = endAdornment ? 'pr-10' : '';

  return (
    <div className={`relative ${className}`}>
      {StartIcon && (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <StartIcon className={variant === 'glass' ? 'h-4 w-4 text-white/60' : 'h-4 w-4 text-gray-500'} />
        </div>
      )}

      <input
        className={`${base} ${variants[variant]} ${errorCls} py-2.5 ${padding} ${rightPad}`}
        {...props}
      />

      {endAdornment && (
        <div className="absolute inset-y-0 right-1.5 flex items-center">
          {endAdornment}
        </div>
      )}
    </div>
  );
}
