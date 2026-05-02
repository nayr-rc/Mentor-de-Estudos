import { useState, useRef, useEffect } from "react";
import { Send, BrainCircuit, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "O que devo estudar agora?",
  "Como está meu desempenho esta semana?",
  "Qual meu pior tópico em Biologia?",
  "Crie um plano para os próximos 3 dias",
];

export default function Mentor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "", streaming: true };
    setMessages([...newMessages, assistantMsg]);

    try {
      const response = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Erro na resposta");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    streaming: true,
                  };
                  return updated;
                });
              }
              if (data.done) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    streaming: false,
                  };
                  return updated;
                });
              }
              if (data.error) throw new Error(data.error);
            } catch {
              // ignore parse errors on partial lines
            }
          }
        }
      }
    } catch (err) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao Mentor IA.",
        variant: "destructive",
      });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Desculpe, houve um erro ao processar sua mensagem. Tente novamente.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c6af5, #3ecf8e)" }}
          >
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
              Mentor IA
            </h1>
            <p className="text-xs text-muted-foreground">Seu coach de estudos pessoal — direto e analítico</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #7c6af520, #3ecf8e10)" }}
            >
              <BrainCircuit size={28} style={{ color: "#7c6af5" }} />
            </div>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
              Pronto para te ajudar
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Pergunte qualquer coisa sobre sua rotina de estudos. Tenho acesso ao seu histórico completo.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  data-testid={`chip-${s.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                  style={{
                    background: "#7c6af512",
                    border: "1px solid #7c6af530",
                    color: "#7c6af5",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background:
                  msg.role === "assistant"
                    ? "linear-gradient(135deg, #7c6af5, #3ecf8e)"
                    : "hsl(var(--muted))",
              }}
            >
              {msg.role === "assistant" ? (
                <BrainCircuit size={14} className="text-white" />
              ) : (
                <User size={14} className="text-muted-foreground" />
              )}
            </div>
            <div
              className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === "assistant" ? "hsl(var(--card))" : "#7c6af5",
                color: msg.role === "user" ? "white" : undefined,
                border: msg.role === "assistant" ? "1px solid hsl(var(--card-border))" : "none",
              }}
            >
              {msg.content || (msg.streaming && (
                <span className="flex gap-1 py-0.5">
                  <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
                  <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
                  <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
                </span>
              ))}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c6af5, #3ecf8e)" }}
            >
              <BrainCircuit size={14} className="text-white" />
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))" }}
            >
              <span className="flex gap-1 py-0.5">
                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "#7c6af5" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions when chatting */}
      {messages.length > 0 && (
        <div className="px-6 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all hover:scale-105 flex-shrink-0"
              style={{ background: "#7c6af512", border: "1px solid #7c6af530", color: "#7c6af5" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 flex-shrink-0">
        <div
          className="flex items-end gap-3 rounded-2xl border p-3"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
        >
          <textarea
            ref={inputRef}
            data-testid="input-mentor-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Mentor IA... (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-muted-foreground"
            style={{ maxHeight: "120px", minHeight: "24px" }}
          />
          <button
            data-testid="button-send-message"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: input.trim() && !isStreaming ? "#7c6af5" : "hsl(var(--muted))",
              color: input.trim() && !isStreaming ? "white" : "hsl(var(--muted-foreground))",
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          O Mentor tem acesso ao seu histórico completo de estudos e hábitos
        </p>
      </div>
    </div>
  );
}
