import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
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
  ShieldCheck,
  TrendingUp,
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

const INITIAL_SUGGESTIONS = [
  '🐘 Fais-moi faire le tour du propriétaire de Bourse Facile',
  '🏦 Comment ouvrir un compte dans une SGI pour la première fois ?',
  '💰 Combien d\'argent faut-il au minimum pour commencer à la BRVM ?',
  '📈 Quelles sont les meilleures actions à dividendes pour un débutant ?',
  '📱 Comment déposer de l\'argent via Wave ou Orange Money dans une SGI ?',
  '🧾 Quels sont tous les frais lors de l\'achat d\'une action à la BRVM ?',
  '🛡️ Comment éviter les pièges et arnaques financières en bourse ?',
];

export const PacoChatModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `🐘 **Salut ! Moi c'est Paco, votre conseiller boursier personnel sur Bourse Facile.**

La bourse peut sembler compliquée avec tous ses termes techniques, mais je suis là pour **tout vous expliquer de manière simple, concrète et sans jargon**.

Que vous n'ayez aucune connaissance financière, que vous hésitiez sur le choix d'une SGI ou que vous vouliez savoir comment investir vos premiers **10 000 FCFA**, posez-moi votre question ci-dessous ou cliquez sur une suggestion !`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Comment ouvrir un compte SGI ?',
        'Quelles sont les meilleures actions à dividendes ?',
        'Quels sont les frais réels d’une transaction ?',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        text: `🐘 **Oups ! Petite coupure de réseau, mais Paco est toujours là !**

Pour investir à la BRVM en toute sérénité :
1. Choisissez une **SGI agréée** (comme celles répertoriées ci-dessus).
2. Fournissez votre pièce d'identité et un justificatif de domicile.
3. Déposez votre premier capital (dès 10 000 FCFA pour certaines SGI).
4. Privilégiez au départ les grandes entreprises régulières en dividendes (**Sonatel, Société Générale CI, Ecobank, Orange CI**).

Posez-moi une autre question et je vous répondrai tout de suite !`,
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
        text: `🐘 **Discussion réinitialisée !**

Je suis à nouveau prêt à répondre à toutes vos questions sur la bourse, la BRVM, les SGI et les stratégies d'investissement. Que souhaitez-vous savoir ?`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'Comment ouvrir un compte SGI ?',
          'Quelles actions acheter avec 50 000 FCFA ?',
          'Comment fonctionnent les intérêts composés ?',
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
    <div id="paco-chat-module" className="bg-slate-900/95 dark:bg-[#0c1813]/95 text-white rounded-[32px] p-5 sm:p-8 border border-slate-700/60 dark:border-emerald-900/40 shadow-xl space-y-6">
      {/* Header with Mascot & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-inner">
            <PacoMascot size="sm" showBadge={false} className="w-full h-full object-contain" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Intelligence & Conseil Financier BRVM
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Paco, votre conseiller Bourse
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-2xl leading-relaxed">
              Expert dédié pour débutants et passionnés. Posez toutes vos questions sur les 41 SGI, les actions cotées, les dividendes, les dépôts Mobile Money et les stratégies de placement dans l'UEMOA.
            </p>
          </div>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleResetChat}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Réinitialiser la discussion</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Suggestions Chips Carousel (NO UGLY SCROLLBAR) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          Questions fréquemment posées par les investisseurs :
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1">
          {INITIAL_SUGGESTIONS.map((sug, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={() => handleSendMessage(sug)}
              className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-600/40 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shrink-0"
            >
              {sug}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container (Clean M3 Scrollbar) */}
      <div className="bg-slate-950/60 rounded-[28px] border border-slate-800 p-4 sm:p-6 min-h-[380px] max-h-[540px] overflow-y-auto m3-scrollbar space-y-4 shadow-inner">
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-[24px] p-4 sm:p-5 space-y-2.5 shadow-sm transition-all ${
                  isModel
                    ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                    : 'bg-emerald-600 text-white font-normal rounded-tr-sm shadow-md'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-3 text-[11px] opacity-75 border-b border-white/10 pb-1.5">
                  <span className="font-semibold flex items-center gap-1">
                    {isModel ? '🐘 Paco' : '👤 Vous'}
                  </span>
                  <span className="text-[10px]">{msg.timestamp}</span>
                </div>

                {/* Message Content */}
                <div>
                  {renderFormattedText(msg.text)}
                </div>

                {/* Grounding Web Sources if available */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Sources & Rapports consultés en ligne :
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
                          <span className="truncate max-w-[160px]">{source.title || 'Source BRVM'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested follow up buttons */}
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

                {/* Bottom message actions for model */}
                {isModel && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => toggleSpeak(msg.text)}
                      className="p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                      title={isSpeaking ? "Arrêter la lecture" : "Écouter la réponse"}
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
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-[24px] rounded-tl-sm px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-300 font-medium">
                Paco consulte les rapports, forums et données BRVM...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* M3 Floating Input Bar Dock */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center rounded-full bg-slate-800/80 border border-slate-700/70 p-1.5 pl-5 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/80 focus-within:border-emerald-500 transition-all"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Posez votre question à Paco (ex: Comment choisir ma SGI ? Quelles actions acheter ?)"
          disabled={isLoading}
          className="flex-1 bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm font-normal focus:outline-none pr-2"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          disabled={!inputText.trim() || isLoading}
          className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
        >
          <span>Envoyer</span>
          <Send className="w-3.5 h-3.5" />
        </motion.button>
      </form>

      {/* Trust & Guarantee Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Informations pédagogiques vérifiées & conformes AMF-UMOA</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Enrichi avec les analyses et rapports officiels récents</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Calculs & simulations tarifaires en Francs CFA (FCFA)</span>
        </div>
      </div>
    </div>
  );
};
