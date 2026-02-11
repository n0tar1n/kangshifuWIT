import React, { createContext, useContext, useState } from "react";

export type DisabilityType = "hearing" | "speech" | "sight";
export type ContextType = "clinic" | "canteen" | "helpdesk";
export type MRTStation = "Dhoby Ghaut" | "Bugis" | "Jurong East" | "Paya Lebar" | "Serangoon";

export interface Message {
  id: string;
  timestamp: Date;
  type: "partner" | "user";
  originalInput: string;
  detectedIntent?: string;
  summary?: string;
  outputFormat?: string;
}

interface AppContextType {
  selectedDisabilities: DisabilityType[];
  toggleDisability: (disability: DisabilityType) => void;
  selectedContext: ContextType;
  setSelectedContext: (context: ContextType) => void;
  selectedStation: MRTStation;
  setSelectedStation: (station: MRTStation) => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>([]);
  const [selectedContext, setSelectedContext] = useState<ContextType>("clinic");
  const [selectedStation, setSelectedStation] = useState<MRTStation>("Dhoby Ghaut");
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleDisability = (disability: DisabilityType) => {
    setSelectedDisabilities((prev) =>
      prev.includes(disability)
        ? prev.filter((d) => d !== disability)
        : [...prev, disability]
    );
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <AppContext.Provider
      value={{
        selectedDisabilities,
        toggleDisability,
        selectedContext,
        setSelectedContext,
        selectedStation,
        setSelectedStation,
        messages,
        addMessage,
        clearMessages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}