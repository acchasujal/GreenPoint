import React, { useState } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useToast } from "./Toast";

type Tab = "login" | "signup";

export const AuthCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"citizen" | "collector">("citizen");
  const [accessCode, setAccessCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, signup, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      console.log(`[AUTH] Attempting login for email: ${email}`);
      await login(email, password);

      // After successful login, the AuthContext will have updated currentUser
      // We'll redirect based on the role
      // Since login is async and updates state, we need a small delay
      setTimeout(() => {
        const savedUser = localStorage.getItem("current_user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          console.log(
            `[AUTH] Login successful. User role: ${user.role}, ID: ${user.user_id}`
          );
          console.log(`[AUTH] Redirecting to /${user.role} dashboard`);

          showToast(
            `Welcome back, ${user.email}!`,
            "success",
            3000
          );

          // Hard redirect based on role
          const targetRoute =
            user.role === "collector" ? "/collector" : "/citizen";
          navigate(targetRoute, { replace: true });
        }
      }, 100);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Login failed";
      console.error(`[AUTH] Login error: ${errorMsg}`);
      setLocalError(errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (role === "collector" && !accessCode) {
      setLocalError("Collector Access Code is required");
      showToast("Collector Access Code is required", "error");
      return;
    }

    try {
      console.log(
        `[AUTH] Attempting signup for email: ${email}, role: ${role}`
      );
      await signup(email, password, role, accessCode);

      // After successful signup (which also logs in), redirect
      setTimeout(() => {
        const savedUser = localStorage.getItem("current_user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          console.log(
            `[AUTH] Signup successful. User role: ${user.role}, ID: ${user.user_id}`
          );
          console.log(`[AUTH] Redirecting to /${user.role} dashboard`);

          showToast(
            `Welcome to GreenPoint, ${user.email}!`,
            "success",
            3000
          );

          // Hard redirect based on role
          const targetRoute =
            user.role === "collector" ? "/collector" : "/citizen";
          navigate(targetRoute, { replace: true });
        }
      }, 100);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Signup failed";
      console.error(`[AUTH] Signup error: ${errorMsg}`);
      setLocalError(errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A8A] rounded-full mb-4">
            <span className="text-2xl font-bold text-white">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GreenPoint</h1>
          <p className="text-gray-600">Mumbai Civic Reward System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors ${
                activeTab === "login"
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-4 px-4 text-center font-semibold transition-colors ${
                activeTab === "signup"
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-600 text-sm font-medium flex-1">
                  {displayError}
                </span>
              </div>
            )}

            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setLocalError("Password reset coming soon!");
                    }}
                    className="text-sm text-[#1E3A8A] hover:underline font-medium"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Register As
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <select
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as "citizen" | "collector")
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition appearance-none bg-white"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="collector">BMC Collector</option>
                    </select>
                  </div>
                </div>

                {/* Collector Access Code - Conditional */}
                {role === "collector" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collector Access Code
                    </label>
                    <input
                      type="password"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter access code"
                      className="w-full px-4 py-2.5 border border-yellow-300 bg-yellow-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for BMC Collector registration
                    </p>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters recommended
                  </p>
                </div>

                {/* Signup Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Powered by GreenPoint Mumbai • Civic Engagement Initiative
        </p>
      </div>
    </div>
  );
};
