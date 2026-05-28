import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Configure axios instance for authentication requests
export const authApi = axios.create({
  baseURL: backendUrl,
  withCredentials: true, // Crucial for sending and receiving secure httpOnly session cookies
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

   // Check user session on startup
  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authApi.get("/api/auth/me");
      if (response.data?.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.log("No active user session found (Guest Mode active).");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogleHash = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        if (accessToken) {
          try {
            setLoading(true);
            // Fetch verified user details directly from Google's public UserInfo endpoint
            const res = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const profileData = {
              name: res.data.name,
              email: res.data.email,
              googleId: res.data.sub, // 'sub' is the unique Google user ID
              avatar: res.data.picture
            };
            
            // Log in using our backend endpoint
            const result = await socialLogin("google", profileData);
            if (result.success) {
              // Wipe out the hash token from URL cleanly
              window.history.replaceState(null, null, " ");
            }
          } catch (err) {
            console.error("Failed to authenticate with Google OAuth:", err);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    const handleGitHubCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        try {
          setLoading(true);
          // Call our backend to exchange the code for access_token and fetch the profile
          const result = await socialLogin("github", { code });
          if (result.success) {
            // Clean up the code query parameter from URL bar cleanly
            window.history.replaceState(null, null, window.location.pathname);
          } else {
            console.error("GitHub live login failed on backend:", result.message);
            // Still wipe the code from URL so it doesn't try to log in again on refresh
            window.history.replaceState(null, null, window.location.pathname);
          }
        } catch (err) {
          console.error("Failed to authenticate with GitHub OAuth:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    handleGoogleHash();
    handleGitHubCode();
    checkAuth();
  }, []);

  // Login with credentials
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/login", { email, password });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: "Login failed" };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid credentials or network issue.";
      setError(errMsg);
      
      // Pass along unverified requirement for redirect flows
      if (err.response?.status === 401 && err.response?.data?.requireVerification) {
        return { 
          success: false, 
          requireVerification: true, 
          email: err.response.data.email, 
          message: errMsg 
        };
      }
      
      return { success: false, message: errMsg };
    }
  };

  // Register with credentials
  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/register", { name, email, password });
      if (response.data?.success) {
        if (response.data?.requireVerification) {
          return { success: true, requireVerification: true, email: response.data.email };
        }
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: "Registration failed" };
    } catch (err) {
      const errMsg = err.response?.data?.message || "An account with this email may already exist.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Verify Email address via OTP
  const verifyEmail = async (email, otp) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/verify-email", { email, otp });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: "Verification failed." };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to verify verification code.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Resend Email verification OTP
  const resendVerificationOtp = async (email) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/resend-verification", { email });
      if (response.data?.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: "Resending code failed." };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to resend code.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Forgot Password recovery
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/forgot-password", { email });
      if (response.data?.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: "Failed to request recovery code." };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Recovery request failed.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Reset Password using OTP
  const resetPassword = async (email, otp, newPassword) => {
    try {
      setError(null);
      const response = await authApi.post("/api/auth/reset-password", { email, otp, newPassword });
      if (response.data?.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: "Resetting password failed." };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reset password.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.post("/api/auth/logout");
      setUser(null);
      return { success: true };
    } catch (err) {
      console.error("Logout Error:", err);
      setUser(null); // Clear local state anyway
      return { success: true };
    }
  };

  // Social Login handler (Google / GitHub)
  const socialLogin = async (provider, profileData) => {
    try {
      setError(null);
      const response = await authApi.post(`/api/auth/oauth/${provider}`, profileData);
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: "Social login failed" };
    } catch (err) {
      const errMsg = err.response?.data?.message || `${provider} authentication failed.`;
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const updateUserPreferences = async (preferences) => {
    try {
      setError(null);
      const response = await authApi.put("/api/auth/preferences", preferences);
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: "Failed to update preferences" };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update preferences.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const deleteUserAccount = async () => {
    try {
      setError(null);
      const response = await authApi.delete("/api/auth/delete-account");
      if (response.data?.success) {
        setUser(null);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: "Failed to delete account" };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete account.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        socialLogin,
        checkAuth,
        verifyEmail,
        resendVerificationOtp,
        forgotPassword,
        resetPassword,
        updateUserPreferences,
        deleteUserAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
