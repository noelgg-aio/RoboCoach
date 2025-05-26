import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '../types';
import MessageBubble from './MessageBubble';
import ErrorModal from './ErrorModal'; // Import the new modal
import { SendIcon, BotIcon, BugIcon } from './Icons'; 
import { INITIAL_WELCOME_MESSAGE, APP_NAME } from '../constants';

interface ChatViewProps {
  chat: Chat | null;
  isLoading: boolean;
  onSendMessage: (messageText: string, isErrorAnalysis?: boolean) => void;
  apiKeyAvailable: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ chat, isLoading, onSendMessage, apiKeyAvailable }) => {
  const [input, setInput] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chat?.messages, isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading && apiKeyAvailable) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`; // max-h-32
  };

  useEffect(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea#chat-input-area'); 
    if (textarea) {
      adjustTextareaHeight(textarea);
    }
  }, [input]);

  const handleOpenErrorModal = () => {
    if (apiKeyAvailable) {
      setIsErrorModalOpen(true);
    }
  };

  const handleSubmitErrorAnalysis = (errorText: string, userPrompt: string) => {
    let fullMessage = "User Query: ";
    if (userPrompt) {
      fullMessage += `${userPrompt}\n\n`;
    } else {
      fullMessage += `(No specific query provided with the error)\n\n`;
    }
    fullMessage += `Error Log:\n\`\`\`\n${errorText}\n\`\`\`\n\nPlease analyze this Roblox Lua error.`;
    onSendMessage(fullMessage, true);
  };

  if (!apiKeyAvailable && !chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <BotIcon className="w-16 h-16 text-pink-600 mb-6 opacity-70" />
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">{APP_NAME}</h2>
        <p className="text-slate-400 max-w-md">API Key not configured. Please set the <code className="bg-slate-700 px-1 py-0.5 rounded text-sm text-pink-400">API_KEY</code> environment variable to enable RoboCoach.</p>
      </div>
    );
  }
  
  if (!chat) {
    const welcomeParts = INITIAL_WELCOME_MESSAGE.split('!');
    const mainWelcome = welcomeParts.length > 0 ? welcomeParts[0] + '!' : INITIAL_WELCOME_MESSAGE;
    const subWelcome = welcomeParts.slice(1).join('!').trim();

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <BotIcon className="w-16 h-16 text-pink-500 mb-6 opacity-70" />
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">{mainWelcome}</h2>
        {subWelcome && <p className="text-slate-400 max-w-md mb-1">{subWelcome}</p>}
        <p className="text-slate-500 mt-3 text-sm">Create a new chat or use the 'Analyze Error' button to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      <div className="p-4 border-b border-slate-700/70 bg-slate-800/80 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-100 truncate" title={chat.name}>{chat.name}</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && chat.messages[chat.messages.length-1]?.sender === 'user' && (
             <MessageBubble key="loading" message={{id: 'loading', sender: 'ai', timestamp: Date.now(), isLoading: true}} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 border-t border-slate-700/70 bg-slate-800/80">
        <div className="flex items-end bg-slate-700/60 rounded-xl p-1.5 shadow-md focus-within:ring-2 focus-within:ring-pink-500 transition-shadow">
          <textarea
            id="chat-input-area"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight(e.target as HTMLTextAreaElement);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ask RoboCoach anything about Roblox Lua..."
            className="flex-grow bg-transparent p-3 text-slate-100 placeholder-slate-400 focus:outline-none resize-none min-h-[3rem] max-h-32 leading-snug"
            rows={1}
            disabled={isLoading || !apiKeyAvailable}
            aria-label="Chat input for RoboCoach"
          />
          <button
            onClick={handleOpenErrorModal}
            disabled={isLoading || !apiKeyAvailable}
            className="p-3 text-teal-400 hover:text-teal-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-slate-700/60"
            aria-label="Analyze Roblox Error"
            title="Analyze Roblox Error"
          >
            <BugIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !apiKeyAvailable}
            className="p-3 text-pink-500 hover:text-pink-400 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:ring-offset-slate-700/60"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <ErrorModal 
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        onSubmit={handleSubmitErrorAnalysis}
        apiKeyAvailable={apiKeyAvailable}
      />
    </div>
  );
};

export default ChatView;