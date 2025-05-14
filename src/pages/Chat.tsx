
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus, Send, User, Bot, Trash } from "lucide-react";
import api from "@/services/api";
import { ChatSession, DetailedChatSession, Message } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

const ChatPage = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DetailedChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatSessions = async () => {
      setLoading(true);
      try {
        const data = await api.getChatSessions();
        setChatSessions(data.results || []);
        
        // If there's at least one session, load it
        if (data.results?.length > 0) {
          const sessionData = await api.getChatSession(data.results[0].uuid);
          setCurrentSession(sessionData);
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await api.createChatSession("New Chat");
      setChatSessions(prevSessions => [newSession, ...prevSessions]);
      const sessionData = await api.getChatSession(newSession.uuid);
      setCurrentSession(sessionData);
      toast.success("New chat session created");
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSelectSession = async (uuid: string) => {
    try {
      const sessionData = await api.getChatSession(uuid);
      setCurrentSession(sessionData);
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Failed to load chat session");
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession) return;
    
    setSendingMessage(true);
    // In a real application, this would connect to the WebSocket
    // For now, we'll just simulate a response
    
    try {
      // Simulate sending message
      const userMessage: Message = {
        id: Date.now(),
        content: message,
        role: "user",
        timestamp: new Date().toISOString(),
      };
      
      // Update UI immediately with user message
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);
      
      setMessage("");
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiMessage: Message = {
          id: Date.now() + 1,
          content: "I'm your AI fitness trainer. How can I help with your workout routine today?",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        
        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, aiMessage]
        } : null);
        
        setSendingMessage(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  const renderChatMessage = (message: Message) => {
    const isUser = message.role === "user";
    
    return (
      <div 
        key={message.id} 
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div 
          className={`flex max-w-[80%] ${
            isUser 
              ? "flex-row-reverse" 
              : "flex-row"
          }`}
        >
          <div 
            className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
              isUser 
                ? "bg-fitness-500 text-white ml-2" 
                : "bg-muted mr-2"
            }`}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          
          <div 
            className={`px-4 py-2 rounded-lg ${
              isUser 
                ? "bg-fitness-500 text-white" 
                : "bg-muted"
            }`}
          >
            <div className="text-sm">{message.content}</div>
            <div className="text-xs opacity-70 mt-1 text-right">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h1>
        <p className="text-muted-foreground">Get personalized fitness advice and guidance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sessions List */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Conversations</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={handleCreateSession}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-2">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.length > 0 ? (
                  chatSessions.map((session) => (
                    <Button 
                      key={session.uuid} 
                      variant="ghost" 
                      className={`w-full justify-start text-left p-2 h-auto ${
                        currentSession?.uuid === session.uuid ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSelectSession(session.uuid)}
                    >
                      <div>
                        <div className="font-medium text-sm flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {session.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {format(new Date(session.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No conversations yet
                    </p>
                    <Button 
                      className="mt-4 bg-fitness-600 hover:bg-fitness-700"
                      onClick={handleCreateSession}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Conversation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 flex flex-col h-[600px]">
          {currentSession ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{currentSession.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(currentSession.created_at), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {currentSession.messages.length > 0 ? (
                  <div className="space-y-4">
                    {currentSession.messages.map(renderChatMessage)}
                    <div ref={chatEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Start a new conversation</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask me anything about fitness, workouts, or nutrition
                    </p>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input 
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    className="bg-fitness-600 hover:bg-fitness-700"
                    disabled={!message.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-2">Chat with AI Trainer</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Get personalized fitness advice, workout tips, and answers to your health questions.
              </p>
              <Button 
                className="bg-fitness-600 hover:bg-fitness-700"
                onClick={handleCreateSession}
              >
                <Plus className="mr-2 h-4 w-4" />
                Start New Conversation
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
