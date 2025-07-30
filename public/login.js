// public/login.js
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
  
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        localStorage.setItem("loggedInUser", username);
        
        // If logged in as admin, set an admin flag and redirect to admin page.
        if (data.admin) {
          localStorage.setItem("isAdmin", "true");
          window.location.href = "admin.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("An error occurred during login.");
    }
  });
  