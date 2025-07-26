import React, { useRef, useState } from "react";
import api from "../api";

export default function ChatBox() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I’m your fitness coach. How can I help today?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);

    // Scroll to bottom on new message
    React.useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    async function handleSend(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const userMsg = { role: "user", content: input };
        setMessages((msgs) => [...msgs, userMsg]);
        setInput("");
        setLoading(true);
        setMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);
        try {
            const aiReply = await api.chatWithAzure(input);
            setMessages((msgs) => {
                const out = [...msgs];
                out[out.length - 1] = { role: "assistant", content: aiReply };
                return out;
            });
        } catch {
            setMessages((msgs) => {
                const out = [...msgs];
                out[out.length - 1] = { role: "assistant", content: "[Error: failed to connect to AI]" };
                return out;
            });
        }
        setLoading(false);
    }

    return (
        <div className="chatbox">
            <div className="chat-messages" ref={chatRef}>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                            m.role === "user" ? "chat-bubble user" : "chat-bubble bot"
                        }
                    >
                        {m.content}
                    </div>
                ))}
            </div>
            <form className="chat-input-row" onSubmit={handleSend}>
                <input
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                    autoFocus
                />
                <button className="chat-send" disabled={loading || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
} 