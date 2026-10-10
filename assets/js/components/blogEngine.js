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
    function renderBlogList(categoryOverride) {
        if (typeof categoryOverride === 'string' && categoryOverride.length > 0) {
            currentCategory = categoryOverride;
        }
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
                    } else if (window.electronAPI && window.electronAPI.isDesktop) {
                        window.open(`https://www.soundengg.com/blog/${item.id}`, '_blank');
                    } else {
                        window.open(`blog/${item.id}`, '_blank');
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
    window.renderBlogList = renderBlogList;

    function closeBlogArticleIfOpen() {
        const blogViewEl = document.getElementById('blog-view');
        const isBlogViewActive = blogViewEl && (blogViewEl.style.display === 'block' || window.getComputedStyle(blogViewEl).display === 'block');
        if (isBlogViewActive && blogReader && blogReader.style.display !== 'none' && window.getComputedStyle(blogReader).display !== 'none') {
            blogReader.style.display = 'none';
            const searchContainer = document.querySelector('#blog-view .global-search-container');
            if (searchContainer) searchContainer.style.display = 'block';
            blogIndex.style.display = 'grid';
            window.scrollTo(0, 0);
            return true;
        }
        return false;
    }
    window.closeBlogArticleIfOpen = closeBlogArticleIfOpen;

    function resetBlogToIndex() {
        blogReader.style.display = 'none';
        const searchContainer = document.querySelector('#blog-view .global-search-container');
        if (searchContainer) searchContainer.style.display = 'block';
        blogIndex.style.display = 'grid';
        catBtns.forEach(b => b.classList.remove('active'));
        const allBtn = document.querySelector('#blog-view .cat-btn[data-cat="all"]');
        if (allBtn) allBtn.classList.add('active');
        renderBlogList('all');
    }
    window.resetBlogToIndex = resetBlogToIndex;

    function openArticle(id) {
        const article = blogArticles.find(a => a.id === id);
        if (!article) return;

        const container = document.getElementById('article-view');
        container.innerHTML = article.content;
        
        // Intercept internal links to prevent full page reloads inside WebView / App console
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.includes('app.html') || href.startsWith('#'))) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Extract hash fragment or view parameter
                    const hashIndex = href.indexOf('#');
                    let viewKey = '';
                    if (hashIndex !== -1) {
                        viewKey = href.substring(hashIndex + 1);
                    } else {
                        const urlParams = new URLSearchParams(href.split('?')[1] || '');
                        viewKey = urlParams.get('view') || '';
                    }

                    if (viewKey) {
                        const normalizedKey = viewKey.toLowerCase().trim().replace(/[-_]/g, '');
                        const viewMap = {
                            // RTA Analyzer
                            'rta': document.getElementById('rta-view'),
                            'rtaanalyzer': document.getElementById('rta-view'),
                            // Delay Finder
                            'delay': document.getElementById('module-view'),
                            'delayfinder': document.getElementById('module-view'),
                            // Audio Pinouts
                            'pinout': document.getElementById('pinout-view'),
                            'pinouts': document.getElementById('pinout-view'),
                            'audiopinouts': document.getElementById('pinout-view'),
                            // Speaker Impedance
                            'impedance': document.getElementById('impedance-view'),
                            'speakerimpedance': document.getElementById('impedance-view'),
                            // Subwoofer Array
                            'subcalc': document.getElementById('sub-calc-view'),
                            'subwoofer': document.getElementById('sub-calc-view'),
                            'subwooferarray': document.getElementById('sub-calc-view'),
                            // Signal Generator
                            'siggen': document.getElementById('siggen-view'),
                            'signalgen': document.getElementById('siggen-view'),
                            'signalgenerator': document.getElementById('siggen-view'),
                            // Ear Training Lab
                            'eartraining': document.getElementById('ear-training-view'),
                            'ear': document.getElementById('ear-training-view'),
                            // Tap Tempo Delay
                            'tapdelay': document.getElementById('tap-delay-view'),
                            'taptempo': document.getElementById('tap-delay-view'),
                            'tap': document.getElementById('tap-delay-view'),
                            // System views
                            'author': document.getElementById('author-view'),
                            'blog': document.getElementById('blog-view'),
                            'menu': document.getElementById('menu-view'),
                            'settings': document.getElementById('settings-view'),
                            'dashboard': document.getElementById('dashboard-view')
                        };

                        const target = viewMap[normalizedKey] || viewMap[viewKey.toLowerCase().trim()];
                        if (target && typeof window.showView === 'function') {
                            window.showView(target);
                        }
                    }
                });
            }
        });

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
            closeBlogArticleIfOpen();
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