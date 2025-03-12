// For browser extensions
function loadChatboxStyles() {
    if (!document.getElementById('chatbox-styles')) {
        console.log("Loading chatbox styles...");

        const link = document.createElement('link');
        link.rel = 'stylesheet';

        // For browser extensions
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            link.href = chrome.runtime.getURL('style.css');
            console.log("Loading CSS from extension: " + link.href);
        } else {
            // For regular web pages
            link.href = 'style.css';
            console.log("Loading CSS from regular path: " + link.href);
        }

        link.id = 'chatbox-styles';
        document.head.appendChild(link);

        console.log("Chatbox styles loaded with ID: chatbox-styles");
    }
}

// Load CSS first
loadChatboxStyles();

// Ensure chatbox is only created once
if (!document.getElementById('chatBox')) {
    console.log("Creating chatbox...");

    // Create chatbox container
    const chatBox = document.createElement('div');
    chatBox.id = 'chatBox';
    chatBox.innerHTML = `
    <div class="chat-header">
        <div id="resizeHandle"></div> <!-- Resize Handle in Upper Left -->
                Chat 
        <button id="toggleChat">-</button>
        <button id="closeBtn">X</button>
    </div>
    <div class="chat-body"></div>
    <div class="chat-footer">
        <input type="text" placeholder="Type a message..." />
        <button id="sendBtn">Send</button>
    </div>
`;
    // Append chatbox to the page
    document.body.appendChild(chatBox);

    // Event Listeners
    document.getElementById('sendBtn').addEventListener('click', function () {
        const chatInput = document.getElementById('chatInput');
        const chatContent = document.getElementById('chatContent');
        const message = chatInput.value.trim();
        if (message) {
            const messageElement = document.createElement('div');
            messageElement.textContent = `You: ${message}`;
            chatContent.appendChild(messageElement);
            chatContent.scrollTop = chatContent.scrollHeight;
            chatInput.value = '';
        }
    });

    document.getElementById('closeBtn').addEventListener('click', function () {
        document.getElementById('chatBox').style.display = 'none'; // Hide the chatbox
    });

    console.log("Chatbox created and added to page");

    document.getElementById("toggleChat").addEventListener("click", function() {
        chatBox.classList.toggle("collapsed");
    });
}

resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;

    let startX = e.clientX;
    let startY = e.clientY;
    let startWidth = chatBox.offsetWidth;
    let startHeight = chatBox.offsetHeight;

    function onMouseMove(e) {
        if (!isResizing) return;

        let newWidth = startWidth - (e.clientX - startX);
        let newHeight = startHeight - (e.clientY - startY);

        chatBox.style.width = `${Math.max(150, newWidth)}px`;
        chatBox.style.height = `${Math.max(200, newHeight)}px`;
    }

    function onMouseUp() {
        isResizing = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
});

window.onload = function () {
    setTimeout(() => {
        // Select the question content
        let question = document.querySelectorAll('div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div:nth-child(3) > div');
        if (question) {
            let questionText = Array.from(question).map(p => p.innerText).join("\n");
            console.log("Extracted Question:", questionText);
        } else {
            console.log("Question not found! The page structure might have changed.");
        }
    }, 2000); // Delay to ensure content loads
};