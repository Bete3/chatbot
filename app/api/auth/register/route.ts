import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cookie from "cookie"; // Correctly importing the cookie module

// Secret key for signing JWT (this should be stored in a secure place like environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COOKIE_NAME = "auth_token"; // The name of the cookie for storing JWT

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, password } = body;

  // Check if a user with the same email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser) {
    return new Response(
      JSON.stringify({ error: "User with this email already exists" }),
      { status: 400 }
    );
  }

  // Hash the user's password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user in the database
  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword, // Store the hashed password
    },
  });

  // Generate a JWT token
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email }, // Payload
    JWT_SECRET, // Secret key
    { expiresIn: "1h" } // Token expiration time (1 hour)
  );

  // Set JWT as an HTTP-only cookie
  const cookieOptions = {
    httpOnly: true, // Makes cookie inaccessible to JavaScript
    secure: process.env.NODE_ENV === "production", // Ensures cookie is sent over HTTPS in production
    maxAge: 60 * 60, // 1 hour (same as token expiration)
    path: "/", // The cookie will be available across the entire domain
  };

  const cookieHeader = cookie.serialize(COOKIE_NAME, token, cookieOptions);

  // Return success response with user info (no token in response body)
  return new Response(
    JSON.stringify({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    }),
    {
      status: 201,
      headers: {
        "Set-Cookie": cookieHeader, // Add the cookie to the response
      },
    }
  );
}
