import { API_BASE_URL } from "./config.js";

document.getElementById("registrationForm").addEventListener("submit", registerUser);

async function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.querySelector('input[name="role"]:checked')?.value;
    const errorMsg = document.getElementById("errorMsg");

    errorMsg.innerHTML = "";

    if (!name || !phone || !email || !password || !role) {
        errorMsg.innerHTML = "Please fill in all fields";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.innerHTML = data.message || "Registration failed";
            return;
        }

        alert("Registration successful! Please log in.");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        errorMsg.innerHTML = "Something went wrong";
    }
}
