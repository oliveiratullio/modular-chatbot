import { useState, useEffect } from "react";

const USER_ID_KEY = "chatbot_user_id";

export function useUserId() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Tenta recuperar o userId do localStorage
    const savedUserId = localStorage.getItem(USER_ID_KEY);

    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      // Gera um novo userId se não existir
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(USER_ID_KEY, newUserId);
      setUserId(newUserId);
    }
  }, []);

  return userId;
}
