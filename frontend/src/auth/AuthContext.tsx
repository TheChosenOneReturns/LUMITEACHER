import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AvatarId = "explorer" | "dreamer" | "inventor";

export interface DemoProfile {
  name: string;
  age: number;
  favoriteTheme: string;
  avatarId: AvatarId;
}

interface AuthContextValue {
  profile: DemoProfile | null;
  login: (profile: DemoProfile) => void;
  logout: () => void;
  updateProfile: (profile: DemoProfile) => void;
}

const storageKey = "story-teacher:demo-profile";
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredProfile(): DemoProfile | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const profile = JSON.parse(stored) as Partial<DemoProfile>;
    if (
      typeof profile.name !== "string" ||
      typeof profile.age !== "number" ||
      typeof profile.favoriteTheme !== "string" ||
      !["explorer", "dreamer", "inventor"].includes(profile.avatarId ?? "")
    ) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return profile as DemoProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DemoProfile | null>(readStoredProfile);

  function persist(nextProfile: DemoProfile | null) {
    setProfile(nextProfile);
    if (nextProfile) {
      localStorage.setItem(storageKey, JSON.stringify(nextProfile));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      login: persist,
      logout: () => persist(null),
      updateProfile: persist,
    }),
    [profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}

export const demoProfile: DemoProfile = {
  name: "Sofía",
  age: 8,
  favoriteTheme: "Espacio",
  avatarId: "explorer",
};
