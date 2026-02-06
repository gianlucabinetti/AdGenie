"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";

export function HeroSection({ onStart }: { onStart: () => void }) {
    return (
        <div className="relative isolate min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
            <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 sm:opacity-20" />

            {/* Floating Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    x: [0, 100, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px]"
            />

            <div className="container relative z-10 px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-muted-foreground ring-1 ring-white/10 hover:ring-white/20 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span>Powered by Google Gemini 3</span>
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl"
                    >
                        Create Ads <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x">
                            In Seconds.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-8 text-lg leading-8 text-gray-300 max-w-2xl mx-auto"
                    >
                        Stop wasting hours on creative strategy. Input your URL or product brief, and our agentic AI generates professional scripts, storyboards, and campaign assets instantly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <button
                            onClick={onStart}
                            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-white px-8 text-base font-bold text-black transition-all duration-300 hover:bg-gray-200 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 w-full sm:w-auto"
                        >
                            <span className="mr-2">Start Designing</span>
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>

                        <button className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors flex items-center gap-2 px-6 py-4 rounded-full hover:bg-white/5 w-full sm:w-auto justify-center">
                            <Play className="w-4 h-4 fill-current" /> Watch Demo
                        </button>
                    </motion.div>

                    {/* Social Proof / Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-16 pt-8 border-t border-white/5"
                    >
                        <p className="text-sm text-gray-500 mb-4">TRUSTED BY INNOVATIVE MARKETING TEAMS</p>
                        <div className="flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholders for logos */}
                            <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
                            <div className="h-8 w-24 bg-white/20 rounded animate-pulse delay-75" />
                            <div className="h-8 w-24 bg-white/20 rounded animate-pulse delay-150" />
                            <div className="h-8 w-24 bg-white/20 rounded animate-pulse delay-200" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
