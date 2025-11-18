import React, { useRef, useEffect, useState } from 'react';
import { Message, Sender } from '../types';
import MessageBubble from './MessageBubble';
import { Send, Menu, Loader2, Eraser, Mic } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onClearChat: () => void;
  onStartVoice: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isLoading, onToggleSidebar, onClearChat, onStartVoice }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
        <div className="flex items-center">
          <button 
            onClick={onToggleSidebar}
            className="mr-4 p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-600"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            Asistente Virtual
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onStartVoice}
            className="flex items-center text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors px-3 py-1.5 rounded-md font-medium border border-purple-200"
            title="Iniciar conversación de voz"
          >
            <Mic size={14} className="mr-1.5" />
            Modo Voz
          </button>
          <button 
            onClick={onClearChat}
            className="flex items-center text-xs text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
            title="Limpiar conversación"
          >
            <Eraser size={14} className="mr-1.5" />
            Limpiar
          </button>
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Send size={24} className="text-slate-300 ml-1" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">¡Bienvenido a MakeMaster!</h3>
              <p className="max-w-md">
                Selecciona un tema del menú lateral o escribe tu duda sobre Make (Integromat) para comenzar.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta sobre Make aquí..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl pl-4 pr-14 py-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm md:text-base max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="absolute right-2 bottom-2.5 flex items-center space-x-1">
             {/* Secondary Mic Button inside input area for convenience */}
            {!inputText.trim() && (
              <button
                onClick={onStartVoice}
                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Hablar"
              >
                <Mic size={20} />
              </button>
            )}
            
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`
                p-2 rounded-lg transition-all duration-200 flex items-center justify-center
                ${inputText.trim() && !isLoading 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className={inputText.trim() ? 'ml-0.5' : ''} />
              )}
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">La IA puede cometer errores. Verifica la información importante.</p>
        </div>
      </div>
    </main>
  );
};

export default ChatArea;