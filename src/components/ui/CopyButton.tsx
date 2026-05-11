import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label: string;
  copiedLabel: string;
}

export function CopyButton({ text, label, copiedLabel }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text-muted hover:text-accent bg-slate-100 hover:bg-accent/10 rounded-lg transition-all"
    >
      {copied ? <Check size={11} className="text-success-theme" /> : <Copy size={11} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
