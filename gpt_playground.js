
const sessionHistories = {}

async function handle_api_request(sendResponse, result, sender, request, modelVersion, role) {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving API key:", chrome.runtime.lastError);
        sendResponse({response: null, error: "Error retrieving API key"});
    } else {
        const apiKey = result.OPENAI_API_KEY;
        if (apiKey) {
            const tabId = sender.tab.id;
            sessionHistories[tabId].push({role: role, content: request.message});
            // sendResponse({response: sessionHistories[tabId]});
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: modelVersion,
                    messages: sessionHistories[tabId],
                    temperature: 0.8,
                }),
            });

            // Parse the response
            const data = await response.json();
            if (data.choices && data.choices.length > 0) {

                sessionHistories[tabId].push({role: 'assistant', content:  data.choices[0].message.content})

                let response_prompt = parseMarkdown(data.choices[0].message.content)

                sendResponse({response: response_prompt});

            } else {
                sendResponse({error: "No valid response from OpenAI"});
            }

        } else {
            sendResponse({response: null, error: "API key not found"});

        }

    }
}

function parseHeadings(markdownText) {
    return markdownText.replace(/^(#+) (.+)$/gm, (match, hashes, text) => {
        const level = hashes.length;
        return `<h${level}><span class="math-inline">\{text\}</h</span>{level}>`;
    });
}

function parseBoldItalic(markdownText) {
    markdownText = markdownText.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    markdownText = markdownText.replace(/\*(.+?)\*/g, '<i>$1</i>');
    markdownText = markdownText.replace(/__(.+?)__/g, '<b>$1</b>');
    markdownText = markdownText.replace(/_(.+?)_/g, '<i>$1</i>');
    return markdownText;
}

function parseLists(markdownText) {
    const listRegex = /^((\s*)([\*\-\+]|\d+\.)\s+(.+?))(\n|$)/gm;
    let result = markdownText.replace(listRegex, (match, item, indent, marker, text) => {
        const isOrdered = /^\d+\.$/.test(marker);
        const listTag = isOrdered ? 'ol' : 'ul';
        const listItem = `<li>${text}</li>`;
        return `${indent}<${listTag}>${listItem}</${listTag}>`;
    });

    // Clean up the lists by grouping consecutive list items
    let cleanedResult = result.replace(/<\/ul>\s*<ul>/g, '');
    cleanedResult = cleanedResult.replace(/<\/ol>\s*<ol>/g, '');

    // Group items into list tags
    return cleanedResult.replace(/(<ol>|<\/ol>|<ul>|<\/ul>)([\s\S]*?)(<ol>|<\/ol>|<ul>|<\/ul>|$)/g, (match, startTag, items, endTag) => {
        if (startTag && endTag) {
            return startTag + items.replace(/<\/li>\s*<li>/g, '') + endTag;
        }
        return match;
    });
}
function parseCodeBlocks(markdownText) {
    return markdownText.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
}

function parseParagraphs(markdownText) {
    return markdownText.replace(/^([^#<\*\-\d\s].*?)(\n|$)/gm, '<p>$1</p>');
}

function parseMarkdown(text) {
    let result = text;
    result = parseCodeBlocks(result);
    result = parseHeadings(result);
    result = parseBoldItalic(result);
    result = parseLists(result);
    result = parseParagraphs(result);
    return result;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const modelVersion = "gpt-4o";
    const tabId = sender.tab.id;
    if (request.type === "getAiResponse") {

                // Fetch the API key from chrome storage
        chrome.storage.local.get("OPENAI_API_KEY", async (result) => {
            await handle_api_request(sendResponse, result, sender, request, modelVersion, 'user');
        });
        return true; // Indicate that sendResponse will be called asynchronously
    } else if (request.type === 'addMessageToHistory'){

        sessionHistories[tabId] = []
        sessionHistories[tabId].push({ role: 'developer', content: request.message });
        sendResponse({response: 'I read the question and ready to be for your service and '})
        return true;
    } else if (request.type === "keepAlive" ){
        console.log("Keeping service worker alive...");
        return true;
    } else if (request.type === "sendWrittenCode") {
        chrome.storage.local.get("OPENAI_API_KEY", async (result) => {
            await handle_api_request(sendResponse, result, sender, request, modelVersion, 'assistant');
        });
        return true;
    }
    return false; // Handle messages this listener doesn't care about.
});
