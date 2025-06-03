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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { ChatSession, DetailedChatSession, Message } from "@/types/api";
import { toast } from "sonner";
import { format } from "date-fns";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preWrittenPrompts = [
    {
      title: "Design a Workout Plan",
      prompt:
        "I'd like you to design a personalized workout plan for me. Please consider my fitness level, goals, and any preferences I might have.",
      icon: <Calendar className="h-4 w-4" />,
      color: "bg-blue-500",
    },
    {
      title: "Create a Meal Plan",
      prompt:
        "Can you help me create a nutritious meal plan that aligns with my fitness goals? Please include breakfast, lunch, dinner, and healthy snack options.",
      icon: <Utensils className="h-4 w-4" />,
      color: "bg-green-500",
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
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Sessions Sidebar */}
        <Card className="w-full lg:w-80 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat Sessions
              </CardTitle>
              <Button
                size="sm"
                onClick={() => createNewSession()}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
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
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
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
                          variant="ghost"
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
        <Card className="flex-1 flex flex-col">
          {!currentSession ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center mb-8">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to FitTrack AI Assistant
                </h2>
                <p className="text-muted-foreground mb-6">
                  Get personalized fitness advice, workout plans, and nutrition
                  guidance
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Start Prompts
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {preWrittenPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 text-left justify-start"
                      onClick={() =>
                        handlePromptClick(prompt.prompt, prompt.title)
                      }
                    >
                      <div
                        className={`p-2 rounded-md ${prompt.color} text-white mr-3`}
                      >
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {currentSession.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isConnected ? "default" : "destructive"}
                      className={isConnected ? "bg-green-500" : ""}
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
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
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.timestamp), "HH:mm")}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary-foreground" />
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
              </CardContent>

              <Separator />

              {/* Input Area */}
              <CardContent className="p-4">
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
