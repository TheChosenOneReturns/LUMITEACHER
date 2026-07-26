import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@story-teacher/shared";
import { signOut } from "aws-amplify/auth";
import { api, ApiClientError } from "../api/client";
import { authMode } from "./config";
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
  const [loading, setLoading] = useState(
    authMode === "cognito" || Boolean(getSessionUserId()),
  );

  async function refreshProfile() {
    if (authMode === "demo" && !getSessionUserId()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await api.getMe());
    } catch (error) {
      if (
        authMode === "cognito" &&
        error instanceof ApiClientError &&
        error.status === 401
      ) {
        await signOut().catch(() => undefined);
      }
      if (authMode === "demo") setSessionUserId(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshProfile();
  }, []);

  async function login(userId: string): Promise<UserProfile> {
    if (authMode === "cognito") {
      throw new Error("El ingreso Cognito no acepta perfiles demo.");
    }
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
    if (authMode === "cognito") void signOut();
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
