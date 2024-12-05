import { prisma } from "@/app/lib/prisma";
import { Hercai } from "hercai";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

const JWT_SECRET = "your-secret-key";

export async function GET(request: Request) {
  try {
    // Parse cookies to retrieve the auth token
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const authToken = cookies.auth_token;

    // Validate if the token is present
    if (!authToken) {
      return new Response(JSON.stringify({ message: "User must log in" }), {
        status: 401,
      });
    }

    // Decode the JWT and extract the user ID
    let userId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
      userId = decoded.userId;
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
      });
    }

    // Extract the chat ID from the URL
    const url = new URL(request.url);
    const chatId = url.pathname.split("/").pop();

    // Fetch chats for the user with the specified chat ID
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: userId,
      },
      include: {
        conversations: true, // Include related conversations if needed
      },
    });
    console.log(chat);
    // If chat is not found, return a 404 response
    if (!chat) {
      return new Response(JSON.stringify({ message: "Chat not found" }), {
        status: 404,
      });
    }

    // Respond with the chat data
    return new Response(JSON.stringify({ chat }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: (error as any).message,
      }),
      {
        status: 500,
      }
    );
  }
}
