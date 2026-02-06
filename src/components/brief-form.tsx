"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type BriefData = {
    productName: string;
    productDescription: string;
    targetAudience: string;
    brandColors: string;
    secondaryBrandColors?: string;
    tone: string;
    platform: string[];
    trustIdentifiers: string;
    logo?: string; // Base64 Data URI
};

export function BriefForm({ onSubmit }: { onSubmit: (data: BriefData) => void }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<BriefData>({
        productName: "",
        productDescription: "",
        targetAudience: "",
        brandColors: "#000000",
        secondaryBrandColors: "#ffffff",
        tone: "Professional",
        platform: ["all"],
        trustIdentifiers: "",
        logo: undefined,
    });

    const totalSteps = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = () => {
        onSubmit(data);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-background -z-20" />
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

            <div className="w-full max-w-3xl relative z-10">
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
                    >
                        <Sparkles className="w-3 h-3" /> AI-Powered Briefing
                    </motion.div>
                    <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">Campaign Brief</h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">Tell us about your product. Our agents will research your audience and craft the perfect campaign.</p>
                </div>

                <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>

                    <div className="min-h-[400px] flex flex-col justify-center">
                        <AnimatePresence mode="wait" initial={false} custom={step}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={1}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200 ml-1">Product Name</label>
                                        <input
                                            name="productName"
                                            value={data.productName}
                                            onChange={handleChange}
                                            className="block w-full rounded-xl border border-white/10 bg-black/20 text-white shadow-inner focus:border-primary focus:ring-1 focus:ring-primary sm:text-lg px-6 py-4 placeholder:text-gray-600 transition-all focus:bg-black/40 outline-none"
                                            placeholder="e.g. Acme Smart CRM"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200 ml-1">Product Description</label>
                                        <textarea
                                            name="productDescription"
                                            value={data.productDescription}
                                            onChange={handleChange}
                                            rows={5}
                                            className="block w-full rounded-xl border border-white/10 bg-black/20 text-white shadow-inner focus:border-primary focus:ring-1 focus:ring-primary sm:text-lg px-6 py-4 placeholder:text-gray-600 transition-all focus:bg-black/40 resize-none outline-none"
                                            placeholder="What does it do? What problems does it solve? Be as descriptive as possible..."
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={1}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200 ml-1">Target Audience</label>
                                        <input
                                            name="targetAudience"
                                            value={data.targetAudience}
                                            onChange={handleChange}
                                            className="block w-full rounded-xl border border-white/10 bg-black/20 text-white shadow-inner focus:border-primary focus:ring-1 focus:ring-primary sm:text-lg px-6 py-4 placeholder:text-gray-600 transition-all focus:bg-black/40 outline-none"
                                            placeholder="e.g. SMB Owners, Marketing Managers, ages 25-45"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200 ml-1">Tone of Voice</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Professional', 'Casual', 'Humorous', 'Luxury', 'Urgent'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setData({ ...data, tone: t })}
                                                    className={cn(
                                                        "px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left",
                                                        data.tone === t
                                                            ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]"
                                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    custom={1}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <label className="text-sm font-medium text-gray-200 ml-1 mb-3 block">Primary Brand Color</label>
                                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10">
                                            <div className="relative group">
                                                <input
                                                    type="color"
                                                    name="brandColors"
                                                    value={data.brandColors}
                                                    onChange={handleChange}
                                                    className="h-16 w-16 rounded-lg opacity-0 cursor-pointer absolute inset-0 z-10"
                                                />
                                                <div className="h-16 w-16 rounded-lg border-2 border-white/20 shadow-lg" style={{ backgroundColor: data.brandColors }} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-mono text-lg">{data.brandColors}</p>
                                                <p className="text-sm text-gray-500">Click the square to change</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-200 ml-1 mb-3 block">Secondary Brand Color <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
                                                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10">
                                                    <div className="relative group">
                                                        <input
                                                            type="color"
                                                            name="secondaryBrandColors"
                                                            value={data.secondaryBrandColors || "#ffffff"}
                                                            onChange={handleChange}
                                                            className="h-16 w-16 rounded-lg opacity-0 cursor-pointer absolute inset-0 z-10"
                                                        />
                                                        <div className="h-16 w-16 rounded-lg border-2 border-white/20 shadow-lg" style={{ backgroundColor: data.secondaryBrandColors || "#ffffff" }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-mono text-lg">{data.secondaryBrandColors || "#ffffff"}</p>
                                                        <p className="text-sm text-gray-500">Click the square to change</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-200 ml-1 mb-3 block">Platform Format (Select Multiple)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            {[
                                                { id: 'all', label: 'All Formats', desc: 'Auto-resize' },
                                                { id: 'instagram', label: 'Instagram', desc: '9:16 Vertical' },
                                                { id: 'facebook', label: 'Facebook', desc: '4:5 Feed' },
                                                { id: 'youtube', label: 'YouTube', desc: '16:9 Landscape' },
                                                { id: 'linkedin', label: 'LinkedIn', desc: '1:1 Square' },
                                                { id: 'x', label: 'X (Twitter)', desc: '16:9 Landscape' }
                                            ].map((p) => {
                                                const isSelected = data.platform.includes(p.id);
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            let newPlatforms = [...data.platform];
                                                            if (p.id === 'all') {
                                                                // If All is clicked, clear others and set All
                                                                newPlatforms = ['all'];
                                                            } else {
                                                                // If specific is clicked
                                                                if (isSelected) {
                                                                    // Deselect
                                                                    newPlatforms = newPlatforms.filter(id => id !== p.id);
                                                                    // If nothing left, default to All
                                                                    if (newPlatforms.length === 0) newPlatforms = ['all'];
                                                                } else {
                                                                    // Select
                                                                    newPlatforms = newPlatforms.filter(id => id !== 'all'); // Remove All if adding specific
                                                                    newPlatforms.push(p.id);
                                                                }
                                                            }
                                                            setData({ ...data, platform: newPlatforms });
                                                        }}
                                                        className={cn(
                                                            "p-3 rounded-xl border transition-all text-left group relative overflow-hidden",
                                                            isSelected
                                                                ? "bg-primary/20 border-primary"
                                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <motion.div
                                                                layoutId="active-ring"
                                                                className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                                                                initial={false}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                            />
                                                        )}
                                                        <div className={cn("font-medium transition-colors text-sm", isSelected ? "text-white" : "text-gray-300 group-hover:text-white")}>{p.label}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">{p.desc}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-gray-200 ml-1 block">Brand Logo <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
                                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10">
                                            <div className="shrink-0">
                                                {data.logo ? (
                                                    <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative group">
                                                        <img src={data.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                                                        <button
                                                            onClick={() => setData({ ...data, logo: undefined })}
                                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-gray-500">
                                                        <span className="text-xs">No Logo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setData({ ...data, logo: reader.result as string });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Upload a PNG or JPG. We'll use this to brand your assets.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-200 ml-1">Trust Symbols / Testimonials <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
                                        </div>
                                        <textarea
                                            name="trustIdentifiers"
                                            value={data.trustIdentifiers}
                                            onChange={handleChange}
                                            rows={3}
                                            className="block w-full rounded-xl border border-white/10 bg-black/20 text-white shadow-inner focus:border-primary focus:ring-1 focus:ring-primary sm:text-base px-6 py-4 placeholder:text-gray-600 transition-all focus:bg-black/40 resize-none outline-none"
                                            placeholder="e.g. 'Rated 5 stars by 10,000+ users', 'As seen in Forbes', or a specific customer quote..."
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-12 flex justify-between items-center pt-6 border-t border-white/10">
                        <button
                            onClick={prevStep}
                            disabled={step === 1}
                            className={cn(
                                "flex items-center px-6 py-3 text-sm font-medium rounded-full transition-all",
                                step === 1
                                    ? 'opacity-0 pointer-events-none'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </button>

                        {step < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="group flex items-center px-8 py-3 text-base font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]"
                            >
                                Next Step <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="group flex items-center px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-primary to-purple-600 rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]"
                            >
                                Launch Campaign <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Footnote */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Step {step} of {totalSteps} — Your data is processed securely by Gemini Enterprise.
                </p>
            </div>
        </div>
    );
}
