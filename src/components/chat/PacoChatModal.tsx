import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Compass,
  Coins,
  TrendingUp,
  X,
  Building2,
  Calculator,
} from 'lucide-react';
import { PacoMascot } from '../common/PacoMascot';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingSources?: Array<{ title?: string; url?: string }>;
  suggestedQuestions?: string[];
}

export const openPacoChat = (initialPrompt?: string) => {
  window.dispatchEvent(
    new CustomEvent('open-paco-chat', {
      detail: { initialPrompt },
    })
  );
};

// Backward compatibility helper for startOnboardingTour
export const startOnboardingTour = () => {
  openPacoChat('Fais-moi faire le tour du propriétaire de Bourse Facile et explique-moi comment utiliser la plateforme.');
};

const QUICK_TOPICS = [
  {
    icon: Sparkles,
    label: 'Visite guidée',
    prompt: 'Fais-moi le tour du propriétaire de Bourse Facile et présente-moi toutes les fonctionnalités clés.',
  },
  {
    icon: Building2,
    label: 'Choisir une SGI',
    prompt: 'Comment choisir la meilleure SGI pour ouvrir un compte et quels sont les documents nécessaires ?',
  },
  {
    icon: Coins,
    label: 'Meilleurs dividendes',
    prompt: 'Quelles sont les meilleures actions à dividendes de la BRVM pour un investisseur débutant ?',
  },
  {
    icon: Calculator,
    label: 'Frais & Tarifs',
    prompt: 'Quels sont exactement tous les frais prélevés lors d’un ordre d’achat d’actions à la BRVM ?',
  },
  {
    icon: TrendingUp,
    label: 'Débuter avec 25 000 FCFA',
    prompt: 'Comment débuter à la BRVM avec un petit budget comme 25 000 FCFA par mois ?',
  },
];

interface PacoChatModalProps {
  onNavigate?: (path: string) => void;
}

