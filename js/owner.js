import { API_BASE_URL } from "./config.js";

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Session expired. Please log in again.");
    window.location.href = "index.html";
}

const propertyList = document.getElementById("propertyList");
const workspaceList = document.getElementById("workspaceList");

let propertiesData = [];
let workspacesData = [];

// -------------------------
// LOAD DATA FROM BACKEND
// -------------------------
async function loadDashboardData() {
    try {
        // GET ALL PROPERTIES
        const propRes = await fetch(`${API_BASE_URL}/properties`);
        const allProperties = await propRes.json();

        propertiesData = allProperties.filter(p => p.owner_id === user.id);

        // GET ALL WORKSPACES
        const wsRes = await fetch(`${API_BASE_URL}/workspaces`);
        const allWorkspaces = await wsRes.json();

        workspacesData = allWorkspaces.filter(w => w.owner_id === user.id);

        render();

    } catch (err) {
        console.error(err);
        alert("Failed to load dashboard data.");
    }
}

// -------------------------
// GET AVERAGE RATING
// -------------------------
async function getAverageRating(workspaceId) {
    try {
        const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/ratings`);
        const data = await res.json();

        const avg = data.average_rating || 0;
        const total = data.total_ratings || 0;

        if (total === 0) return "No ratings yet";

        const fullStars = Math.round(avg);
        return "★".repeat(fullStars) + "☆".repeat(5 - fullStars) + ` (${total})`;
    } catch (err) {
        console.error(err);
        return "No ratings";
    }
}

// -------------------------
// RENDER DASHBOARD
// -------------------------
async function render() {
    propertyList.innerHTML = "";
    workspaceList.innerHTML = "";

    // ---- PROPERTIES ----
    for (const p of propertiesData) {
        const propertyWorkspaces = workspacesData.filter(w => w.property_id === p.id);

        let workspacesListHTML = "";
        if (propertyWorkspaces.length > 0) {
            workspacesListHTML += "<ul style='margin: 5px 0; padding-left: 20px;'>";
            propertyWorkspaces.forEach((w, index) => {
                workspacesListHTML += `<li><strong>Workspace ${index + 1}:</strong> ${w.type} (${w.seats} seats) - $${w.price}/${w.lease_term}</li>`;
            });
            workspacesListHTML += "</ul>";
        } else {
            workspacesListHTML = "<p style='color: #777; margin: 5px 0;'>No workspaces registered under this property yet.</p>";
        }

        propertyList.innerHTML += `
            <div class="card">
               <img src="${API_BASE_URL.replace('/api', '')}${p.image_url}">

               <h3>${p.address}</h3>
               <p>${p.neighborhood}</p>
               
               <p style="font-weight: bold; margin: 8px 0; color: #2f3e4e;">
                 ${propertyWorkspaces.length} workspace(s) under this property.
               </p>

               <button onclick="editProperty(${p.id})">Edit</button>

               <button onclick="deleteProperty(${p.id}, ${propertyWorkspaces.length})">
                   Delete
               </button>

               <button onclick="toggleWorkspacesPanel(${p.id})">
                   Show/Hide Workspaces
               </button>

               <div id="workspace-panel-${p.id}" style="display: none; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; text-align: left;">
                   <h4 style="margin: 0 0 5px 0; color: #2f3e4e;">Workspace Breakdown:</h4>
                   ${workspacesListHTML}
               </div>
            </div>
        `;
    }

    // ---- WORKSPACES ----
    for (const w of workspacesData) {
        const property = propertiesData.find(p => p.id === w.property_id);
        const location = property ? `${property.address}, ${property.neighborhood}` : "Unknown";

        const ratingStars = await getAverageRating(w.id);

        workspaceList.innerHTML += `
            <div class="card">
                <img src="${API_BASE_URL.replace('/api', '')}${w.image_url}">
                <h3>${w.type}</h3>
                <p>${location}</p>
                <p>Seats: ${w.seats}</p>
                <p>Price: $${w.price}</p>
                <p>Rating: ${ratingStars}</p>

                <button onclick="editWorkspace(${w.id})">Edit</button>
                <button onclick="deleteWorkspace(${w.id})">Delete</button>
                <button onclick="workspaceDetails(${w.id})">Workspace Details</button>
            </div>
        `;
    }
}

// -------------------------
// TOGGLE PANEL FUNCTION (Moved Cleanly Outside Render)
// -------------------------
window.toggleWorkspacesPanel = function (propertyId) {
    const panel = document.getElementById(`workspace-panel-${propertyId}`);
    if (panel) {
        if (panel.style.display === "none") {
            panel.style.display = "block";
        } else {
            panel.style.display = "none";
        }
    }
};

// -------------------------
// EDIT FUNCTIONS
// -------------------------
window.editProperty = function (id) {
    window.location.href = `property.html?id=${id}`;
};

window.editWorkspace = function (id) {
    console.log("Editing workspace ID:", id);
    window.location.href = `workspace.html?id=${id}`;
};


// -------------------------
// DELETE FUNCTIONS
// -------------------------
window.deleteProperty = async function (id, workspaceCount) {
    if (workspaceCount > 0) {
        alert("Cannot delete property with existing workspaces.");
        return;
    }

    if (!confirm("Delete this property?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            alert("Failed to delete property.");
            return;
        }

        propertiesData = propertiesData.filter(p => p.id !== id);
        render();

    } catch (err) {
        console.error(err);
        alert("Error deleting property.");
    }
};

window.deleteWorkspace = async function (id) {
    if (!confirm("Delete this workspace?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            alert("Failed to delete workspace.");
            return;
        }

        workspacesData = workspacesData.filter(w => w.id !== id);
        render();

    } catch (err) {
        console.error(err);
        alert("Error deleting workspace.");
    }
};

// -------------------------
// WORKSPACE DETAILS
// -------------------------
window.workspaceDetails = function (id) {
    window.location.href = `workspace-details.html?id=${id}`;
};

// -------------------------
// SORTING
// -------------------------
document.getElementById("sortPriceBtn").onclick = () => {
    workspacesData.sort((a, b) => a.price - b.price);
    render();
};

document.getElementById("sortSeatsBtn").onclick = () => {
    workspacesData.sort((a, b) => a.seats - b.seats);
    render();
};

// -------------------------
// LOGOUT
// -------------------------
document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "index.html";
};

// -------------------------
// INITIAL LOAD (Fixed with DOM Lifecycle Protection)
// -------------------------
loadDashboardData();
