import { useState } from 'react';

// Custom hook to manage chat state and logic
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add functionality later
  const sendMessage = async (message) => {
    // Logic will go here
  };

  return { messages, isLoading, sendMessage };
};

export default useChat;
