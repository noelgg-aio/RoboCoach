import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import { Chat, Message } from './types';
import { generateChatName, processUserPrompt } from './services/geminiService';
import { API_KEY, NEW_CHAT_ROBOCOACH_WELCOME }  from './constants';
import { isValidAccessKey, keysLastUpdated } from './services/accessKeys';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyAvailable] = useState<boolean>(!!API_KEY);
  const [accessKey, setAccessKey] = useState<string>("");
  const [isAccessKeyValid, setIsAccessKeyValid] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastKeyCheck, setLastKeyCheck] = useState<number>(0);

  // Check for saved access key in localStorage and validate it against current valid keys
  useEffect(() => {
    const validateSavedKey = () => {
      const savedKey = localStorage.getItem('robocoach-access-key');
      if (savedKey) {
        // Check if the saved key is still in the valid keys list
        if (isValidAccessKey(savedKey)) {
          setAccessKey(savedKey);
          setIsAccessKeyValid(true);
        } else {
          // If the key was removed from valid keys, clear it from localStorage
          localStorage.removeItem('robocoach-access-key');
          setAccessKey("");
          setIsAccessKeyValid(false);
          setKeyError("Your access key is no longer valid. Please enter a new key.");
        }
      }
      setLastKeyCheck(Date.now());
    };

    validateSavedKey();

    // Set up an interval to periodically check if keys have been updated
    const keyCheckInterval = setInterval(() => {
      // If keysLastUpdated is newer than our last check, revalidate
      if (keysLastUpdated > lastKeyCheck) {
        validateSavedKey();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(keyCheckInterval);
  }, [lastKeyCheck]);

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

  const handleAccessKeySubmit = () => {
    setIsSubmitting(true);
    setKeyError("");
    
    setTimeout(() => {
      if (isValidAccessKey(accessKey)) {
        setIsAccessKeyValid(true);
        localStorage.setItem('robocoach-access-key', accessKey);
      } else {
        setKeyError("Invalid Key!");
        setIsSubmitting(false);
      }
    }, 800); // Add a slight delay for animation effect
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAccessKeySubmit();
    }
  };

  // Access Key Entry UI
  if (!isAccessKeyValid) {
    return (
      <div className="flex h-screen w-screen bg-slate-900 text-slate-100 items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full transform transition-all duration-500 ease-in-out hover:shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-pink-500 text-transparent bg-clip-text">RoboCoach Access</h1>
          <p className="mb-6 text-slate-300 text-center">Please enter your access key to continue:</p>
          <div className="relative">
            <input
              type="text"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value);
                if (keyError) setKeyError("");
              }}
              onKeyPress={handleKeyPress}
              className={`w-full p-3 mb-2 bg-slate-700 border ${keyError ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="Enter access key"
              disabled={isSubmitting}
            />
            {keyError && (
              <p className="text-red-500 text-sm mb-4 font-medium animate-pulse">{keyError}</p>
            )}
          </div>
          <button
            onClick={handleAccessKeySubmit}
            disabled={isSubmitting || !accessKey.trim()}
            className={`w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform ${isSubmitting ? 'scale-95 opacity-90' : 'hover:scale-[1.02] hover:shadow-lg'} ${!accessKey.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    );
  }

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