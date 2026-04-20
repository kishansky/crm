import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) {
      return toast.error("Please enter email & password");
    }

    try {
      setLoading(true);

      const res = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success(`Welcome ${res.data.user.name} 🚀`);

      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-between bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">

      {/* TOP HEADING */}
      <div className="text-center mt-10">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to CRM System
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Manage leads, track performance, and grow your business 🚀
        </p>
      </div>

      {/* LOGIN CARD */}
      <div className="flex justify-center items-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur rounded-2xl">
          
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">
              Sign in to your account
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <Input
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />

            <Button
              onClick={login}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

          </CardContent>
        </Card>
      </div>

      {/* FOOTER */}
      <div className="text-center text-xs text-gray-400 mb-4">
        © {new Date().getFullYear()} CRM System. All rights reserved.
      </div>

    </div>
  );
}