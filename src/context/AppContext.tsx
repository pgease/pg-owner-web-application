import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { appPrefs } from "@/api/http";
import { getProperties, updateLanguage } from "@/api/propertyOwner";
import type { PropertyResponse } from "@/api/propertyOwner";

type Lang = "hi-IN" | "en-US";

interface AppContextValue {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  selectedPgId: string | null;
  setSelectedPgId: (id: string | null) => void;
  properties: PropertyResponse[];
  refreshProperties: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Lang>(() => appPrefs.getLanguage());
  const [selectedPgId, setSelectedPgIdState] = useState<string | null>(() => appPrefs.getSelectedPgId());
  const [properties, setProperties] = useState<PropertyResponse[]>([]);

  const refreshProperties = useCallback(async () => {
    try {
      const raw = await getProperties();
      const list = Array.isArray(raw) ? raw : (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data) ? (raw as { data: PropertyResponse[] }).data : []);
      setProperties(list);
      setSelectedPgIdState((prev) => {
        const valid = list.some((p) => p.id === prev);
        if (list.length > 0 && (!prev || !valid)) {
          const first = list[0].id;
          appPrefs.setSelectedPgId(first);
          return first;
        }
        return prev;
      });
    } catch {
      setProperties([]);
    }
  }, []);

  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  const setLanguage = useCallback((lang: Lang) => {
    appPrefs.setLanguage(lang);
    setLanguageState(lang);
    updateLanguage(lang).catch(() => {});
  }, []);

  const setSelectedPgId = useCallback((id: string | null) => {
    appPrefs.setSelectedPgId(id);
    setSelectedPgIdState(id);
  }, []);

  const value: AppContextValue = {
    language,
    setLanguage,
    selectedPgId,
    setSelectedPgId,
    properties,
    refreshProperties,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
