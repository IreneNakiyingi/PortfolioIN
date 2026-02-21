/**
 * MASTER SCRIPT.JS
 * Includes: Testimonial Slider, Project Fetching, 
 * Contact Form Handling, and Toast Notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load
    fetchProjects();

    // 2. Testimonial Slider Logic
    let currentSlide = 0;
    const slides = document.querySelectorAll('.testimonial-slide');
    
    // Check if slider exists before running to avoid errors
    if (slides.length > 0) {
        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            if (index >= slides.length) currentSlide = 0;
            if (index < 0) currentSlide = slides.length - 1;
            slides[currentSlide].classList.add('active');
        }

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            currentSlide++;
            showSlide(currentSlide);
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            currentSlide--;
            showSlide(currentSlide);
        });

        // Auto-play every 5 seconds
        setInterval(() => {
            currentSlide++;
            showSlide(currentSlide);
        }, 5000);
    }
});

/**
 * 3. Fetch Projects from SQL Database 
 * Sorts them into Health, Tech, and Research grids
 */
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        // Target the grids in index.html
        const grids = {
            'Health': document.getElementById('health-grid'),
            'Tech': document.getElementById('tech-grid'),
            'Research': document.getElementById('research-grid')
        };

        // Clear loaders
        Object.values(grids).forEach(grid => { if(grid) grid.innerHTML = ''; });

        projects.forEach(p => {
            const card = `
                <div class="card">
                    <div class="card-img-container">
                        <img src="${p.image || 'https://via.placeholder.com/400x250'}" alt="${p.title}">
                    </div>
                    <div class="card-body">
                        <span class="tag">${p.subcategory}</span>
                        <h3>${p.title}</h3>
                        <p><strong>Role:</strong> ${p.role}</p>
                        <p>${p.description}</p>
                        <div class="tools-list"><small>🛠 ${p.tools}</small></div>
                        <a href="${p.link}" target="_blank" class="btn btn-primary" style="margin-top:15px; display:block; text-align:center;">View Project</a>
                    </div>
                </div>
            `;

            // Place in the correct section based on category
            // "Research/Consultancy" is mapped to the Research grid
            const categoryKey = p.category.includes('Research') ? 'Research' : p.category;
            if (grids[categoryKey]) {
                grids[categoryKey].innerHTML += card;
            }
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

/**
 * 4. Contact Form Handling with Toast Notification
 */
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerText;
    
    btn.innerText = "Sending...";
    btn.disabled = true;

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showToast("Success! Message sent successfully.");
            document.getElementById('contactForm').reset();
        } else {
            showToast("Error! Something went wrong.");
        }
    } catch (error) {
        showToast("Error! Check your connection.");
        console.error("Error:", error);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

/**
 * 5. Toast Notification Logic
 */
function showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = message;
        toast.className = "toast show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }
}