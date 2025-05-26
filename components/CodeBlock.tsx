import React, { useState, useEffect, useRef } from 'react';
import { CopyIcon } from './Icons';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'lua' }) => {
  const [copied, setCopied] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setShowCopiedTooltip(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        setShowCopiedTooltip(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);


  return (
    <div className="bg-slate-800/70 rounded-lg my-2 relative group shadow-inner">
      <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-600/70">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="relative text-slate-400 hover:text-pink-400 transition-colors text-xs p-1 rounded flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
          aria-label="Copy code to clipboard"
        >
          <CopyIcon className="w-4 h-4" />
          <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
           {showCopiedTooltip && (
            <span className="absolute -top-8 right-0 bg-slate-950 text-white text-xs px-2 py-1 rounded-md shadow-lg transition-opacity duration-200 opacity-100">
              Copied!
            </span>
          )}
        </button>
      </div>
      <pre className="p-3 text-sm overflow-x-auto text-slate-200 max-h-96">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;