// main.js
document.addEventListener('DOMContentLoaded', function () {
    // =================================================================
    // MULTI-LANGUAGE SUPPORT SCRIPT (Core Logic)
    // =================================================================

    let currentLanguage = localStorage.getItem('language') || 'zh-CN';
    window.currentLanguage = currentLanguage; // Make it globally accessible

    function setLanguage(lang) {
        if (!window.translations[lang]) return; // Use window.translations
        currentLanguage = lang;
        window.currentLanguage = currentLanguage; // Update global reference
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (window.translations[lang][key]) { // Use window.translations
                el.textContent = window.translations[lang][key];
            }
        });

        document.querySelectorAll('[data-translate-href]').forEach(el => {
            const key = el.dataset.translateHref;
            if (window.translations[lang][key]) { // Use window.translations
                el.href = window.translations[lang][key];
            }
        });

        const searchInput = document.getElementById('header-search');
        if(searchInput) {
            searchInput.placeholder = window.translations[lang].header_search_placeholder; // Use window.translations
        }

        const langName = window.languages.find(l => l.code === lang)?.name || '简体中文'; // Use window.languages
        document.getElementById('mobile-language-text').textContent = langName;
        document.getElementById('footer-language-text').textContent = langName;
        document.getElementById('footer-language-text-mobile').textContent = langName;

        // Trigger Zendesk API re-load for new language
        if (typeof loadLatestArticles === 'function') {
            loadLatestArticles();
        }
        if (typeof loadPopularArticles === 'function') {
            loadPopularArticles();
        }

        // Notify other scripts about language change
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLanguage } }));
    }

    // --- Language Modal Logic ---
    const languageModal = document.getElementById('language-modal');
    const languageModalPanel = document.getElementById('language-modal-panel');
    const languageGrid = document.getElementById('language-grid');
    const openModalButtons = [
        document.getElementById('language-menu-button'),
        document.getElementById('mobile-language-button'),
        document.getElementById('footer-language-button'),
        document.getElementById('footer-language-button-mobile')
    ].filter(btn => btn !== null);
    const closeModalButton = document.getElementById('language-modal-close');

    if (languageGrid) {
        languageGrid.innerHTML = '';
        window.languages.forEach(lang => { // Use window.languages
            const langButton = document.createElement('button');
            langButton.className = 'language-item p-3 rounded-lg border border-gray-200 text-left text-sm font-medium hover:border-brand hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand transition-colors duration-200';
            langButton.textContent = lang.name;
            langButton.dataset.langCode = lang.code;
            languageGrid.appendChild(langButton);
        });
    }

    function updateActiveLangButton() {
        languageGrid.querySelectorAll('.language-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langCode === currentLanguage);
        });
    }

    const openModal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateActiveLangButton();
        languageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            languageModal.classList.remove('opacity-0');
            languageModalPanel.classList.remove('opacity-0', 'scale-95');
        }, 10);
    };

    const closeModal = () => {
        // Temporarily disable transitions to close immediately
        languageModal.style.transition = 'none';
        languageModalPanel.style.transition = 'none';

        languageModal.classList.remove('opacity-0');
        languageModalPanel.classList.remove('opacity-0', 'scale-95');
        languageModal.classList.add('hidden');
        document.body.style.overflow = '';

        // Force reflow to apply changes immediately
        void languageModal.offsetWidth;

        // Restore transitions after closing
        setTimeout(() => {
            languageModal.style.transition = '';
            languageModalPanel.style.transition = '';
        }, 0);
    };





    openModalButtons.forEach(btn => btn.addEventListener('click', openModal));
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    languageModal.addEventListener('click', (e) => {
        if (e.target === languageModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && !languageModal.classList.contains('hidden')) closeModal();
    });

    if (languageGrid) {
        languageGrid.addEventListener('click', (e) => {
            const selectedButton = e.target.closest('.language-item');
            if (!selectedButton) {
                return;
            }
            const langCode = selectedButton.dataset.langCode;
            
            try {
                setLanguage(langCode);
            } catch (error) {
                console.error('Error in setLanguage:', error);
            }
            
            closeModal();
        });
    }



    // --- Mobile Menu Logic ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            mobileMenuButton.querySelector('svg:first-child').classList.toggle('hidden');
            mobileMenuButton.querySelector('svg:last-child').classList.toggle('hidden');
        });
    }

    // --- Mobile Menu Accordion Logic ---
    const mobileAccordionTriggers = document.querySelectorAll('.mobile-accordion-trigger');
    mobileAccordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const submenu = trigger.nextElementSibling;
            const icon = trigger.querySelector('.chevron-icon');

            if (submenu.style.maxHeight) {
                submenu.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                submenu.style.maxHeight = submenu.scrollHeight + "px";
                icon.style.transform = '180deg'; // Corrected to string '180deg'
            }
        });
    });


    // --- Accordion Logic (for FAQ and Footer) ---
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        const button = item.querySelector('.accordion-button');
        const content = item.querySelector('.accordion-content');
        if (!button || !content) return;
        button.addEventListener('click', () => {
            const isOpen = button.classList.contains('open');
            const parentGroup = button.closest('.space-y-2, .space-y-4');

            if (parentGroup) {
                parentGroup.querySelectorAll('.accordion-item').forEach(otherItem => {
                    const otherButton = otherItem.querySelector('.accordion-button');
                    const otherContent = otherItem.querySelector('.accordion-content');
                    if (otherButton && otherButton !== button && otherButton.classList.contains('open')) {
                        otherButton.classList.remove('open');
                        otherContent.style.maxHeight = null;
                    }
                });
            }

            if (isOpen) {
                button.classList.remove('open');
                content.style.maxHeight = null;
            } else {
                button.classList.add('open');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // --- Swiper Initialization ---
    const swiperDesktop = new Swiper('#self-service-carousel-desktop', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination-desktop', clickable: true },
        navigation: {
            nextEl: '.swiper-button-next-desktop',
            prevEl: '.swiper-button-prev-desktop',
        },
    });

    const swiperMobile = new Swiper('#self-service-carousel-mobile', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination-mobile', clickable: true },
    });

    // Pause on hover logic for both
    const desktopSwiperWrapper = document.querySelector('#self-service-carousel-desktop');
    if (desktopSwiperWrapper) {
        desktopSwiperWrapper.addEventListener('mouseenter', () => swiperDesktop.autoplay.stop());
        desktopSwiperWrapper.addEventListener('mouseleave', () => swiperDesktop.autoplay.start());
    }

    const mobileSwiperWrapper = document.querySelector('#self-service-carousel-mobile');
    if (mobileSwiperWrapper) {
        mobileSwiperWrapper.addEventListener('mouseenter', () => swiperMobile.autoplay.stop());
        mobileSwiperWrapper.addEventListener('mouseleave', () => swiperMobile.autoplay.start());
    }

    // Initial load of language
    setLanguage(currentLanguage);
});
