import React from 'react';
import { Message } from '../types';
import CodeBlock from './CodeBlock';
import { BotIcon, UserIcon } from './Icons';

interface MessageBubbleProps {
  message: Message;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex space-x-1.5 items-center px-2 py-1">
    <span className="loading-dot bg-teal-400"></span>
    <span className="loading-dot bg-teal-400"></span>
    <span className="loading-dot bg-teal-400"></span>
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-pink-600 text-white self-end rounded-l-xl rounded-tr-xl shadow-lg'
    : 'bg-slate-700 text-slate-100 self-start rounded-r-xl rounded-tl-xl shadow-lg';
  
  const Icon = isUser ? UserIcon : BotIcon;
  const iconContainerClasses = isUser 
    ? "text-pink-200 bg-pink-700/70" 
    : "text-teal-400 bg-slate-800/90";

  return (
    <div className={`flex w-full mb-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-2.5 max-w-[90%] sm:max-w-[80%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className={`flex-shrink-0 p-1.5 rounded-full self-end ${iconContainerClasses} shadow-md`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
         {isUser && (
          <div className={`flex-shrink-0 p-1.5 rounded-full self-end ${iconContainerClasses} shadow-md`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div 
          className={`px-3.5 py-2.5 ${bubbleClasses} ${message.isError ? 'border border-red-500/70 bg-red-700/40 !text-red-200' : ''}`}
          aria-live="polite" 
          aria-atomic="true"
        >
          {message.isLoading && <LoadingIndicator />}
          {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>}
          {message.code && <CodeBlock code={message.code} />}
          {message.isError && !message.text && <p className="text-red-300">An error occurred.</p>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;