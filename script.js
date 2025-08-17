/* ========= 通用工具 ========= */
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

/* ========= 语言切换（动态） ========= */

// 当前 HC 语言
function getCurrentHcLocale() {
  const lc =
    (window.HelpCenter && (window.HelpCenter.user?.locale || window.HelpCenter.locale)) ||
    'en-us';
  return String(lc).toLowerCase().replace('_', '-');
}

// 获取支持的语言（优先 HelpCenter.locales，失败则请求 API）
let __localeCache = null;
async function getSupportedLocalesAsync() {
  if (__localeCache) return __localeCache;

  const injected = (window.HelpCenter && window.HelpCenter.locales) || [];
  const normalizedInjected = injected
    .map((l) => String(l).toLowerCase().replace('_', '-'))
    .filter(Boolean);

  if (normalizedInjected.length) {
    __localeCache = Array.from(new Set(normalizedInjected));
    return __localeCache;
  }

  try {
    const res = await fetch('/api/v2/help_center/locales.json', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('fetch locales failed');
    const data = await res.json();
    const arr = Array.isArray(data) ? data : (Array.isArray(data.locales) ? data.locales : []);
    const normalized = arr.map((l) => String(l).toLowerCase().replace('_', '-')).filter(Boolean);
    __localeCache = normalized.length ? Array.from(new Set(normalized)) : ['zh-cn','en-us'];
  } catch (e) {
    __localeCache = ['zh-cn','en-us'];
  }
  return __localeCache;
}

// 语言显示名
function prettyName(locale) {
  const lc = String(locale || '').toLowerCase();
  const override = {
    'zh-cn': '简体中文',
    'zh-tw': '繁體中文',
    'en-us': 'English (US)',
    'en-gb': 'English (UK)'
  };
  if (override[lc]) return override[lc];

  try {
    const ui = getCurrentHcLocale();
    const [lang, region] = lc.split('-');
    const langNames = new Intl.DisplayNames([ui], { type: 'language', languageDisplay: 'standard' });
    const regionNames = new Intl.DisplayNames([ui], { type: 'region' });
    let name = langNames.of(lang) || lc;
    if (region) {
      const rn = regionNames.of(region.toUpperCase());
      if (rn) name = `${name}（${rn}）`;
    }
    return name;
  } catch {
    return lc;
  }
}

// 切换 URL
function buildHcLocaleUrl(targetLocale) {
  const parts = window.location.pathname.split('/');
  const i = parts.findIndex((p) => p === 'hc');
  if (i >= 0 && parts[i + 1]) parts[i + 1] = targetLocale;
  return parts.join('/') + window.location.search + window.location.hash;
}

// 切换语言
function switchLanguage(targetLocale) {
  if (!targetLocale) return;
  const mapUrl = (lang) =>
    String(lang).toLowerCase().replace('-', '_').replace(/^([a-z]{2})_([a-z]{2})$/i, (m, a, b) =>
      `${a}_${b.toUpperCase()}`
    );

  const newLangForHref = mapUrl(targetLocale);
  document.querySelectorAll('[data-translate-href]').forEach((el) => {
    const href = el.getAttribute('href') || '';
    if (!href) return;
    const updated = href.replace(/\/[a-z]{2}_[A-Z]{2}\//g, `/${newLangForHref}/`);
    el.setAttribute('href', updated);
  });

  window.location.href = buildHcLocaleUrl(targetLocale);
}

// 打开语言选择弹窗
async function openLangModal() {
  const existed = document.getElementById('lang-modal');
  if (existed) existed.remove();

  const current = getCurrentHcLocale();
  const locales = await getSupportedLocalesAsync();

  const modal = document.createElement('div');
  modal.id = 'lang-modal';
  modal.className =
    'fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity';
  modal.style.opacity = '0';

  const panel = document.createElement('div');
  panel.className =
    'lang-panel w-full max-w-[520px] mx-4 bg-white rounded-2xl shadow-xl transform transition-all';
  panel.style.opacity = '0';
  panel.style.transform = 'scale(0.96)';

  panel.innerHTML = `
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold">语言</h3>
      <button id="lang-modal-close" class="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
    <div class="px-5 py-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${locales
          .map((loc) => {
            const active = loc === current;
            return `
              <button class="lang-pill px-4 py-4 rounded-xl border ${
                active ? 'bg-emerald-50 border-emerald-300 text-gray-900' : 'border-gray-200'
              } text-left" data-locale="${loc}">
                ${prettyName(loc)}
              </button>`;
          })
          .join('')}
      </div>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  // 打开动画
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    panel.style.opacity = '1';
    panel.style.transform = 'scale(1)';
  });

  // 点击选项
  panel.querySelectorAll('.lang-pill').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-locale');
      if (target && target !== current) switchLanguage(target);
    });
  });

  // 关闭
  const close = () => {
    panel.style.opacity = '0';
    panel.style.transform = 'scale(0.96)';
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 180);
  };
  panel.querySelector('#lang-modal-close')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
}

/* ========= 其它功能 ========= */
ready(() => {
  // 语言按钮触发
  const langTriggers = [
    document.getElementById('lang-switcher'),
    document.getElementById('lang-toggle'),
    document.getElementById('mobile-lang-toggle')
  ].filter(Boolean);
  langTriggers.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLangModal();
    })
  );

  // 手风琴
  document.querySelectorAll('.accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
        header.classList.remove('active');
      } else {
        document.querySelectorAll('.accordion-content').forEach((el) => (el.style.maxHeight = null));
        document.querySelectorAll('.accordion-header').forEach((el) => el.classList.remove('active'));
        content.style.maxHeight = content.scrollHeight + 'px';
        header.classList.add('active');
      }
    });
  });

  // 搜索框 Enter 提交
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchInput.closest('form')?.submit();
      }
    });
  }

  // 表单提交加载状态
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', () => {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>';
      }
    });
  }

  // 移动端菜单
  const mobileMenuBtn = document.querySelector('#mobile-menu-button');
  const mobileMenu = document.querySelector('#mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
