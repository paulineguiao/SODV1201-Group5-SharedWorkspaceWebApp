import { API_BASE_URL } from "./config.js";

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Session expired. Please log in again.");
    window.location.href = "index.html";
}

const workspaceId = new URLSearchParams(window.location.search).get("id");

const propertySelect = document.getElementById("property");
const form = document.getElementById("workspaceForm");

// -------------------------
// LOAD OWNER PROPERTIES
// -------------------------
async function loadProperties() {
    try {
        const res = await fetch(`${API_BASE_URL}/properties`);
        const allProperties = await res.json();

        const ownerProperties = allProperties.filter(p => p.owner_id === user.id);

        if (!ownerProperties.length) {
            alert("You have no properties yet. Please add a property first.");
            window.location.href = "property.html";
            return;
        }

        ownerProperties.forEach(p => {
            propertySelect.innerHTML += `
                <option value="${p.id}">${p.address} (${p.neighborhood})</option>
            `;
        });

    } catch (err) {
        console.error(err);
        alert("Failed to load properties.");
    }
}

// -------------------------
// LOAD WORKSPACE IF EDITING
// -------------------------
async function loadWorkspace() {
    if (!workspaceId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`);
        const w = await res.json();

        document.getElementById("workspaceId").value = w.id;
        document.getElementById("property").value = w.property_id;
        document.querySelector(`input[name='type'][value='${w.type}']`).checked = true;
        document.getElementById("seats").value = w.seats;
        document.getElementById("availability_date").value = w.availability_date;
        document.querySelector(`input[name='smoking'][value='${w.smoking}']`).checked = true;

        document.querySelector(
            `input[name='lease_term'][value='${w.lease_term.charAt(0).toLowerCase() + w.lease_term.slice(1)}']`
        ).checked = true;

        document.getElementById("price").value = w.price;

        if (w.image_url) {
            document.getElementById("preview").innerHTML = `
                <img src="${API_BASE_URL.replace('/api', '')}${w.image_url}" width="200">
            `;
        }

    } catch (err) {
        console.error(err);
        alert("Failed to load workspace.");
    }
}

// -------------------------
// SAVE WORKSPACE
// -------------------------
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("owner_id", user.id);
    formData.append("property_id", propertySelect.value);
    formData.append("type", document.querySelector("input[name='type']:checked").value);
    formData.append("seats", document.getElementById("seats").value);
    formData.append("lease_term", document.querySelector("input[name='lease_term']:checked").value.toLowerCase());
    formData.append("price", document.getElementById("price").value);
    formData.append("availability_date", document.getElementById("availability_date").value);
    formData.append("smoking", document.querySelector("input[name='smoking']:checked").value);

    // FIXED: image variable now defined
    const image = document.getElementById("imageUpload").files[0];
    if (image) formData.append("image", image);
    

    try {
        let res;

        if (workspaceId) {
            // UPDATE
            res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
        } else {

            // CREATE
            res = await fetch(`${API_BASE_URL}/workspaces`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
        }

        if (!res.ok) {
            alert("Failed to save workspace.");
            return;
        }

        alert("Workspace saved!");
        window.location.href = "owner-dashboard.html";

    } catch (err) {
        console.error(err);
        alert("Error saving workspace.");
    }
});

// -------------------------
// NAVIGATION
// -------------------------
window.goHome = () => window.location.href = "owner-dashboard.html";
window.goProperty = () => window.location.href = "property.html";
window.logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "index.html";
};

// INITIAL LOAD
loadProperties().then(loadWorkspace);
