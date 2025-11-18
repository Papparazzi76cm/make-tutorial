import React, { useEffect, useState } from 'react';
import { Mic, X, Volume2 } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number; // 0 to 1
  status: 'connecting' | 'active' | 'error';
}

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, volume, status }) => {
  const [bars, setBars] = useState<number[]>(new Array(5).fill(10));

  // Simulate visualizer bars based on single volume input
  useEffect(() => {
    if (!isOpen) return;
    
    const updateBars = () => {
      const newBars = bars.map(() => {
        // Randomize around the volume level
        const baseHeight = Math.max(10, volume * 100);
        const variation = Math.random() * 20 - 10;
        return Math.max(4, Math.min(100, baseHeight + variation));
      });
      setBars(newBars);
    };

    const interval = setInterval(updateBars, 50);
    return () => clearInterval(interval);
  }, [isOpen, volume]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8 mt-4">
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center
            ${status === 'connecting' ? 'bg-yellow-100 animate-pulse' : 
              status === 'error' ? 'bg-red-100' : 'bg-purple-100'}
          `}>
            {status === 'connecting' ? (
              <Volume2 size={40} className="text-yellow-600 opacity-50" />
            ) : (
              <Mic size={40} className={`
                ${status === 'error' ? 'text-red-600' : 'text-purple-600'}
              `} />
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {status === 'connecting' ? 'Conectando...' : 
           status === 'error' ? 'Error de conexión' : 'Escuchando...'}
        </h3>
        
        <p className="text-slate-500 text-sm text-center mb-8">
          {status === 'connecting' ? 'Estableciendo conexión con Gemini Live...' :
           status === 'error' ? 'Por favor intenta de nuevo.' :
           'Habla naturalmente para conversar.'}
        </p>

        {/* Visualizer */}
        {status === 'active' && (
          <div className="flex items-center justify-center space-x-2 h-16 mb-6">
            {bars.map((height, i) => (
              <div 
                key={i}
                className="w-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded-full transition-all duration-75 ease-out"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="bg-slate-900 text-white font-medium py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-transform hover:scale-105 active:scale-95 w-full"
        >
          Terminar Llamada
        </button>
      </div>
    </div>
  );
};

export default VoiceModal;