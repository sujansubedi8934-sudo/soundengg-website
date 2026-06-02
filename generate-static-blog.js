const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');
const blogDestDir = path.join(destDir, 'blog');

// Mock window context to execute and load blog data from JS files
const blogs = [];
const window = {
    soundEnggBlogs: {
        push: (obj) => blogs.push(obj)
    }
};

// Evaluate each file in the mock context
const blogsDir = path.join(srcDir, 'assets/js/data/blogs');
if (!fs.existsSync(blogsDir)) {
    console.error("❌ Blogs directory not found in assets/js/data/blogs!");
    process.exit(1);
}

const files = fs.readdirSync(blogsDir);
files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(blogsDir, file);
        const code = fs.readFileSync(filePath, 'utf8');
        try {
            (new Function('window', code))(window);
        } catch (e) {
            console.error(`❌ Error executing ${file}:`, e);
        }
    }
});

console.log(`📚 Loaded ${blogs.length} blog posts successfully.`);

// Create blog output directory inside www/
if (!fs.existsSync(blogDestDir)) {
    fs.mkdirSync(blogDestDir, { recursive: true });
}

// HTML Generator Template matching the VFD and Landing Page Theme
const getTemplate = (blog) => {
    const keywords = blog.seoKeywords ? blog.seoKeywords.join(', ') : '';
    const category = blog.categoryLabel || blog.category.toUpperCase();
    
    // Format JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": blog.title,
        "description": blog.excerpt,
        "image": "https://soundengg.com/assets/img/og-preview.png",
        "author": {
            "@type": "Person",
            "name": "Sujan Subedi",
            "url": "https://soundengg.com/"
        },
        "publisher": {
            "@type": "Organization",
            "name": "SoundEngg",
            "logo": {
                "@type": "ImageObject",
                "url": "https://soundengg.com/assets/img/logo.png"
            }
        },
        "datePublished": "2026-05-15",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://soundengg.com/blog/${blog.id}.html`
        }
    };

    return `<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${blog.title} | SoundEngg Blog</title>
    <meta name="description" content="${blog.excerpt}">
    <meta name="keywords" content="${keywords}">
    <link rel="canonical" href="https://soundengg.com/blog/${blog.id}.html">

    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://soundengg.com/blog/${blog.id}.html">
    <meta property="og:title" content="${blog.title} | SoundEngg Blog">
    <meta property="og:description" content="${blog.excerpt}">
    <meta property="og:image" content="https://soundengg.com/assets/img/og-preview.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://soundengg.com/blog/${blog.id}.html">
    <meta property="twitter:title" content="${blog.title} | SoundEngg Blog">
    <meta property="twitter:description" content="${blog.excerpt}">

    <!-- Styles -->
    <link rel="stylesheet" href="../assets/css/styles.css?v=3.6.1">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
    </script>

    <!-- Google AdSense Tag -->
    <meta name="google-adsense-account" content="ca-pub-4117687060036448">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4117687060036448" crossorigin="anonymous"></script>
</head>
<body class="landing-page">
    <header class="landing-nav">
        <div class="container nav-container">
            <a href="../index.html" class="logo-link">
                <img src="../assets/img/logo-dark.png" alt="SoundEngg Logo" class="brand-logo dark-logo">
            </a>
            <div class="nav-links">
                <a href="../index.html">Home</a>
                <a href="../blog.html">Blog</a>
                <a href="../app.html" class="btn btn-primary">Launch Console</a>
            </div>
            <!-- Mobile View Navigation Select Dropdown -->
            <div class="mobile-nav-dropdown-container">
                <button class="mobile-nav-toggle-btn btn-landing-nav-toggle" aria-label="Toggle Navigation Dropdown">
                    <span class="landing-nav-active-label">MENU</span>
                    <span class="material-symbols-outlined dropdown-arrow">arrow_drop_down</span>
                </button>
                <div class="mobile-nav-dropdown-menu landing-nav-dropdown-menu" style="display: none;">
                    <a href="../index.html#features" class="mobile-nav-item">FEATURES</a>
                    <a href="../pro.html" class="mobile-nav-item">PRO</a>
                    <a href="../blog.html" class="mobile-nav-item active">BLOG</a>
                    <a href="../index.html#contact" class="mobile-nav-item">CONTACT</a>
                    <a href="../app.html" class="mobile-nav-item">LAUNCH</a>
                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    const toggleBtn = document.querySelector('.btn-landing-nav-toggle');
                    const menu = document.querySelector('.landing-nav-dropdown-menu');
                    if (!toggleBtn || !menu) return;

                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isVisible = menu.style.display === 'flex';
                        menu.style.display = isVisible ? 'none' : 'flex';
                        toggleBtn.classList.toggle('active', !isVisible);
                    });

                    document.addEventListener('click', (e) => {
                        if (!menu.contains(e.target) && e.target !== toggleBtn) {
                            menu.style.display = 'none';
                            toggleBtn.classList.remove('active');
                        }
                    });
                });
            </script>
        </div>
    </header>

    <main class="container" style="padding-top: 120px; padding-bottom: 100px;">
        <div class="article-reader" style="max-width: 800px; margin: 0 auto;">
             <a href="../blog.html" style="display: inline-flex; align-items: center; color: var(--primary); text-decoration: none; margin-bottom: 2rem; font-size: 0.9rem;">
                 <span class="material-symbols-outlined" style="margin-right: 0.5rem;">arrow_back</span> BACK TO INDEX
             </a>
             
             <!-- Article Main Content -->
             ${blog.content}
             
             <!-- Google AdSense Native Article Ad Unit -->
             <div class="ad-placeholder adsbygoogle-container" style="margin-top: 3rem; background: var(--surface-low); border: 1px dashed var(--border-color); border-radius: 8px; padding: 1.5rem; text-align: center;">
                 <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 1px;">SPONSOR_ADVERTISEMENT</div>
                 <ins class="adsbygoogle"
                      style="display:block; text-align:center;"
                      data-ad-layout="in-article"
                      data-ad-format="fluid"
                      data-ad-client="ca-pub-4117687060036448"
                      data-ad-slot="1234567890"></ins>
                 <script>
                      (adsbygoogle = window.adsbygoogle || []).push({});
                 </script>
             </div>
             
             <!-- Author Bio Card -->
             <div class="author-card rugged-bevel brushed-metal" style="margin-top: 4rem; padding: 2.5rem; background: var(--surface-low, #121212); border: 1px solid var(--border-color, #222); border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
                 <div style="display: flex; flex-direction: row; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                     <div class="author-avatar-wrap" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid var(--primary, #00ffff); flex-shrink: 0; box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);">
                         <img src="../assets/img/author-profile.jpg" alt="Sujan Subedi" style="width: 100%; height: 100%; object-fit: cover;">
                     </div>
                     <div style="flex: 1; min-width: 200px;">
                         <h4 style="margin: 0 0 0.25rem 0; font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.5px;">Sujan Subedi</h4>
                         <p style="margin: 0; font-size: 0.85rem; color: var(--primary, #00ffff); font-family: var(--font-mono, monospace); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">Lead Audio Systems Engineer & Founder</p>
                     </div>
                 </div>
                 <p style="margin: 0; font-size: 0.95rem; color: var(--text-muted, #aaa); line-height: 1.6;">
                     Sujan Subedi is a distinguished Live Sound Mixing and System Engineer operating across India and Nepal. A graduate of A.R. Rahman's KMMC (Chennai), he specializes in tailoring large-scale sound reinforcement configurations, DSP tuning, and advanced acoustic simulation engines.
                 </p>
                 <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px dashed var(--border-color, #222);">
                     <span style="font-size: 0.85rem; color: var(--text-muted, #888); font-family: var(--font-mono, monospace);">CONTACT_AUTHOR:</span>
                     <a href="mailto:sujan@soundengg.com" style="color: var(--primary, #00ffff); text-decoration: none; font-size: 0.9rem; font-family: var(--font-mono, monospace); font-weight: 600; transition: all 0.2s;">
                         sujan@soundengg.com
                     </a>
                 </div>
             </div>

             <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                 <p style="color: var(--text-muted); font-size: 0.9rem;">Share this article:</p>
                 <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                     <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent('https://soundengg.com/blog/' + blog.id + '.html')}" target="_blank" class="btn btn-outline small-btn">Twitter</a>
                     <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://soundengg.com/blog/' + blog.id + '.html')}" target="_blank" class="btn btn-outline small-btn">LinkedIn</a>
                 </div>
             </div>
        </div>
    </main>

    <footer class="landing-footer">
        <div class="footer-bottom">
            <div class="container">
                <p>&copy; 2026 SoundEngg. Built by Engineers for Engineers.</p>
            </div>
        </div>
    </footer>
    <!-- Vercel Web Analytics & Speed Insights -->
    <script defer src="/_vercel/insights/script.js"></script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>
`;
};

// Write out static HTML for each blog post
blogs.forEach(blog => {
    const htmlContent = getTemplate(blog);
    const outputFilePath = path.join(blogDestDir, `${blog.id}.html`);
    fs.writeFileSync(outputFilePath, htmlContent, 'utf8');
    console.log(`  - Generated static blog post: blog/${blog.id}.html`);
});

// Dynamic Sitemap generation including all newly discovered blogs
const generateSitemap = () => {
    const sitemapPath = path.join(destDir, 'sitemap.xml');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
  <url>
    <loc>https://soundengg.com/</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soundengg.com/index.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soundengg.com/app.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soundengg.com/blog.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soundengg.com/privacy.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://soundengg.com/terms.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Blog Articles -->
`;

    blogs.forEach(blog => {
        xml += `  <url>
    <loc>https://soundengg.com/blog/${blog.id}.html</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    xml += `</urlset>`;
    
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    // Also copy to root sitemap.xml to keep source in sync!
    fs.writeFileSync(path.join(srcDir, 'sitemap.xml'), xml, 'utf8');
    console.log(`✅ Generated sitemap.xml with ${blogs.length} static blog posts.`);
};

generateSitemap();
