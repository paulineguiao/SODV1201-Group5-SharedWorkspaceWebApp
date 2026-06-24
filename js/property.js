import { API_BASE_URL } from "./config.js";

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Session expired. Please log in again.");
    window.location.href = "index.html";
}

const propertyId = new URLSearchParams(window.location.search).get("id");

// NAVIGATION
window.goHome = () => window.location.href = "owner-dashboard.html";
window.goWorkspace = () => window.location.href = "workspace.html";
window.logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "index.html";
};

// VALID ADDRESS CHECK
function isValidAddress(address) {
    let pattern = /\d+.*[a-zA-Z]/;
    return pattern.test(address);
}

// -------------------------
// LOAD PROPERTY IF EDITING
// -------------------------
async function loadProperty() {
    if (!propertyId) return; // Add mode

    try {
        const res = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            console.error("Failed to fetch property:", res.status);
            alert("Failed to load property.");
            return;
        }

        const p = await res.json();

        // Fill input fields
        document.getElementById("propertyId").value = p.id;
        document.getElementById("address").value = p.address;
        document.getElementById("neighborhood").value = p.neighborhood;
        document.getElementById("sqft").value = p.square_feet;

        // Radio buttons
        document.querySelector(`input[name='parking'][value='${p.parking ? "Yes" : "No"}']`).checked = true;
        document.querySelector(`input[name='transport'][value='${p.public_transport ? "Yes" : "No"}']`).checked = true;

        // Preview image
        if (p.image_url) {
            document.getElementById("preview").innerHTML = `
                <img src="${API_BASE_URL.replace('/api', '')}${p.image_url}" width="200">
            `;
        }

    } catch (err) {
        console.error(err);
        alert("Failed to load property.");
    }
}



// -------------------------
// SAVE PROPERTY (ADD/UPDATE)
// -------------------------
document.getElementById("saveBtn").onclick = async function () {

    let address = document.getElementById("address").value;
    let neighborhood = document.getElementById("neighborhood").value;
    let sqft = document.getElementById("sqft").value;
    let image = document.getElementById("imageUpload").files[0];

    let error = document.getElementById("addressError");
    error.textContent = "";

    if (!isValidAddress(address)) {
        error.textContent = "Please enter a valid address (must include number + street name)";
        return;
    }

    if (!address || !neighborhood || !sqft) {
        error.textContent = "Please fill all required fields";
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("owner_id", user.id);
    formData.append("address", address);
    formData.append("neighborhood", neighborhood);
    formData.append("square_feet", sqft);
    formData.append("parking", document.querySelector("input[name='parking']:checked").value === "Yes" ? 1 : 0);
    formData.append("public_transport", document.querySelector("input[name='transport']:checked").value === "Yes" ? 1 : 0);

    if (image) formData.append("image", image);

    try {
        let res;

        if (propertyId) {
            // UPDATE
            res = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
        } else {
            // CREATE
            res = await fetch(`${API_BASE_URL}/properties`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
        }

        if (!res.ok) {
            alert("Failed to save property.");
            return;
        }

        alert("Property saved!");
        window.location.href = "owner-dashboard.html";

    } catch (err) {
        console.error(err);
        alert("Error saving property.");
    }
};

// INITIAL LOAD
loadProperty();

