const sessionHistories = {};
const MODEL_VERSION = "gpt-4o";

/**
 * Handles API requests to OpenAI
 */
async function handleApiRequest(sendResponse, apiKey, sender, request, role) {
    if (!apiKey) {
        return sendResponse({ response: null, error: "API key not found" });
    }

    const tabId = sender.tab.id;
    sessionHistories[tabId] = sessionHistories[tabId] || [];
    sessionHistories[tabId].push({ role, content: request.message });

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL_VERSION,
                messages: sessionHistories[tabId],
                temperature: 0.8,
            }),
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            const assistantResponse = data.choices[0].message.content;
            sessionHistories[tabId].push({ role: "assistant", content: assistantResponse });
            sendResponse({ response: parseMarkdown(assistantResponse) });
        } else {
            sendResponse({ error: "No valid response from OpenAI" });
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        sendResponse({ error: "Failed to fetch AI response" });
    }
}

/**
 * Parses Markdown into HTML
 */
function parseMarkdown(text) {
    return text
        .replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>')
        .replace(/^(#+) (.+)$/gm, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>')
        .replace(/__(.+?)__/g, '<b>$1</b>')
        .replace(/_(.+?)_/g, '<i>$1</i>')
        .replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>')
        .replace(/^([^#<\*\-\d\s].*?)(\n|$)/gm, '<p>$1</p>');
}

/**
 * Handles incoming messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender.tab.id;

    switch (request.type) {
        case "getAiResponse":
        case "sendWrittenCode":
            chrome.storage.local.get("OPENAI_API_KEY", (result) => {
                handleApiRequest(sendResponse, result.OPENAI_API_KEY, sender, request, request.type === "sendWrittenCode" ? "assistant" : "user");
            });
            return true; // Asynchronous response

        case "addMessageToHistory":
            sessionHistories[tabId] = [{ role: "developer", content: request.message }];
            sendResponse({ response: "I read the question and am ready to assist you." });
            return true;

        case "keepAlive":
            console.log("Keeping service worker alive...");
            return true;
    }
    return false; // Unhandled messages
});
