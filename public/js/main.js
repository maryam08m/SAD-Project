// Variable initialization
let slideIndex = 1;
let slideTimer; // Variable to hold the interval timer

// Run setup when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on a page with a slideshow
    if (document.getElementsByClassName("mySlides").length > 0) {
        showSlides(slideIndex);
        startAutoSlides(); // Start the automatic timer
    }
});

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
    resetAutoSlides(); // Reset timer on manual interaction
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
    resetAutoSlides(); // Reset timer on manual interaction
}

// Logic to display the specific slide
function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");

    // Safety check: if no slides exist, stop function
    if (slides.length === 0) return;

    // Wrap around logic
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    // Hide all slides
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        slides[i].style.opacity = "0"; // Reset opacity for fade effect
        slides[i].style.transform = "translateX(100%)"; // Reset position for slide effect
    }

    // Remove active class from all dots
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    // Show the current slide
    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].style.display = "block";
        
        // Small delay to allow CSS transition to catch the display:block change
        setTimeout(() => {
            slides[slideIndex - 1].style.opacity = "1";
            slides[slideIndex - 1].style.transform = "translateX(0)";
        }, 10);
    }

    // Activate the current dot
    if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].className += " active";
    }
}

// Start the automatic slideshow
function startAutoSlides() {
    slideTimer = setInterval(() => {
        plusSlides(1);
    }, 7000); // 7 seconds
}

// Reset the timer (used when user manually clicks)
function resetAutoSlides() {
    clearInterval(slideTimer); // Stop the current timer
    startAutoSlides(); // Start a new one
}