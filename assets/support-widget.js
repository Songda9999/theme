// support-widget.js
document.addEventListener('DOMContentLoaded', function() {
    // --- WIDGET CONFIGURATION ---
    
    const ZENDESK_BASE_URL = 'https://100ex.zendesk.com';
    const ANNOUNCEMENT_CATEGORY_ID = '45495487972633';

    // Widget specific translations (can be merged with main translations if preferred)
    const WIDGET_TRANSLATIONS = {
        'zh-CN': {
            widget_header: '客户支持',
            widget_intro: '查看下方的常见问题以获得即时解决方案。如果常见问题无法解决您的问题，请点击下面的按钮联系我们的在线支持团队。',
            widget_self_service: '自助服务',
            widget_ss_1: '重置谷歌验证',
            widget_ss_2: '收不到验证码',
            widget_ss_3: '如何身份认证',
            widget_ss_4: '忘记相关密码',
            widget_faq_title: '常见问题',
            widget_search_placeholder: '搜索问题...',
            widget_start_chat: '客户支持',
            loading: '加载中...',
            no_results: '没有找到相关结果。',
        },
        'en-US': {
            widget_header: 'Customer Support',
            widget_intro: 'Check the FAQ below for instant solutions. If you can\'t find an answer, click the button below to contact our online support team.',
            widget_self_service: 'Self-Service',
            widget_ss_1: 'Reset Google Authenticator',
            widget_ss_2: 'Can\'t Receive Code',
            widget_ss_3: 'How to do KYC',
            widget_ss_4: 'Forgot Password',
            widget_faq_title: 'Frequently Asked Questions',
            widget_search_placeholder: 'Search questions...',
            widget_start_chat: 'Contact Support',
            loading: 'Loading...',
            no_results: 'No results found.',
        }
    };

    const FAQ_SECTIONS = {
        'zh-CN': [
            { name: '下载及注册指南', id: '42473907219993' },
            { name: '账号与安全设置', id: '41467861058841' },
            { name: '充提币 / 转账', id: '47543129712153' },
            { name: '交易与记录', id: '47543089016473' },
            { name: '其他问题', id: '47543090092185' }
        ],
        'en-US': [
            { name: 'Download & Register', id: 'YOUR_ENGLISH_SECTION_ID_1' },
            { name: 'Account & Security', id: 'YOUR_ENGLISH_SECTION_ID_2' },
            { name: 'Deposit & Withdrawal', id: 'YOUR_ENGLISH_SECTION_ID_3' },
            { name: 'Trading & Records', id: 'YOUR_ENGLISH_SECTION_ID_4' },
            { name: 'Other Questions', id: 'YOUR_ENGLISH_SECTION_ID_5' }
        ]
    };

    // --- GET ELEMENTS ---
    const openSupportBtn = document.getElementById('open-support-btn');
    const modalBackdrop = document.getElementById('support-modal-backdrop');
    const faqView = document.getElementById('faq-view');
    const startChatFromFaqBtn = document.getElementById('start-chat-from-faq-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const faqNav = document.getElementById('faq-nav');
    const faqList = document.getElementById('faq-list');
    const faqSearch = document.getElementById('faq-search');
    const noResults = document.getElementById('no-results');
    const faqLoading = document.getElementById('faq-loading');
    const announcementBanner = document.getElementById('announcement-banner');
    const announcementTicker = document.getElementById('announcement-ticker');
    const newAnnouncementToast = document.getElementById('new-announcement-toast');
    const toastLink = document.getElementById('toast-announcement-link');
    const closeToastBtn = document.getElementById('close-toast-btn');
    const openChatSupportCard = document.getElementById('open-chat-support-card');

    let currentWidgetLanguage = 'zh-CN';
    let announcementInterval;
    const SEEN_ANNOUNCEMENTS_KEY = 'seenAnnouncements_100ex_v2';
    let allArticles = [];

    // --- LANGUAGE & TRANSLATION ---
    function translateWidget(lang) {
        currentWidgetLanguage = lang;
        document.querySelectorAll('[data-widget-translate-key]').forEach(el => {
            const key = el.dataset.widgetTranslateKey;
            if (WIDGET_TRANSLATIONS[lang] && WIDGET_TRANSLATIONS[lang][key]) {
                el.textContent = WIDGET_TRANSLATIONS[lang][key];
            }
        });
        faqSearch.placeholder = WIDGET_TRANSLATIONS[lang] ? WIDGET_TRANSLATIONS[lang].widget_search_placeholder : 'Search questions...';
        noResults.textContent = WIDGET_TRANSLATIONS[lang] ? WIDGET_TRANSLATIONS[lang].no_results : 'No results found.';
        faqLoading.textContent = WIDGET_TRANSLATIONS[lang] ? WIDGET_TRANSLATIONS[lang].loading : 'Loading...';
    }

    // Listen for language changes from the main page
    window.addEventListener('languageChanged', (event) => {
        const newLang = event.detail.lang;
        translateWidget(newLang);
        // Re-initialize the FAQ with the new language
        if (!modalBackdrop.classList.contains('hidden')) {
            initializeFaq();
        }
    });

    // --- API FUNCTIONS ---
    async function fetchFromZendesk(endpoint, lang) {
        const langCode = lang === 'en-US' ? 'en-us' : 'zh-cn';
        try {
            // For English, we return mock data. Replace this with your actual API call.
            if (lang === 'en-US') {
                await new Promise(resolve => setTimeout(resolve, 300));
                if (endpoint.includes('articles')) {
                    return { articles: [
                        { id: 1, title: `Mock Article 1 for ${lang}`, html_url: '#' },
                        { id: 2, title: `Mock Article 2 for ${lang}`, html_url: '#' },
                        { id: 3, title: `Mock Article 3 for ${lang}`, html_url: '#' },
                    ]};
                }
                 return { articles: [] };
            }

            const response = await fetch(`${ZENDESK_BASE_URL}/api/v2/help_center/${langCode}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch from Zendesk: ${endpoint}`, error);
            return null;
        }
    }

    // --- DYNAMIC RENDERING FUNCTIONS ---
    function renderFaqList(articles) {
        faqLoading.classList.add('hidden');
        if (!articles || articles.length === 0) {
            faqList.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }
        faqList.innerHTML = articles.map(article => `<li><a href="${article.html_url}" target="_blank" rel="noopener noreferrer" class="hover:text-teal-500 transition-colors">${article.title}</a></li>`).join('');
        noResults.classList.add('hidden');
    }

    async function loadArticlesForSection(sectionId) {
        faqList.innerHTML = '';
        noResults.classList.add('hidden');
        faqLoading.classList.remove('hidden');
        const data = await fetchFromZendesk(`/sections/${sectionId}/articles.json`, currentWidgetLanguage);
        renderFaqList(data ? data.articles : []);
    }

    async function fetchAllArticles(sectionIds) {
        const promises = sectionIds.map(id => fetchFromZendesk(`/sections/${id}/articles.json`, currentWidgetLanguage));
        const results = await Promise.all(promises);
        allArticles = results.flatMap(result => result ? result.articles : []);
    }

    async function initializeFaq() {
        const lang = currentWidgetLanguage;
        const sections = FAQ_SECTIONS[lang];

        const highlighter = document.getElementById('faq-nav-highlighter');
        highlighter.style.opacity = '0';

        faqNav.innerHTML = '<div id="faq-nav-highlighter" class="absolute right-[-2px] w-0.5 bg-teal-600 transition-all duration-300 ease-in-out"></div>';

        sections.forEach((section, index) => {
            const navItem = document.createElement('a');
            navItem.href = '#';
            navItem.dataset.sectionId = section.id;
            navItem.className = 'faq-nav-item text-gray-500 hover:text-black block whitespace-nowrap pr-8 pl-4 py-2';
            navItem.textContent = section.name;
            if (index === 0) {
                navItem.classList.add('active', 'font-semibold');
                navItem.classList.remove('text-gray-500');
            }
            faqNav.appendChild(navItem);
        });

        await fetchAllArticles(sections.map(s => s.id));

        if (sections.length > 0) {
            await loadArticlesForSection(sections[0].id);
            setTimeout(() => {
                 const firstNavItem = faqNav.querySelector('.faq-nav-item');
                 if(firstNavItem) moveHighlighter(firstNavItem);
            }, 100);
        } else {
            faqLoading.classList.add('hidden');
            noResults.classList.remove('hidden');
        }
    }

    // --- UI AND EVENT HANDLERS ---
    function moveHighlighter(targetElement) {
        const highlighter = document.getElementById('faq-nav-highlighter');
        if (!targetElement || !highlighter) return;
        highlighter.style.opacity = '1';
        highlighter.style.top = `${targetElement.offsetTop}px`;
        highlighter.style.height = `${targetElement.offsetHeight}px`;
    }

    function handleSearch() {
        const searchTerm = faqSearch.value.toLowerCase().trim();
        const highlighter = document.getElementById('faq-nav-highlighter');

        if (searchTerm === '') {
            const activeCategoryItem = document.querySelector('.faq-nav-item.active');
            if(activeCategoryItem){
                 loadArticlesForSection(activeCategoryItem.dataset.sectionId);
                 moveHighlighter(activeCategoryItem);
            }
        } else {
            if (highlighter) highlighter.style.opacity = '0';
            document.querySelectorAll('.faq-nav-item').forEach(i => i.classList.remove('active', 'font-semibold'));
            const filteredArticles = allArticles.filter(article =>
                article.title.toLowerCase().includes(searchTerm)
            );
            renderFaqList(filteredArticles);
        }
    }

    async function openModal() {
        // Ensure Zendesk widget stays hidden when opening our custom modal
        ensureZendeskWidgetHidden();

        // Sync widget language with main page language
        const mainLang = localStorage.getItem('language') || 'zh-CN';
        translateWidget(mainLang);

        modalBackdrop.classList.remove('hidden');
        setTimeout(() => {
            modalBackdrop.classList.remove('opacity-0');
            faqView.classList.remove('opacity-0', 'scale-95');
        }, 10);

        faqSearch.value = '';
        await initializeFaq();

        const announcements = await fetchFromZendesk(`/categories/${ANNOUNCEMENT_CATEGORY_ID}/articles.json`, currentWidgetLanguage);
        if(announcements && announcements.articles){
            startAnnouncementTicker(announcements.articles.slice(0, 5).map(a => ({...a, url: a.html_url})));
            const seenAnnouncements = JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY)) || [];
            const newImportantAnnouncement = announcements.articles.find(ann => ann.title.startsWith('重要：') && !seenAnnouncements.includes(ann.id));
            if (newImportantAnnouncement) {
                showNewAnnouncementToast({...newImportantAnnouncement, url: newImportantAnnouncement.html_url});
            }
        }
    }

    function closeModal() {
        modalBackdrop.classList.add('opacity-0');
        faqView.classList.add('opacity-0', 'scale-95');
        hideNewAnnouncementToast();
        setTimeout(() => {
            modalBackdrop.classList.add('hidden');
            stopAnnouncementTicker();
        }, 300);
    }

    function startAnnouncementTicker(announcements) {
        if (!announcements || announcements.length === 0) {
            announcementBanner.style.display = 'none';
            return;
        }
        announcementBanner.style.display = 'flex';
        announcementTicker.innerHTML = '';
        announcements.forEach((ann, index) => {
            const link = document.createElement('a');
            link.href = ann.url;
            link.textContent = ann.title;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            if (index === 0) link.classList.add('active');
            announcementTicker.appendChild(link);
        });
        if (announcements.length > 1) {
            let currentIndex = 0;
            if (announcementInterval) clearInterval(announcementInterval);
            announcementInterval = setInterval(() => {
                const items = announcementTicker.querySelectorAll('a');
                items[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % items.length;
                items[currentIndex].classList.add('active');
            }, 5000);
        }
    }

    function stopAnnouncementTicker() {
        clearInterval(announcementInterval);
    }

    function showNewAnnouncementToast(announcement) {
        toastLink.href = announcement.url;
        toastLink.textContent = announcement.title;
        markAnnouncementAsSeen(announcement.id);
        newAnnouncementToast.classList.add('show');
    }

    function markAnnouncementAsSeen(announcementId) {
        const seenAnnouncements = JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY)) || [];
        if (!seenAnnouncements.includes(announcementId)) {
            seenAnnouncements.push(announcementId);
            localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(seenAnnouncements));
        }
    }

    function hideNewAnnouncementToast() {
        newAnnouncementToast.classList.remove('show');
    }

    // --- ZENDESK WIDGET CONTROL LOGIC ---
    let zendeskIsAuthorizedToShow = false; // Flag to indicate when Zendesk should be visible
    let hideInterval;
    
    function hideZendeskWidget() {
        // Don't hide if Zendesk is authorized to show
        if (zendeskIsAuthorizedToShow) {
            return;
        }
        
        // Method 1: Use zE API if available
        if (typeof zE === 'function') {
            try {
                zE('webWidget', 'hide');
            } catch (error) {
                console.warn('Failed to hide via zE API:', error);
            }
        }
        
        // Method 2: Direct DOM manipulation for backup
        const selectors = [
            '#launcher',
            '.zEWidget-launcher',
            'iframe[title*="Zendesk"]',
            'iframe[src*="zendesk"]',
            'iframe[src*="zdassets"]',
            '.zEWidget-launcher-frame',
            'div[data-testid="launcher"]',
            '[data-garden-id="chrome.launcher"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.style.opacity = '0';
                    element.style.pointerEvents = 'none';
                }
            });
        });
    }
    
    function showZendeskWidget() {
        zendeskIsAuthorizedToShow = true;
        
        if (typeof zE === 'function') {
            try {
                zE('webWidget', 'show');
                zE('webWidget', 'open');
            } catch (error) {
                console.warn('Failed to show Zendesk widget:', error);
            }
        }
    }
    
    // Add a function to ensure the modal is properly hidden when needed
    function ensureZendeskWidgetHidden() {
        hideZendeskWidget();
    }
    
    // Initialize Zendesk control
    function initializeZendeskControl() {
        // Wait for zE to be available
        const waitForZE = () => {
            if (typeof zE !== 'undefined') {
                zE(function() {
                    // Hide widget initially
                    hideZendeskWidget();
                    
                    // Set up event listeners
                    try {
                        zE('webWidget:on', 'close', function() {
                            zendeskIsAuthorizedToShow = false;
                            setTimeout(hideZendeskWidget, 100);
                        });
                        
                        zE('webWidget:on', 'open', function() {
                            // Widget opened
                        });
                    } catch (e) {
                        console.warn('Could not set up zE event listeners:', e);
                    }
                });
            } else {
                setTimeout(waitForZE, 100);
            }
        };
        waitForZE();
        
        // Periodic check to ensure widget stays hidden when not authorized
        hideInterval = setInterval(() => {
            if (!zendeskIsAuthorizedToShow) {
                hideZendeskWidget();
            }
        }, 1000);
    }
    
    // Initialize control immediately
    initializeZendeskControl();

    // --- EVENT LISTENERS ---
    openSupportBtn.addEventListener('click', openModal);
    if (openChatSupportCard) {
        openChatSupportCard.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
    
    startChatFromFaqBtn.addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
            showZendeskWidget();
        }, 300);
    });
    
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    closeToastBtn.addEventListener('click', hideNewAnnouncementToast);
    modalBackdrop.addEventListener('click', (event) => {
        if (event.target === modalBackdrop) closeModal();
    });
    faqNav.addEventListener('click', (e) => {
        const target = e.target.closest('.faq-nav-item');
        if (target && !target.classList.contains('active')) {
            e.preventDefault();
            faqSearch.value = '';
            document.querySelectorAll('.faq-nav-item').forEach(i => {
                i.classList.remove('active', 'font-semibold');
                i.classList.add('text-gray-500');
            });
            target.classList.add('active', 'font-semibold');
            target.classList.remove('text-gray-500');
            loadArticlesForSection(target.dataset.sectionId);
            moveHighlighter(target);
        }
    });
    faqSearch.addEventListener('input', handleSearch);
});
