import React, { useState, useEffect } from 'react'; // Import useState and useEffect
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

// Adjust this value for typing speed (milliseconds per word)
const WORD_TYPING_SPEED_MS = 70; // Faster speed

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (isUser || !message.text || message.isLoading || message.isError) {
      // For user messages, or if no text, loading, or error, display instantly or reset
      setDisplayedText(message.text || '');
      return;
    }

    // Bot message typing animation
    setDisplayedText(''); // Reset for new message animation
    const words = message.text.split(' ');
    let currentWordIndex = 0;
    let constructedText = '';

    const timer = setInterval(() => {
      if (currentWordIndex < words.length) {
        constructedText += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
        setDisplayedText(constructedText);
        currentWordIndex++;
      } else {
        clearInterval(timer);
      }
    }, WORD_TYPING_SPEED_MS);

    return () => clearInterval(timer); // Cleanup on component unmount or if message changes
  }, [message.text, message.isLoading, message.isError, isUser]); // Rerun effect if these change

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
        {/* Icon rendering - no change here, but simplified for clarity */}
        {/* We can combine the icon rendering logic */}
        <div className={`flex-shrink-0 p-1.5 rounded-full self-end ${iconContainerClasses} shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div 
          className={`px-3.5 py-2.5 ${bubbleClasses} ${message.isError ? 'border border-red-500/70 bg-red-700/40 !text-red-200' : ''}`}
          aria-live={!isUser && !message.isLoading ? "polite" : undefined} // Announce changes for bot messages
          aria-atomic="true"
        >
          {message.isLoading && <LoadingIndicator />}
          
          {/* Text content: Use displayedText for animated bot messages, message.text for user messages */}
          {!message.isLoading && message.text && (
             <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
               {isUser ? message.text : displayedText}
             </p>
          )}
          
          {/* This condition was a bit complex, simplified if text is primary content */}
          {/* Original: (message.text || (!isUser && !message.isLoading && message.text !== undefined)) */}
          {/* Now handled by the more direct !message.isLoading && message.text condition above */}

          {message.code && <CodeBlock code={message.code} />}
          {message.isError && !message.text && <p className="text-red-300">An error occurred.</p>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;