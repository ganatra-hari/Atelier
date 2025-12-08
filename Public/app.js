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
    // UPDATED: Added max-h and overflow handling for mobile landscape views
    // UPDATED: Adjusted padding (p-5 md:p-8) for smaller screens
    const modalHTML = `
    <div id="shop-modal" class="fixed inset-0 bg-black/60 z-[60] hidden flex items-center justify-center backdrop-blur-sm transition-opacity duration-300 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all scale-95 opacity-0 relative flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible" id="shop-modal-wrapper">
            
            <button id="close-shop-modal" class="absolute top-3 right-3 z-20 bg-white/90 rounded-full p-2 text-gray-500 hover:text-gray-900 shadow-md transition-colors hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div class="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative shrink-0">
                <img id="shop-modal-img" src="" class="w-full h-full object-cover object-center absolute inset-0" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
            </div>

            <div class="w-full md:w-1/2 p-5 md:p-8 flex flex-col h-full">
                <span id="shop-modal-category" class="w-fit px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wide mb-3 md:mb-4">Category</span>
                
                <h2 id="shop-modal-title" class="text-xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">Product Name</h2>
                
                <div class="flex items-center mb-4 md:mb-6">
                    <div class="flex text-yellow-400 text-sm">★★★★★</div>
                    <span class="text-xs md:text-sm text-gray-500 ml-2">(4.5 Reviews)</span>
                </div>
                
                <p id="shop-modal-price" class="text-2xl md:text-3xl font-bold text-stone-900 mb-4 md:mb-6">₹0.00</p>
                
                <div class="prose prose-sm text-gray-500 mb-6 md:mb-8 flex-grow overflow-y-auto max-h-32 md:max-h-40 custom-scrollbar">
                    <h4 class="font-medium text-gray-900 mb-1">Description</h4>
                    <p id="shop-modal-desc" class="text-sm leading-relaxed">No description.</p>
                </div>
                
                <button id="shop-modal-add-btn" class="w-full bg-stone-900 text-white py-3 md:py-4 rounded-lg font-bold hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-auto text-sm md:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Add to Cart
                </button>
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

        // Mock data fallback in case API fails (for demonstration)
        const mockData = [
            { _id: '1', name: 'Minimalist Chair', category: 'Furniture', price: 12500, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800', description: 'Ergonomic design meets modern aesthetics.' },
            { _id: '2', name: 'Ceramic Vase', category: 'Decor', price: 2400, image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=800', description: 'Handcrafted ceramic vase with matte finish.' },
            { _id: '3', name: 'Linen Lamp', category: 'Lighting', price: 5600, image: 'https://images.unsplash.com/photo-1507473888900-52a1b2d8f7d3?auto=format&fit=crop&q=80&w=800', description: 'Soft ambient lighting for your living room.' },
            { _id: '4', name: 'Oak Table', category: 'Furniture', price: 35000, image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=800', description: 'Solid oak coffee table with natural finish.' }
        ];

        if (shopProductGrid) {
            shopProductGrid.innerHTML = `<div class="col-span-full flex justify-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>`;
        }

        try {
            // Attempt to fetch, fall back to mock data if 404/error (so you can see UI)
            let data;
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error("API not found");
                data = await response.json();
            } catch (e) {
                console.log("Using mock data for demo...");
                data = mockData;
            }
            
            allProductsData = data;

            if (shopProductGrid) applyFilters();
            if (homeProductGrid) renderProductGrid(allProductsData.slice(0, 4), homeProductGrid, false);

        } catch (error) {
            console.error("Error loading products:", error);
            if (shopProductGrid) {
                shopProductGrid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">Failed to load products.</p>';
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

        products.forEach((product) => {
            const mainImgSrc = fixImagePath(product.image);
            const galleryImages = [mainImgSrc, mainImgSrc, mainImgSrc];

            const card = document.createElement('div');
            // UPDATED: Added 'active:scale-95' for touch feedback
            card.className = "product-card group bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col relative h-full";
            
            const thumbnailsHtml = galleryImages.map((img) => `
                <div class="w-10 h-10 md:w-12 md:h-12 border border-stone-200 rounded-md overflow-hidden cursor-pointer hover:border-stone-800 transition-colors shrink-0"
                     onmouseover="this.closest('.product-card').querySelector('.main-img').src='${img}'">
                    <img src="${img}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x100?text=Img'">
                </div>
            `).join('');

            const actionButton = showAddToCart ? `
                <button class="add-to-cart-btn w-full bg-stone-900 text-white py-2.5 md:py-3 rounded-md hover:bg-stone-700 active:bg-stone-950 transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base">
                    Add to Cart
                </button>
            ` : `
                <a href="shop" class="w-full bg-white border border-stone-300 text-stone-700 py-2.5 md:py-3 rounded-md hover:bg-stone-50 transition-colors font-medium flex items-center justify-center text-sm md:text-base">
                    View Details
                </a>
            `;

            card.innerHTML = `
                <div class="w-full aspect-square md:h-64 bg-stone-100 relative overflow-hidden group">
                    <img src="${mainImgSrc}" alt="${product.name}" 
                         class="main-img w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                         onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                    
                    <!-- Quick view visible on hover for desktop, absolute for mobile -->
                    <button type="button" class="quick-view-btn absolute top-3 right-3 bg-white p-2 rounded-full shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50 text-gray-700 hover:text-stone-900 z-10" title="Quick View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                
                <div class="p-4 flex flex-col flex-grow">
                    <div class="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide w-full">${thumbnailsHtml}</div>
                    <div class="mb-2">
                        <p class="text-stone-500 text-[10px] md:text-xs uppercase tracking-wide font-medium mb-1">${product.category}</p>
                        <h3 class="text-base md:text-lg font-bold text-stone-800 line-clamp-1" title="${product.name}">${product.name}</h3>
                    </div>
                    <div class="mt-auto">
                        <div class="flex justify-between items-end mb-4">
                            <p class="text-lg md:text-xl font-bold text-stone-900">${formatPrice(product.price)}</p>
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
                    e.stopPropagation();
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

        // Re-bind Add button
        const newBtn = shopModalAddBtn.cloneNode(true);
        shopModalAddBtn.parentNode.replaceChild(newBtn, shopModalAddBtn);
        shopModalAddBtn = newBtn;
        
        shopModalAddBtn.addEventListener('click', () => {
            addItemToCart(product);
            closeShopModal();
        });

        shopModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            shopModalWrapper.classList.remove('scale-95', 'opacity-0');
            shopModalWrapper.classList.add('scale-100', 'opacity-100');
        });
        
        document.body.style.overflow = 'hidden'; 
    }

    function closeShopModal() {
        if (!shopModal) return;
        
        shopModalWrapper.classList.remove('scale-100', 'opacity-100');
        shopModalWrapper.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            shopModal.classList.add('hidden');
            document.body.style.overflow = ''; 
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
            filterButtons.forEach(b => b.classList.remove('active', 'bg-stone-900', 'text-white'));
            filterButtons.forEach(b => b.classList.add('bg-stone-100', 'text-stone-600'));
            
            btn.classList.remove('bg-stone-100', 'text-stone-600');
            btn.classList.add('active', 'bg-stone-900', 'text-white');
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
            // UPDATED: Improved flex layout for small screens
            itemEl.className = "flex gap-3 md:gap-4 py-4 border-b border-stone-100";
            
            // UPDATED: Increased Touch Targets for buttons (w-8 h-8)
            itemEl.innerHTML = `
                <img src="${item.image}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md bg-gray-100 shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <h4 class="font-medium text-stone-800 text-sm truncate pr-2">${item.name}</h4>
                        <button class="remove-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
                    </div>
                    <p class="text-stone-500 text-sm mt-1">${formatPrice(item.price)}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button class="qty-btn-minus w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-stone-900 hover:text-white transition-colors text-sm">-</button>
                        <span class="text-sm font-medium w-4 text-center">${item.quantity}</span>
                        <button class="qty-btn-plus w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-stone-900 hover:text-white transition-colors text-sm">+</button>
                    </div>
                </div>
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
            document.body.style.overflow = 'hidden'; // Lock scroll
            setTimeout(() => cartPanel.querySelector('.side-panel')?.classList.add('translate-x-0'), 10);
        }
    }
    function closeCartPanel() {
        if(cartPanel) {
            cartPanel.querySelector('.side-panel')?.classList.remove('translate-x-0');
            setTimeout(() => {
                cartPanel.classList.add('hidden');
                document.body.style.overflow = ''; // Unlock scroll
            }, 300);
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
    
    // UPDATED: Improved mobile menu toggling logic
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
    }

    // --- INITIALIZE ---
    loadProducts();
    updateCartUI();
});