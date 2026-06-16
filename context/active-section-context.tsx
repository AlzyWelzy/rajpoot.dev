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
  timeOfLastClick: number;
  setTimeOfLastClick: React.Dispatch<React.SetStateAction<number>>;
  /** True while a nav-click smooth-scroll is in flight; the scroll-spy pauses
   *  so the active pill doesn't stutter through every passed section. */
  isNavigating: () => boolean;
};

export const ActiveSectionContext =
  createContext<ActiveSectionContextType | null>(null);

export default function ActiveSectionContextProvider({
  children,
}: ActiveSectionContextProviderProps) {
  const [activeSection, setActiveSection] = useState<SectionName>("Home");
  // Kept for the existing click handlers' API; the suppression itself is driven
  // by the navigating ref below so it can end precisely on `scrollend`.
  const [timeOfLastClick, setTimeOfLastClickState] = useState(0);

  const navigatingRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNavigating = useCallback(() => navigatingRef.current, []);

  const setTimeOfLastClick = useCallback<
    React.Dispatch<React.SetStateAction<number>>
  >((value) => {
    setTimeOfLastClickState(value);
    // A click happened → begin suppressing the spy until the scroll settles.
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
      timeOfLastClick,
      setTimeOfLastClick,
      isNavigating,
    }),
    [activeSection, timeOfLastClick, setTimeOfLastClick, isNavigating],
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
