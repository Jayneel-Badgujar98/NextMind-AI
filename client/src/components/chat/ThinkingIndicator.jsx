// src/components/chat/ThinkingIndicator.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThinkingIndicator = ({ status }) => {
  const { theme } = useTheme();
  const displayStatus = status || "NextMind is thinking";

  // Determine icon and styling based on status message content
  const isRunning = displayStatus.includes("Running") || displayStatus.includes("⚙️");
  const isFinished = displayStatus.includes("Finished") || displayStatus.includes("✅");

  // Clean emoji/prefix from status text if present for a cleaner UI
  const cleanStatusText = displayStatus
    .replace(/^[⚙️✅\s]+/, "") // Remove starting emoji and whitespace
    .trim();

  return (
    <div className="flex items-end gap-3 max-w-[85%]">
      {/* AI Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181818] shadow-lg shadow-black/5 dark:shadow-black/20">
        <img
          src={theme === "dark" ? "/LOGO_DARK.png" : "/LOGO_LIGHT.png"}
          alt="NextMind"
          className="h-full w-full object-contain p-1"
        />
      </div>

      {/* Thinking/Status Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        className="
          relative
          flex
          items-center
          gap-3
          px-5
          py-4
          rounded-3xl
          rounded-bl-md
          bg-white/90
          dark:bg-[#181818]/95
          border
          border-slate-200
          dark:border-white/10
          backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.1)]
          dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
        "
      >
        {/* subtle glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#10A37F]/5 via-transparent to-[#10A37F]/5 pointer-events-none" />

        {/* Dynamic Status Icon */}
        <div className="flex items-center justify-center shrink-0">
          {isRunning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="text-[#10A37F]"
            >
              <Loader2 size={16} className="stroke-[2.5]" />
            </motion.div>
          ) : isFinished ? (
            <CheckCircle2 size={16} className="text-emerald-500 stroke-[2.5]" />
          ) : (
            <Sparkles size={16} className="text-[#10A37F] animate-pulse" />
          )}
        </div>

        {/* Status Text */}
        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 select-none tracking-wide">
          {cleanStatusText}
        </span>

        {/* Animated Bouncing/Pulsing Dots (only when not running/finished tools specifically) */}
        {!isRunning && !isFinished && (
          <div className="flex items-center gap-1 ml-1">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: dot * 0.15,
                  ease: "easeInOut",
                }}
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-[#10A37F]
                  shadow-[0_0_10px_rgba(16,163,127,0.55)]
                "
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ThinkingIndicator;
