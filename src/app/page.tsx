"use client";

import { useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { BriefForm, BriefData } from "@/components/brief-form";
import { LoadingView } from "@/components/loading-view";
import { CampaignDashboard } from "@/components/campaign-dashboard";

export default function Home() {
  const [view, setView] = useState<"hero" | "brief" | "loading" | "dashboard">("hero");
  const [campaignData, setCampaignData] = useState<any>(null);

  const handleStart = () => setView("brief");

  const handleBriefSubmit = async (data: BriefData) => {
    setView("loading");
    try {
      const response = await fetch("/api/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const result = await response.json();
      setCampaignData({ ...result, ...data });
      setView("dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to generate campaign. Please try again.");
      setView("brief");
    }
  };

  return (
    <main className="flex min-h-screen flex-col w-full bg-background selection:bg-primary/20">
      {/* Global Logo */}
      <div className="absolute top-8 left-8 z-50">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ad-genie-logo.png"
            alt="Ad Genie Logo"
            className="h-28 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {view === "hero" && <HeroSection onStart={handleStart} />}
      {view === "brief" && <BriefForm onSubmit={handleBriefSubmit} />}
      {view === "loading" && <LoadingView />}
      {view === "dashboard" && campaignData && (
        <CampaignDashboard
          data={campaignData}
          onReset={() => {
            setCampaignData(null);
            setView("hero");
          }}
          onUpdate={(newData) => setCampaignData((prev: any) => ({ ...prev, ...newData }))}
        />
      )}
    </main>
  );
}
