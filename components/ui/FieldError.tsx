'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string | null;
  error?: string | null;
  className?: string;
  id?: string;
}

export function FieldError({ message, error, className = '', id }: FieldErrorProps) {
  const text = message || error;
  if (!text) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`text-xs text-spend flex items-center gap-1.5 mt-1.5 font-medium ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
