import React, { createContext, useContext, useState, useEffect } from "react";

export interface CurrentUser {
  user_id: string;
  email: string;
  role: "citizen" | "collector";
  session_token: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    role: "citizen" | "collector",
    accessCode?: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    console.log("[AUTH] Checking for existing user session on mount");
    const savedUser = localStorage.getItem("current_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log(
          `[AUTH] Found existing user session: ${parsedUser.email} (${parsedUser.role})`
        );
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("[AUTH] Failed to parse saved user from localStorage", e);
        localStorage.removeItem("current_user");
      }
    } else {
      console.log("[AUTH] No existing user session found");
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    console.log(`[AUTH] Starting login process for: ${email}`);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      console.log(`[AUTH] Making API request to ${apiUrl}/login`);

      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(`[AUTH] API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Login failed";
        console.error(`[AUTH] Login API Error (${response.status}): ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[AUTH] API Response Data:`, data);

      const user: CurrentUser = {
        user_id: data.data.user_id,
        email: data.data.email,
        role: data.data.role as "citizen" | "collector",
        session_token: data.data.session_token,
      };

      console.log(
        `[AUTH] Setting user in state: ${user.email} (${user.role}) with ID: ${user.user_id}`
      );
      setCurrentUser(user);

      console.log(`[AUTH] Saving user to localStorage`);
      localStorage.setItem("current_user", JSON.stringify(user));

      console.log(`[AUTH] Login successful`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      console.error(`[AUTH] Login failed:`, err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: "citizen" | "collector",
    accessCode?: string
  ) => {
    setIsLoading(true);
    setError(null);
    console.log(
      `[AUTH] Starting signup process for: ${email} as ${role}`
    );

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      console.log(`[AUTH] Making API request to ${apiUrl}/signup`);

      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
          access_code: role === "collector" ? accessCode : undefined,
        }),
      });

      console.log(`[AUTH] Signup API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Signup failed";
        console.error(`[AUTH] Signup API Error (${response.status}): ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`[AUTH] Signup successful, attempting auto-login`);
      // After successful signup, automatically log the user in
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      console.error(`[AUTH] Signup failed:`, err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log(
      `[AUTH] Logout called for user: ${currentUser?.email || "unknown"}`
    );
    setCurrentUser(null);
    localStorage.removeItem("current_user");
    setError(null);
    console.log("[AUTH] User session cleared");
  };

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
