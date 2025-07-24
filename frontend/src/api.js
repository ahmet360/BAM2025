const api = {
    async *chatStream(uid, message) {
        const res = await fetch("/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, message }),
        });
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        let done = false;
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                yield new TextDecoder().decode(value);
            }
        }
    },
    async getRecovery(uid) {
        const res = await fetch(`/recovery?uid=${uid}`);
        if (!res.ok) throw new Error("Failed to fetch recovery");
        return res.json();
    },
    async logWorkout(uid, payload) {
        const res = await fetch("/log/workout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to log workout");
        return res.json();
    },
    async chatWithAzure(message) {
        const res = await fetch("/api/azure-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error("Failed to connect to AI");
        const data = await res.json();
        return data.response;
    },
};

export default api; 