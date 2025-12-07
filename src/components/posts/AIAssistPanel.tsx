import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type AIAssistPanelProps = {
  currentCaption: string;
  onReplace: (suggestion: string) => void;
};

const generateDemoSuggestion = (type: string, caption: string): string[] => {
  const base = caption || 'Amazing product! Get yours today.';
  
  switch (type) {
    case 'improve':
      return [
        `${base} ✨ Premium quality guaranteed!`,
        `${base} Don't miss out on this deal! 🔥`,
        `${base} Limited stock available - order now!`,
      ];
    case 'shorter':
      return [
        base.split('.')[0] + '! 🎯',
        'Quick deal! ' + base.slice(0, 50) + '...',
        base.slice(0, 60) + '! DM to order.',
      ];
    case 'catchy':
      return [
        `🔥 ${base} 💯 Don't sleep on this!`,
        `🎉 ${base} ⚡ Get it before it's gone!`,
        `✨ ${base} 🚀 Order yours now!`,
      ];
    case 'fr':
      return [
        'Produit de qualité supérieure! Commandez maintenant. 🇫🇷',
        'Ne ratez pas cette offre incroyable! 💫',
        'Stock limité - contactez-nous vite! 📱',
      ];
    case 'pidgin':
      return [
        'Quality tin for here! No dull yourself, come buy! 😎',
        'E sweet pass! Better price, better quality. 💯',
        'Waka come! Limited stock dey here. 🔥',
      ];
    default:
      return [base];
  }
};

export const AIAssistPanel = ({ currentCaption, onReplace }: AIAssistPanelProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const isDemoMode = !import.meta.env.VITE_AI_ENDPOINT || !import.meta.env.VITE_AI_KEY;

  const handleGenerate = async (type: string) => {
    setLoading(true);
    setActiveType(type);
    
    // Demo mode - instant suggestions
    await new Promise(resolve => setTimeout(resolve, 600));
    const demoSuggestions = generateDemoSuggestion(type, currentCaption);
    setSuggestions(demoSuggestions);
    setLoading(false);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const buttons = [
    { key: 'improve', label: 'Improve' },
    { key: 'shorter', label: 'Shorten' },
    { key: 'catchy', label: 'Catchy + Emojis' },
    { key: 'fr', label: 'Translate: FR' },
    { key: 'pidgin', label: 'Translate: Pidgin' },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Assist</span>
        {isDemoMode && (
          <Badge variant="outline" className="ml-auto text-[10px]">
            Demo AI
          </Badge>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {buttons.map(btn => (
          <Button
            key={btn.key}
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(btn.key)}
            disabled={loading}
            className={cn(
              'text-xs',
              activeType === btn.key && 'border-primary/40 bg-primary/5 text-primary'
            )}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Generating suggestions...
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/50 p-3"
            >
              <p className="flex-1 text-sm text-foreground">{suggestion}</p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(suggestion, idx)}
                  className="h-7 w-7 p-0"
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReplace(suggestion)}
                  className="h-7 px-2 text-xs"
                >
                  Replace
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
