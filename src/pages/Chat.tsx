import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { MessageCircle, Plus, Send, User, Bot, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

const ChatPage = () => {
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);
  const wsRef = useRef(null);

  // Fetch chat sessions on mount
  useEffect(() => {
    const fetchChatSessions = async () => {
      setLoading(true);
      try {
        const data = await api.getChatSessions();
        setChatSessions(data || []);
        if (data && data.length > 0) {
          await handleSelectSession(data[0].uuid);
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchChatSessions();
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const connectWebSocket = (sessionId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//localhost:8000/ws/chat/${sessionId}/`,
    );
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message && data.role) {
          setCurrentSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: Date.now(),
                  content: data.message,
                  role: data.role,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              ],
            };
          });
          setSendingMessage(false);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Error connecting to chat server");
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    wsRef.current = ws;
  };

  const handleCreateSession = async () => {
    try {
      const session = await api.createChatSession("Untitled");
      setChatSessions((prev) => [session, ...prev]);
      await handleSelectSession(session.uuid);
      toast.success("New chat session created");
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSelectSession = async (uuid) => {
    try {
      const response = await fetch(`/api/chat/sessions/${uuid}/`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      const sessionData = await response.json();
      setCurrentSession(sessionData);
      connectWebSocket(uuid);
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Failed to load chat session");
    }
  };

  const handleDeleteSession = async (uuid) => {
    try {
      await api.deleteChatSession(uuid);
      setChatSessions((prev) =>
        prev.filter((session) => session.uuid !== uuid),
      );
      setCurrentSession(null);
      toast.success("Chat session deleted");
      const remainingSessions = chatSessions.filter((s) => s.uuid !== uuid);
      if (remainingSessions.length > 0) {
        await handleSelectSession(remainingSessions[0].uuid);
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  const handleSendMessage = async () => {
    if (
      !message.trim() ||
      !currentSession ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;
    setSendingMessage(true);
    try {
      wsRef.current.send(
        JSON.stringify({
          message: message.trim(),
        }),
      );
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), "h:mm a");
  };

  const renderChatMessage = (msg) => {
    const isUser = msg.role === "user";
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${isUser ? "bg-fitness-500 text-white ml-2" : "bg-muted mr-2"}`}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${isUser ? "bg-fitness-500 text-white" : "bg-muted"}`}
          >
            <div className="text-sm">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            <div className="text-xs opacity-70 mt-1 text-right">
              {formatTimestamp(msg.timestamp)}
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
        <p className="text-muted-foreground">
          Get personalized fitness advice and guidance
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Your Conversations</h3>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleCreateSession}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-2">
                    <div className="h-5 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 mt-1 bg-gray-200 rounded" />
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
                      className={`w-full justify-start text-left p-2 h-auto ${currentSession?.uuid === session.uuid ? "bg-muted" : ""}`}
                      onClick={() => handleSelectSession(session.uuid)}
                    >
                      <div>
                        <div className="font-medium text-sm flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {session.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(session.created_at).toLocaleDateString()}
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
          </div>
        </Card>
        <Card className="md:col-span-3 flex flex-col h-[600px]">
          {currentSession ? (
            <>
              <div className="border-b pb-3 flex justify-between items-center px-4">
                <div>
                  <h2 className="text-lg font-medium">
                    {currentSession.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentSession.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSession(currentSession.uuid)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {currentSession.messages &&
                currentSession.messages.length > 0 ? (
                  <div className="space-y-4">
                    {currentSession.messages.map(renderChatMessage)}
                    <div ref={chatEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      Start a new conversation
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask me anything about fitness, workouts, or nutrition
                    </p>
                  </div>
                )}
              </div>
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
                Get personalized fitness advice, workout tips, and answers to
                your health questions.
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
