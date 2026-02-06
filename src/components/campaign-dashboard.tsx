"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layout, Users, Share2, Sparkles, Loader2, Download, Copy, Check, Package, Image as ImageIcon, MessageSquarePlus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type DashboardProps = {
    data: any;
    onReset: () => void;
    onUpdate?: (newData: any) => void;
};

export function CampaignDashboard({ data, onReset, onUpdate }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<"strategy" | "creative">("strategy");
    const [isRefining, setIsRefining] = useState(false);
    const [feedback, setFeedback] = useState("");

    const { strategy, creative } = data || {};

    if (!strategy || !creative) {
        return <div className="p-8 text-center text-muted-foreground">Waiting for campaign data...</div>;
    }

    const handleRefine = async () => {
        if (!feedback) return;
        setIsRefining(true);
        try {
            const res = await fetch("/api/refine-campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ strategy, creative, feedback })
            });
            const newData = await res.json();

            if (onUpdate) onUpdate(newData);
            setFeedback("");
            setActiveTab("strategy");
        } catch (e) {
            console.error(e);
            alert("Refinement failed.");
        } finally {
            setIsRefining(false);
        }
    };

    const [generatingAssets, setGeneratingAssets] = useState<{ [key: number]: 'idle' | 'image' | 'done' | 'error' }>({});
    const [assetData, setAssetData] = useState<{ [key: number]: { image?: string, refinedPrompt?: string } }>({});
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
    const [generatingCopy, setGeneratingCopy] = useState<{ [key: number]: boolean }>({});
    const [copyData, setCopyData] = useState<{ [key: number]: any }>({});
    const [customTextInputs, setCustomTextInputs] = useState<{ [key: number]: string }>({});

    const handleCopyPrompt = (prompt: string, id: string) => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        setCopiedPromptId(id);
        setTimeout(() => setCopiedPromptId(null), 2000);
    };

    const generateSingleAsset = async (index: number, prompt: string, overlayText?: string) => {
        setGeneratingAssets(prev => ({ ...prev, [index]: 'image' }));
        try {
            // Determine aspect ratio based on platform (User Specs)
            const platforms = Array.isArray(data.platform) ? data.platform : [data.platform || 'all'];
            const normalizedPlatforms = platforms.map((p: any) => (p || '').toLowerCase());

            let aspectRatio = "16:9";

            // 1. Check specific asset placement if available
            const assetPlacement = creative?.assets?.[index]?.placement?.toLowerCase() || "";

            if (assetPlacement.includes("story") || assetPlacement.includes("reel") || assetPlacement.includes("tiktok") || assetPlacement.includes("shorts")) {
                aspectRatio = "9:16";
            } else if (assetPlacement.includes("feed") || assetPlacement.includes("post")) {
                // Instagram/Facebook feeds are usually 4:5
                if (normalizedPlatforms.some((p: string) => p.includes("instagram") || p.includes("facebook"))) {
                    aspectRatio = "4:5";
                } else if (normalizedPlatforms.some((p: string) => p.includes("linkedin") || p.includes("twitter"))) {
                    aspectRatio = "1:1"; // LinkedIn/Twitter often square or landscape
                }
            } else {
                // 2. Fallback to Platform Default
                if (normalizedPlatforms.some((p: string) => p.includes("tiktok") || p.includes("reel") || p.includes("shorts"))) {
                    aspectRatio = "9:16";
                } else if (normalizedPlatforms.some((p: string) => p.includes("instagram") || p.includes("facebook"))) {
                    aspectRatio = "4:5";
                } else if (normalizedPlatforms.some((p: string) => p.includes("linkedin") || p.includes("pinterest"))) {
                    aspectRatio = "1:1"; // Pinterest is often vertical but 2:3 or 1:1 safe
                    if (normalizedPlatforms.some((p: string) => p.includes("pinterest"))) aspectRatio = "2:3";
                }
            }

            const imgRes = await fetch("/api/generate-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, campaignContext: data, aspectRatio, overlayText })
            });

            const imgData = await imgRes.json();
            if (imgData.error || !imgData.image) throw new Error(imgData.error);

            setAssetData(prev => ({
                ...prev,
                [index]: {
                    image: imgData.isSvg
                        ? `data:image/svg+xml;base64,${imgData.image}`
                        : (imgData.image.startsWith('http') || imgData.image.startsWith('data:'))
                            ? imgData.image
                            : `data:image/jpeg;base64,${imgData.image}`,
                    refinedPrompt: imgData.refinedPrompt
                }
            }));
            setGeneratingAssets(prev => ({ ...prev, [index]: 'done' }));

        } catch (e) {
            console.error(e);
            setGeneratingAssets(prev => ({ ...prev, [index]: 'error' }));
        }
    };

    const handleGenerateAllAssets = async () => {
        setIsGeneratingAll(true);
        const assets = creative.assets || creative.script; // Fallback only if schema migration issues, but we assume assets
        // Process sequentially to avoid rate limits
        for (let i = 0; i < assets.length; i++) {
            await generateSingleAsset(i, assets[i].imagePrompt);

            // Significant delay for free tier (12s) to respect strict RPM limits
            if (i < assets.length - 1) {
                await new Promise(r => setTimeout(r, 12000));
            }
        }
        setIsGeneratingAll(false);
    };

    const handleDownloadAll = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const assets = creative.assets || creative.script || [];
            let count = 0;

            for (let i = 0; i < assets.length; i++) {
                const imgData = assetData[i]?.image;
                if (!imgData) continue;

                // Handle data URI or URL
                let blob: Blob | null = null;
                if (imgData.startsWith('data:')) {
                    const res = await fetch(imgData);
                    blob = await res.blob();
                } else if (imgData.startsWith('http')) {
                    try {
                        const res = await fetch(imgData);
                        blob = await res.blob();
                    } catch (e) { console.warn("Failed to fetch image for zip", e); }
                }

                if (blob) {
                    const ext = blob.type.split('/')[1] || 'jpg';
                    const filename = `ad-asset-${i + 1}-${data.productName.substring(0, 10).replace(/\s+/g, '_')}.${ext}`;
                    zip.file(filename, blob);
                    count++;
                }
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `${data.productName.replace(/\s+/g, '_')}_campaign_assets.zip`);
            } else {
                alert("No generate images found to download. Please generate assets first.");
            }

        } catch (e) {
            console.error("Zip download failed", e);
            alert("Failed to create zip file.");
        } finally {
            setIsZipping(false);
        }
    };

    const handleGenerateCopy = async (index: number, asset: any) => {
        setGeneratingCopy(prev => ({ ...prev, [index]: true }));
        try {
            const imageBase64 = assetData[index]?.image;

            const res = await fetch("/api/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName: data.productName,
                    productDescription: data.productDescription || "N/A",
                    strategy: strategy,
                    imageContext: {
                        imageBase64: imageBase64 || undefined,
                        imageDescription: asset.visualDescription,
                    }
                })
            });

            const result = await res.json();
            if (result.error) throw new Error(result.error);

            setCopyData(prev => ({ ...prev, [index]: result }));

        } catch (e) {
            console.error("Copy generation failed", e);
            alert("Failed to generate copy.");
        } finally {
            setGeneratingCopy(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleCopyText = (asset: any, id: string, index: number) => {
        const finalHeadline = copyData[index]?.headline || asset.headline;
        const finalBody = copyData[index]?.body || asset.tagline;

        const text = `HEADLINE:\n${finalHeadline}\n\nPRIMARY TEXT:\n${finalBody}\n\nPLACEMENT:\n${asset.placement}`;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const platformDisplay = Array.isArray(data.platform)
        ? data.platform.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")
        : (data.platform || "All");

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/10 p-6 rounded-2xl border border-white/5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Campaign Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {data.productName} • {platformDisplay}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {data.logo && (
                        <div className="h-12 w-12 bg-white rounded-lg p-1 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={data.logo} alt="Brand Logo" className="h-full w-full object-contain" />
                        </div>
                    )}
                    <button onClick={onReset} className="px-4 py-2 text-sm font-medium border border-white/10 rounded-full hover:bg-white/5 transition-colors">
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-1 bg-muted/20 p-1.5 rounded-xl w-max border border-white/5">
                    <button
                        onClick={() => setActiveTab("strategy")}
                        className={cn(
                            "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                            activeTab === "strategy" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-white/5 text-muted-foreground"
                        )}
                    >
                        Strategy & Insights
                    </button>
                    <button
                        onClick={() => setActiveTab("creative")}
                        className={cn(
                            "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                            activeTab === "creative" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-white/5 text-muted-foreground"
                        )}
                    >
                        Creative Assets
                    </button>
                </div>

                {activeTab === 'creative' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerateAllAssets}
                            disabled={isGeneratingAll}
                            className={cn("px-5 py-2.5 text-sm font-semibold text-white rounded-full flex items-center gap-2 shadow-lg hover:scale-105 transition-all text-nowrap", isGeneratingAll ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600")}
                        >
                            {isGeneratingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate All
                        </button>
                        <button
                            onClick={handleDownloadAll}
                            disabled={isZipping}
                            className={cn("px-5 py-2.5 text-sm font-semibold text-white rounded-full flex items-center gap-2 shadow-lg hover:scale-105 transition-all text-nowrap", isZipping ? "bg-gray-600" : "bg-green-600 hover:bg-green-500")}
                        >
                            {isZipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                            Download All (.zip)
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === "strategy" ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                                <Users className="h-6 w-6 text-blue-400" />
                                Target Persona
                            </h3>
                            <div className="text-card-foreground/90 leading-relaxed space-y-6">
                                <p className="text-lg">{strategy.targetPersona}</p>

                                {strategy.personaDetails && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Demographics</span>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.personaDetails.demographics?.map((trait: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-200">{trait}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Interests</span>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.personaDetails.keyInterests?.map((trait: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-200">{trait}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 sm:col-span-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Buying Behavior</span>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.personaDetails.buyingBehavior?.map((trait: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-200">{trait}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">Emotional Hook</span>
                                    <p className="text-xl font-serif italic text-blue-100">"{strategy.emotionalHook}"</p>
                                </div>

                                {strategy.effectiveFont && (
                                    <div className="mt-4 p-6 bg-pink-500/5 border border-pink-500/10 rounded-xl">
                                        <span className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-2 block">Recommended Typography</span>
                                        <p className="text-xl tracking-tight font-medium text-pink-100">{strategy.effectiveFont}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                                <Share2 className="h-6 w-6 text-purple-400" />
                                Platform Strategy
                            </h3>
                            <div className="text-card-foreground/90 leading-relaxed space-y-6">
                                <p>{strategy.platformBestPractices}</p>

                                {strategy.contentPillars && strategy.contentPillars.length > 0 && (
                                    <div className="mt-4">
                                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 block">Content Pillars</span>
                                        <div className="flex flex-wrap gap-2">
                                            {strategy.contentPillars.map((pillar: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-200">
                                                    {pillar}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 block mt-4">Key Pain Points</span>
                                    <ul className="space-y-3">
                                        {strategy.painPoints.map((point: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2.5" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {strategy.hashtags && strategy.hashtags.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <p className="text-sm text-muted-foreground flex flex-wrap gap-2">
                                            {strategy.hashtags.map((tag: string, i: number) => (
                                                <span key={i} className="text-blue-400">#{tag.replace('#', '')}</span>
                                            ))}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Refinement UI */}
                        <section className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 border border-white/5 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-yellow-400" /> Refine Strategy</h3>
                                    <p className="text-muted-foreground">Not quite right? Ask the AI to adjust the tone, audience, or creative direction.</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto flex-1">
                                    <input
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="e.g. 'Make it funnier' or 'Focus more on Gen Z'..."
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={handleRefine}
                                        disabled={!feedback || isRefining}
                                        className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refine"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-xl text-center max-w-4xl mx-auto">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Big Idea</span>
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{creative.mainConcept}</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">{creative.rationale}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {creative.assets?.map((asset: any, index: number) => {
                                const hasNewCopy = !!copyData[index];
                                const currentHeadline = copyData[index]?.headline || asset.headline;
                                const currentBody = copyData[index]?.body || asset.tagline;

                                return (
                                    <div key={index} className="group bg-card border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col h-full">
                                        <div className="aspect-[4/5] bg-black/40 relative overflow-hidden">
                                            {assetData[index]?.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={assetData[index].image}
                                                    alt={asset.headline}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-black/20">
                                                    <Layout className="h-12 w-12 text-white/20 mb-4" />
                                                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{asset.visualDescription}</p>
                                                </div>
                                            )}

                                            {/* Action Overlay - Minimized to just Regenerate/Download Image */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 backdrop-blur-sm z-20">
                                                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                                    <button
                                                        onClick={() => generateSingleAsset(index, asset.imagePrompt)}
                                                        className="w-full px-4 py-2.5 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                                                    >
                                                        {generatingAssets[index] === 'image' ? (
                                                            <> <Loader2 className="w-4 h-4 animate-spin" /> Generating </>
                                                        ) : (
                                                            <> <Sparkles className="w-4 h-4" /> Regenerate Image </>
                                                        )}
                                                    </button>
                                                    {assetData[index]?.image && (
                                                        <a
                                                            href={assetData[index].image}
                                                            download={`ad-asset-${index}.jpg`}
                                                            className="w-full px-4 py-2.5 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-4 h-4" /> Download
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4 z-10 space-y-2 pointer-events-none">
                                                {generatingAssets[index] === 'image' && (
                                                    <span className="px-3 py-1 bg-blue-500/80 text-white text-xs font-bold rounded-full backdrop-blur-md animate-pulse block text-right">Generating Img</span>
                                                )}
                                                {generatingCopy[index] && (
                                                    <span className="px-3 py-1 bg-purple-500/80 text-white text-xs font-bold rounded-full backdrop-blur-md animate-pulse block text-right">Writing Copy...</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Primary Actions Bar */}
                                        <div className="p-4 border-b border-white/5 bg-white/5 flex gap-2 overflow-x-auto">
                                            <button
                                                onClick={() => handleGenerateCopy(index, asset)}
                                                disabled={generatingCopy[index]}
                                                className={cn(
                                                    "flex-1 px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap",
                                                    hasNewCopy
                                                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
                                                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                                                )}
                                            >
                                                {generatingCopy[index] ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                                                {hasNewCopy ? "Refine Copy" : "Generate Copywrited Version"}
                                            </button>
                                        </div>

                                        {/* Suggested Text Overlay Section */}
                                        {hasNewCopy && copyData[index]?.overlayText && (
                                            <div className="px-4 py-3 bg-indigo-950/30 border-b border-white/5">
                                                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-2 block flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Embed Text into Image
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {copyData[index].overlayText.map((txt: string, i: number) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => generateSingleAsset(index, assetData[index]?.refinedPrompt || asset.imagePrompt, txt)}
                                                            className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-xs rounded border border-indigo-500/30 transition-colors text-left"
                                                            title="Regenerate image with this text"
                                                        >
                                                            + "{txt}"
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const allText = copyData[index].overlayText.join(" | ");
                                                            generateSingleAsset(index, assetData[index]?.refinedPrompt || asset.imagePrompt, allText);
                                                        }}
                                                        className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-500 transition-colors"
                                                    >
                                                        Combine All
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Or type custom text..."
                                                        value={customTextInputs[index] || ""}
                                                        onChange={(e) => setCustomTextInputs(prev => ({ ...prev, [index]: e.target.value }))}
                                                        className="flex-1 px-2 py-1 text-xs bg-black/20 border border-indigo-500/30 rounded text-indigo-100 placeholder:text-indigo-400/50 focus:outline-none focus:border-indigo-400"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && customTextInputs[index]) {
                                                                generateSingleAsset(index, assetData[index]?.refinedPrompt || asset.imagePrompt, customTextInputs[index]);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (customTextInputs[index]) {
                                                                generateSingleAsset(index, assetData[index]?.refinedPrompt || asset.imagePrompt, customTextInputs[index]);
                                                            }
                                                        }}
                                                        disabled={!customTextInputs[index]}
                                                        className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs rounded border border-indigo-500/50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}


                                        <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-card to-black/20">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-muted-foreground">
                                                    {asset.placement}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopyText(asset, asset.id || index.toString(), index)}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                        title="Copy Ad Text"
                                                    >
                                                        {copiedId === (asset.id || index.toString()) ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyPrompt(assetData[index]?.refinedPrompt || asset.imagePrompt, index.toString())}
                                                        className="text-gray-400 hover:text-white transition-colors ml-2"
                                                        title="Copy Visual Prompt"
                                                    >
                                                        {copiedPromptId === index.toString() ? <Check className="w-4 h-4 text-green-400" /> : <ImageIcon className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className={cn("font-bold text-xl leading-snug mb-2 transition-colors", hasNewCopy ? "text-indigo-300" : "text-white group-hover:text-blue-400")}>
                                                {currentHeadline}
                                            </h4>
                                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">{currentBody}</p>

                                            {hasNewCopy && (
                                                <div className="mt-2 mb-4 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">AI Rationale</span>
                                                    <p className="text-xs text-indigo-200/80 leading-relaxed">{copyData[index].rationale}</p>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-white/5 text-xs text-muted-foreground">
                                                <p className="font-bold mb-1.5 uppercase tracking-wider text-white/40">Visual Prompt</p>
                                                <p className="line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{asset.imagePrompt}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
