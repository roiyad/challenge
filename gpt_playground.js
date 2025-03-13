
const sessionHistories = {}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const modelVersion = "gpt-4o";
    const tabId = sender.tab.id;
    if (request.type === "getAiResponse") {

                // Fetch the API key from chrome storage
        chrome.storage.local.get("OPENAI_API_KEY", async (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving API key:", chrome.runtime.lastError);
                sendResponse({response: null, error: "Error retrieving API key"});
            } else {
                const apiKey = result.OPENAI_API_KEY;
                if (apiKey) {
                    const tabId = sender.tab.id;
                    sessionHistories[tabId].push({role: "user", content: request.message});
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

                        sendResponse({response: data.choices[0].message.content});
                        let response_prompt = data.choices[0].message.content
                        sessionHistories[tabId].push({role: 'assistant', content:response_prompt})
                        sendResponse({response: response_prompt});

                    } else {
                        sendResponse({error: "No valid response from OpenAI"});
                    }

                } else {
                    sendResponse({response: null, error: "API key not found"});

                }

            }
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
    }
    return false; // Handle messages this listener doesn't care about.
});

                // Check if the API Key exists
                // if (!apiKey) {
                //     console.error("API Key is missing!");
                //     sendResponse({error: "API Key is missing"});
                //     return;
                // }
                //
                // console.log("Using API Key:", apiKey);
                //
                // // Proceed with the API request

//         });
//     return true; // Keep the message channel open
// });
