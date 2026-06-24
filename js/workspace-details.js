import { API_BASE_URL } from "./config.js";

// -----------------------------
// NAVIGATION
// -----------------------------
window.goHome = function () {
    const role = localStorage.getItem("role");

    if (role === "coworker") {
        window.location.href = "searchworkspace.html";
    } else if (role === "owner") {
        window.location.href = "owner-dashboard.html";
    } else {
        window.location.href = "index.html";
    }
};

window.logout = function () {
    localStorage.clear();
    window.location.href = "index.html";
};

// -----------------------------
// GET WORKSPACE ID (URL or localStorage)
// -----------------------------
function getWorkspaceId() {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromURL = urlParams.get("id");
    const idFromStorage = localStorage.getItem("selectedWorkspaceId");

    return idFromURL || idFromStorage;
}

// -----------------------------
// LOAD WORKSPACE DETAILS
// -----------------------------
document.addEventListener("DOMContentLoaded", async function () {
    const workspaceId = getWorkspaceId();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!workspaceId) {
        alert("No workspace selected.");
        window.location.href = "searchworkspace.html";
        return;
    }

    try {
        // GET WORKSPACE DETAILS (includes owner + property info)
        const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const ws = await response.json();

        if (!response.ok) {
            alert(ws.message || "Failed to load workspace details.");
            return;
        }

        // -----------------------------
        // FILL WORKSPACE DETAILS
        // -----------------------------
        if (ws.image_url) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    document.querySelector(".workspace-photo").src = `${baseUrl}${ws.image_url}`;
} else {
    document.querySelector(".workspace-photo").src = "https://via.placeholder.com/120";
}

        document.querySelector("#workspaceType").value = ws.type;
        document.querySelector("#propertyName").value = ws.property_name || "Property";
        document.querySelector("#address").value = ws.address;
        document.querySelector("#seats").value = ws.seats;

        // Smoking
        const smokeRadios = document.getElementsByName("smoke");
        smokeRadios[0].checked = ws.smoking === 1;
        smokeRadios[1].checked = ws.smoking === 0;

        document.querySelector("#availability").value = ws.availability_date;
        document.querySelector("#term").value = ws.lease_term;
        document.querySelector("#price").value = "$" + ws.price;

        // -----------------------------
        // OWNER INFO (for coworker)
        // -----------------------------
        if (role === "coworker") {
            console.log("Owner:", ws.owner_name, ws.owner_email, ws.owner_phone);
        }

        // -----------------------------
        // HIDE REVIEW SECTION FOR OWNERS
        // -----------------------------
        if (role === "owner") {
            document.getElementById("reviewSection").style.display = "none";
        }

        // -----------------------------
        // LOAD REVIEWS + RATINGS
        // -----------------------------
        loadReviews(workspaceId);
        loadRating(workspaceId);

        if (role === "coworker") {
            setupRatingSelector(workspaceId);
        }

    } catch (error) {
        console.error(error);
        alert("Error loading workspace details.");
    }
});

// -----------------------------
// LOAD REVIEWS
// -----------------------------
async function loadReviews(workspaceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/reviews`);
        const reviews = await response.json();

        const list = document.getElementById("reviewsList");
        list.innerHTML = "";

        if (!reviews.length) {
            list.innerHTML = `<p>No reviews yet.</p>`;
            return;
        }

        reviews.forEach(r => {
            const card = document.createElement("div");
            card.classList.add("review-card");

            card.innerHTML = `
                <span>"${r.comment}" - <strong>${r.coworker_name || "Anonymous"}</strong></span>
            `;

            list.appendChild(card);
        });

    } catch (error) {
        console.error(error);
    }
}

// -----------------------------
// LOAD AVERAGE RATING
// -----------------------------
async function loadRating(workspaceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/ratings`);
        const data = await response.json();

        const avg = data.average_rating || 0;
        document.getElementById("ratingDisplay").textContent = convertToStars(avg);

    } catch (error) {
        console.error(error);
    }
}

// Convert number → stars
function convertToStars(avg) {
    const full = Math.floor(avg);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
}

// -----------------------------
// SUBMIT REVIEW
// -----------------------------
let selectedRating = 0;

window.submitReview = async function () {
    const reviewText = document.getElementById("reviewText").value.trim();
    const workspaceId = getWorkspaceId();
    const token = localStorage.getItem("token");

    if (!selectedRating) {
        alert("Please select a star rating first.");
        return;
    }

    if (!reviewText) {
        alert("Please write a review first.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                rating: selectedRating,
                comment: reviewText 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to submit review.");
            return;
        }

        alert("Review & Rating submitted!");
        document.getElementById("reviewText").value = "";
        selectedRating = 0;
        document.getElementById("ratingStars").textContent = "☆☆☆☆☆";
        loadReviews(workspaceId);
        loadRating(workspaceId);

    } catch (error) {
        console.error(error);
        alert("Error submitting review.");
    }
};

// -----------------------------
// STAR RATING SELECTOR (coworker only)
// -----------------------------
function setupRatingSelector(workspaceId) {
    const starDiv = document.getElementById("ratingStars");

    starDiv.innerHTML = `
        <span class="interactive-star" data-value="1">☆</span>
        <span class="interactive-star" data-value="2">☆</span>
        <span class="interactive-star" data-value="3">☆</span>
        <span class="interactive-star" data-value="4">☆</span>
        <span class="interactive-star" data-value="5">☆</span>
    `;

    const stars = starDiv.querySelectorAll(".interactive-star");

    stars.forEach((star) => {
        star.addEventListener("click", function () {
            selectedRating = parseInt(this.getAttribute("data-value"));
            
            // Update stars visually
            stars.forEach((s, idx) => {
                if (idx < selectedRating) {
                    s.textContent = "★";
                } else {
                    s.textContent = "☆";
                }
            });
        });
    });
}

// -----------------------------
// SUBMIT RATING
// -----------------------------
async function submitRating(workspaceId, rating) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ rating })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to submit rating.");
            return;
        }

        alert("Rating submitted!");

    } catch (error) {
        console.error(error);
        alert("Error submitting rating.");
    }
}
