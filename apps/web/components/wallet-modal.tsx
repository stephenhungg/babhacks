"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
}

export function WalletModal({ open, onClose, onConfirm }: WalletModalProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addr = input.trim();
    if (!addr.startsWith("r") || addr.length < 25 || addr.length > 35) {
      setError("Enter a valid XRPL address (starts with r, 25-35 characters)");
      return;
    }
    setError("");
    onConfirm(addr);
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative bg-background border border-foreground/10 shadow-2xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5" />
          <h2 className="text-lg font-display">Connect XRPL wallet</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Paste your XRPL testnet address. This is where you&apos;ll receive MPT equity tokens when a round settles.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              className="w-full border border-foreground/20 bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-foreground/50 transition placeholder-muted-foreground"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5">{error}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Don&apos;t have one?{" "}
            <a
              href="https://faucet.altnet.rippletest.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition"
            >
              Get a free testnet wallet
            </a>
          </p>

          <button
            type="submit"
            className="w-full py-3 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all"
          >
            Connect
          </button>
        </form>
      </div>
    </div>
  );
}
