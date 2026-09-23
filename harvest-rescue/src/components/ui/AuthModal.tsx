"use client";

import React, { useState } from "react";
import { User, LogIn, LogOut, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck, Mail, AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { api, UserProfile } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialMode?: "signin" | "register";
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialMode = "signin",
  onAuthSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode || "signin");
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please provide your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        const res = await api.register(name.trim(), normEmail, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(normEmail, password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E0E4DF] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0E4DF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#191C1A]">Farmer Account</h3>
              <p className="text-xs text-[#717973]">
                {currentUser ? "Manage your monitoring session" : "Secure access to your agricultural parcels"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#717973] hover:bg-[#F0F4EF] hover:text-[#191C1A] flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Logged in state */}
        {currentUser ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#D8ECE0]/60 border border-[#A3D9B5] flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-base">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1B4D3E] block">
                  Active Session
                </span>
                <p className="text-base font-bold text-[#191C1A] truncate">{currentUser.name}</p>
                <p className="text-xs text-[#414943] truncate">{currentUser.email}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] shrink-0" />
            </div>

            <div className="p-4 rounded-2xl bg-[#F0F4EF] border border-[#E0E4DF] space-y-1.5 text-xs text-[#414943]">
              <div className="flex items-center gap-1.5 font-bold text-[#1B4D3E]">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Protection Active</span>
              </div>
              <p>Your registered farms and predictive risk alerts are private to this account.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outlined"
                size="md"
                onClick={onClose}
                className="flex-1 justify-center"
              >
                Close
              </Button>
              <Button
                variant="filled"
                size="md"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="flex-1 justify-center bg-[#BA1A1A] hover:bg-[#93000A] text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Forms */
          <div className="space-y-5">
            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-[#F0F4EF] p-1 border border-[#E0E4DF]">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-[#1B4D3E] shadow-xs"
                    : "text-[#717973] hover:text-[#191C1A]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-[#1B4D3E] shadow-xs"
                    : "text-[#717973] hover:text-[#191C1A]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] flex items-center gap-2.5 text-xs text-[#BA1A1A]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191C1A]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-[#717973]" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-[#C0C9C0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] bg-[#FBFDFA]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191C1A]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#717973]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-[#C0C9C0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] bg-[#FBFDFA]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191C1A]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-[#717973]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9.5 pr-10 py-2.5 rounded-xl border border-[#C0C9C0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] bg-[#FBFDFA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#717973] hover:text-[#191C1A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191C1A]">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-[#717973]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-[#C0C9C0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] bg-[#FBFDFA]"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="filled"
                size="md"
                isLoading={isLoading}
                leftIcon={mode === "signin" ? <LogIn className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                className="w-full justify-center text-sm font-bold py-3 mt-2 shadow-xs"
              >
                {mode === "signin" ? "Sign In to Harvest Rescue" : "Create Account & Start Monitoring"}
              </Button>
            </form>

            <div className="p-3 rounded-2xl bg-[#F0F4EF] border border-[#E0E4DF] text-center text-xs text-[#717973]">
              {mode === "signin" ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className="text-[#1B4D3E] font-bold underline cursor-pointer"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="text-[#1B4D3E] font-bold underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
