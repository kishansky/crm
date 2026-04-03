import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Company from "@/components/ui/Company";

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

      // ✅ Store everything
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success(`Welcome ${res.data.user.name} 🚀`);

      // ✅ Role-based redirect
      if (res.data.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard"); // same for now (can change later)
      }

    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center  gap-2 bg-muted px-4">

      <div className="flex flex-col gap-6">

      <Card className="w-full max-w-md shadow-xl">

        <CardHeader>
          <CardTitle className="text-center text-2xl">
            CRM Login
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={login}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

        </CardContent>

      </Card>
      {/* <Company /> */}
            </div>
    </div>
  );
}