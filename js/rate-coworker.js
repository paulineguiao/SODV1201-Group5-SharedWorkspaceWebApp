import { API_BASE_URL } from "./config.js";

function goHome() {
    window.location.href = "owner-dashboard.html";
}

function logout() {
    alert("Logging out...");
    window.location.href = "index.html";
}

window.goHome = goHome;
window.logout = logout;

// LOAD COWORKER LIST
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/users?role=coworker`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const coworkers = await response.json();
        const select = document.getElementById("coworkerSelect");
        select.addEventListener("change", loadCoworkerReviews);

        coworkers.forEach(cw => {
            const option = document.createElement("option");
            option.value = cw.id;
            option.textContent = cw.name;
            select.appendChild(option);
        });

        setTimeout(() => {
            loadCoworkerReviews();
        }, 50);

    } catch (error) {
        console.error(error);
        alert("Failed to load coworkers.");
    }

    setupRatingSelector();
});

// STAR RATING SELECTOR
let selectedRating = 0;

function setupRatingSelector() {
    const starDiv = document.getElementById("ratingStars");

    starDiv.addEventListener("click", (event) => {
        const x = event.offsetX;
        const width = starDiv.clientWidth;
        const percent = x / width;

        selectedRating = Math.ceil(percent * 5);
        if (selectedRating < 1) selectedRating = 1;
        if (selectedRating > 5) selectedRating = 5;

        starDiv.textContent = "★".repeat(selectedRating) + "☆".repeat(5 - selectedRating);
    });
}

// SUBMIT REVIEW + RATING
window.submitCoworkerReview = async function () {
    const coworkerId = document.getElementById("coworkerSelect").value;
    const reviewText = document.getElementById("coworkerReview").value.trim();
    const token = localStorage.getItem("token");

    if (!selectedRating) {
        alert("Please select a rating.");
        return;
    }

    if (!reviewText) {
        alert("Please write a review.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/coworkers/${coworkerId}/rate`, {
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

        alert("Review submitted!");
        document.getElementById("coworkerReview").value = "";
        selectedRating = 0;
        document.getElementById("ratingStars").textContent = "☆☆☆☆☆";

        loadCoworkerReviews();

    } catch (error) {
        console.error(error);
        alert("Error submitting review.");
    }
};

// LOAD PREVIOUS REVIEWS
async function loadCoworkerReviews() {
    const selectElement = document.getElementById("coworkerSelect");
    
    // SAFETY GAURDRAIL: If the dropdown element doesn't exist or is empty, stop here.
    if (!selectElement || !selectElement.value) {
        return; 
    }

    const coworkerId = selectElement.value;

    try {
        const response = await fetch(`${API_BASE_URL}/coworkers/${coworkerId}/reviews`);
        const reviews = await response.json();

        const container = document.getElementById("coworkerReviews");
        container.innerHTML = "";

        // Check if reviews is an array before looping
        if (Array.isArray(reviews)) {
            reviews.forEach(r => {
                const card = document.createElement("div");
                card.classList.add("review-card");

                card.innerHTML = `
                    <span>"${r.comment}"</span>
                    <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
                `;

                container.appendChild(card);
            });
        }

    } catch (error) {
        console.error("Error displaying reviews:", error);
    }
}
