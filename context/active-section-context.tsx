"use client";

import type { SectionName } from "@/lib/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ActiveSectionContextProviderProps = {
  children: React.ReactNode;
};

type ActiveSectionContextType = {
  activeSection: SectionName;
  setActiveSection: React.Dispatch<React.SetStateAction<SectionName>>;
  /** Call on a nav click: suppresses the scroll-spy until the smooth scroll
   *  settles so the active pill doesn't stutter through passed sections. */
  beginNavigation: () => void;
  /** True while a nav-click smooth-scroll is in flight. */
  isNavigating: () => boolean;
};

export const ActiveSectionContext =
  createContext<ActiveSectionContextType | null>(null);

export default function ActiveSectionContextProvider({
  children,
}: ActiveSectionContextProviderProps) {
  const [activeSection, setActiveSection] = useState<SectionName>("Home");

  const navigatingRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNavigating = useCallback(() => navigatingRef.current, []);

  const beginNavigation = useCallback(() => {
    navigatingRef.current = true;
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    // Fallback for browsers without `scrollend` (Safari): cap the suppression.
    fallbackTimer.current = setTimeout(() => {
      navigatingRef.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    const onScrollEnd = () => {
      navigatingRef.current = false;
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("scrollend", onScrollEnd);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  const value = useMemo<ActiveSectionContextType>(
    () => ({
      activeSection,
      setActiveSection,
      beginNavigation,
      isNavigating,
    }),
    [activeSection, beginNavigation, isNavigating],
  );

  return (
    <ActiveSectionContext.Provider value={value}>
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function useActiveSectionContext() {
  const context = useContext(ActiveSectionContext);

  if (context === null) {
    throw new Error(
      "useActiveSectionContext must be used within an ActiveSectionContextProvider",
    );
  }

  return context;
}
