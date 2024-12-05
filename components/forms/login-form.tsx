"use client";

import * as React from "react";
import axios from "axios";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Zod Schema for Login validation
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export function LoginForm() {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = React.useState<
    Partial<z.infer<typeof loginSchema>>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors({ ...errors, [id]: "" }); // Clear error on change
  };

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      loginSchema.parse(formData);
      axios
        .post("http://localhost:3000/api/auth/login", formData)
        .then((response) => {
          console.log("Response:", response.data);
          toast.success("Login successful!");
          router.push("/");
        })
        .catch((error) => {
          console.error("Error:", error);
          toast.error("Login failed.");
        });
      // const response = axios.post("/api/auth/login");
      // console.log(response);
      // console.log("Login successful:", formData);
      // alert("Login successful!");
      // Optionally, handle login success logic
      // setFormData({ email: "", password: "" });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.flatten().fieldErrors;
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Card className="min-w-96">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Access your account below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span className="text-red-500 text-sm">{errors.email}</span>
              )}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="text-red-500 text-sm">{errors.password}</span>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button type="submit" className="w-full" onClick={handleSubmit}>
          Login
        </Button>
      </CardFooter>
    </Card>
  );
}
