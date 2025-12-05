document.addEventListener('DOMContentLoaded', () => {

    // --- Global State ---
    let cartItems = JSON.parse(localStorage.getItem('atelierCart')) || {};
    let allProductsData = []; 

    // --- DOM Elements ---
    const shopProductGrid = document.getElementById('shop-product-grid');
    const homeProductGrid = document.getElementById('home-product-grid');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartBadge = document.getElementById('cart-badge');
    const cartPanel = document.getElementById('cart-panel');

    // Filter Elements
    const filterButtons = document.querySelectorAll('.category-btn');
    const searchInput = document.getElementById('search-input');
    
    // --- 1. IMAGE PATH HELPER ---
    function fixImagePath(path) {
        if (!path) return '';
        let cleanPath = path.replace(/\\/g, '/');
        if (cleanPath.startsWith('http')) return cleanPath;
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return cleanPath;
    }

    // --- 2. FORMAT PRICE ---
    function formatPrice(price) {
        return Number(price).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    }

    // --- 3. INJECT MODAL HTML (The "Card View" Popup) ---
    // We inject this via JS so you don't have to edit your HTML files
    const modalHTML = `
    <div id="shop-modal" class="fixed inset-0 bg-black/50 z-[60] hidden flex items-center justify-center backdrop-blur-sm transition-opacity duration-300">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4 overflow-hidden transform transition-all scale-95 opacity-0 relative" id="shop-modal-wrapper">
            <button id="close-shop-modal" class="absolute top-4 right-4 z-10 bg-white rounded-full p-1 text-gray-400 hover:text-gray-600 shadow-sm transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div class="grid grid-cols-1 md:grid-cols-2">
                <div class="h-64 md:h-[500px] bg-gray-100 relative">
                    <img id="shop-modal-img" src="" class="w-full h-full object-cover object-center absolute inset-0" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                </div>
                <div class="p-8 flex flex-col h-full justify-center">
                    <span id="shop-modal-category" class="w-fit px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">Category</span>
                    <h2 id="shop-modal-title" class="text-3xl font-bold text-gray-900 mb-2">Product Name</h2>
                    <div class="flex items-center mb-6">
                        <div class="flex text-yellow-400">★★★★★</div>
                        <span class="text-sm text-gray-500 ml-2">(4.5 Reviews)</span>
                    </div>
                    <p id="shop-modal-price" class="text-3xl font-bold text-stone-900 mb-6">₹0.00</p>
                    <div class="prose prose-sm text-gray-500 mb-8 flex-grow overflow-y-auto max-h-40">
                        <h4 class="font-medium text-gray-900 mb-2">Description</h4>
                        <p id="shop-modal-desc">No description.</p>
                    </div>
                    <button id="shop-modal-add-btn" class="w-full bg-stone-900 text-white py-4 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    
    // Only insert modal if it doesn't exist to avoid duplicates on re-runs
    if (!document.getElementById('shop-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // --- 4. FETCH DATA ---
    async function loadProducts() {
        if (!shopProductGrid && !homeProductGrid) return;

        if (shopProductGrid) {
            shopProductGrid.innerHTML = `<div class="col-span-full flex justify-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>`;
        }

        try {
            const response = await fetch('/api/products');
            allProductsData = await response.json();

            if (shopProductGrid) applyFilters();
            if (homeProductGrid) renderProductGrid(allProductsData.slice(0, 4), homeProductGrid, false);

        } catch (error) {
            console.error("Error loading products:", error);
            if (shopProductGrid) {
                shopProductGrid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">Failed to load products. Please try again later.</p>';
            }
        }
    }

    // --- 5. RENDER FUNCTION (Updated with Quick View) ---
    function renderProductGrid(products, container, showAddToCart = true) {
        container.innerHTML = ''; 

        if (products.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">No products found.</p>';
            return;
        }

        products.forEach((product, index) => {
            const mainImgSrc = fixImagePath(product.image);
            // Simulate Gallery
            const galleryImages = [mainImgSrc, mainImgSrc, mainImgSrc];

            const card = document.createElement('div');
            card.className = "product-card group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col relative";
            
            const thumbnailsHtml = galleryImages.map((img) => `
                <div class="w-12 h-12 border border-stone-200 rounded-md overflow-hidden cursor-pointer hover:border-stone-800 transition-colors"
                     onmouseover="this.closest('.product-card').querySelector('.main-img').src='${img}'">
                    <img src="${img}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x100?text=Img'">
                </div>
            `).join('');

            const actionButton = showAddToCart ? `
                <button class="add-to-cart-btn w-full bg-stone-900 text-white py-3 rounded-md hover:bg-stone-700 transition-colors font-medium flex items-center justify-center gap-2">
                    Add to Cart
                </button>
            ` : `
                <a href="shop" class="w-full bg-white border border-stone-300 text-stone-700 py-3 rounded-md hover:bg-stone-50 transition-colors font-medium flex items-center justify-center">
                    View Details
                </a>
            `;

            card.innerHTML = `
                <div class="w-full h-64 bg-stone-100 relative overflow-hidden group">
                    <img src="${mainImgSrc}" alt="${product.name}" 
                         class="main-img w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                         onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                    
                    <!-- QUICK VIEW BUTTON (Eye Icon) -->
                    <button type="button" class="quick-view-btn absolute top-3 right-3 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50 text-gray-700 hover:text-stone-900 hover:scale-110 z-10" title="Quick View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                
                <div class="p-4 flex flex-col flex-grow">
                    <div class="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">${thumbnailsHtml}</div>
                    <div class="mb-2">
                        <p class="text-stone-500 text-xs uppercase tracking-wide font-medium mb-1">${product.category}</p>
                        <h3 class="text-lg font-bold text-stone-800 line-clamp-1" title="${product.name}">${product.name}</h3>
                    </div>
                    <div class="mt-auto">
                        <div class="flex justify-between items-end mb-4">
                            <p class="text-xl font-bold text-stone-900">${formatPrice(product.price)}</p>
                            <div class="flex text-yellow-400 text-xs mb-1">★★★★☆</div>
                        </div>
                        ${actionButton}
                    </div>
                </div>
            `;

            // Attach Add to Cart Listener
            if (showAddToCart) {
                const addBtn = card.querySelector('.add-to-cart-btn');
                if(addBtn) {
                    addBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        addItemToCart(product);
                    });
                }
            }
            
            // Attach Quick View Listener
            const quickViewBtn = card.querySelector('.quick-view-btn');
            if(quickViewBtn) {
                quickViewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent bubbling
                    openShopModal(product);
                });
            }

            container.appendChild(card);
        });
    }

    // --- 6. MODAL LOGIC (For Shop) ---
    const shopModal = document.getElementById('shop-modal');
    const shopModalWrapper = document.getElementById('shop-modal-wrapper');
    const closeShopModalBtn = document.getElementById('close-shop-modal');
    let shopModalAddBtn = document.getElementById('shop-modal-add-btn');

    function openShopModal(product) {
        if (!shopModal) return;

        const imgSrc = fixImagePath(product.image);
        
        const imgEl = document.getElementById('shop-modal-img');
        if(imgEl) {
            imgEl.src = imgSrc;
            imgEl.onerror = function() { this.src = 'https://placehold.co/600x400?text=No+Image'; };
        }
        
        const titleEl = document.getElementById('shop-modal-title');
        if(titleEl) titleEl.textContent = product.name;
        
        const priceEl = document.getElementById('shop-modal-price');
        if(priceEl) priceEl.textContent = formatPrice(product.price);
        
        const catEl = document.getElementById('shop-modal-category');
        if(catEl) catEl.textContent = product.category;
        
        const descEl = document.getElementById('shop-modal-desc');
        if(descEl) descEl.textContent = product.description || "No description available.";

        // Setup the Add to Cart button inside the modal
        // Remove old listeners by cloning
        const newBtn = shopModalAddBtn.cloneNode(true);
        shopModalAddBtn.parentNode.replaceChild(newBtn, shopModalAddBtn);
        shopModalAddBtn = newBtn; // Update reference
        
        shopModalAddBtn.addEventListener('click', () => {
            addItemToCart(product);
            closeShopModal();
        });

        shopModal.classList.remove('hidden');
        // Animation frame helps transition play correctly
        requestAnimationFrame(() => {
            shopModalWrapper.classList.remove('scale-95', 'opacity-0');
            shopModalWrapper.classList.add('scale-100', 'opacity-100');
        });
        
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    }

    function closeShopModal() {
        if (!shopModal) return;
        
        shopModalWrapper.classList.remove('scale-100', 'opacity-100');
        shopModalWrapper.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            shopModal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    }

    if(closeShopModalBtn) {
        closeShopModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeShopModal();
        });
    }
    
    if(shopModal) {
        shopModal.addEventListener('click', (e) => { 
            if(e.target === shopModal) closeShopModal(); 
        });
    }
    
    document.addEventListener('keydown', (e) => { 
        if(e.key === 'Escape' && shopModal && !shopModal.classList.contains('hidden')) {
            closeShopModal(); 
        }
    });


    // --- 7. FILTER LOGIC ---
    function applyFilters() {
        if (!shopProductGrid) return;
        const activeBtn = document.querySelector('.category-btn.active');
        const category = activeBtn ? activeBtn.dataset.category : 'all';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const filtered = allProductsData.filter(product => {
            const matchesCategory = category === 'all' || product.category.toLowerCase() === category.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        renderProductGrid(filtered, shopProductGrid, true);
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
    if (searchInput) searchInput.addEventListener('input', applyFilters);


    // --- 8. CART LOGIC ---
    function addItemToCart(product) {
        const id = product._id;
        if (cartItems[id]) {
            cartItems[id].quantity++;
        } else {
            cartItems[id] = {
                name: product.name,
                price: product.price,
                image: fixImagePath(product.image),
                quantity: 1
            };
        }
        saveCart();
        updateCartUI();
        openCartPanel(); 
    }

    function removeItemFromCart(id) {
        delete cartItems[id];
        saveCart();
        updateCartUI();
    }

    function updateQuantity(id, change) {
        if (cartItems[id]) {
            cartItems[id].quantity += change;
            if (cartItems[id].quantity <= 0) delete cartItems[id];
            saveCart();
            updateCartUI();
        }
    }

    function saveCart() {
        localStorage.setItem('atelierCart', JSON.stringify(cartItems));
    }

    function updateCartUI() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        let count = 0;
        const items = Object.entries(cartItems);

        if (items.length === 0) cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">Your cart is empty.</p>';

        items.forEach(([id, item]) => {
            subtotal += item.price * item.quantity;
            count += item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = "flex gap-4 py-4 border-b border-stone-100";
            itemEl.innerHTML = `
                <img src="${item.image}" class="w-20 h-20 object-cover rounded-md bg-gray-100">
                <div class="flex-1">
                    <h4 class="font-medium text-stone-800 text-sm">${item.name}</h4>
                    <p class="text-stone-500 text-sm mt-1">${formatPrice(item.price)}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button class="qty-btn-minus w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-xs">-</button>
                        <span class="text-sm font-medium">${item.quantity}</span>
                        <button class="qty-btn-plus w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-xs">+</button>
                    </div>
                </div>
                <button class="remove-btn text-gray-400 hover:text-red-500 self-start"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
            `;
            itemEl.querySelector('.qty-btn-minus').addEventListener('click', () => updateQuantity(id, -1));
            itemEl.querySelector('.qty-btn-plus').addEventListener('click', () => updateQuantity(id, 1));
            itemEl.querySelector('.remove-btn').addEventListener('click', () => removeItemFromCart(id));
            cartItemsContainer.appendChild(itemEl);
        });

        if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotal);
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.classList.toggle('hidden', count === 0);
        }
    }

    // --- 9. UI INTERACTIONS ---
    function openCartPanel() {
        if(cartPanel) {
            cartPanel.classList.remove('hidden');
            setTimeout(() => cartPanel.querySelector('.side-panel')?.classList.add('translate-x-0'), 10);
        }
    }
    function closeCartPanel() {
        if(cartPanel) {
            cartPanel.querySelector('.side-panel')?.classList.remove('translate-x-0');
            setTimeout(() => cartPanel.classList.add('hidden'), 300);
        }
    }

    const cartBtn = document.getElementById('cart-icon-btn');
    if (cartBtn) cartBtn.addEventListener('click', openCartPanel);
    const closeCart = document.getElementById('close-cart-btn');
    if (closeCart) closeCart.addEventListener('click', closeCartPanel);
    const cartOverlay = document.getElementById('cart-panel-overlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartPanel);

    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu-btn');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.remove('hidden'));
        if (closeMenu) closeMenu.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    }

    // --- INITIALIZE ---
    loadProducts();
    updateCartUI();
});