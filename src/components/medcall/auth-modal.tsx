"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUserStore } from "@/store";
import { useUIStore } from "@/store";

export function AuthModal() {
  const { authModal, setAuthModal } = useUIStore();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState({
    matricNumber: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    matricNumber: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "HOST",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setSuccess("Login successful!");
      setTimeout(() => {
        setAuthModal(null);
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          matricNumber: registerData.matricNumber,
          password: registerData.password,
          role: registerData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("Registration successful! You can now login.");
      setTimeout(() => {
        setSuccess(null);
        // Switch to login tab
        setRegisterData({
          name: "",
          matricNumber: "",
          password: "",
          confirmPassword: "",
          role: "STUDENT",
        });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAuthModal(null);
    setError(null);
    setSuccess(null);
    setLoginData({ matricNumber: "", password: "" });
    setRegisterData({
      name: "",
      matricNumber: "",
      password: "",
      confirmPassword: "",
      role: "STUDENT",
    });
  };

  return (
    <Dialog open={authModal !== null} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to MedCall
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in or create an account to join meetings
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-matric">Matric Number</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-matric"
                    placeholder="e.g., CSC/2020/001"
                    className="pl-10"
                    value={loginData.matricNumber}
                    onChange={(e) =>
                      setLoginData({ ...loginData, matricNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  placeholder="Enter your full name"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, name: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ This name will be locked after registration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-matric">Matric Number</Label>
                <Input
                  id="register-matric"
                  placeholder="e.g., CSC/2020/001"
                  value={registerData.matricNumber}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, matricNumber: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Matric number is unique and cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Confirm Password</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      checked={registerData.role === "STUDENT"}
                      onChange={() => setRegisterData({ ...registerData, role: "STUDENT" })}
                      className="h-4 w-4"
                    />
                    <span>Student</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="HOST"
                      checked={registerData.role === "HOST"}
                      onChange={() => setRegisterData({ ...registerData, role: "HOST" })}
                      className="h-4 w-4"
                    />
                    <span>Host (Lecturer)</span>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
