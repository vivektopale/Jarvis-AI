
const promptInput = document.getElementById("prompt");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.getElementById("image");
const imageInput = document.querySelector("#image input");

const API_KEY = "AIzaSyCYYq7PfJ2wmVdNgY7h7lmP0ebqgEo8XrQ";
const Api_Url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Object to hold the current user message and image file (if any)
let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  }
};

// Modified: Save a chat message by including the logged-in user
async function storeChatMessage(chatMessage) {
  const loggedInUser = localStorage.getItem("loggedInUser"); // Get logged-in user
  if (!loggedInUser) {
    console.error("No logged-in user found.");
    return;
  }

  try {
    let response = await fetch(`/api/chats/${loggedInUser}`, { // Save chat under specific user
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatMessage)
    });
    let data = await response.json();
    console.log('Chat stored:', data.chat);
  } catch (error) {
    console.error('Error storing chat message:', error);
  }
}

// Generate AI response using your API key via a POST request
async function generateResponse(aiChatBox) {
  const textElem = aiChatBox.querySelector(".ai-chat-area");
  const requestBody = JSON.stringify({
    "contents": [{
      "parts": [
        { "text": user.message },
        ...(user.file.data ? [{ "inline_data": user.file }] : [])
      ]
    }]
  });

  try {
        chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
    let response = await fetch(Api_Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody
    });
    let data = await response.json();
    let apiResponse = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    textElem.innerHTML = apiResponse;

    // Save AI message under the specific user
    storeChatMessage({
      type: "ai",
      message: apiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(error);
    textElem.innerHTML = "Error occurred while fetching response.";
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  }
}

// Helper to create a chat box element from HTML and a class name
function createChatBox(html, classes) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

// Handle the user’s message submission
function handleChatResponse(userMessage) {
  user.message = userMessage;

  // Create the user's chat box
  const userHtml = `
    <img src="user.png" alt="User" width="40">
    <div class="user-chat-area">
      ${user.message}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
    </div>
  `;
  promptInput.value = "";
  const userChatBox = createChatBox(userHtml, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  // Scroll to the bottom
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

  // Save the user's message under the specific user
  storeChatMessage({
    type: "user",
    message: user.message,
    file: user.file.data ? user.file : null,
    timestamp: new Date()
  });

  // Add the AI chat box with a loader and fetch the response
  setTimeout(() => {
    const aiHtml = `
      <img src="ai.png" alt="AI" width="40">
      <div class="ai-chat-area">
        <img src="loader.gif" alt="" class="load" width="30px">
      </div>
    `;
    const aiChatBox = createChatBox(aiHtml, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

// Event listener: Send chat message when "Enter" is pressed
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleChatResponse(promptInput.value);
  }
});

// Handle image upload
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64string = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64string
    };
  };
  reader.readAsDataURL(file);
});

// Click the image button to trigger file input
imageBtn.addEventListener("click", () => {
  imageBtn.querySelector("input").click();

});
