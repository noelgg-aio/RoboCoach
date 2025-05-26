import React, { useState, useEffect } from 'react';
import { XMarkIcon, BugIcon } from './Icons';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (errorText: string, userPrompt: string) => void;
  apiKeyAvailable: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, onSubmit, apiKeyAvailable }) => {
  const [errorText, setErrorText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorText('');
      setUserPrompt('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (errorText.trim() && apiKeyAvailable) {
      onSubmit(errorText.trim(), userPrompt.trim());
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-950 bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div 
        className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 opacity-100 ring-1 ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <BugIcon className="w-7 h-7 text-red-400" />
            <h2 id="error-modal-title" className="text-xl font-semibold text-slate-100">Analyze Roblox Error</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full -mr-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label="Close error analysis modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="error-text-area" className="block text-sm font-medium text-slate-300 mb-1.5">
              Paste Console Error Log <span className="text-red-400">*</span>
            </label>
            <textarea
              id="error-text-area"
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              placeholder="Paste the full error message from Roblox Studio's output here..."
              className="w-full h-40 p-3 bg-slate-700/70 text-slate-200 rounded-lg border border-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-y placeholder-slate-500 text-sm"
              required
              aria-required="true"
              disabled={!apiKeyAvailable}
            />
          </div>
          <div>
            <label htmlFor="user-prompt-error" className="block text-sm font-medium text-slate-300 mb-1.5">
              Optional: What were you trying to do? (or specific question)
            </label>
            <input
              id="user-prompt-error"
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., 'This error happens when I click the shop button.'"
              className="w-full p-3 bg-slate-700/70 text-slate-200 rounded-lg border border-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder-slate-500 text-sm"
              disabled={!apiKeyAvailable}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600/80 hover:bg-slate-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!errorText.trim() || !apiKeyAvailable}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:text-red-400/70 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center gap-2"
          >
            <BugIcon className="w-4 h-4" />
            Analyze Error
          </button>
        </div>
        {!apiKeyAvailable && (
             <p className="text-xs text-red-400 mt-3 text-center">API Key not available. Error analysis is disabled.</p>
        )}
      </div>
    </div>
  );
};

export default ErrorModal;