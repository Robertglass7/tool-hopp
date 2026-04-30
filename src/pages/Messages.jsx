import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const allMessages = await base44.entities.Message.list();
      return allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', user?.id] });
      const previous = queryClient.getQueryData(['messages', user?.id]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        ...newMessage,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      queryClient.setQueryData(['messages', user?.id], (old = []) => [optimistic, ...old]);
      setMessageText('');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['messages', user?.id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      
      if (!convMap.has(otherUser)) {
        convMap.set(otherUser, []);
      }
      convMap.get(otherUser).push(msg);
    });

    return Array.from(convMap.entries()).map(([otherUser, msgs]) => ({
      otherUser,
      messages: msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      lastMessage: msgs[msgs.length - 1]
    }));
  }, [messages, user]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      senderId: user.id,
      receiverId: selectedConversation,
      content: messageText
    });
  };

  const selectedMessages = conversations.find(c => c.otherUser === selectedConversation)?.messages || [];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden border-green-700 bg-green-950/50">
            <CardHeader className="border-b border-green-700">
              <CardTitle className="text-white">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto h-full">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="p-4 border-b border-green-700">
                      <Skeleton className="h-16 w-full bg-green-800" />
                    </div>
                  ))
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-green-300">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.otherUser}
                      onClick={() => setSelectedConversation(conv.otherUser)}
                      className={`p-4 border-b border-green-700 cursor-pointer hover:bg-green-900/50 transition-colors ${
                        selectedConversation === conv.otherUser ? 'bg-orange-500/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold">
                          {String(conv.otherUser)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-white">User {conv.otherUser}</p>
                          <p className="text-sm text-green-300 truncate">
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col border-green-700 bg-green-950/50">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-green-700">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {String(selectedConversation)[0].toUpperCase()}
                    </div>
                    User {selectedConversation}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedMessages.map(msg => {
                    const isSent = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            isSent
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-green-900/70 text-green-100 border border-green-700'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isSent ? 'text-orange-100' : 'text-green-400'}`}>
                            {format(new Date(msg.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                <div className="p-4 border-t border-green-700">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-green-900/50 text-white border-green-700"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-orange-500 to-orange-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-green-300">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}