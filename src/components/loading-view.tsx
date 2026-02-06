"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

const messaging = [
    "Analyzing market trends...",
    "Identifying target audience...",
    "Drafting high-converting copy...",
    "Designing storyboard visuals...",
    "Finalizing campaign assets..."
];

export function LoadingView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-24 text-center px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Campaign</h2>

            <div className="h-8 overflow-hidden relative w-full max-w-md">
                {messaging.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            y: [20, 0, 0, -20]
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 2.5,
                            repeat: Infinity,
                            repeatDelay: (messaging.length - 1) * 2.5
                        }}
                        className="absolute inset-0 flex justify-center items-center text-muted-foreground"
                    >
                        <Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> {msg}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
