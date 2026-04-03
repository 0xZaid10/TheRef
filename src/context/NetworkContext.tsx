"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { NETWORKS } from "@/config/networks";
import { resetClient } from "@/lib/genlayer";

const STORAGE_KEY = "theref_network";

const NetworkContext = createContext({
  network: null,
  networkId: null,
  setNetwork: () => {},
  clearNetwork: () => {},
  isReady: false,
});

export function NetworkProvider({ children }) {
  const [networkId, setNetworkId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && NETWORKS[stored]) {
        setNetworkId(stored);
      }
    } catch {
    } finally {
      setIsReady(true);
    }
  }, []);

  const setNetwork = useCallback((id) => {
    const prev = networkId ? NETWORKS[networkId] : null;
    if (prev) resetClient(prev);
    setNetworkId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, [networkId]);

  const clearNetwork = useCallback(() => {
    if (networkId) {
      const prev = NETWORKS[networkId];
      if (prev) resetClient(prev);
    }
    setNetworkId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [networkId]);

  const network = networkId ? NETWORKS[networkId] : null;

  return (
    <NetworkContext.Provider value={{ network, networkId, setNetwork, clearNetwork, isReady }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
