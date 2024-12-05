import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cookie from "cookie"; // Correct import for cookie module

// Secret key for signing JWT (this should be stored in a secure place like environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COOKIE_NAME = "auth_token"; // Name of the cookie for storing JWT

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  // Compare the provided password with the stored hashed password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
    });
  }

  // Generate a JWT token for the user after successful login
  const token = jwt.sign(
    { userId: user.id, email: user.email }, // Payload with user data
    JWT_SECRET, // Secret key for signing
    { expiresIn: "1h" } // Token expiration (1 hour)
  );

  // Set JWT as an HTTP-only cookie
  const cookieOptions = {
    httpOnly: true, // Makes cookie inaccessible to JavaScript
    secure: process.env.NODE_ENV === "production", // Ensures cookie is sent over HTTPS in production
    maxAge: 60 * 60, // 1 hour
    path: "/", // The cookie will be available across the entire domain
  };

  const cookieHeader = cookie.serialize(COOKIE_NAME, token, cookieOptions);

  // Return success response
  return new Response(
    JSON.stringify({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    }),
    {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader, // Add the cookie to the response
      },
    }
  );
}
