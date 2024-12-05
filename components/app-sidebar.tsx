"use client";

import React, { useEffect, useState } from "react";
import { User2, Settings, LogOut } from "lucide-react";
import axios from "axios";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import * as cookies from "cookie";
// No need to import cookieStore, use it directly from the window object

const AppSidebar = () => {
  interface Chat {
    id: string;
    name: string;
  }

  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get("/api/chat");
        setChats(response.data.chats);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    };

    fetchChats();
  }, []);

  const handleLogout = async () => {
    if ("cookieStore" in window) {
      try {
        await (window as any).cookieStore.delete("auth_token");
      } catch (error) {
        console.error("Failed to delete cookie:", error);
      }
    } else {
      // Fallback to document.cookie for browsers that do not support cookieStore
      document.cookie =
        "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    // Redirect to the login page
    window.location.href = "/auth/login";
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            {chats.map((chat) => (
              <Link key={chat.id} href={`/chat?chatId=${chat.id}`} passHref>
                <SidebarMenuItem>{chat.name}</SidebarMenuItem>
              </Link>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton onClick={handleLogout}>
            <LogOut />
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
