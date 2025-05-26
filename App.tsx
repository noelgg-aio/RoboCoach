import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import { Chat, Message } from './types';
import { generateChatName, processUserPrompt } from './services/geminiService';
import { API_KEY, NEW_CHAT_ROBOCOACH_WELCOME }  from './constants';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyAvailable] = useState<boolean>(!!API_KEY);


  // Load chats from localStorage on initial render
  useEffect(() => {
    const storedChats = localStorage.getItem('robocoach-chats');
    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats);
        setChats(parsedChats);
        const lastActiveChatId = localStorage.getItem('robocoach-last-active-chat-id');
        if (lastActiveChatId && parsedChats.find((c:Chat) => c.id === lastActiveChatId)) {
            setActiveChatId(lastActiveChatId);
        } else if (parsedChats.length > 0) {
            setActiveChatId(parsedChats[0].id);
        }
      } catch (error) {
        console.error("Failed to parse chats from localStorage", error);
        setChats([]);
      }
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
        localStorage.setItem('robocoach-chats', JSON.stringify(chats));
    } else {
        localStorage.removeItem('robocoach-chats'); 
    }
  }, [chats]);

  // Save last active chat ID
  useEffect(() => {
    if (activeChatId) {
        localStorage.setItem('robocoach-last-active-chat-id', activeChatId);
    } else {
        localStorage.removeItem('robocoach-last-active-chat-id');
    }
  }, [activeChatId]);


  const handleCreateNewChat = () => {
    if (!apiKeyAvailable) return;
    const newChatId = Date.now().toString() + Math.random().toString(36).substring(2,9);
    
    const welcomeMessage: Message = {
      id: `${newChatId}-welcome`,
      sender: 'ai',
      text: NEW_CHAT_ROBOCOACH_WELCOME,
      timestamp: Date.now(),
      isLoading: false,
      isError: false,
    };
    
    const newChat: Chat = {
      id: newChatId,
      name: 'New Scripting Chat', 
      messages: [welcomeMessage],
      createdAt: Date.now(),
    };
    setChats((prevChats) => [newChat, ...prevChats]);
    setActiveChatId(newChatId);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (chatIdToDelete: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatIdToDelete));
    if (activeChatId === chatIdToDelete) {
      const remainingChats = chats.filter((chat) => chat.id !== chatIdToDelete);
      setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const handleSendMessage = useCallback(async (messageText: string, isErrorAnalysis: boolean = false) => {
    if (!activeChatId || !apiKeyAvailable) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setIsLoading(true);

    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat && (currentChat.messages.filter(m => m.sender === 'user').length === 0 || (isErrorAnalysis && currentChat.name === 'New Scripting Chat'))) { 
      const namePrompt = isErrorAnalysis ? "Error Analysis Session" : messageText;
      const chatName = isErrorAnalysis ? "Error Analysis" : await generateChatName(namePrompt);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId ? { ...chat, name: chatName } : chat
        )
      );
    }
    
    const chatHistory = currentChat?.messages.filter(m => m.id !== userMessage.id) || []; 
    
    const aiResponses = await processUserPrompt(messageText, chatHistory);

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, ...aiResponses] }
          : chat
      )
    );
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, chats, apiKeyAvailable]);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
         <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onCreateNewChat={handleCreateNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            apiKeyAvailable={apiKeyAvailable}
        />
      </div>
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatView
          chat={activeChat || null}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          apiKeyAvailable={apiKeyAvailable}
        />
      </main>
    </div>
  );
};

export default App;