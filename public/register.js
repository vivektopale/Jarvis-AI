// register.js
document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value.trim();
  
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, mobile, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Redirect to login page after successful registration
        window.location.href = "login.html";
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Registration Error:", error);
      alert("An error occurred during registration.");
    }
  });
  