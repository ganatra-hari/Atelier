/**
 * Admin Layout Manager
 * Handles loading Sidebar, Header, Footer and highlighting navigation.
 */

// 1. Component Loader Function
async function loadComponent(id, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        const element = document.getElementById(id);
        
        if (element) {
            element.innerHTML = html;
            // Re-initialize icons if you are using Lucide
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Error loading component:", error);
    }
}

// 2. Active Link Highlighter
function highlightActiveLink(linkId) {
    // No timeout needed! The HTML is already loaded by the time this runs.
    const link = document.getElementById(linkId);
    if (link) {
        // Remove default classes
        link.classList.remove('text-gray-700', 'hover:bg-gray-100');
        // Add active styling (Dark background, white text)
        link.classList.add('bg-gray-900', 'text-white');
        
        // Update icon color if SVG exists
        const icon = link.querySelector('svg');
        if(icon) icon.classList.remove('text-gray-400');
    }
}

// 3. Initialize Page
document.addEventListener("DOMContentLoaded", async () => {
    // Load Sidebar, Header, Footer
    // IMPORTANT: Ensure your index.js allows serving files from '/admin/'
    await Promise.all([
        loadComponent("sidebar-container", "/admin/Sidebar.html"),
        loadComponent("header-container", "/admin/Header.html"),
        loadComponent("footer-container", "/admin/Footer.html")
    ]);

    // Highlight the current page link
    const path = window.location.pathname;
    
    if (path.includes('add-product')) {
        highlightActiveLink("nav-add-product");
    } else if (path.includes('login')) {
        highlightActiveLink("nav-login");
    } else {
        // Default to Dashboard
        highlightActiveLink("nav-home");
    }
});

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/api/products/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            const data = await response.json();

            // Update DOM elements
            document.getElementById('dashboard-products').textContent = data.totalProducts;
            document.getElementById('dashboard-revenue').textContent = '₹' + data.totalRevenue.toLocaleString('en-IN'); 
            document.getElementById('dashboard-orders').textContent = data.activeOrders;

        } catch (error) {
            console.error(error);
            document.getElementById('dashboard-products').textContent = '-';
            document.getElementById('dashboard-revenue').textContent = '-';
        }
    });
