import React, { useState } from 'react';
import { Chat } from '../types';
import { PlusIcon, TrashIcon, BotIcon } from './Icons';
import { APP_NAME } from '../constants';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onCreateNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  apiKeyAvailable: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onCreateNewChat,
  onSelectChat,
  onDeleteChat,
  apiKeyAvailable,
}) => {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  return (
    <div className="w-full md:w-72 bg-slate-800 h-full flex flex-col p-4 border-r border-slate-700 shadow-lg">
      <div className="flex items-center gap-3 mb-6 px-1 pt-1">
         <BotIcon className="w-9 h-9 text-pink-500" />
         <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{APP_NAME}</h1>
      </div>

      <button
        onClick={onCreateNewChat}
        disabled={!apiKeyAvailable}
        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 mb-6 text-sm shadow-md hover:shadow-lg disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-label="Start a new chat with RoboCoach"
      >
        <PlusIcon className="w-5 h-5" />
        New Chat
      </button>

      {!apiKeyAvailable && (
         <div className="bg-red-700/40 border border-red-600/70 text-red-300 px-3 py-2.5 rounded-lg text-xs mb-4 shadow">
            API Key not configured. Chat functionality is disabled.
        </div>
      )}

      <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 -mr-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            onMouseEnter={() => setHoveredChatId(chat.id)}
            onMouseLeave={() => setHoveredChatId(null)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 group relative ${
              activeChatId === chat.id
                ? 'bg-pink-600 text-white font-semibold shadow-md ring-1 ring-pink-500'
                : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
            role="button"
            tabIndex={0}
            aria-current={activeChatId === chat.id ? "page" : undefined}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm truncate pr-2">{chat.name}</span>
              {(hoveredChatId === chat.id || activeChatId === chat.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className={`p-1 rounded-md ${ activeChatId === chat.id ? 'text-pink-100 hover:bg-pink-500/60 hover:text-white' : 'text-slate-400 hover:bg-red-500/30 hover:text-red-300'} opacity-80 group-hover:opacity-100 transition-all`}
                  aria-label={`Delete chat: ${chat.name}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;