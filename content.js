// For browser extensions

const firstPromptMessage = `Read the following question. In the following conversation, the user will ask you 
hints and explanations on how to solve it. Be explanatory, kind, and help with every question he has. 
Do not give a full solution unless explicitly asked. Answer only what is asked. 
Your goal is to help the user learn.`;

// global variable to restore the last code the user wrote
let last_code = ''

// Load chatbox styles
function loadChatboxStyles() {
    if (document.getElementById("chatbox-styles")) return;

    console.log("Loading chatbox styles...");

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "chatbox-styles";

    // Handle browser extension vs. web page
    link.href = typeof chrome !== "undefined" && chrome.runtime
        ? chrome.runtime.getURL("style.css")
        : "style.css";

    console.log("CSS Loaded from:", link.href);
    document.head.appendChild(link);
}

// Initialize chatbox UI
function createChatbox() {
    if (document.getElementById("chatBox")) return;

    console.log("Creating chatbox...");

    const chatBox = document.createElement("div");
    chatBox.id = "chatBox";

    const chatHeader = createChatHeader();
    const chatBody = createChatBody();
    const chatFooter = createChatFooter();

    chatBox.append(chatHeader, chatBody, chatFooter);
    document.body.appendChild(chatBox);

    console.log("Chatbox created successfully!");
}

/**
 * Create chatbox header.
 */
function createChatHeader() {
    const header = document.createElement("div");
    header.classList.add("chat-header");

    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resizeHandle";

    const title = document.createTextNode(" Chat ");
    const toggleBtn = createButton("toggleChat", "-", toggleChatbox);
    const closeBtn = createButton("closeBtn", "X", closeChatbox);

    header.append(resizeHandle, title, toggleBtn, closeBtn);
    return header;
}

/**
 * Create chatbox body.
 */
function createChatBody() {
    const body = document.createElement("div");
    body.classList.add("chat-body");

    const welcomeMessage = document.createElement("div");
    welcomeMessage.textContent = "Hello, my name is Mikasa. I will be your AI assistant. Feel free to ask for help.";
    welcomeMessage.classList.add("mikasa-message");

    body.appendChild(welcomeMessage);
    return body;
}

/**
 * Create chatbox footer.
 */
function createChatFooter() {
    const footer = document.createElement("div");
    footer.classList.add("chat-footer");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";

    const sendBtn = createButton("sendBtn", "Send", handleUserMessage);

    footer.append(input, sendBtn);
    return footer;
}

/**
 * Create a button element with an event listener.
 */
function createButton(id, text, clickHandler) {
    const button = document.createElement("button");
    button.id = id;
    button.textContent = text;
    button.addEventListener("click", clickHandler);
    return button;
}

// Handle user messages
function handleUserMessage() {
    const chatInput = document.querySelector(".chat-footer input");
    const chatBody = document.querySelector(".chat-body");
    const message = chatInput.value.trim();

    if (!message) return;

    appendMessage("User", message, "user-message");
    chatInput.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    extractUserCode();

    // Request AI response
    setTimeout(() => {
        chrome.runtime.sendMessage({ type: "getAiResponse", message, reasoning_effort: "high" }, (response) => {
            console.log("Response from background:", response);
            const responseText = response?.response || `<strong>Mikasa:</strong> ${response?.error || "No response received."}`;
            appendMessage("Mikasa", responseText, "mikasa-message");
        });
    }, 2000);
}

/**
 * Append a new message to the chat.
 */
function appendMessage(sender, message, className) {
    const chatBody = document.querySelector(".chat-body");
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messageDiv.classList.add(className);
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}


// Extract user's written code
function extractUserCode() {
    const codeElements = document.querySelectorAll('#editor .monaco-editor-background .view-lines');
    if (!codeElements) return console.log("Cannot find the written code");

    const writtenCode = Array.from(codeElements).map(p => p.innerText).join("\n");
    if (writtenCode === last_code) return;

    last_code = writtenCode;
    const userCodeMessage = `This is the user code. Save it as an input in case he asks about it. 
    Do not mention the written code unless the user requests it:\n\n${writtenCode}`;

    console.log("Code has been sent.");
    chrome.runtime.sendMessage({ type: "sendWrittenCode", message: userCodeMessage });
}

// Add chatbox resizing functionality
function enableChatboxResizing() {
    const chatBox = document.getElementById("chatBox");
    const resizeHandle = document.getElementById("resizeHandle");

    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        let startX = e.clientX, startY = e.clientY;
        let startWidth = chatBox.offsetWidth, startHeight = chatBox.offsetHeight;
        let isResizing = true;

        function onMouseMove(e) {
            if (!isResizing) return;
            chatBox.style.width = `${Math.max(150, startWidth - (e.clientX - startX))}px`;
            chatBox.style.height = `${Math.max(200, startHeight - (e.clientY - startY))}px`;
        }

        function onMouseUp() {
            isResizing = false;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
}

// Extract question from the page
function extractQuestion() {
    setTimeout(() => {
        const questionElements = document.querySelectorAll(
            "div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div:nth-child(3) > div"
        );

        if (!questionElements) return console.log("Question not found! The page structure might have changed.");

        const questionText = Array.from(questionElements).map(p => p.innerText).join("\n");
        const message = firstPromptMessage + questionText;

        chrome.runtime.sendMessage({ type: "addMessageToHistory", message }, (response) => {
            console.log("Response from background:", response);
        });

        console.log("Extracted Question:", questionText);
    }, 2000);
}

// Keep service worker alive
function keepServiceWorkerAlive() {
    setInterval(() => chrome.runtime.sendMessage({ type: "keepAlive" }), 25000);
}

function toggleChatbox() {
    document.getElementById("chatBox").classList.toggle("collapsed");
}


function closeChatbox() {
    document.getElementById("chatBox").style.display = "none";
}


// ---- Execute Functions ----
window.onload = function () {
    loadChatboxStyles();
    createChatbox();
    enableChatboxResizing();
    extractQuestion();
    keepServiceWorkerAlive();
};
