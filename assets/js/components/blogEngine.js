function initBlog() {
    const blogIndex = document.getElementById('blog-index');
    const blogReader = document.getElementById('blog-reader');
    const catBtns = document.querySelectorAll('.cat-btn');
    const backBtn = document.querySelector('.btn-back-to-index');

    if (!blogIndex || !blogReader) return;

    // Render all articles (Live and Placeholders)
    function renderBlogList(filter = 'all') {
        blogIndex.innerHTML = '';

        // Combine real articles and placeholders
        const allItems = [
            ...blogArticles.map(a => ({ ...a, type: 'live' })),
            ...(typeof blogPlaceholders !== "undefined" ? blogPlaceholders : []).map(p => ({ ...p, type: 'locked', id: null }))
        ];

        allItems.forEach(item => {
            const itemCat = item.category || item.cat;
            if (filter !== 'all' && itemCat !== filter) return;

            const isLockedPro = item.isPro && !window.isBlogUnlocked(item.id);

            const card = document.createElement('article');
            card.className = `article-card widget rugged-bevel brushed-metal ${item.type === 'locked' ? 'locked' : ''} ${isLockedPro ? 'pro-locked' : ''}`;
            if (item.id) card.setAttribute('data-id', item.id);
            card.setAttribute('data-cat', itemCat);

            const metaTag = isLockedPro 
                ? `<span class="status-tag gold-tag" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(212, 175, 55, 0.1) !important; color: #FFD700 !important; border: 1px solid rgba(212, 175, 55, 0.3);"><span class="material-symbols-outlined" style="font-size: 0.95rem; vertical-align: middle;">lock</span>LOCKED</span>` 
                : `<span class="read-time">${item.readTime}</span>`;

            card.innerHTML = `
                <div class="card-meta">
                    <span class="cat-tag ${item.isPro ? 'gold-tag' : ''}">${(item.categoryLabel || item.cat).toUpperCase()}</span>
                    ${item.type === 'locked' ? `<span class="status-tag">UPCOMING</span>` : metaTag}
                </div>
                <h3 class="article-title ${item.type === 'live' ? 'text-primary' : ''}">${item.title}</h3>
                <p class="article-excerpt">${item.excerpt}</p>
                ${(item.type === 'live') ? (isLockedPro 
                    ? `<button class="read-more unlock-ad-btn" style="color: #FFD700 !important; border-color: rgba(212, 175, 55, 0.5) !important; background: rgba(212, 175, 55, 0.1) !important; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 1.1rem; vertical-align: middle;">workspace_premium</span>🔓 UNLOCK WITH AD</button>` 
                    : `<button class="read-more">READ DEEP DIVE <span class="material-symbols-outlined">arrow_forward</span></button>`
                ) : ''}
            `;

            if (item.type === 'live') {
                if (isLockedPro) {
                    const readBtn = card.querySelector('.read-more');
                    if (readBtn) {
                        readBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.pendingArticleToOpen = item.id;
                            window.showProUpgradeModal('blog');
                        });
                    }
                    card.addEventListener('click', () => {
                        window.pendingArticleToOpen = item.id;
                        window.showProUpgradeModal('blog');
                    });
                } else {
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
        blogReader.style.display = 'block';
        window.scrollTo(0, 0);
    }
    window.openBlogArticle = openArticle;

    // Category Filtering
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Return to index if reading an article
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
            
            renderBlogList(cat);
        });
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
        });
    }

    // Initial Render
    renderBlogList();

    // Listen for Pro status changes to re-render gated content
    document.addEventListener('proStatusChanged', () => {
        const activeBtn = Array.from(catBtns).find(b => b.classList.contains('active'));
        renderBlogList(activeBtn ? activeBtn.getAttribute('data-cat') : 'all');
    });
}