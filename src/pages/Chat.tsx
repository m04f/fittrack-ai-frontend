import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  Calendar,
  Utensils,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { ChatSession, DetailedChatSession, Message } from "@/types/api";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const Chat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] =
    useState<DetailedChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reusable scroll to bottom function
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        // Use smooth scrolling behavior
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  const preWrittenPrompts = [
    {
      title: "Design a Workout Plan",
      prompt:
        "I'd like you to design a personalized workout plan for me. Please consider my fitness level, goals, and any preferences I might have.",
      icon: <Calendar className="h-4 w-4" />,
      color: "fitness-icon-bg",
    },
    {
      title: "Create a Meal Plan",
      prompt:
        "Can you help me create a nutritious meal plan that aligns with my fitness goals? Please include breakfast, lunch, dinner, and healthy snack options.",
      icon: <Utensils className="h-4 w-4" />,
      color: "fitness-icon-bg",
    },
  ];

  // Fetch chat sessions on component mount
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      api.closeWebSocket();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Add a small delay to ensure DOM has been updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Auto-scroll when loading state changes (typing indicator appears/disappears)
  useEffect(() => {
    if (isLoading) {
      // Small delay for loading indicator to appear
      const timeoutId = setTimeout(scrollToBottom, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Check if user has scrolled up to show scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]",
        );
        if (scrollElement) {
          const { scrollTop, scrollHeight, clientHeight } = scrollElement;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
          setShowScrollButton(!isAtBottom && messages.length > 0);
        }
      }
    };

    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  const fetchChatSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessionsData = await api.getChatSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      toast.error("Failed to load chat sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async (title: string = "New Chat") => {
    try {
      const newSession = await api.createChatSession(title);
      setSessions((prev) => [newSession, ...prev]);
      await openSession(newSession.uuid);
      toast.success("New chat session created");
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to create new chat session");
    }
  };

  const openSession = async (sessionUuid: string) => {
    try {
      setIsLoading(true);
      const sessionData = await api.getChatSession(sessionUuid);
      setCurrentSession(sessionData);
      setMessages(sessionData.messages || []);

      // Connect WebSocket for this session
      connectWebSocket(sessionUuid);
    } catch (error) {
      console.error("Error opening chat session:", error);
      toast.error("Failed to open chat session");
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (sessionId: string) => {
    api.connectWebSocket(
      sessionId,
      (data) => {
        if (data.message && data.role) {
          const newMessage: Message = {
            id: Date.now(),
            content: data.message,
            role: data.role,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setIsLoading(false);
        toast.error("Connection lost. Please try again.");
      },
      () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsLoading(false);
      },
    );

    // Set connected to true immediately, will be updated by callbacks if connection fails
    setIsConnected(true);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setInputMessage("");
    setIsLoading(true);

    try {
      if (!isConnected) {
        toast.error("Not connected to chat service");
        setIsLoading(false);
        return;
      }
      api.sendWebSocketMessage(message);
      
      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionUuid: string) => {
    try {
      await api.deleteChatSession(sessionUuid);
      setSessions((prev) => prev.filter((s) => s.uuid !== sessionUuid));

      if (currentSession?.uuid === sessionUuid) {
        setCurrentSession(null);
        setMessages([]);
        api.closeWebSocket();
        setIsConnected(false);
      }

      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Error deleting chat session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  const handlePromptClick = async (prompt: string, title: string) => {
    if (!currentSession) {
      await createNewSession(title);
      // Wait a bit longer for session to be fully established
      setTimeout(() => {
        setInputMessage(prompt);
        inputRef.current?.focus();
      }, 1000);
    } else {
      setInputMessage(prompt);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-enter">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight fitness-gradient-text">
          AI Chat Assistant
        </h1>
        <p className="text-muted-foreground">
          Get personalized fitness advice and workout recommendations
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        {/* Sessions Sidebar */}
        <Card className="fitness-card border-2 fitness-border-light/50 shadow-lg w-full lg:w-80 flex flex-col h-full">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 fitness-text-primary">
                <MessageCircle className="h-5 w-5 fitness-text-primary" />
                Chat Sessions
              </CardTitle>
              <Button
                size="sm"
                variant="fitness"
                onClick={() => createNewSession()}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4 pb-4">
              {loadingSessions ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No chat sessions yet</p>
                  <p className="text-sm">Create one to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.uuid}
                      className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentSession?.uuid === session.uuid
                          ? "fitness-bg-secondary/50 fitness-border"
                          : "hover:bg-muted/50 fitness-border-light/30"
                      }`}
                      onClick={() => openSession(session.uuid)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {session.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(session.created_at),
                              "MMM d, yyyy",
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="fitness-ghost"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.uuid);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="fitness-card border-2 fitness-border-light/50 shadow-lg flex-1 flex flex-col h-full overflow-hidden">
          {!currentSession ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full fitness-icon-bg flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-10 w-10 text-fitness-primary-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 fitness-gradient-text">
                  Welcome to FitTrack AI Assistant
                </h2>
                <p className="text-muted-foreground mb-6">
                  Get personalized fitness advice, workout plans, and nutrition
                  guidance
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2 fitness-text-primary">
                  <Sparkles className="h-4 w-4 fitness-text-primary" />
                  Quick Start Prompts
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {preWrittenPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="fitness-outline"
                      className="h-auto p-4 text-left justify-start"
                      onClick={() =>
                        handlePromptClick(prompt.prompt, prompt.title)
                      }
                    >
                      <div className="p-2 rounded-md fitness-icon-bg mr-3 shadow-md">
                        {prompt.icon}
                      </div>
                      <div>
                        <div className="font-medium">{prompt.title}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 fitness-text-primary">
                    <Bot className="h-5 w-5 fitness-text-primary" />
                    {currentSession.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isConnected ? "default" : "destructive"}
                      className={
                        isConnected
                          ? "bg-fitness-primary text-fitness-primary-foreground"
                          : ""
                      }
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <Separator className="flex-shrink-0" />

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Start a conversation with the AI assistant</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {message.role !== "user" && (
                            <div className="w-8 h-8 rounded-full fitness-icon-bg flex items-center justify-center flex-shrink-0 shadow-md">
                              <Bot className="h-4 w-4 text-fitness-primary-foreground" />
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "fitness-button-primary shadow-md"
                                : "bg-muted"
                            }`}
                          >
                            {message.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                            ) : (
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:my-2 prose-code:text-fitness-600 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    code({ node, inline, className, children, ...props }) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline && match ? (
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          className="rounded-md text-sm"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className={`${className} bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm`} {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    blockquote({ children }) {
                                      return (
                                        <blockquote className="border-l-4 border-fitness-400 pl-4 my-2 italic text-slate-600 dark:text-slate-400">
                                          {children}
                                        </blockquote>
                                      );
                                    },
                                    table({ children }) {
                                      return (
                                        <div className="overflow-x-auto my-2">
                                          <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
                                            {children}
                                          </table>
                                        </div>
                                      );
                                    },
                                    th({ children }) {
                                      return (
                                        <th className="border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left font-semibold">
                                          {children}
                                        </th>
                                      );
                                    },
                                    td({ children }) {
                                      return (
                                        <td className="border border-slate-300 dark:border-slate-600 px-3 py-2">
                                          {children}
                                        </td>
                                      );
                                    },
                                    ul({ children }) {
                                      return (
                                        <ul className="list-disc list-inside my-2 space-y-1">
                                          {children}
                                        </ul>
                                      );
                                    },
                                    ol({ children }) {
                                      return (
                                        <ol className="list-decimal list-inside my-2 space-y-1">
                                          {children}
                                        </ol>
                                      );
                                    },
                                    h1({ children }) {
                                      return (
                                        <h1 className="text-xl font-bold my-3 fitness-gradient-text">
                                          {children}
                                        </h1>
                                      );
                                    },
                                    h2({ children }) {
                                      return (
                                        <h2 className="text-lg font-semibold my-2 fitness-text-primary">
                                          {children}
                                        </h2>
                                      );
                                    },
                                    h3({ children }) {
                                      return (
                                        <h3 className="text-base font-semibold my-2 fitness-text-primary">
                                          {children}
                                        </h3>
                                      );
                                    },
                                    strong({ children }) {
                                      return (
                                        <strong className="font-semibold text-fitness-700 dark:text-fitness-300">
                                          {children}
                                        </strong>
                                      );
                                    },
                                    em({ children }) {
                                      return (
                                        <em className="italic text-slate-600 dark:text-slate-400">
                                          {children}
                                        </em>
                                      );
                                    },
                                    a({ href, children }) {
                                      return (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-fitness-600 hover:text-fitness-700 dark:text-fitness-400 dark:hover:text-fitness-300 underline"
                                        >
                                          {children}
                                        </a>
                                      );
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.timestamp), "HH:mm")}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full fitness-user-avatar flex items-center justify-center flex-shrink-0 shadow-md">
                              <User className="h-4 w-4 fitness-text-primary" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full fitness-icon-bg flex items-center justify-center flex-shrink-0 shadow-md">
                            <Bot className="h-4 w-4 text-fitness-primary-foreground" />
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
                
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <Button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 z-10 h-10 w-10 rounded-full shadow-lg"
                    variant="fitness"
                    size="sm"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>

              <Separator className="flex-shrink-0" />

              {/* Input Area */}
              <CardContent className="p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={!isConnected || isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || !isConnected || isLoading}
                    size="sm"
                    variant="fitness"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Connecting to chat service...
                  </p>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Chat;
