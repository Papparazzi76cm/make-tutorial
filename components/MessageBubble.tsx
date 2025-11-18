import React from 'react';
import { Message, Sender, MessageImage } from '../types';
import { Bot, User, Terminal, ImageIcon, Loader2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;
  const isSystem = message.sender === Sender.SYSTEM;

  // Helper to render a single image block
  const renderImage = (imgData: MessageImage, key: string | number) => {
    return (
      <div key={key} className="my-4 w-full max-w-md mx-auto">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {imgData.url ? (
            <>
              <img 
                src={imgData.url} 
                alt={imgData.prompt} 
                className="w-full h-auto object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className="text-[10px] text-white/90 font-medium flex items-center">
                  <ImageIcon size={10} className="mr-1" />
                  Generado por AI
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 min-h-[160px]">
              {imgData.isLoading ? (
                <>
                  <Loader2 size={24} className="text-purple-600 animate-spin mb-2" />
                  <span className="text-xs text-slate-500 font-medium">Diseñando diagrama...</span>
                </>
              ) : (
                <span className="text-xs text-red-400 font-medium">Error generando imagen</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Advanced parser to handle code blocks, bold text AND interleaved images
  const renderContent = () => {
    const text = message.text;
    // Split by the image tag pattern, capturing the tag so we can replace it
    // Regex captures the full tag: [GENERAR_IMAGEN: prompt]
    const parts = text.split(/(\[GENERAR_IMAGEN:.*?\])/g);
    
    let imageIndexCounter = 0;

    return parts.map((part, partIndex) => {
      // Check if this part is an image tag
      const tagMatch = part.match(/\[GENERAR_IMAGEN: (.*?)\]/);
      
      if (tagMatch) {
        // Render the corresponding image from state
        const currentImageIndex = imageIndexCounter++;
        const imgData = message.images?.[currentImageIndex];
        
        if (imgData) {
          return renderImage(imgData, `img-${partIndex}`);
        }
        return null; // Should not happen if state is synced
      }

      // If not a tag, render text (with code blocks and bold support)
      if (!part.trim()) return null;

      const codeParts = part.split(/(```[\s\S]*?```)/g);
      
      return (
        <span key={`text-${partIndex}`}>
          {codeParts.map((subPart, subIndex) => {
            if (subPart.startsWith('```') && subPart.endsWith('```')) {
              const content = subPart.slice(3, -3).replace(/^[a-z]+\n/, '');
              return (
                <div key={`code-${subIndex}`} className="my-3 rounded-md overflow-hidden border border-slate-700 bg-[#1e1e1e] text-slate-200 block">
                  <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-slate-700 text-xs text-slate-400">
                    <Terminal size={14} className="mr-2" />
                    <span>Snippet</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {content.trim()}
                  </pre>
                </div>
              );
            }
            
            // Bold text parsing
            return (
              <span key={`sub-${subIndex}`} className="whitespace-pre-wrap">
                {subPart.split(/(\*\*.*?\*\*)/g).map((boldPart, boldIndex) => {
                  if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                    return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
                  }
                  return boldPart;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        
        <div className={`flex ${isBot ? 'flex-row' : 'flex-row-reverse'} w-full`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${isBot ? 'bg-purple-600 mr-3' : 'bg-slate-700 ml-3'}`}>
            {isBot ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
          </div>

          {/* Bubble Content */}
          <div 
            className={`relative px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm overflow-hidden w-full
              ${isBot 
                ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' 
                : 'bg-purple-600 text-white rounded-tr-none border border-purple-600'
              }
            `}
          >
            {renderContent()}
            
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-purple-400 animate-pulse"></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;