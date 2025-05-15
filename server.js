const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the `chats` directory exists
const chatsDir = path.join(__dirname, 'chats');
if (!fs.existsSync(chatsDir)) {
    fs.mkdirSync(chatsDir);
}

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* --------------------- Helper Functions --------------------- */

// Read chat history for a specific user
function readUserChat(username) {
    const userChatPath = path.join(chatsDir, `${username}.json`);
    if (!fs.existsSync(userChatPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(userChatPath, 'utf8'));
    } catch (error) {
        console.error(`Error reading chat history for ${username}:`, error);
        return [];
    }
}

// Write chat history for a specific user
function writeUserChat(username, chatHistory) {
    const userChatPath = path.join(chatsDir, `${username}.json`);
    try {
        fs.writeFileSync(userChatPath, JSON.stringify(chatHistory, null, 2));
    } catch (error) {
        console.error(`Error saving chat history for ${username}:`, error);
    }
}

/* --------------------- Chat Endpoints --------------------- */

// Get chat history for a specific user
app.get('/api/chats/:username', (req, res) => {
    const { username } = req.params;
    const chatHistory = readUserChat(username);
    res.json(chatHistory);
});

// Save a chat message for a specific user
app.post('/api/chats/:username', (req, res) => {
    const { username } = req.params;
    const chatMessage = req.body;
    chatMessage.id = Date.now();

    let userChatHistory = readUserChat(username);
    userChatHistory.push(chatMessage);
    writeUserChat(username, userChatHistory);

    res.json({ success: true, chat: chatMessage });
});

// Delete all chat history for a user
app.delete('/api/chats/:username', (req, res) => {
    const { username } = req.params;
    writeUserChat(username, []);
    res.json({ success: true });
});

// Delete a specific chat message by ID
app.delete('/api/chats/:username/:id', (req, res) => {
    const { username, id } = req.params;
    let userChatHistory = readUserChat(username);
    userChatHistory = userChatHistory.filter(chat => chat.id !== parseInt(id, 10));
    writeUserChat(username, userChatHistory);
    res.json({ success: true });
});

/* ------------------ User Registration & Login ------------------ */

const userFilePath = path.join(__dirname, 'user.json');

// Read all users
function readUsers() {
    try {
        if (!fs.existsSync(userFilePath)) return [];
        const data = fs.readFileSync(userFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading user.json:", error);
        return [];
    }
}

// Write user data
function writeUsers(users) {
    try {
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing user.json:", error);
    }
}

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, mobile, password } = req.body;

    if (!username || !email || !mobile || !password) {
        return res.status(400).json({ error: "All fields (username, email, mobile, and password) are required." });
    }

    const users = readUsers();

    // Check for duplicate entries
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ error: "Username already exists." });
    }
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ error: "Email already registered." });
    }
    if (users.find(user => user.mobile === mobile)) {
        return res.status(400).json({ error: "Mobile number already registered." });
    }


    users.push({ username, email, mobile, password });
    writeUsers(users);

    res.json({ message: "Registration successful." });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
  
    if (username === "admin" && password === "admin") {
        return res.json({ message: "Login successful.", admin: true });
    }
  
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
  
    if (!user) {
        return res.status(401).json({ error: "Invalid username or password." });
    }
  
    res.json({ message: "Login successful." });
});

/* ------------------ Admin Features ------------------ */

// View all registered users
app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json(users);
});

// Add a new user
app.post('/api/users', (req, res) => {
    const { username, email, mobile, password } = req.body;
    if (!username || !email || !mobile || !password)
        return res.status(400).json({ error: "Username and password are required." });

    const users = readUsers();
    if (users.find(user => user.username === username))
        return res.status(400).json({ error: "Username already exists." });

    users.push({ username,email, mobile, password });
    writeUsers(users);
    res.json({ message: "User added successfully." });
});

app.put('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    const { newUsername, email, mobile, password } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex === -1) return res.status(404).json({ error: "User not found." });

    // Update user details only if provided
    if (newUsername) users[userIndex].username = newUsername;
    if (email) users[userIndex].email = email;
    if (mobile) users[userIndex].mobile = mobile;
    if (password) users[userIndex].password = await bcrypt.hash(password, 10); // Securely hash password

    writeUsers(users);
    res.json({ message: "User updated successfully." });
});

// Delete a user
app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;

    let users = readUsers();
    users = users.filter(user => user.username !== username);
    writeUsers(users);
    res.json({ message: "User deleted successfully." });
});

// Forgot Password endpoint
app.post('/api/forgot-password', (req, res) => {
    const { username, mobile, newPassword } = req.body;

    if (!username || !mobile || !newPassword) {
        return res.status(400).json({ error: "Username, mobile number, and new password are required." });
    }

    const users = readUsers();
    const userIndex = users.findIndex(user => user.username === username && user.mobile === mobile);

    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found or mobile number doesn't match." });
    }

    users[userIndex].password = newPassword;
    writeUsers(users);

    res.json({ message: "Password reset successful. You can now log in with your new password." });
});

/* ------------------ Start Server ------------------ */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});