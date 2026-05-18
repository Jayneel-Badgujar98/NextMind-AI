// src/components/chat/TypingIndicator.jsx


import React from "react";
import { motion } from "framer-motion";

const dots = [0, 1, 2];

const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-3 max-w-[85%]">
      
      {/* AI Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-2xl overflow-hidden border border-white/10 bg-[#181818] shadow-lg shadow-black/20">
        <img
          src="/LOGO_DARK.png"
          alt="NextMind"
          className="h-full w-full object-contain p-1"
        />
      </div>

      {/* Typing Bubble */}
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
          gap-2
          px-5
          py-4
          rounded-3xl
          rounded-bl-md
          bg-[#181818]/95
          border
          border-white/10
          backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.35)]
        "
      >
        {/* subtle glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#10A37F]/5 via-transparent to-[#10A37F]/5 pointer-events-none" />

        {/* AI text */}
        <span className="text-sm text-zinc-400 mr-1 select-none">
          NextMind is thinking
        </span>

        {/* Animated Dots */}
        <div className="flex items-center gap-1">
          {dots.map((dot) => (
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
                h-2.5
                w-2.5
                rounded-full
                bg-[#10A37F]
                shadow-[0_0_10px_rgba(16,163,127,0.55)]
              "
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TypingIndicator;


// // src/components/chat/TypingIndicator.jsx
// import React from 'react';
// import { Bot, Sparkles } from 'lucide-react';

// const TypingIndicator = () => {
//   return (
//     <div className="flex w-full justify-start mb-6">
//       <div className="flex max-w-[80%] md:max-w-[70%] gap-4 flex-row">
        
//         {/* 1. AI Avatar (Consistent with MessageBubble) */}
//         <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
//           <Bot size={18} className="text-white animate-pulse" style={{ animationDuration: '3s' }} />
//         </div>

//         {/* 2. Premium Glassmorphism Bubble */}
//         <div className="relative px-5 py-3.5 bg-gray-800/80 backdrop-blur-xl text-gray-200 rounded-2xl rounded-tl-none border border-gray-700/50 shadow-md flex items-center gap-3 overflow-hidden">
          
//           {/* Subtle glowing background effect inside the bubble */}
//           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50"></div>

//           {/* AI Magic Sparkle Icon */}
//           <Sparkles size={16} className="text-emerald-400 relative z-10 animate-pulse" />
          
//           {/* Text & Smooth Dots */}
//           <span className="text-[14.5px] font-medium text-gray-300 relative z-10 flex items-center tracking-wide">
//             NextMind is thinking
            
//             {/* Elegant micro-dots instead of huge bouncing balls */}
//             <span className="flex items-center gap-1 ml-2.5 mt-1">
//               <span 
//                 className="w-1.5 h-1.5 bg-emerald-400/90 rounded-full animate-bounce" 
//                 style={{ animationDelay: '0ms', animationDuration: '1s' }}
//               ></span>
//               <span 
//                 className="w-1.5 h-1.5 bg-emerald-400/90 rounded-full animate-bounce" 
//                 style={{ animationDelay: '150ms', animationDuration: '1s' }}
//               ></span>
//               <span 
//                 className="w-1.5 h-1.5 bg-emerald-400/90 rounded-full animate-bounce" 
//                 style={{ animationDelay: '300ms', animationDuration: '1s' }}
//               ></span>
//             </span>
//           </span>
          
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TypingIndicator;