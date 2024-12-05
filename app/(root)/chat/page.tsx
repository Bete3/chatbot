"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SendHorizonal } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  const [content, setContent] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      fetchChatHistory(chatId as string);
    }
  }, [chatId]);

  const fetchChatHistory = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chat.conversations || []);
        scrollToBottom();
      } else {
        console.error("Failed to fetch chat history");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSubmit = async () => {
    if (!content) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, chatId }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: "user", content },
          { role: "assistant", content: data.reply },
        ]);
        setContent("");
        scrollToBottom();
      } else {
        console.error("Failed to fetch chat response");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const renderMessage = (message: { role: string; content: string }) => {
    if (message.content.startsWith("```") && message.content.endsWith("```")) {
      const code = message.content.slice(3, -3).trim();
      return (
        <SyntaxHighlighter language="javascript" style={solarizedlight}>
          {code}
        </SyntaxHighlighter>
      );
    }
    return <p>{message.content}</p>;
  };

  return (
    <div className="flex flex-col h-[95%]">
      {/* Scrollable Top Section */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-none"
      >
        <div className="space-y-4">
          {chatHistory.length > 0 ? (
            chatHistory.map((message, index) => (
              <div
                key={index}
                className={message.role === "user" ? "text-right" : "text-left"}
              >
                {renderMessage(message)}
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div className="flex px-6 py-4 gap-4">
        <Input
          className="rounded-full"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setContent(e.target.value)
          }
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />
        <div
          className="flex items-center justify-center p-2 rounded-full bg-neutral-600 text-white cursor-pointer"
          onClick={handleSubmit}
        >
          <SendHorizonal />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
