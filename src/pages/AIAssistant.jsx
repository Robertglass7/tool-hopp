import React, { useState, useRef, useEffect } from "react";
import { toolhopp as base44 } from \"@/api/toolhoppClient\";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Sparkles, Wrench, AlertTriangle, Lightbulb, BookOpen
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const exampleQuestions = [
  "How do I safely use a circular saw?",
  "Step-by-step guide to install a ceiling fan",
  "What safety gear do I need for using a paint sprayer?",
  "How to fix a leaky faucet?",
  "Best way to cut plywood with minimal splintering"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your FREE AI Tool Assistant. I can help you:\n\n🔧 **Tool Usage** - Learn how to safely use any tool\n📋 **Project Guidance** - Step-by-step instructions for any DIY project\n⚠️ **Safety Tips** - Important precautions and required safety gear\n💡 **Pro Tips** - Expert advice and troubleshooting\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const askAIMutation = useMutation({
    mutationFn: async (question) => {
      const response = await base44.ai.ask(question);
      return response;
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await askAIMutation.mutateAsync(input);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    }
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                AI Tool Assistant
              </h1>
            </div>
            <p className="text-green-200">
              Free expert guidance for safe tool usage and project success
            </p>
          </div>

          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            100% Free
          </Badge>
        </div>

        {/* Features Banner */}
        <Card className="border-2 border-purple-500 bg-green-950/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-green-100">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Safety Instructions</span>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Project Guides</span>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <Wrench className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Tool Best Practices</span>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Pro Tips</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="border-2 border-green-700 bg-green-950/50 backdrop-blur-sm">
          <CardHeader className="border-b border-green-700">
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Chat with AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                          : 'bg-green-900/70 text-green-100 border border-green-700'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-purple-400">
                            AI Assistant
                          </span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {askAIMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-green-900/70 rounded-2xl p-4 max-w-[85%] border border-green-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Example Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 border-t border-green-700">
                <p className="text-sm text-green-300 mb-3 mt-4">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(question)}
                      className="text-xs border-green-600 text-green-200 hover:border-purple-500 hover:bg-purple-500/10"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-green-700">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Ask me anything about tools, safety, or your project..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={askAIMutation.isPending}
                  className="resize-none bg-green-900/50 text-white border-green-700 placeholder:text-green-400"
                  rows={2}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || askAIMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
