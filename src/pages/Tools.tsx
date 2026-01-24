import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hello! I am your AI assistant within BS30 Tools. How can I help you today?',
};

const Tools: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [...messages, userMsg] },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.response || 'No response generated.' },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      toast({
        title: 'Error',
        description: err.message || 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Assistant</h2>
          <p className="text-muted-foreground">Chat, draft, and brainstorm with AI.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
          title="Clear Chat"
        >
          <Eraser size={20} />
        </Button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn('flex gap-4', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  msg.role === 'user' ? 'bg-primary' : 'bg-success'
                )}
              >
                {msg.role === 'user' ? (
                  <User size={16} className="text-primary-foreground" />
                ) : (
                  <Bot size={16} className="text-success-foreground" />
                )}
              </div>

              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground border border-border rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                <Bot size={16} className="text-success-foreground" />
              </div>
              <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-5 py-3">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-muted border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="pr-12 bg-card border-border"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="absolute right-1 top-1 h-8 w-8 gradient-brand text-primary-foreground hover:opacity-90"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Tools;
