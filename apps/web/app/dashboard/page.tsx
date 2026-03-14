"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/nav";
import { AnimatedSphere } from "@/components/landing/animated-sphere";
import { getMarkets } from "@/lib/api";
import type { ValuationMarket } from "@/lib/api-types";

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}B`;
  if (n >= 1) return `$${n.toFixed(1)}M`;
  return `$${(n * 1000).toFixed(0)}K`;
}

function repoName(githubUrl: string): string {
  const parts = githubUrl.replace(/^https?:\/\/github\.com\//, "").split("/");
  return parts[1] || parts[0];
}

export default function DashboardPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [markets, setMarkets] = useState<ValuationMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    getMarkets()
      .then(setMarkets)
      .catch(() => setMarkets([]))
      .finally(() => setLoading(false));
  }, []);

  function handleAnalyze() {
    if (!githubUrl.trim()) return;
    router.push(`/list?github=${encodeURIComponent(githubUrl.trim())}`);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DashboardNav />

      {/* Animated sphere background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] opacity-20 pointer-events-none">
        <AnimatedSphere />
      </div>

      {/* Subtle background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        {[...Array(10)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground"
            style={{ top: `${10 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto w-full">

          {/* List your startup section */}
          <div className={`mb-20 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-3xl font-display tracking-tight mb-2">
              List your startup
            </h1>
            <p className="text-muted-foreground mb-8 text-sm max-w-xl">
              Paste your public GitHub URL to get an AI analysis, open a prediction market, and let the crowd price your valuation.
            </p>

            <div className="flex gap-0 max-w-xl border border-foreground/20 overflow-hidden focus-within:border-foreground/50 transition-all duration-300 hover:border-foreground/30 bg-background/80 backdrop-blur-sm">
              <input
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder-muted-foreground"
                placeholder="https://github.com/your-startup/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all duration-300 flex items-center gap-2 shrink-0 group"
              >
                List <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              Try: github.com/vercel/next.js or any public repo
            </p>
          </div>

          {/* Active markets grid */}
          <div className={`transition-all duration-500 delay-150 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-px bg-foreground/30" />
              <span className="text-xs font-mono text-muted-foreground">Open markets</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : markets.length === 0 ? (
              <div className="border border-dashed border-foreground/20 p-12 text-center">
                <p className="text-sm text-muted-foreground">No markets yet. Analyze a repo to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {markets.map((m) => (
                  <Link
                    key={m.id}
                    href={`/market/${m.id}`}
                    className="group border border-foreground/10 hover:border-foreground/30 transition-all duration-300 p-5 bg-background/50 hover:bg-foreground/[0.02]"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-base">{repoName(m.githubUrl)}</h3>
                        <span className="text-xs font-mono text-muted-foreground truncate block max-w-[160px]">
                          {m.githubUrl.replace("https://github.com/", "")}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        m.status === "closed"
                          ? "border-foreground/20 text-muted-foreground"
                          : "border-green-500/30 text-green-500"
                      }`}>
                        {m.status === "closed" ? "Closed" : "Live"}
                      </span>
                    </div>

                    {/* Valuation */}
                    <div className="mb-4">
                      <div className="text-2xl font-display">
                        {m.consensusValuation ? fmt(m.consensusValuation) : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">crowd valuation</div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-1.5 border-t border-foreground/10 pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Bets</span>
                        <span className="font-mono">{m.bets.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono">
                          ${m.bets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                        </span>
                      </div>
                      {m.agentValuation && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">AI estimate</span>
                          <span className="font-mono">{fmt(m.agentValuation)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      View market <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
