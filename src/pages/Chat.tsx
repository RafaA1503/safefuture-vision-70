import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Role = "system" | "user" | "assistant";
interface ChatMessage { role: Role; content: string }

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "Eres el asistente de NeoSafety. Responde en español, claro y conciso." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "Chat con IA | NeoSafety";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Chat con IA de NeoSafety para dudas y asistencia en tiempo real.');

    // Canonical tag
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', `${location.origin}/chat`);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  useEffect(() => {
    // Auto scroll on new message
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const visibleMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as Role, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const content: string = data?.content ?? "";
      setMessages(prev => [...prev, { role: "assistant", content }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, ocurrió un error al responder." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="container py-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat con IA NeoSafety</h1>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/" className="story-link">Detector</a>
          <a href="/galeria" className="story-link">Galería</a>
        </nav>
      </header>

      <section className="container grid gap-6 pb-12 lg:grid-cols-[1fr]">
        <Card className="p-0 overflow-hidden border glass">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Bot className="text-primary" size={20} />
            <h2 className="text-base font-semibold">Asistente</h2>
          </div>

          <ScrollArea className="h-[55vh]">
            <div ref={viewportRef} className="p-4 space-y-4">
              {visibleMessages.length === 0 && (
                <p className="text-sm text-muted-foreground">Escribe tu primera pregunta abajo.</p>
              )}
              {visibleMessages.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.role === 'assistant' ? '' : 'justify-end'}`}>
                  {m.role === 'assistant' && (
                    <div className="shrink-0 mt-1"><Bot size={18} className="text-primary" /></div>
                  )}
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="shrink-0 mt-1"><User size={18} className="opacity-70" /></div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot size={18} className="text-primary" /> Pensando...
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                className="min-h-[44px]"
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Enviar">
                <Send size={16} />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tus mensajes se procesan de forma segura vía funciones Edge.</p>
          </div>
        </Card>
      </section>

      <footer className="container pb-8 -mt-4 text-sm text-muted-foreground text-center">
        NeoSafety · Chat con IA
      </footer>
    </main>
  );
};

export default Chat;
