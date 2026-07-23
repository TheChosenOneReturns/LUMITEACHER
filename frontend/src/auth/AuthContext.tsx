import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@story-teacher/shared";
import { api } from "../api/client";
import { getSessionUserId, setSessionUserId } from "./session";

export type AvatarId = string;

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  login: (userId: string) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (update: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(getSessionUserId()));

  async function refreshProfile() {
    if (!getSessionUserId()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await api.getMe());
    } catch {
      setSessionUserId(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshProfile();
  }, []);

  async function login(userId: string): Promise<UserProfile> {
    setSessionUserId(userId);
    try {
      const next = await api.getMe();
      setProfile(next);
      return next;
    } catch (error) {
      setSessionUserId(null);
      throw error;
    }
  }

  function logout() {
    setSessionUserId(null);
    setProfile(null);
  }

  async function updateProfile(update: Partial<UserProfile>): Promise<UserProfile> {
    const next = await api.updateMe(update);
    setProfile(next);
    return next;
  }

  const value = useMemo<AuthContextValue>(
    () => ({ profile, loading, login, logout, updateProfile, refreshProfile }),
    [profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}