export const PacoChatModal: React.FC<PacoChatModalProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-modal-1',
      role: 'model',
      text: `🐘 **Bonjour ! Je suis Paco, votre conseiller boursier et guide personnel.**

Bienvenue sur **Bourse Facile** ! Je suis là pour répondre à toutes vos questions sur la **BRVM (Bourse Régionale des Valeurs Mobilières)**, vous expliquer les termes financiers en langage simple et vous aider à investir sereinement dans les 8 pays de l'UEMOA.

👉 Cliquez sur un sujet rapide ci-dessous ou posez-moi directement votre question !`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Fais-moi visiter la plateforme',
        'Comment ouvrir un compte SGI ?',
        'Quelles actions acheter pour les dividendes ?',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for global open events
  useEffect(() => {
    const handleCustomOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ initialPrompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.initialPrompt) {
        setTimeout(() => {
          handleSendMessage(customEvent.detail.initialPrompt);
        }, 200);
      }
    };

    window.addEventListener('open-paco-chat', handleCustomOpen);
    window.addEventListener('open-onboarding-tour', handleCustomOpen);

    return () => {
      window.removeEventListener('open-paco-chat', handleCustomOpen);
      window.removeEventListener('open-onboarding-tour', handleCustomOpen);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat/paco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `paco-${Date.now()}`,
        role: 'model',
        text: data.reply || "Désolé, je n'ai pas pu formuler ma réponse. Pouvez-vous reformuler votre question ?",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data.groundingSources,
        suggestedQuestions: data.suggestedQuestions,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMessage: ChatMessage = {
        id: `paco-err-${Date.now()}`,
        role: 'model',
        text: `🐘 **Paco est toujours là pour vous guider !**

Pour bien démarrer à la BRVM :
1. **Choisissez une SGI agréée** (CGF Bourse, BOA Capital, Société Générale Capital Securities, etc.).
2. **Préparez vos documents** (Pièce d'identité et justificatif de domicile).
3. **Commencez petit à petit** avec un budget régulier (dès 10 000 ou 25 000 FCFA par mois).
4. **Privilégiez les grandes entreprises régulières** (Sonatel, Société Générale CI, Ecobank, Orange CI).

N'hésitez pas à me poser une autre question précise !`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: `🐘 **Conversation réinitialisée !**

Je suis à votre entière disposition. Que souhaitez-vous savoir sur la bourse, les actions ou les SGI ?`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'Visite guidée de la plateforme',
          'Comment ouvrir un compte SGI ?',
          'Quelles actions acheter avec 50 000 FCFA ?',
        ],
      },
    ]);
  };

  const toggleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-2.5 text-[13.5px] sm:text-[14.5px] leading-relaxed text-slate-100">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm sm:text-base font-bold text-emerald-300 mt-2.5 mb-1 tracking-tight">
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-bold text-white mt-3 mb-1.5 tracking-tight">
                {trimmed.replace(/^##\s+/, '')}
              </h3>
            );
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const content = trimmed.replace(/^[*•-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="text-slate-200">{renderInlineStyles(content)}</span>
              </div>
            );
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)?.[0];
            const content = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold shrink-0">
                  {num}
                </span>
                <span className="text-slate-200">{renderInlineStyles(content)}</span>
              </div>
            );
          }

          return <p key={idx} className="text-slate-200">{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-emerald-200/90">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Material 3 Extended Floating Action Button (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-950/40 hover:shadow-2xl hover:shadow-emerald-900/50 border border-emerald-400/40 backdrop-blur-md cursor-pointer group"
            title="Poser une question à Paco (Conseiller Bourse)"
            aria-label="Ouvrir le conseiller Paco"
          >
            <div className="relative w-9 h-9 rounded-full bg-white/10 p-0.5 flex items-center justify-center shrink-0 border border-emerald-300/30">
              <PacoMascot size="sm" showBadge={false} className="w-full h-full object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-900"></span>
              </span>
            </div>

            <div className="text-left flex flex-col pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white">Paco</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-200 text-[9px] font-extrabold uppercase tracking-wide">
                  IA
                </span>
              </div>
              <span className="text-[11px] text-emerald-100/90 font-medium whitespace-nowrap">
                Conseiller Bourse
              </span>
            </div>
          </motion.button>
        </div>
      )}

      {/* Material 3 Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-hidden">
            {/* Scrim Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            {/* Modal Dialog Surface */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.85 }}
              className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900/95 text-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-700/60 overflow-hidden"
            >
              {/* Material 3 Top App Bar */}
              <div className="px-5 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-3 backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center p-1 shadow-sm shrink-0">
                    <PacoMascot size="sm" showBadge={false} className="w-full h-full object-contain" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-900"></span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                        Paco
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wide uppercase">
                        Conseiller Bourse BRVM
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-normal">
                      Explications simples, aide au choix de SGI et visite interactive
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleResetChat}
                    className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Nouvelle conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* M3 Quick Assist Chips Carousel (NO BROWSER SCROLLBAR) */}
              <div className="bg-slate-950/40 px-4 sm:px-6 py-2.5 border-b border-slate-800/60 overflow-x-auto no-scrollbar scrollbar-none">
                <div className="flex items-center gap-2 w-max">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0 pr-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    Thèmes :
                  </span>
                  {QUICK_TOPICS.map((topic, tIdx) => {
                    const TopicIcon = topic.icon;
                    return (
                      <motion.button
                        key={tIdx}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        disabled={isLoading}
                        onClick={() => handleSendMessage(topic.prompt)}
                        className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-emerald-950/50 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-600/40 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <TopicIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{topic.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Messages Thread Container (Smooth M3 Scrollbar) */}
              <div className="flex-1 overflow-y-auto m3-scrollbar p-4 sm:p-6 space-y-4 min-h-[340px] max-h-[58vh] bg-slate-950/60">
                {messages.map(msg => {
                  const isModel = msg.role === 'model';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}
                    >
                      {isModel && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] sm:max-w-[82%] rounded-[24px] p-4 sm:p-5 space-y-2.5 shadow-sm ${
                          isModel
                            ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                            : 'bg-emerald-600 text-white font-normal rounded-tr-sm shadow-md'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 text-[11px] opacity-75 border-b border-white/10 pb-1.5">
                          <span className="font-semibold flex items-center gap-1">
                            {isModel ? '🐘 Paco' : '👤 Vous'}
                          </span>
                          <span className="text-[10px]">{msg.timestamp}</span>
                        </div>

                        {/* Content */}
                        <div>
                          {renderFormattedText(msg.text)}
                        </div>

                        {/* Grounding Web Sources */}
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                              Sources officielles consultées :
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.groundingSources.map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-900 text-emerald-300 hover:text-emerald-200 text-[11px] border border-slate-700/60 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                                  <span className="truncate max-w-[160px]">{source.title || 'BRVM'}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested follow-up buttons */}
                        {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-700/60 space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-300 block">
                              Poursuivre avec Paco :
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestedQuestions.map((q, qIdx) => (
                                <motion.button
                                  key={qIdx}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleSendMessage(q)}
                                  className="px-3 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 hover:text-white text-xs font-medium border border-emerald-800/50 transition-colors text-left cursor-pointer"
                                >
                                  👉 {q}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Speech & Copy */}
                        {isModel && (
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => toggleSpeak(msg.text)}
                              className="p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                              title={isSpeaking ? "Arrêter la voix" : "Écouter la réponse"}
                            >
                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                              title="Copier le texte"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isModel && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 shadow-md">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/60 rounded-[24px] rounded-tl-sm px-4 py-3 flex items-center gap-3 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        Paco prépare ses explications...
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* M3 Floating Input Bar Dock */}
              <div className="p-4 bg-slate-900 border-t border-slate-800/80">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative flex items-center rounded-full bg-slate-800/80 border border-slate-700/70 p-1.5 pl-4 sm:pl-5 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/80 focus-within:border-emerald-500 transition-all"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Posez votre question à Paco (ex: actions à dividendes, SGI...)"
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm font-normal focus:outline-none pr-2"
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    disabled={!inputText.trim() || isLoading}
                    className="px-4 sm:px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                  >
                    <span>Envoyer</span>
                    <Send className="w-3.5 h-3.5" />
                  </motion.button>
                </form>

                <div className="mt-2 text-center">
                  <p className="text-[10.5px] text-slate-400">
                    🐘 Paco s'appuie sur la documentation officielle BRVM & AMF-UMOA pour vous guider en toute clarté.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
