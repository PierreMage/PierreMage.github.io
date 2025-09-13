/**
 * Read It Later - A simple article saving application
 * Built with vanilla JavaScript following KISS principles
 */

// Application state and configuration
const App = {
    // Storage key for localStorage
    STORAGE_KEY: 'readItLater_articles',
    
    // Application data
    articles: [],
    filteredArticles: [],
    currentFilter: 'all',
    
    // DOM elements (will be populated on init)
    elements: {},
    
    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Read It Later app...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Load saved articles from localStorage
        this.loadArticles();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial state
        this.renderArticles();

        // Update delete all button visibility
        this.updateDeleteAllButtonVisibility();

        console.log('App initialized successfully');
    },
    
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            addArticleForm: document.getElementById('addArticleForm'),
            articleUrl: document.getElementById('articleUrl'),
            articleTitle: document.getElementById('articleTitle'),
            articleTags: document.getElementById('articleTags'),
            searchInput: document.getElementById('searchInput'),
            filterTabs: document.querySelectorAll('.filter-tab'),
            articlesContainer: document.getElementById('articlesContainer'),
            emptyState: document.getElementById('emptyState'),
            messageContainer: document.getElementById('messageContainer'),
            csvFileInput: document.getElementById('csvFileInput'),
            exportButton: document.getElementById('exportButton'),
            deleteAllButton: document.getElementById('deleteAllButton'),
            deleteAllModal: document.getElementById('deleteAllModal'),
            confirmDeleteAll: document.getElementById('confirmDeleteAll'),
            cancelDeleteAll: document.getElementById('cancelDeleteAll'),
            deleteAllMessage: document.getElementById('deleteAllMessage'),
            editArticleModal: document.getElementById('editArticleModal'),
            editArticleForm: document.getElementById('editArticleForm'),
            editArticleTitleInput: document.getElementById('editArticleTitleInput'),
            editArticleTagsInput: document.getElementById('editArticleTagsInput'),
            saveEditedArticle: document.getElementById('saveEditedArticle'),
            cancelEditArticle: document.getElementById('cancelEditArticle')
        };
        
        // Verify all elements exist
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.error(`Element not found: ${key}`);
            }
        }
    },
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Form submission
        this.elements.addArticleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddArticle();
        });

        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter tabs
        this.elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleFilterTabClick(e.target);
            });
        });

        // CSV file input
        this.elements.csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImportCSV(file);
                // Clear the input so the same file can be selected again
                e.target.value = '';
            }
        });

        // Export button
        this.elements.exportButton.addEventListener('click', () => {
            this.exportToCSV();
        });

        // Delete all button
        this.elements.deleteAllButton.addEventListener('click', () => {
            this.showDeleteAllModal();
        });

        // Delete all modal handlers
        this.elements.confirmDeleteAll.addEventListener('click', () => {
            this.deleteAllArticles();
        });

        this.elements.cancelDeleteAll.addEventListener('click', () => {
            this.hideDeleteAllModal();
        });

        // Modal close button
        this.elements.deleteAllModal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideDeleteAllModal();
        });

        // Modal overlay click to close
        this.elements.deleteAllModal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.hideDeleteAllModal();
        });

        // Edit Article Modal event listeners
        this.elements.saveEditedArticle.addEventListener('click', () => {
            this.saveEditedArticle();
        });

        this.elements.cancelEditArticle.addEventListener('click', () => {
            this.hideEditArticleModal();
        });

        this.elements.editArticleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedArticle();
        });

        // Edit modal close button
        this.elements.editArticleModal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideEditArticleModal();
        });

        // Edit modal overlay click to close
        this.elements.editArticleModal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.hideEditArticleModal();
        });

        // Keyboard support for modals
        document.addEventListener('keydown', (e) => {
            // Delete All Modal
            if (this.elements.deleteAllModal.style.display !== 'none') {
                if (e.key === 'Escape') {
                    this.hideDeleteAllModal();
                } else if (e.key === 'Enter' && e.target === this.elements.confirmDeleteAll) {
                    this.deleteAllArticles();
                }
            }

            // Edit Article Modal
            if (this.elements.editArticleModal.style.display !== 'none') {
                if (e.key === 'Escape') {
                    this.hideEditArticleModal();
                } else if (e.key === 'Enter' && e.target === this.elements.saveEditedArticle) {
                    this.saveEditedArticle();
                }
            }
        });

        // URL blur event for automatic title extraction
        this.elements.articleUrl.addEventListener('blur', (e) => {
            this.handleUrlBlur(e.target.value.trim());
        });

        // Keyboard navigation for articles
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Focus management for messages
        this.elements.messageContainer.addEventListener('DOMNodeInserted', (e) => {
            if (e.target.classList && e.target.classList.contains('message')) {
                // Announce to screen readers
                e.target.setAttribute('role', 'alert');
            }
        });
    },

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        // Handle Escape key to close messages
        if (e.key === 'Escape') {
            const messages = this.elements.messageContainer.querySelectorAll('.message');
            messages.forEach(message => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            });
        }

        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                case 'F':
                    // Focus search input
                    e.preventDefault();
                    this.elements.searchInput.focus();
                    break;
                case 'n':
                case 'N':
                    // Focus URL input for new article
                    e.preventDefault();
                    this.elements.articleUrl.focus();
                    break;
            }
        }
    },
    
    /**
     * Load articles from localStorage
     */
    loadArticles() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.articles = stored ? JSON.parse(stored) : [];

            // Migrate existing articles to new format
            this.migrateArticles();

            this.filteredArticles = [...this.articles];
            console.log(`Loaded ${this.articles.length} articles from storage`);
        } catch (error) {
            console.error('Error loading articles from storage:', error);
            this.articles = [];
            this.filteredArticles = [];
            this.showMessage('Error loading saved articles', 'error');
        }
    },

    /**
     * Migrate existing articles to include new Pocket-compatible fields
     */
    migrateArticles() {
        let migrationNeeded = false;

        this.articles = this.articles.map(article => {
            const migratedArticle = { ...article };

            // Add timeAdded if missing (convert from dateAdded)
            if (!migratedArticle.timeAdded && migratedArticle.dateAdded) {
                migratedArticle.timeAdded = Math.floor(new Date(migratedArticle.dateAdded).getTime() / 1000);
                migrationNeeded = true;
            }

            // Add status if missing (convert from isRead)
            if (!migratedArticle.status) {
                migratedArticle.status = migratedArticle.isRead ? 'archive' : 'unread';
                migrationNeeded = true;
            }

            // Add tags if missing
            if (!migratedArticle.tags) {
                migratedArticle.tags = [];
                migrationNeeded = true;
            }

            return migratedArticle;
        });

        // Save migrated data if changes were made
        if (migrationNeeded) {
            this.saveArticles();
            console.log('Articles migrated to new format');
        }
    },
    
    /**
     * Save articles to localStorage
     */
    saveArticles() {
        try {
            const dataString = JSON.stringify(this.articles);

            // Check if localStorage is available and has enough space
            if (typeof Storage === 'undefined') {
                throw new Error('localStorage is not supported in this browser');
            }

            // Try to save and handle quota exceeded errors
            localStorage.setItem(this.STORAGE_KEY, dataString);
            console.log('Articles saved to storage');
        } catch (error) {
            console.error('Error saving articles to storage:', error);

            if (error.name === 'QuotaExceededError') {
                this.showMessage('Storage quota exceeded. Please delete some articles.', 'error');
            } else if (error.message.includes('localStorage is not supported')) {
                this.showMessage('Your browser does not support local storage. Articles will not be saved.', 'warning');
            } else {
                this.showMessage('Error saving articles. Changes may not be preserved.', 'error');
            }
        }
    },
    
    /**
     * Handle adding a new article
     */
    handleAddArticle() {
        const url = this.elements.articleUrl.value.trim();
        const title = this.elements.articleTitle.value.trim();
        const tagsInput = this.elements.articleTags.value.trim();

        // Process tags
        const tags = this.processTags(tagsInput);

        // Comprehensive validation
        const validationResult = this.validateArticleInput(url, title);
        if (!validationResult.isValid) {
            this.showMessage(validationResult.message, 'error');
            return;
        }

        // Check if URL already exists
        if (this.articles.some(article => article.url === validationResult.normalizedUrl)) {
            this.showMessage('This article is already saved', 'warning');
            return;
        }

        try {
            // Create new article object
            const article = {
                id: this.generateId(),
                url: validationResult.normalizedUrl,
                title: title || this.generateFallbackTitle(validationResult.normalizedUrl),
                dateAdded: new Date().toISOString(),
                timeAdded: Math.floor(Date.now() / 1000), // Unix timestamp for Pocket compatibility
                isRead: false,
                status: 'unread', // Pocket format: 'unread' or 'archive'
                tags: tags // Array of tags from user input
            };

            // Add to articles array
            this.articles.unshift(article); // Add to beginning

            // Save to storage
            this.saveArticles();

            // Update display
            this.applyCurrentFilter();
            this.renderArticles();
            this.updateDeleteAllButtonVisibility();

            // Clear form
            this.elements.addArticleForm.reset();

            // Show success message
            this.showMessage('Article saved successfully!', 'success');

            console.log('Article added:', article);
        } catch (error) {
            console.error('Error adding article:', error);
            this.showMessage('Failed to save article. Please try again.', 'error');
        }
    },

    /**
     * Validate article input
     */
    validateArticleInput(url, title) {
        // Check if URL is provided
        if (!url) {
            return { isValid: false, message: 'Please enter a URL' };
        }

        // Normalize URL (add protocol if missing)
        let normalizedUrl = url;
        if (!url.match(/^https?:\/\//)) {
            normalizedUrl = 'https://' + url;
        }

        // Validate URL format
        try {
            const urlObj = new URL(normalizedUrl);

            // Check for valid protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return { isValid: false, message: 'Only HTTP and HTTPS URLs are supported' };
            }

            // Check for valid hostname
            if (!urlObj.hostname || urlObj.hostname.length < 3) {
                return { isValid: false, message: 'Please enter a valid URL with a proper domain' };
            }

            return { isValid: true, normalizedUrl: normalizedUrl };
        } catch (error) {
            return { isValid: false, message: 'Please enter a valid URL (e.g., https://example.com)' };
        }
    },
    
    /**
     * Generate a unique ID for articles
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Generate a fallback title from URL (simple fallback)
     */
    generateFallbackTitle(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const segments = pathname.split('/').filter(segment => segment);

            if (segments.length > 0) {
                // Take the last segment and clean it up
                return segments[segments.length - 1]
                    .replace(/[-_]/g, ' ')
                    .replace(/\.[^/.]+$/, '') // Remove file extension
                    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
            }

            return urlObj.hostname;
        } catch (error) {
            return 'Untitled Article';
        }
    },

    /**
     * Process tags input string into array
     */
    processTags(tagsInput) {
        if (!tagsInput) return [];

        return tagsInput
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => tag.toLowerCase()) // Normalize to lowercase
            .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
    },
    
    /**
     * Handle search functionality
     */
    handleSearch(query) {
        console.log('Searching for:', query);
        this.applyCurrentFilter(query);
        this.renderArticles();
    },
    
    /**
     * Handle filter tab click
     */
    handleFilterTabClick(clickedTab) {
        const filter = clickedTab.dataset.filter;
        console.log('Filter changed to:', filter);

        // Update tab states
        this.elements.filterTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });

        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');

        // Apply filter
        this.currentFilter = filter;
        this.applyCurrentFilter();
        this.renderArticles();
    },


    
    /**
     * Apply current filter and search
     */
    applyCurrentFilter(searchQuery = '') {
        const query = searchQuery || this.elements.searchInput.value.toLowerCase();
        
        this.filteredArticles = this.articles.filter(article => {
            // Apply read/unread filter
            let matchesFilter = true;
            if (this.currentFilter === 'read') {
                matchesFilter = article.isRead;
            } else if (this.currentFilter === 'unread') {
                matchesFilter = !article.isRead;
            }
            
            // Apply search query
            let matchesSearch = true;
            if (query) {
                const searchText = `${article.title} ${article.url} ${(article.tags || []).join(' ')}`.toLowerCase();
                matchesSearch = searchText.includes(query);
            }
            
            return matchesFilter && matchesSearch;
        });
    },
    
    /**
     * Render the articles list
     */
    renderArticles() {
        const container = this.elements.articlesContainer;
        const emptyState = this.elements.emptyState;
        
        // Show/hide empty state
        if (this.filteredArticles.length === 0) {
            emptyState.style.display = 'block';
            if (this.articles.length === 0) {
                emptyState.innerHTML = '<h3>No articles saved yet</h3><p>Start by adding your first article above!</p>';
            } else {
                emptyState.innerHTML = '<h3>No articles match your search</h3><p>Try adjusting your search terms or filter.</p>';
            }
        } else {
            emptyState.style.display = 'none';
        }
        
        // Clear existing articles (except empty state)
        const existingArticles = container.querySelectorAll('.article-item');
        existingArticles.forEach(item => item.remove());
        
        // Render each article
        this.filteredArticles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            container.appendChild(articleElement);
        });
        
        console.log(`Rendered ${this.filteredArticles.length} articles`);
    },
    
    /**
     * Create an article element for display
     */
    createArticleElement(article) {
        const articleDiv = document.createElement('div');
        articleDiv.className = `article-item ${article.isRead ? 'read' : 'unread'}`;
        articleDiv.setAttribute('data-id', article.id);

        const formattedDate = new Date(article.dateAdded).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        articleDiv.innerHTML = `
            <div class="article-header">
                <h3 class="article-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${this.escapeHtml(article.title)}
                    </a>
                </h3>
                <div class="article-actions">
                    <button class="btn btn-small btn-secondary edit-article"
                            data-id="${article.id}"
                            aria-label="Edit article">
                        Edit
                    </button>
                    <button class="btn btn-small btn-secondary toggle-read"
                            data-id="${article.id}"
                            aria-label="${article.isRead ? 'Mark as unread' : 'Mark as read'}">
                        ${article.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button class="btn btn-small btn-danger delete-article"
                            data-id="${article.id}"
                            aria-label="Delete article">
                        Delete
                    </button>
                </div>
            </div>
            <div class="article-url">${this.escapeHtml(article.url)}</div>
            ${this.renderTags(article.tags)}
            <div class="article-meta">
                <span class="article-date">Added ${formattedDate}</span>
                <div class="article-status">
                    <span class="status-indicator ${article.isRead ? 'read' : 'unread'}"></span>
                    <span>${article.isRead ? 'Read' : 'Unread'}</span>
                </div>
            </div>
        `;

        // Add event listeners for buttons
        const editButton = articleDiv.querySelector('.edit-article');
        const toggleButton = articleDiv.querySelector('.toggle-read');
        const deleteButton = articleDiv.querySelector('.delete-article');

        editButton.addEventListener('click', () => this.showEditArticleModal(article.id));
        toggleButton.addEventListener('click', () => this.toggleReadStatus(article.id));
        deleteButton.addEventListener('click', () => this.deleteArticle(article.id));

        return articleDiv;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Render tags as HTML
     */
    renderTags(tags) {
        if (!tags || tags.length === 0) {
            return '';
        }

        const tagElements = tags.map(tag =>
            `<span class="tag" onclick="App.searchByTag('${this.escapeHtml(tag)}')" title="Search for articles with tag: ${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
        ).join('');

        return `<div class="article-tags">${tagElements}</div>`;
    },

    /**
     * Search by tag
     */
    searchByTag(tag) {
        this.elements.searchInput.value = tag;
        this.handleSearch(tag);
    },

    /**
     * Handle URL blur event for automatic title extraction
     */
    handleUrlBlur(url) {
        // Only extract title if title field is empty and URL is provided
        if (!url || this.elements.articleTitle.value.trim()) {
            return;
        }

        // Validate URL before attempting to fetch
        const validationResult = this.validateArticleInput(url, '');
        if (!validationResult.isValid) {
            return; // Don't show error for blur event, just skip
        }

        this.extractTitleFromUrl(validationResult.normalizedUrl);
    },

    /**
     * Extract title from URL using multiple strategies
     */
    async extractTitleFromUrl(url) {
        // Show loading indicator
        const titleInput = this.elements.articleTitle;
        const originalPlaceholder = titleInput.placeholder;
        titleInput.placeholder = 'Fetching title...';
        titleInput.disabled = true;

        try {
            let title = null;
            let extractionMethod = 'fallback';

            // Strategy 1: Try CORS proxy services
            try {
                title = await this.tryTitleExtractionWithProxy(url);
                if (title) {
                    extractionMethod = 'proxy';
                    console.log('Title extracted via proxy service');
                }
            } catch (error) {
                console.log('Proxy extraction failed:', error.message);
            }

            // Strategy 2: If proxy fails, try direct fetch (will likely fail but worth trying)
            if (!title) {
                try {
                    title = await this.tryDirectTitleExtraction(url);
                    if (title) {
                        extractionMethod = 'direct';
                        console.log('Title extracted via direct fetch');
                    }
                } catch (error) {
                    console.log('Direct extraction failed (expected):', error.message);
                }
            }

            // Strategy 3: Use URL-based title generation as fallback
            if (!title) {
                title = this.generateSmartTitleFromUrl(url);
                extractionMethod = 'url-analysis';
                console.log('Title generated from URL analysis');
            }

            // Set the title if we got one and the field is still empty
            if (title && !titleInput.value.trim()) {
                titleInput.value = title;

                // Show appropriate message based on extraction method
                if (extractionMethod === 'proxy' || extractionMethod === 'direct') {
                    this.showMessage('Title extracted successfully', 'success');
                } else {
                    this.showMessage('Title generated from URL (CORS restrictions prevent automatic fetch)', 'info');
                }
            }
        } catch (error) {
            console.log('All title extraction methods failed:', error.message);
            // Use URL-based fallback as last resort
            const fallbackTitle = this.generateSmartTitleFromUrl(url);
            if (fallbackTitle && !titleInput.value.trim()) {
                titleInput.value = fallbackTitle;
                this.showMessage('Title generated from URL', 'info');
            }
        } finally {
            // Restore input state
            titleInput.placeholder = originalPlaceholder;
            titleInput.disabled = false;
        }
    },

    /**
     * Try title extraction using CORS proxy services
     */
    async tryTitleExtractionWithProxy(url) {
        const proxyServices = [
            // AllOrigins - reliable free CORS proxy
            {
                url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
                name: 'AllOrigins',
                parseResponse: async (response) => {
                    const data = await response.json();
                    return data.contents;
                }
            },
            // JSONProxy - another reliable option
            {
                url: `https://jsonp.afeld.me/?url=${encodeURIComponent(url)}`,
                name: 'JSONProxy',
                parseResponse: async (response) => {
                    const data = await response.json();
                    return data.contents;
                }
            }
        ];

        for (const proxy of proxyServices) {
            try {
                console.log(`Trying ${proxy.name} proxy...`);

                const response = await fetch(proxy.url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    // Add timeout to prevent hanging
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (response.ok) {
                    const html = await proxy.parseResponse(response);

                    if (html && html.length > 0) {
                        const title = this.extractTitleFromHtml(html);
                        if (title && title.trim().length > 0) {
                            console.log(`✅ Title extracted via ${proxy.name}: "${title}"`);
                            return title.trim();
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ ${proxy.name} proxy failed:`, error.message);
                continue; // Try next proxy
            }
        }

        console.log('All proxy services failed or returned no title');
        return null;
    },

    /**
     * Try direct title extraction (will likely fail due to CORS)
     */
    async tryDirectTitleExtraction(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (response.ok) {
                const html = await response.text();
                const title = this.extractTitleFromHtml(html);
                if (title) {
                    console.log('Title extracted via direct fetch');
                    return title;
                }
            }
        } catch (error) {
            console.log('Direct fetch failed (expected for most sites):', error.message);
        }

        return null;
    },

    /**
     * Generate a smart title from URL with better heuristics
     */
    generateSmartTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname;

            // Special handling for common sites
            if (hostname.includes('wikipedia.org')) {
                const match = pathname.match(/\/wiki\/(.+)/);
                if (match) {
                    return decodeURIComponent(match[1]).replace(/_/g, ' ');
                }
            }

            if (hostname.includes('github.com')) {
                const parts = pathname.split('/').filter(p => p);
                if (parts.length >= 2) {
                    return `${parts[0]}/${parts[1]} - GitHub`;
                }
            }

            if (hostname.includes('stackoverflow.com') || hostname.includes('stackexchange.com')) {
                const match = pathname.match(/\/questions\/\d+\/(.+)/);
                if (match) {
                    return decodeURIComponent(match[1]).replace(/-/g, ' ');
                }
            }

            if (hostname.includes('medium.com') || hostname.includes('dev.to')) {
                const segments = pathname.split('/').filter(segment => segment);
                if (segments.length > 0) {
                    return segments[segments.length - 1].replace(/-/g, ' ');
                }
            }

            // Generic URL processing
            const segments = pathname.split('/').filter(segment => segment);

            if (segments.length > 0) {
                let title = segments[segments.length - 1];

                // Remove file extensions
                title = title.replace(/\.[^/.]+$/, '');

                // Replace separators with spaces
                title = title.replace(/[-_]/g, ' ');

                // Decode URL encoding
                title = decodeURIComponent(title);

                // Capitalize words
                title = title.replace(/\b\w/g, l => l.toUpperCase());

                // Add site name if title is meaningful
                if (title.length > 3) {
                    const siteName = hostname.replace(/^www\./, '').split('.')[0];
                    return `${title} - ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}`;
                }
            }

            // Fallback to hostname
            return hostname.replace(/^www\./, '');
        } catch (error) {
            return 'Untitled Article';
        }
    },

    /**
     * Extract title from HTML content
     */
    extractTitleFromHtml(html) {
        try {
            // Create a temporary DOM element to parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Try to get title from <title> tag
            const titleElement = doc.querySelector('title');
            if (titleElement && titleElement.textContent.trim()) {
                return titleElement.textContent.trim();
            }

            // Fallback to meta title
            const metaTitle = doc.querySelector('meta[property="og:title"]') ||
                             doc.querySelector('meta[name="title"]');
            if (metaTitle && metaTitle.content.trim()) {
                return metaTitle.content.trim();
            }

            return null;
        } catch (error) {
            console.error('Error parsing HTML for title:', error);
            return null;
        }
    },

    /**
     * Toggle read status of an article
     */
    toggleReadStatus(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (article) {
            article.isRead = !article.isRead;
            article.status = article.isRead ? 'archive' : 'unread'; // Update Pocket status
            this.saveArticles();
            this.applyCurrentFilter();
            this.renderArticles();

            const status = article.isRead ? 'read' : 'unread';
            this.showMessage(`Article marked as ${status}`, 'success');
        }
    },

    /**
     * Delete an article
     */
    deleteArticle(articleId) {
        try {
            const article = this.articles.find(a => a.id === articleId);
            if (!article) {
                this.showMessage('Article not found', 'error');
                return;
            }

            if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
                this.articles = this.articles.filter(a => a.id !== articleId);
                this.saveArticles();
                this.applyCurrentFilter();
                this.renderArticles();
                this.updateDeleteAllButtonVisibility();
                this.showMessage('Article deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showMessage('Failed to delete article. Please try again.', 'error');
        }
    },

    /**
     * Show delete all confirmation modal
     */
    showDeleteAllModal() {
        const articleCount = this.articles.length;
        this.elements.deleteAllMessage.textContent =
            `Are you sure you want to delete all ${articleCount} article${articleCount === 1 ? '' : 's'}? This action cannot be undone.`;

        this.elements.deleteAllModal.style.display = 'flex';

        // Focus the cancel button by default for safety
        setTimeout(() => {
            this.elements.cancelDeleteAll.focus();
        }, 100);
    },

    /**
     * Hide delete all confirmation modal
     */
    hideDeleteAllModal() {
        this.elements.deleteAllModal.style.display = 'none';
    },

    /**
     * Delete all articles
     */
    deleteAllArticles() {
        const articleCount = this.articles.length;
        this.articles = [];
        this.saveArticles();
        this.applyCurrentFilter();
        this.renderArticles();
        this.updateDeleteAllButtonVisibility();
        this.hideDeleteAllModal();
        this.showMessage(`Successfully deleted ${articleCount} article${articleCount === 1 ? '' : 's'}`, 'success');
    },

    /**
     * Update delete all button visibility based on article count
     */
    updateDeleteAllButtonVisibility() {
        const hasArticles = this.articles.length > 0;
        this.elements.deleteAllButton.style.display = hasArticles ? 'block' : 'none';
    },

    /**
     * Show edit article modal
     */
    showEditArticleModal(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) {
            console.error('Article not found for editing:', articleId);
            return;
        }

        // Store the article ID being edited
        this.editingArticleId = articleId;

        // Populate the form with current values
        this.elements.editArticleTitleInput.value = article.title || '';
        this.elements.editArticleTagsInput.value = article.tags ? article.tags.join(', ') : '';

        // Show the modal
        this.elements.editArticleModal.style.display = 'flex';

        // Focus on the title input
        setTimeout(() => {
            this.elements.editArticleTitleInput.focus();
        }, 100);
    },

    /**
     * Hide edit article modal
     */
    hideEditArticleModal() {
        this.elements.editArticleModal.style.display = 'none';
        this.editingArticleId = null;

        // Clear form
        this.elements.editArticleForm.reset();
    },

    /**
     * Save edited article
     */
    saveEditedArticle() {
        if (!this.editingArticleId) {
            console.error('No article ID set for editing');
            return;
        }

        const article = this.articles.find(a => a.id === this.editingArticleId);
        if (!article) {
            console.error('Article not found for saving:', this.editingArticleId);
            return;
        }

        // Get form values
        const newTitle = this.elements.editArticleTitleInput.value.trim();
        const newTagsInput = this.elements.editArticleTagsInput.value.trim();

        // Validate title
        if (!newTitle) {
            this.showMessage('Title is required', 'error');
            this.elements.editArticleTitleInput.focus();
            return;
        }

        // Process tags
        const newTags = this.processTags(newTagsInput);

        // Update article
        article.title = newTitle;
        article.tags = newTags;

        // Save to storage
        this.saveArticles();

        // Update display
        this.applyCurrentFilter();
        this.renderArticles();

        // Hide modal
        this.hideEditArticleModal();

        // Show success message
        this.showMessage('Article updated successfully', 'success');
    },

    /**
     * Show a message to the user
     */
    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        messageDiv.setAttribute('role', 'alert');
        messageDiv.setAttribute('aria-live', 'polite');
        messageDiv.setAttribute('tabindex', '-1');

        // Add close button for accessibility
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'message-close';
        closeButton.setAttribute('aria-label', 'Close message');
        closeButton.addEventListener('click', () => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        });

        messageDiv.appendChild(closeButton);
        this.elements.messageContainer.appendChild(messageDiv);

        // Auto-remove after different times based on message type
        let autoRemoveTime = 5000; // Default 5 seconds
        if (type === 'info') {
            autoRemoveTime = 3000; // Info messages disappear faster
        } else if (type === 'error') {
            autoRemoveTime = 0; // Error messages stay until manually closed
        }

        if (autoRemoveTime > 0) {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, autoRemoveTime);
        }

        console.log(`${type.toUpperCase()}: ${text}`);
    },

    /**
     * Handle CSV file import
     */
    handleImportCSV(file) {
        if (!file) {
            this.showMessage('Please select a CSV file', 'error');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showMessage('Please select a valid CSV file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSV(e.target.result);
            } catch (error) {
                console.error('Error reading CSV file:', error);
                this.showMessage('Error reading CSV file. Please check the file format.', 'error');
            }
        };

        reader.onerror = () => {
            this.showMessage('Error reading file', 'error');
        };

        reader.readAsText(file);
    },

    /**
     * Parse CSV content and import articles
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            this.showMessage('CSV file is empty', 'error');
            return;
        }

        // Parse header
        const header = this.parseCSVLine(lines[0]);
        const expectedColumns = ['title', 'url', 'time_added', 'tags', 'status'];

        // Validate header format
        if (!this.validateCSVHeader(header, expectedColumns)) {
            this.showMessage('Invalid CSV format. Expected columns: title, url, time_added, tags, status', 'error');
            return;
        }

        // Parse data rows
        const importResults = {
            total: 0,
            imported: 0,
            skipped: 0,
            errors: 0
        };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            importResults.total++;

            try {
                const row = this.parseCSVLine(line);
                const article = this.createArticleFromCSVRow(row, header);

                if (this.importArticle(article)) {
                    importResults.imported++;
                } else {
                    importResults.skipped++;
                }
            } catch (error) {
                console.error(`Error parsing line ${i + 1}:`, error);
                importResults.errors++;
            }
        }

        // Save imported articles
        this.saveArticles();
        this.applyCurrentFilter();
        this.renderArticles();
        this.updateDeleteAllButtonVisibility();

        // Show import summary
        this.showImportSummary(importResults);
    },

    /**
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        // Add the last field
        result.push(current);

        return result;
    },

    /**
     * Validate CSV header
     */
    validateCSVHeader(header, expectedColumns) {
        if (header.length !== expectedColumns.length) {
            return false;
        }

        for (let i = 0; i < expectedColumns.length; i++) {
            if (header[i].toLowerCase() !== expectedColumns[i]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Create article object from CSV row
     */
    createArticleFromCSVRow(row, header) {
        const article = {};

        // Map CSV columns to article properties
        for (let i = 0; i < header.length; i++) {
            const column = header[i].toLowerCase();
            const value = row[i] || '';

            switch (column) {
                case 'title':
                    article.title = value;
                    break;
                case 'url':
                    article.url = value;
                    break;
                case 'time_added':
                    article.timeAdded = parseInt(value) || Math.floor(Date.now() / 1000);
                    article.dateAdded = new Date(article.timeAdded * 1000).toISOString();
                    break;
                case 'tags':
                    article.tags = value ? value.split('|').map(tag => tag.trim()).filter(tag => tag) : [];
                    break;
                case 'status':
                    article.status = value || 'unread';
                    article.isRead = value === 'archive';
                    break;
            }
        }

        // Add required fields
        article.id = this.generateId();

        // Validate required fields
        if (!article.url || !article.title) {
            throw new Error('Missing required fields: url or title');
        }

        return article;
    },

    /**
     * Import a single article (check for duplicates)
     */
    importArticle(article) {
        // Check for duplicate URL
        const existingArticle = this.articles.find(a => a.url === article.url);

        if (existingArticle) {
            // Skip duplicate
            return false;
        }

        // Add to articles array
        this.articles.push(article);
        return true;
    },

    /**
     * Show import summary
     */
    showImportSummary(results) {
        const message = `Import complete: ${results.imported} imported, ${results.skipped} skipped (duplicates), ${results.errors} errors`;
        const type = results.errors > 0 ? 'warning' : 'success';
        this.showMessage(message, type);

        console.log('Import summary:', results);
    },

    /**
     * Export articles to CSV in Pocket format
     */
    exportToCSV() {
        if (this.articles.length === 0) {
            this.showMessage('No articles to export', 'warning');
            return;
        }

        try {
            const csvContent = this.generateCSV();
            this.downloadCSV(csvContent);
            this.showMessage(`Exported ${this.articles.length} articles to CSV`, 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showMessage('Error exporting articles to CSV', 'error');
        }
    },

    /**
     * Generate CSV content in Pocket format
     */
    generateCSV() {
        // CSV header
        const header = ['title', 'url', 'time_added', 'tags', 'status'];
        const rows = [header];

        // Add article rows
        this.articles.forEach(article => {
            const row = [
                article.title || '',
                article.url || '',
                article.timeAdded || Math.floor(new Date(article.dateAdded).getTime() / 1000),
                (article.tags || []).join('|'),
                article.status || (article.isRead ? 'archive' : 'unread')
            ];
            rows.push(row);
        });

        // Convert to CSV string
        return rows.map(row => this.formatCSVRow(row)).join('\n');
    },

    /**
     * Format a CSV row with proper escaping
     */
    formatCSVRow(row) {
        return row.map(field => {
            const stringField = String(field);

            // Check if field needs quoting (contains comma, quote, or newline)
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                // Escape quotes by doubling them and wrap in quotes
                return '"' + stringField.replace(/"/g, '""') + '"';
            }

            return stringField;
        }).join(',');
    },

    /**
     * Download CSV file
     */
    downloadCSV(csvContent) {
        // Create blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Set download attributes
        link.setAttribute('href', url);
        link.setAttribute('download', `read-it-later-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
