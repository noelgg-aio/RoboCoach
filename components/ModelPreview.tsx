import React from 'react';
import { DownloadIcon } from './Icons';

interface ModelPreviewProps {
  imageUrl: string;
  fileName: string;
  promptText?: string;
}

const ModelPreview: React.FC<ModelPreviewProps> = ({ imageUrl, fileName, promptText }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-2.5 p-3 bg-gray-800/60 rounded-lg shadow">
      {promptText && <p className="text-xs text-gray-400 mb-2 italic">Model for: "{promptText}"</p>}
      <img 
        src={imageUrl} 
        alt={promptText ? `Preview for ${promptText}` : 'Generated 3D model preview'} 
        className="rounded-md max-w-xs sm:max-w-sm md:max-w-md mx-auto shadow-lg border border-gray-700/50" 
      />
      <button
        onClick={handleDownload}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        aria-label={`Download ${fileName} (PNG image)`}
      >
        <DownloadIcon className="w-4 h-4" />
        Download PNG
      </button>
    </div>
  );
};

export default ModelPreview;