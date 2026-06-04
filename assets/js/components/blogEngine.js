function initBlog() {
    const blogIndex = document.getElementById('blog-index');
    const blogReader = document.getElementById('blog-reader');
    const catBtns = document.querySelectorAll('#blog-view .cat-btn');
    const backBtn = document.querySelector('.btn-back-to-index');
    const searchInput = document.getElementById('blog-search-input');

    if (!blogIndex || !blogReader) return;

    let currentCategory = 'all';
    let searchQuery = '';

    // Render all articles (Live and Placeholders)
    function renderBlogList() {
        blogIndex.innerHTML = '';

        // Combine real articles and placeholders
        const allItems = [
            ...blogArticles.map(a => ({ ...a, type: 'live' })),
            ...(typeof blogPlaceholders !== "undefined" ? blogPlaceholders : []).map(p => ({ ...p, type: 'locked', id: null }))
        ];

        allItems.forEach(item => {
            const itemCat = item.category || item.cat;
            
            // Check category filter
            if (currentCategory !== 'all' && itemCat !== currentCategory) return;

            // Check search filter
            if (searchQuery) {
                const titleText = (item.title || '').toLowerCase();
                const excerptText = (item.excerpt || '').toLowerCase();
                const catText = (item.categoryLabel || item.cat || '').toLowerCase();
                if (!titleText.includes(searchQuery) && 
                    !excerptText.includes(searchQuery) && 
                    !catText.includes(searchQuery)) {
                    return;
                }
            }

            const card = document.createElement('article');
            card.className = `article-card widget rugged-bevel brushed-metal ${item.type === 'locked' ? 'locked' : ''}`;
            if (item.id) card.setAttribute('data-id', item.id);
            card.setAttribute('data-cat', itemCat);

            const metaTag = `<span class="read-time">${item.readTime}</span>`;

            card.innerHTML = `
                <div class="card-meta">
                    <span class="cat-tag">${(item.categoryLabel || item.cat).toUpperCase()}</span>
                    ${item.type === 'locked' ? `<span class="status-tag">UPCOMING</span>` : metaTag}
                </div>
                <h3 class="article-title ${item.type === 'live' ? 'text-primary' : ''}">${item.title}</h3>
                <p class="article-excerpt">${item.excerpt}</p>
                ${(item.type === 'live') ? `<button class="read-more">READ DEEP DIVE <span class="material-symbols-outlined">arrow_forward</span></button>` : ''}
            `;

            if (item.type === 'live') {
                const readBtn = card.querySelector('.read-more');
                const handleRead = (e) => {
                    if (e) e.stopPropagation();
                    if (window.Capacitor) {
                        openArticle(item.id);
                    } else {
                        window.open(`blog/${item.id}.html`, '_blank');
                    }
                };
                if (readBtn) {
                    readBtn.addEventListener('click', handleRead);
                }
                card.addEventListener('click', handleRead);
            }

            blogIndex.appendChild(card);
        });
    }

    function openArticle(id) {
        const article = blogArticles.find(a => a.id === id);
        if (!article) return;

        const container = document.getElementById('article-view');
        container.innerHTML = article.content;
        
        blogIndex.style.display = 'none';
        
        // Hide search container when reading an article
        const searchContainer = document.querySelector('#blog-view .global-search-container');
        if (searchContainer) searchContainer.style.display = 'none';

        blogReader.style.display = 'block';
        window.scrollTo(0, 0);
    }
    window.openBlogArticle = openArticle;

    // Category Filtering
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.getAttribute('data-cat');
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Return to index if reading an article
            blogReader.style.display = 'none';
            
            // Show search container again when returning to index
            const searchContainer = document.querySelector('#blog-view .global-search-container');
            if (searchContainer) searchContainer.style.display = 'block';

            blogIndex.style.display = 'grid';
            
            renderBlogList();
        });
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            blogReader.style.display = 'none';
            
            // Show search container again when returning to index
            const searchContainer = document.querySelector('#blog-view .global-search-container');
            if (searchContainer) searchContainer.style.display = 'block';

            blogIndex.style.display = 'grid';
        });
    }

    // Set up search event listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderBlogList();
        });
    }

    // Initial Render
    renderBlogList();

    // Listen for Pro status changes to re-render gated content
    document.addEventListener('proStatusChanged', () => {
        renderBlogList();
    });
}