import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceModal from './components/VoiceModal';
import { Message, Sender, Topic, MessageImage } from './types';
import { createChatSession, sendMessageStream, generateTutorialImage } from './services/geminiService';
import { LiveClient } from './services/liveClient';
import { GenerateContentResponse, Chat, Content } from '@google/genai';

const STORAGE_KEY_MESSAGES = 'make_master_messages';
const STORAGE_KEY_TOPIC = 'make_master_active_topic';

function App() {
  // Lazy load state from localStorage
  const [activeTopicId, setActiveTopicId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_TOPIC);
    }
    return null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lazy load messages and ensure no "stuck" loading states
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) {
        try {
          const parsed: Message[] = JSON.parse(saved);
          // Ensure compatibility with new structure
          return parsed.map(msg => ({ 
            ...msg, 
            isStreaming: false, 
            images: msg.images || [] 
          }));
        } catch (e) {
          console.error("Error parsing saved messages", e);
          return [];
        }
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Voice State
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [voiceVolume, setVoiceVolume] = useState(0);
  
  // Refs
  const chatSessionRef = useRef<Chat | null>(null);
  const liveClientRef = useRef<LiveClient | null>(null);

  // Helper to convert UI messages to Gemini History
  const getHistoryFromMessages = (msgs: Message[]): Content[] => {
    const history: Content[] = [];
    let lastRole = '';

    const chatMsgs = msgs.filter(m => m.sender !== Sender.SYSTEM);

    chatMsgs.forEach(msg => {
      const role = msg.sender === Sender.USER ? 'user' : 'model';
      // Remove tags from history to prevent model confusion in future context
      const cleanText = msg.text.replace(/\[GENERAR_IMAGEN:.*?\]/g, '').trim();
      
      if (cleanText) {
        if (history.length > 0 && lastRole === role) {
          history[history.length - 1].parts[0].text += `\n\n${cleanText}`;
        } else {
          history.push({
            role: role,
            parts: [{ text: cleanText }]
          });
        }
        lastRole = role;
      }
    });

    if (history.length > 0 && history[history.length - 1].role === 'user') {
      history.pop();
    }

    return history;
  };

  // Initialize Text Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const history = getHistoryFromMessages(messages);
        chatSessionRef.current = createChatSession(history);
      } catch (e) {
        console.error("Failed to initialize chat session", e);
      }
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Voice Client Ref
  useEffect(() => {
    liveClientRef.current = new LiveClient({
      onConnect: () => setVoiceStatus('active'),
      onDisconnect: () => {
        setVoiceStatus('connecting'); // Reset for next time
        setIsVoiceOpen(false);
      },
      onError: (err) => {
        console.error("Voice Error", err);
        setVoiceStatus('error');
        setTimeout(() => setIsVoiceOpen(false), 3000);
      },
      onVolumeChange: (vol) => setVoiceVolume(vol)
    });

    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  // Storage Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeTopicId) {
      localStorage.setItem(STORAGE_KEY_TOPIC, activeTopicId);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOPIC);
    }
  }, [activeTopicId]);

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSelectTopic = async (topic: Topic) => {
    setActiveTopicId(topic.id);
    const systemMsg: Message = {
      id: Date.now().toString(),
      text: `Tema seleccionado: ${topic.title}`,
      sender: Sender.SYSTEM,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, systemMsg]);
    await handleSendMessage(topic.initialPrompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveTopicId(null);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_TOPIC);
    chatSessionRef.current = createChatSession();
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: Sender.USER,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        const history = getHistoryFromMessages(messages);
        chatSessionRef.current = createChatSession(history);
      }

      const botMsgId = (Date.now() + 1).toString();
      const botPlaceholder: Message = {
        id: botMsgId,
        text: '',
        sender: Sender.BOT,
        timestamp: Date.now(),
        isStreaming: true,
        images: []
      };
      setMessages(prev => [...prev, botPlaceholder]);

      const stream = await sendMessageStream(chatSessionRef.current, text);
      
      let accumulatedText = '';

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        accumulatedText += chunkText;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: accumulatedText } 
            : msg
        ));
      }

      // Post-stream processing: Find ALL image tags
      // matchAll returns iterator, convert to array
      const matches = Array.from(accumulatedText.matchAll(/\[GENERAR_IMAGEN: (.*?)\]/g));
      
      // Initialize images state if matches found
      if (matches.length > 0) {
        const initialImages: MessageImage[] = matches.map(m => ({
          prompt: m[1],
          isLoading: true
        }));

        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, isStreaming: false, images: initialImages } 
            : msg
        ));

        // Trigger generations in parallel
        matches.forEach((match, index) => {
          generateTutorialImage(match[1]).then(base64 => {
            setMessages(prev => prev.map(msg => {
              if (msg.id === botMsgId) {
                const updatedImages = [...(msg.images || [])];
                // Update the specific image slot
                if (updatedImages[index]) {
                  updatedImages[index] = {
                    ...updatedImages[index],
                    isLoading: false,
                    url: base64 ? `data:image/jpeg;base64,${base64}` : undefined
                  };
                }
                return { ...msg, images: updatedImages };
              }
              return msg;
            }));
          });
        });
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
        ));
      }

    } catch (error) {
      console.error("Error in chat:", error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        text: "Lo siento, hubo un error al conectar con el servicio de IA. Por favor intenta de nuevo.",
        sender: Sender.SYSTEM,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setMessages(prev => prev.filter(msg => !(msg.sender === Sender.BOT && msg.isStreaming && !msg.text)));
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Handlers
  const handleStartVoice = async () => {
    setVoiceStatus('connecting');
    setIsVoiceOpen(true);
    await liveClientRef.current?.connect();
  };

  const handleEndVoice = async () => {
    await liveClientRef.current?.disconnect();
    setIsVoiceOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen}
        toggleSidebar={handleToggleSidebar}
        activeTopicId={activeTopicId}
        onSelectTopic={handleSelectTopic}
      />
      
      <ChatArea 
        messages={messages}
        onSendMessage={(text) => handleSendMessage(text)}
        isLoading={isLoading}
        onToggleSidebar={handleToggleSidebar}
        onClearChat={handleClearChat}
        onStartVoice={handleStartVoice}
      />

      <VoiceModal 
        isOpen={isVoiceOpen}
        onClose={handleEndVoice}
        volume={voiceVolume}
        status={voiceStatus}
      />
    </div>
  );
}

export default App;