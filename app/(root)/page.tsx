"use client";

import { Input } from "@/components/ui/input";
import { SendHorizonal } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

const Page = () => {
  const [content, setContent] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, []);

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

        // Update chatId if it was not set before
        if (!chatId) {
          setChatId(data.chatId);
        }
      } else {
        console.error("Failed to fetch chat response");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-[95%]">
      {/* Scrollable Top Section */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-none"
      >
        <div className="space-y-4">
          {chatHistory.map((message, index) => (
            <p
              key={index}
              className={message.role === "user" ? "text-right" : "text-left"}
            >
              {message.content}
            </p>
          ))}
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

export default Page;
