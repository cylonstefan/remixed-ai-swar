import React, { useState } from 'react';
import { TEAM_TEMPLATES } from '../data/templates';
import { Agent } from '../types';

interface TemplateProps {
  onSelect: (template: any) => void;
}

export const AgentTemplateManager: React.FC<TemplateProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 border border-white/10 rounded-2xl bg-black/40">
      <h3 className="text-white font-bold text-sm">Biblioteka szablonów</h3>
      {TEAM_TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-all"
        >
          <div className="text-white text-xs font-bold">{t.name}</div>
          <div className="text-slate-400 text-[10px]">{t.description}</div>
        </button>
      ))}
    </div>
  );
};
