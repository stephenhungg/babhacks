"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/nav";
import { AnimatedSphere } from "@/components/landing/animated-sphere";

// Floating orb component
function FloatingOrb({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <div
      className="absolute rounded-full bg-foreground/5 animate-pulse"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + delay}s`,
      }}
    />
  );
}

export default function DashboardPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  function handleAnalyze() {
    if (!githubUrl.trim()) return;
    router.push(`/list?github=${encodeURIComponent(githubUrl)}`);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DashboardNav />

      {/* Animated sphere background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] opacity-20 pointer-events-none">
        <AnimatedSphere />
      </div>

      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{
              top: `${16.66 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{
              left: `${12.5 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingOrb delay={0} size={120} x={10} y={20} />
        <FloatingOrb delay={1} size={80} x={85} y={70} />
        <FloatingOrb delay={2} size={60} x={20} y={80} />
        <FloatingOrb delay={0.5} size={100} x={70} y={15} />
        <FloatingOrb delay={1.5} size={40} x={50} y={60} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-36 pb-10">
        {/* Headline */}
        <h1
          className={`text-4xl lg:text-5xl font-display tracking-tight mb-4 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Start your round
        </h1>

        <p
          className={`text-lg text-muted-foreground mb-8 max-w-xl transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Paste a public GitHub URL to analyze your startup and open a prediction market.
        </p>

        {/* Input section */}
        <div
          className={`transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex gap-0 max-w-xl border border-foreground/20 overflow-hidden focus-within:border-foreground/50 transition-all duration-300 hover:border-foreground/30 bg-background/80 backdrop-blur-sm">
            <input
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder-muted-foreground"
              placeholder="https://github.com/your-org/your-repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              className="px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all duration-300 flex items-center gap-2 shrink-0 group"
            >
              Analyze <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Try: github.com/vercel/next.js or any public repo
          </p>
        </div>

      </div>

      {/* Decorative corner element */}
      <div className="absolute bottom-8 right-8 opacity-30 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 120 120" className="text-foreground">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 60 60"
              to="0 60 60"
              dur="15s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="60" cy="60" r="4" fill="currentColor">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}
