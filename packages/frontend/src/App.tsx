import { useState } from "react";

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [status, setStatus] = useState<string>("");

  async function checkHealth() {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setStatus(JSON.stringify(json));
    } catch {
      setStatus("Backend not reachable yet.");
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Modular Chatbot</h1>
      <p>Monorepo bootstrap is ready. Click to ping backend health.</p>
      <button onClick={checkHealth}>Check Backend Health</button>
      <pre>{status}</pre>
    </div>
  );
}
