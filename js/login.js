import { API_BASE_URL } from "./config.js";

document.getElementById("loginForm").addEventListener("submit", loginUser);

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    errorMsg.innerHTML = "";

    if (email === "" || password === "") {
        errorMsg.innerHTML = "Please fill in all fields";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.innerHTML = data.message || "Invalid email or password";
            return;
        }

        // Save token + user info + role
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);  

        alert("Login successful");

        // Redirect based on role
        if (data.user.role === "owner") {
            window.location.href = "owner-dashboard.html";
        } else {
            window.location.href = "searchworkspace.html";
        }

    } catch (error) {
        console.error(error);
        errorMsg.innerHTML = "Something went wrong";
    }
}

window.goToSignup = function () {
    window.location.href = "registrationpage.html";
}
