"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  X, 
  Loader2, 
  Sparkles,
  Check,
  Plus
} from 'lucide-react';
import type { Movie } from '@/types/movie';
import { getPosterUrl } from '@/types/movie';
import { useAuth } from '@/components/providers/auth-provider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  movies?: Movie[];
}

const FloatingAiAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { watchlist, toggleWatchlist: updateWatchlist } = useAuth();
  const maxChars = 2000;
  
  const chatRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Handle auto-scroll to bottom of conversation
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = (customMessage || message).trim();
    if (!textToSend) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(36).slice(2, 9),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Clear state if regular compose input
    if (!customMessage) {
      setMessage('');
      setCharCount(0);
    }

    setIsLoading(true);

    try {
      // Direct call to our custom api route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).slice(2, 9),
        role: 'assistant',
        content: data.reply || 'I processed that, but could not retrieve specific details.',
        timestamp: new Date(),
        movies: data.movies || []
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMsg: Message = {
        id: Math.random().toString(36).slice(2, 9),
        role: 'assistant',
        content: "I couldn't reach the recommendation service just now. You can still explore the sample catalogue, or try again after configuring the movie and AI services. Here is one pick to start with: Inception.",
        timestamp: new Date(),
        movies: [
          {
            id: 27205,
            title: "Inception",
            overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.",
            poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
            release_date: "2010-07-15",
            vote_average: 8.4,
            genre_ids: [28, 878, 12]
          }
        ]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Use the shared watchlist state so saves stay in sync across the app.
  const toggleWatchlist = (movie: Movie) => {
    void updateWatchlist(movie);
  };

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating 3D Glowing AI Logo */}
      <button 
        className={`floating-ai-button relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform cursor-pointer ${
          isChatOpen ? 'rotate-90 scale-95' : 'rotate-0 scale-100'
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(168,85,247,0.85) 100%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.7), 0 0 40px rgba(124, 58, 237, 0.5), 0 0 60px rgba(109, 40, 217, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* 3D effect overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-40"></div>
        <div className="absolute inset-0 rounded-full border-2 border-white/15"></div>
        
        {/* Toggle Icon */}
        <div className="relative z-10">
          {isChatOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <Bot className="w-8 h-8 text-white animate-pulse" />
          )}
        </div>
        
        {/* Radiant Ping Ring Animation */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-indigo-500"></div>
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div 
          ref={chatRef}
          className="absolute bottom-20 right-0 w-[450px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right animate-popIn"
        >
          <div className="relative flex flex-col h-[580px] max-h-[80vh] rounded-3xl bg-gradient-to-br from-zinc-900/90 to-zinc-950/95 border border-zinc-800/80 shadow-2xl backdrop-blur-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/40 bg-zinc-900/20">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    MRXYZ AI Movie Concierge
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Find a film that fits your mood</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-800/80 text-cyan-200 border border-zinc-700/60 rounded-full">
                  AI concierge
                </span>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages View */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {messages.length === 0 ? (
                // Greeting state
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4 px-4 py-8">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Bot className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-200">Your AI Cinematic Concierge</h3>
                  <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                    Tell me what you enjoy, what mood you&apos;re in, or name a film you love. I&apos;ll help narrow down what to watch next.
                  </p>
                  
                  {/* Preset Quick Starters */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-4">
                    <button 
                      onClick={() => handleSend("Recommend three mind-bending science-fiction films and explain why I might like each.")}
                      className="px-3 py-2 text-left text-[11px] font-medium bg-zinc-800/30 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-all"
                    >
                      🌌 Mind-bending Sci-Fi
                    </button>
                    <button 
                      onClick={() => handleSend("Suggest three warm, genuinely funny films for a relaxed evening.")}
                      className="px-3 py-2 text-left text-[11px] font-medium bg-zinc-800/30 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-all"
                    >
                      🍿 Cozy Comedy
                    </button>
                    <button 
                      onClick={() => handleSend("Recommend clever thrillers with satisfying plot twists, without spoiling them.")}
                      className="px-3 py-2 text-left text-[11px] font-medium bg-zinc-800/30 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-all"
                    >
                      🎭 Thrillers with Twist
                    </button>
                    <button 
                      onClick={() => handleSend("Find me an underrated, acclaimed film under two hours.")}
                      className="px-3 py-2 text-left text-[11px] font-medium bg-zinc-800/30 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-all"
                    >
                      🎬 Under 2hr Acclaimed
                    </button>
                  </div>
                </div>
              ) : (
                // Active messages stream
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        {msg.role === 'assistant' ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-semibold text-zinc-300">MRXYZ AI</span>
                          </>
                        ) : (
                          <span className="font-semibold text-zinc-400">You</span>
                        )}
                        <span>•</span>
                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div 
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-tr-none shadow-md border border-indigo-500/20'
                            : 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/40 rounded-tl-none backdrop-blur-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Render recommended movies as interactive glass cards */}
                      {msg.role === 'assistant' && msg.movies && msg.movies.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 w-full max-w-[90%] pt-1">
                          {msg.movies.map((movie) => {
                            const isSaved = watchlist.some((savedMovie) => savedMovie.id === movie.id);
                            return (
                              <div 
                                key={movie.id}
                                className="flex gap-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 hover:border-zinc-700/60 transition-all duration-300 shadow-lg"
                              >
                                <img 
                                  src={getPosterUrl(movie.poster_path, 'w154')}
                                  alt={movie.title}
                                  className="w-12 h-18 object-cover rounded-lg bg-zinc-800 shadow"
                                />
                                <div className="flex-1 flex flex-col min-w-0">
                                  <div className="flex justify-between items-start gap-1">
                                    <h4 className="text-xs font-bold text-zinc-100 truncate">{movie.title}</h4>
                                    <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60">
                                      ⭐ {Math.round(movie.vote_average * 10) / 10}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-normal">
                                    {movie.overview}
                                  </p>
                                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/60">
                                    <span className="text-[9px] text-zinc-500">{movie.release_date.slice(0, 4)}</span>
                                    <button
                                      onClick={() => toggleWatchlist(movie)}
                                      className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                                        isSaved 
                                          ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                                      }`}
                                    >
                                      {isSaved ? (
                                        <>
                                          <Check className="w-2.5 h-2.5" />
                                          Saved
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-2.5 h-2.5" />
                                          Add Watchlist
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading indicator bubble */}
                  {isLoading && (
                    <div className="flex flex-col items-start space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-zinc-300">MRXYZ AI is thinking...</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-none bg-zinc-800/40 border border-zinc-800 text-zinc-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Curating custom movie match...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            {/* Input Composer Section */}
            <div className="relative border-t border-zinc-800/50 bg-zinc-900/10">
              <textarea
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={maxChars}
                className="w-full px-6 py-4 bg-transparent border-none outline-none resize-none text-sm font-normal leading-relaxed min-h-[70px] max-h-[140px] text-zinc-100 placeholder-zinc-500 scrollbar-none"
                placeholder="What should I watch tonight? Tell me your mood…"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <div 
                className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none"
              ></div>
            </div>

            {/* Simple composer actions */}
            <div className="flex items-center justify-between gap-3 px-4 pb-4">
              <p className="min-w-0 text-[10px] leading-4 text-zinc-500">
                Enter to send · Shift + Enter for a new line
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-zinc-500">{charCount}/{maxChars}</span>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!message.trim() || isLoading}
                  aria-label="Send message"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Glowing Accent Overlay */}
            <div 
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03), transparent 60%, rgba(168, 85, 247, 0.03))' 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export { FloatingAiAssistant };
