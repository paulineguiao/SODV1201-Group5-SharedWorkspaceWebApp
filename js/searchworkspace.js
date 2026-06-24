import { API_BASE_URL } from "./config.js";

document.getElementById("searchBtn").addEventListener("click", loadWorkspaces);

async function loadWorkspaces() {
    const token = localStorage.getItem("token");
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "Loading...";

    // Collect ALL filters
    const address = document.getElementById("address").value;
    const neighborhood = document.getElementById("neighborhood").value;
    const sqft = document.getElementById("sqft").value;
    const parking = document.getElementById("parking").value;
    const transport = document.getElementById("transport").value;
    const seats = document.getElementById("seats").value;
    const smoking = document.getElementById("smoking").value;
    const date = document.getElementById("date").value;
    const term = document.getElementById("term").value;
    const price = document.getElementById("price").value;

    // Build query params
    const params = new URLSearchParams();

    if (address) params.append("address", address);
    if (neighborhood) params.append("neighborhood", neighborhood);
    if (sqft) params.append("sqft", sqft);
    if (parking) params.append("parking", parking);
    if (transport) params.append("transport", transport);
    if (seats) params.append("seats", seats);
    if (smoking) params.append("smoking", smoking);
    if (date) params.append("date", date);
    if (term) params.append("term", term);
    if (price) params.append("price", price);

    try {
        const response = await fetch(
            `${API_BASE_URL}/workspaces/search?${params.toString()}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            resultsDiv.innerHTML = `<p>${data.message || "Failed to load workspaces"}</p>`;
            return;
        }

        if (data.length === 0) {
            resultsDiv.innerHTML = "<p>No workspaces found.</p>";
            return;
        }

        resultsDiv.innerHTML = "";

        data.forEach(ws => {
            const card = document.createElement("div");
            card.classList.add("workspace-card");

            // Convert rating to stars
            const stars = convertToStars(ws.average_rating || 0);

            let workspaceImage;
    if (ws.image_url) {
        if (ws.image_url.startsWith("http")) {
            workspaceImage = ws.image_url;
        } else {
            const cleanPath = ws.image_url.replace(/^\/+/, ""); 
            const baseUrlClean = API_BASE_URL.replace("/api", "");
            workspaceImage = `${baseUrlClean}/${cleanPath}`;
        }
    } else {
        workspaceImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'><rect width='200' height='150' fill='%23cccccc'/><text x='50%23' y='50%23' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23666666'>No Image Provided</text></svg>";
    }

            card.innerHTML = `
        <img src="${workspaceImage}" 
             alt="${ws.type}" 
             style="width:200px; height:150px; object-fit: cover; border-radius:8px; margin-bottom:10px;">
        
        <h3>${ws.type}</h3>

        <p><strong>Available:</strong> ${ws.availability_date}</p>
        <p><strong>Price:</strong> $${ws.price}</p>

        <p><strong>Owner Phone:</strong> ${ws.owner_phone || "N/A"}</p>

        <p><strong>Rating:</strong> 
            <span class="stars">${stars}</span>
            (${ws.total_ratings || 0})
        </p>

        <button onclick="viewDetails(${ws.id})">
            View Details
        </button>
    `;

            resultsDiv.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = "<p>Error loading workspaces.</p>";
    }
}

function convertToStars(avg) {
    const full = Math.floor(avg);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
}

window.viewDetails = function (id) {
    localStorage.setItem("selectedWorkspaceId", id);
    window.location.href = "workspace-details.html";
};
