import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Bot, User, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatEnergyData } from './ChatEnergyData';
import { ActionButton } from '@/hooks/useChat';

interface ChatMessageProps {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  dataVisualizations?: Array<{
    type: 'consumption' | 'production' | 'efficiency';
    title: string;
  }>;
  actionButtons?: ActionButton[];
}

export function ChatMessage({
  role,
  content,
  timestamp,
  dataVisualizations,
  actionButtons,
}: ChatMessageProps) {
  const handleActionClick = (button: ActionButton) => {
    if (button.url) {
      window.open(button.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (button.targetSection === 'trigger-tutorial') {
      window.dispatchEvent(new CustomEvent('openSmartGridTutorial'));
      return;
    }

    // Dispatch global navigation event to Index.tsx
    window.dispatchEvent(
      new CustomEvent('navigateToSection', {
        detail: {
          tab: button.targetTab,
          section: button.targetSection,
        },
      })
    );
  };

  return (
    <div className={`flex gap-3 ${role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
      <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
        {role === 'assistant' ? (
          <>
            <AvatarImage src="/lovable-uploads/045f69f0-5424-4c58-a887-6e9e984d428b.png" />
            <AvatarFallback>
              <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback>
            <User className="h-4 w-4 md:h-5 md:w-5" />
          </AvatarFallback>
        )}
      </Avatar>
      <div
        className={`flex flex-col gap-2 max-w-[88%] md:max-w-[80%] ${
          role === 'assistant' ? 'items-start' : 'items-end'
        }`}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl px-4 py-2.5 ${
            role === 'assistant'
              ? 'bg-card text-card-foreground shadow-sm border'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{content}</p>

          {/* DATA VISUALIZATIONS */}
          {dataVisualizations?.map((viz, index) => (
            <div key={index} className="mt-3">
              <ChatEnergyData dataType={viz.type} title={viz.title} />
            </div>
          ))}

          {/* INTERACTIVE ACTION BUTTONS */}
          {actionButtons && actionButtons.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-1.5">
              {actionButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(btn)}
                  className="h-7 text-xs px-2.5 gap-1.5 font-medium border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-foreground"
                >
                  <span>{btn.label}</span>
                  {btn.url ? (
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="w-3 h-3 text-primary" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </motion.div>
        <span className="text-xs text-muted-foreground px-1">{format(timestamp, 'HH:mm')}</span>
      </div>
    </div>
  );
}
