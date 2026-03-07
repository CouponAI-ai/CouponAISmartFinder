import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import BottomNav from "@/components/BottomNav";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: JSX.Element[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (line: string): JSX.Element => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      elements.push(<div key={key++} className="h-1" />);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      listItems.push(
        <li key={key++} className="ml-2">{inlineFormat(line.slice(2))}</li>
      );
    } else {
      flushList();
      elements.push(<p key={key++} className="leading-snug">{inlineFormat(line)}</p>);
    }
  }
  flushList();
  return <div className="space-y-1 text-sm">{elements}</div>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
}

const STARTERS = [
  "Any Subway deals near me?",
  "Best fast food coupons?",
  "Walmart promo codes?",
  "Movie ticket discounts?",
  "Auto service coupons?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi there! I'm your CouponAI Assistant — I'm here to help you hunt down the best coupons and deals. Ask me about a specific store, category, or type of savings and I'll point you in the right direction!",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await apiRequest("POST", "/api/chat", { message, history });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, blocked: data.blocked },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops — I had a little hiccup. Try again or browse deals manually on the Home tab!",
        },
      ]);
    },
  });

  function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    chatMutation.mutate(msg);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi there! I'm your CouponAI Assistant — I'm here to help you hunt down the best coupons and deals. Ask me about a specific store, category, or type of savings and I'll point you in the right direction!",
      },
    ]);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Sparkly Header ───────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-[hsl(var(--primary)/0.85)] to-accent px-4 pt-12 pb-6">
        {/* floating sparkle dots */}
        <span className="sparkle-dot absolute top-3 left-8"  style={{ animationDelay: "0s" }} />
        <span className="sparkle-dot absolute top-6 left-1/3" style={{ animationDelay: "0.4s" }} />
        <span className="sparkle-dot absolute top-2 right-10" style={{ animationDelay: "0.8s" }} />
        <span className="sparkle-dot absolute top-8 right-1/4" style={{ animationDelay: "0.2s" }} />
        <span className="sparkle-dot absolute top-4 left-2/3" style={{ animationDelay: "1.1s" }} />
        <span className="sparkle-dot absolute top-10 left-1/2" style={{ animationDelay: "0.6s" }} />

        <div className="relative flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/40">
                <Sparkles className="w-5 h-5 text-white sparkle-icon" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-300 border-2 border-primary sparkle-pulse" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">AI Chatbot</h1>
              <p className="text-white/75 text-xs">Ask me for any coupon or deal</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={clearChat}
            data-testid="button-chat-clear"
            className="text-white/80 hover:text-white hover:bg-white/10"
            title="Start new conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* ── Message area ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-4 pb-40">
        {/* Starter chips — only shown when no user messages yet */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
            {STARTERS.map((s) => (
              <button
                key={s}
                data-testid={`button-starter-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary font-medium hover-elevate active-elevate-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            data-testid={`message-${msg.role}-${i}`}
            className={`flex items-end gap-2 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm text-sm"
                  : msg.blocked
                  ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
                  : "bg-card text-card-foreground border border-border rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant"
                ? renderMarkdown(msg.content)
                : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="typing-dots">
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <input
            ref={inputRef}
            data-testid="input-chat-message"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about any coupon or deal…"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            disabled={chatMutation.isPending}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatMutation.isPending}
            data-testid="button-chat-send"
            className="rounded-full flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
