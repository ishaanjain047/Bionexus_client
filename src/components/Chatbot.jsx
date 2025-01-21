import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Trash2,
  Clock,
  X,
  Menu,
  Loader2,
} from "lucide-react";
import BotMessage from "./BotMessage";

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-gray-400">Loading your conversations...</p>
    </div>
  </div>
);

const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-800">
        <h3 className="text-xl font-semibold text-gray-100 mb-2">Clear Chat</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to clear the current chat? This action cannot be
          undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>
    </>
  );
};

const ChatHistory = ({ history, onChatSelect, onNewChat }) => (
  <div className="w-80 bg-[#141414] border-r border-gray-800 flex flex-col">
    <div className="p-4 border-b border-gray-800 flex flex-col gap-4 bg-[#1a1a1a]">
      <div className="flex items-center space-x-2">
        <Clock className="text-gray-400" size={20} />
        <h2 className="font-semibold text-gray-200">Chat History</h2>
      </div>
      <button
        onClick={onNewChat}
        className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <MessageCircle size={18} />
        <span>New Chat</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      {history.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onChatSelect(chat)}
          className="w-full p-4 text-left hover:bg-[#1a1a1a] border-b border-gray-800 transition-colors group"
        >
          <div className="text-sm font-medium text-gray-300 mb-1 group-hover:text-white">
            {formatDate(chat.timestamp)}
          </div>
          <div className="text-xs text-gray-400 line-clamp-2 group-hover:text-gray-300">
            {chat.title}
          </div>
        </button>
      ))}
      {history.length === 0 && (
        <div className="p-6 text-gray-400 text-sm text-center">
          No chat history yet
        </div>
      )}
    </div>
  </div>
);

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch(
          "https://renaiscent-bionexus.onrender.com/api/query",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: input,
              max_results: 5,
              min_confidence: 0.3,
              include_details: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMessages((prev) => [...prev, { text: data, sender: "bot" }]);
      } catch (error) {
        console.error("Error calling API:", error);
        setMessages((prev) => [
          ...prev,
          {
            text: "Sorry, I encountered an error while processing your request. Please try again.",
            sender: "bot",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
  };

  const startNewChat = () => {
    // Save current chat if it has messages beyond welcome message
    if (messages.length > 1) {
      const chatSession = {
        id: currentChatId,
        timestamp: new Date().toISOString(),
        messages: messages,
        title: messages[1]?.text?.slice(0, 30) + "..." || "New Chat",
      };

      const updatedHistory = [
        chatSession,
        ...chatHistory.filter((chat) => chat.id !== currentChatId),
      ].slice(0, 10);

      setChatHistory(updatedHistory);
      localStorage.setItem("chatSessions", JSON.stringify(updatedHistory));
    }

    // Start new chat
    setMessages([
      {
        text: "💊 Hello! How can I help you today?",
        sender: "bot",
      },
    ]);
    setCurrentChatId(Date.now());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      setChatHistory(JSON.parse(savedSessions));
    }

    // Initialize with welcome message if no messages
    if (messages.length === 0) {
      setMessages([
        {
          text: "💊 Hello! How can I help you today?",
          sender: "bot",
        },
      ]);
    }

    // Simulate initial loading
    setTimeout(() => setIsInitialLoading(false), 1500);
  }, []);

  return (
    <>
      {isInitialLoading && <LoadingScreen />}
      <div className="fixed inset-0 bg-[#0a0a0a] text-gray-100 overflow-hidden flex">
        <ChatHistory
          history={chatHistory}
          onChatSelect={loadChat}
          onNewChat={startNewChat}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="bg-[#141414] border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="text-blue-500" size={24} />
              <h1 className="text-lg font-semibold text-gray-100">
                Renaiscent BioNexus
              </h1>
            </div>
            <button
              onClick={() => messages.length > 1 && setShowDeleteModal(true)}
              className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Clear current chat"
              disabled={messages.length <= 1}
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <BotMessage key={index} message={message} isLoading={false} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-lg px-4 py-2.5 bg-[#1a1a1a] text-gray-100 border border-gray-800">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-[#141414] border-t border-gray-800 p-4">
            <div className="max-w-4xl mx-auto relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full bg-[#1a1a1a] text-gray-100 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800 placeholder-gray-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setMessages([
            {
              text: "💊 Hello! How can I help you today?",
              sender: "bot",
            },
          ]);
          setShowDeleteModal(false);
        }}
      />
    </>
  );
};

export default Chatbot;
