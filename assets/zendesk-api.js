// zendesk-api.js
document.addEventListener('DOMContentLoaded', function() {
    const zendeskSubdomain = 'song-48339';
    const proxyUrl = 'https://corsproxy.io/?'; // Consider if you need a proxy in production
    const popularSectionIds = ['46041105078553', '45999231749529', '46011276167193'];
    let currentPopularSectionIndex = 0;

    const mockEnglishApiData = {
        latest: {
            articles: [
                { html_url: '#', title: 'Important: New Security Policy Update', created_at: '2025-07-20T10:00:00Z' },
                { html_url: '#', title: 'How to Stake Your Assets for High APY', created_at: '2025-07-19T11:30:00Z' },
                { html_url: '#', title: 'Guide to Our New Futures Trading Interface', created_at: '2025-07-18T15:00:00Z' },
            ]
        },
        popular: {
            articles: [
                { html_url: '#', title: 'How to reset my Google Authenticator?' },
                { html_url: '#', title: 'Why haven\'t I received my deposit?' },
                { html_url: '#', title: 'How to complete Identity Verification (KYC)?' },
                { html_url: '#', title: 'What are the trading fees?' },
                { html_url: '#', title: 'I forgot my login password.' },
            ]
        }
    };

    const fetchAndRenderArticles = (endpoint, desktopListEl, mobileListEl, renderFunc, clear = true, mockData = null) => {
        const lang = window.currentLanguage; // Access currentLanguage from global scope
        if (!desktopListEl || !mobileListEl) return;

        const loadingText = window.translations[lang].loading; // Access translations from global scope
        if(clear) {
            desktopListEl.innerHTML = `<li>${loadingText}</li>`;
            if(mobileListEl.parentElement.id === 'zendesk-latest-list-mobile-container') {
                mobileListEl.innerHTML = `<li>${loadingText}</li>`;
            } else {
                 mobileListEl.innerHTML = `<li>${loadingText}</li>`;
            }
        }

        if (lang !== 'zh-CN' && mockData) {
            if(clear){
                desktopListEl.innerHTML = '';
                mobileListEl.innerHTML = '';
            }
            const articles = mockData.articles;
            if (articles && articles.length > 0) {
                articles.forEach((article, index) => {
                    renderFunc(article, index, desktopListEl, mobileListEl);
                });
            } else {
                const noArticlesMsg = `<li>${window.translations[lang].no_articles}</li>`; // Access translations
                if(clear){
                    desktopListEl.innerHTML = noArticlesMsg;
                    mobileListEl.innerHTML = noArticlesMsg;
                }
            }
            return;
        }

        // Map language codes to Zendesk locales
        const zendeskLocaleMap = {
            'zh-CN': 'zh-cn',
            'en-US': 'en-us'
        };
        
        const targetLocale = zendeskLocaleMap[lang] || 'zh-cn';
        const zendeskApiUrl = `https://${zendeskSubdomain}.zendesk.com/api/v2/help_center/${targetLocale}/${endpoint}`;
        const apiUrl = proxyUrl + encodeURIComponent(zendeskApiUrl);

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                if(clear){
                    desktopListEl.innerHTML = '';
                    mobileListEl.innerHTML = '';
                }
                const articles = data.articles;
                if (articles && articles.length > 0) {
                    articles.forEach((article, index) => {
                        renderFunc(article, index, desktopListEl, mobileListEl);
                    });
                } else {
                    const noArticlesMsg = `<li>${window.translations[lang].no_articles}</li>`; // Access translations
                    if(clear){
                        desktopListEl.innerHTML = noArticlesMsg;
                        mobileListEl.innerHTML = noArticlesMsg;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching Zendesk articles:', error);
                const errorMsg = `<li>${window.translations[lang].load_fail}</li>`; // Access translations
                desktopListEl.innerHTML = errorMsg;
                mobileListEl.innerHTML = errorMsg;
            });
    };

    const renderLatestArticle = (article, index, desktopList, mobileList) => {
        const date = new Date(article.created_at);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const desktopItem = document.createElement('li');
        desktopItem.innerHTML = `<a href="${article.html_url}" target="_blank" class="block">${article.title}</a><p class="text-sm text-gray-500 mt-1">${formattedDate}</p>`;
        desktopList.appendChild(desktopItem);

        const mobileItem = document.createElement('li');
        mobileItem.innerHTML = `<a href="${article.html_url}" target="_blank" class="block">${article.title}</a><p class="text-sm text-gray-400 mt-1">${formattedDate}</p>`;
        mobileList.appendChild(mobileItem);
    };

    const renderPopularArticle = (article, index, desktopList, mobileList) => {
        const desktopItem = document.createElement('li');
        desktopItem.className = 'flex items-start';
        desktopItem.innerHTML = `<span class="text-gray-400 mr-3">${index + 1}</span><a href="${article.html_url}" target="_blank">${article.title}</a>`;
        desktopList.appendChild(desktopItem);

        const mobileItem = document.createElement('li');
        mobileItem.innerHTML = `<a href="${article.html_url}" target="_blank">${article.title}</a>`;
        mobileList.appendChild(mobileItem);
    };

    const latestDesktopList = document.getElementById('zendesk-latest-list-desktop');
    const latestMobileContainer = document.getElementById('zendesk-latest-list-mobile-container');
    const latestMobileList = latestMobileContainer ? latestMobileContainer.querySelector('ul') : null;

    const popularDesktopList = document.getElementById('zendesk-popular-list-desktop');
    const popularMobileList = document.getElementById('zendesk-popular-list-mobile');

    window.loadLatestArticles = function() {
        fetchAndRenderArticles('articles.json?sort_by=created_at&sort_order=desc&per_page=3', latestDesktopList, latestMobileList, renderLatestArticle, true, mockEnglishApiData.latest);
    }

    window.loadPopularArticles = function() {
        if (popularSectionIds && popularSectionIds.length > 0) {
            const sectionId = popularSectionIds[currentPopularSectionIndex];
            const popularArticlesEndpoint = `sections/${sectionId}/articles.json?per_page=5`;
            fetchAndRenderArticles(popularArticlesEndpoint, popularDesktopList, popularMobileList, renderPopularArticle, true, mockEnglishApiData.popular);
            currentPopularSectionIndex = (currentPopularSectionIndex + 1) % popularSectionIds.length;
        } else {
            const msg = `<li>${window.translations[window.currentLanguage].no_section_id}</li>`; // Access translations
            if(popularDesktopList) popularDesktopList.innerHTML = msg;
            if(popularMobileList) popularMobileList.innerHTML = msg;
        }
    }

    document.getElementById('refresh-latest').addEventListener('click', window.loadLatestArticles);
    document.getElementById('refresh-popular').addEventListener('click', window.loadPopularArticles);

    // Automatically load articles when page loads
    // Add a small delay to ensure translations are loaded
    setTimeout(() => {
        if (window.translations && window.currentLanguage) {
            window.loadLatestArticles();
            window.loadPopularArticles();
        } else {
            // Retry after another short delay
            setTimeout(() => {
                window.loadLatestArticles();
                window.loadPopularArticles();
            }, 500);
        }
    }, 100);
});
