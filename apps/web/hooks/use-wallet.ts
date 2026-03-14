"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "lapis_xrpl_wallet";

function loadSaved(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * XRPL wallet hook - user pastes their own address.
 * Persists in localStorage across sessions.
 */
export function useWallet() {
  const saved = loadSaved();
  const [address, setAddress] = useState<string | null>(saved);
  const [showModal, setShowModal] = useState(false);

  const connect = useCallback(() => {
    setShowModal(true);
  }, []);

  const confirm = useCallback((addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setAddress(trimmed);
    setShowModal(false);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAddress(null);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    connected: !!address,
    address,
    shortAddress,
    showModal,
    connect,
    confirm,
    disconnect,
    closeModal: () => setShowModal(false),
  };
}
