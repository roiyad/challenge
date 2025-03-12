document.addEventListener('DOMContentLoaded', function() {
    const toggleChatButton = document.getElementById('toggleChat');

    toggleChatButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: toggleChat
            });
        });
    });

    function toggleChat() {
        chrome.storage.local.get(['chatVisible'], function(result) {
            const chatVisible = result.chatVisible === undefined ? true : !result.chatVisible; // default to visible

            chrome.storage.local.set({ chatVisible: chatVisible }, function() {
                const chatBox = document.getElementById('myChatBox');
                if (chatVisible) {
                    if (!chatBox) {
                        createChatBox();
                    } else {
                        chatBox.style.display = 'block';
                    }

                } else if (chatBox) {
                    chatBox.style.display = 'none';
                }
            });
        });
    }
});
