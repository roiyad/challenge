# AI-Assisted Coding Helper

## Overview
**Mikasa** is an AI-powered assistant designed to help you improve your coding skills and solve programming challenges efficiently.

### Why Use Mikasa Instead of Directly Querying AI Models?
While you could interact directly with models like OpenAI, Gemini, or Claude, Mikasa offers several advantages:
- **Persistent Context**: Mikasa retains your current answer across page reloads, ensuring continuity in problem-solving.
- **Guided Learning**: The chatbot is designed to **not** immediately give you the solution unless explicitly requested, encouraging deeper learning.
- **Seamless Code Assistance**: Every time you send a message, Mikasa understands your current response and can guide you without requiring you to repeatedly copy and paste code.

## Getting Started
To install and run the Chrome extension, refer to this tutorial:
[Chrome Extension Setup Guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=he)

## How It Works
The extension consists of two key components:
1. **Content Script** – Runs the Chrome extension within the webpage.
2. **Worker Script** – Handles communication with the OpenAI API.

### Worker Requests
The worker processes four types of requests:
1. **User API Response**: Handles questions asked by the user.
2. **Question and Examples Storage**: Saves conversation history for context-aware responses.
3. **User Code Submission**: Retains submitted code to maintain chat context.
4. **Worker Keep-Alive Mechanism**: Since Chrome terminates inactive workers after 30 seconds, the system sends a **ping every 25 seconds** to keep the worker running.

---


### How to start the script
1. First make sure your Chrome extension is working
2. You need an open AI security key 
3. After you got it paste the key on row 7 in gpt_playground.js where it has written YOUR_OPENAI_API_KEY unmark the shadow 
and you good to go

Mikasa is designed to enhance your coding experience by providing **intelligent guidance** while ensuring that you stay engaged in the learning process!

