"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginWithMetaMask = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask tidak terinstall.");
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const walletAddress = accounts[0].toLowerCase();
    const nonceRes = await API.get(`/auth/nonce/${walletAddress}`);
    const { message } = nonceRes.data.data;
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, walletAddress],
    });
    const verifyRes = await API.post("/auth/verify-signature", {
      walletAddress,
      signature,
    });
    const { token: newToken, user: newUser } = verifyRes.data.data;
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithMetaMask,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
