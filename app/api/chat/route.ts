import { prisma } from "@/app/lib/prisma";
import { Hercai } from "hercai";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

const JWT_SECRET = "your-secret-key"; // Replace with your actual JWT secret

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, chatId } = body;

    // Check if user is logged in
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const authToken = cookies.auth_token;
    if (!authToken) {
      return new Response(JSON.stringify({ message: "User must log in" }), {
        status: 401,
      });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET);
      userId = (decoded as jwt.JwtPayload).userId;
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
      });
    }

    if (!content) {
      return new Response(JSON.stringify({ message: "Content is required" }), {
        status: 400,
      });
    }

    let chat;
    if (!chatId) {
      // Create a new chat if chatId is not provided
      chat = await prisma.chat.create({
        data: {
          name: `Chat about: ${content.substring(0, 20)}`, // Descriptive name
          userId: userId,
        },
        include: { conversations: true },
      });
    } else {
      // Fetch the existing chat
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { conversations: true },
      });

      if (!chat) {
        return new Response(JSON.stringify({ message: "Chat not found" }), {
          status: 404,
        });
      }
    }

    const herc = new Hercai();

    // Include history in the request
    const combinedMessages = [
      ...chat.conversations.map((conv) => ({
        role: conv.role,
        content: conv.content,
      })), // Pass conversation history
      { role: "user", content: content }, // Add the new user input
    ];

    const hercResponse = await herc.question({
      model: "v3",
      content: combinedMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n"),
    });

    // Save the new conversation to the database
    await prisma.conversation.create({
      data: {
        content: content,
        role: "user",
        chatId: chat.id,
      },
    });

    await prisma.conversation.create({
      data: {
        content: hercResponse.reply,
        role: "assistant",
        chatId: chat.id,
      },
    });

    return new Response(
      JSON.stringify({
        reply: hercResponse.reply,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
}

export async function GET(request: Request) {
  try {
    // Check if user is logged in
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const authToken = cookies.auth_token;
    if (!authToken) {
      return new Response(JSON.stringify({ message: "User must log in" }), {
        status: 401,
      });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET);
      userId = (decoded as jwt.JwtPayload).userId;
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
      });
    }

    const chats = await prisma.chat.findMany({
      where: { userId: userId },
    });

    console.log(chats);

    return new Response(JSON.stringify({ chats }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
}
