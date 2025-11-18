import React from 'react';
import { CURRICULUM } from '../constants';
import { Topic } from '../types';
import { Zap, GitMerge, Globe, Database, Settings, Code, Box, Layers, GraduationCap, ChevronRight } from 'lucide-react';

interface SidebarProps {
  onSelectTopic: (topic: Topic) => void;
  activeTopicId: string | null;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  Zap, GitMerge, Globe, Database, Settings, Code, Box, Layers
};

const Sidebar: React.FC<SidebarProps> = ({ onSelectTopic, activeTopicId, isOpen, toggleSidebar }) => {
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-200 transform transition-transform duration-300 ease-in-out
        flex flex-col border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">MakeMaster</h1>
            <p className="text-xs text-slate-400">Tutor AI Interactivo</p>
          </div>
        </div>

        {/* Curriculum List */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Plan de Estudios
          </div>
          
          <nav className="space-y-1 px-2">
            {CURRICULUM.map((topic) => {
              const IconComponent = IconMap[topic.icon] || Zap;
              const isActive = activeTopicId === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    onSelectTopic(topic);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`
                    w-full flex items-center text-left px-3 py-3 rounded-lg transition-colors group relative
                    ${isActive 
                      ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
                    }
                  `}
                >
                  <div className={`mr-3 ${isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <IconComponent size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{topic.title}</div>
                    <div className="text-[10px] opacity-70 line-clamp-1">{topic.description}</div>
                  </div>
                  
                  {/* Difficulty Indicator */}
                  <div className={`
                    absolute right-2 top-2 w-2 h-2 rounded-full
                    ${topic.difficulty === 'Beginner' ? 'bg-green-500' : 
                      topic.difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'}
                  `} title={topic.difficulty}/>
                  
                  {isActive && <ChevronRight size={14} className="text-purple-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Potenciado por Gemini 2.0
          <br />
          Deploy: Hostinger
        </div>
      </aside>
    </>
  );
};

export default Sidebar;