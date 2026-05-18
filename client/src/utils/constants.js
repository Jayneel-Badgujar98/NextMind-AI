// src/utils/constants.js

export const APP = {
    NAME: "NextMind AI",
    VERSION: "1.0.0",
    DESCRIPTION: "Your Next-Gen Intelligent AI Assistant",
    LOGO_DARK : "/LOGO_DARK.png",
    LOGO_LIGHT : "/LOGO_LIGHT.png",
    LOGO_NAME: "/logo_name.png", // Agar public folder mein hai
    AI_AVATAR: "https://api.dicebear.com/7.x/bottts/svg?seed=NexMind", // Dynamic AI Avatar
    USER_PLACEHOLDER: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
    BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    CHAT: "/api/ai/chat",
    CHAT_HISTORY: "/api/chats",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    // WELCOME_TITLE: `Welcome to ${APP.NAME}`,
    WELCOME_SUBTITLE: "How can I assist your brilliant mind today?",
    INPUT_PLACEHOLDER: "Ask anything to NexMind...",
    FOOTER_TEXT: "NexMind AI can make mistakes. Check important info.",
};