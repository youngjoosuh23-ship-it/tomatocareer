import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-text-main font-semibold animate-pulse">{message}</p>
    </div>
  );
}

export function LoadingSpinner({ message }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-text-muted font-medium animate-pulse">{message}</p>
    </div>
  );
}
