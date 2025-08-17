
(function(){
  function openModal(){ 
    document.getElementById('support-modal-backdrop').style.display='block';
    document.getElementById('support-modal').style.display='flex';
  }
  function closeModal(){
    document.getElementById('support-modal-backdrop').style.display='none';
    document.getElementById('support-modal').style.display='none';
  }

  function ensureShell(){
    if (document.getElementById('open-support-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'open-support-btn';
    btn.title = 'Support';
    btn.innerHTML = '?';
    document.body.appendChild(btn);

    const backdrop = document.createElement('div');
    backdrop.id = 'support-modal-backdrop';

    const panel = document.createElement('div');
    panel.id = 'support-modal';
    panel.innerHTML = `
      <header>
        <h4>Help Center</h4>
        <button id="support-close" class="btn secondary">×</button>
      </header>
      <div id="faq-scroll">
        <p>Search our articles or start a chat.</p>
        <div>
          <input id="hc-quick-search" placeholder="Type to search..." style="width:100%;padding:10px;border-radius:10px;border:1px solid #213044;background:#0f1622;color:#e8eef6" />
          <ul id="hc-quick-results" style="margin-top:10px;list-style:none;padding:0"></ul>
        </div>
      </div>
      <footer>
        <button id="support-chat" class="btn">Start chat</button>
        <a href="/hc/{{help_center.locale}}/requests/new" class="btn secondary">Submit a request</a>
      </footer>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    // Events
    btn.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModal);
    panel.querySelector('#support-close').addEventListener('click', closeModal);

    // Open Messaging on click (if available)
    panel.querySelector('#support-chat').addEventListener('click', function(){
      try { zE('messenger', 'open'); } catch(e) {}
      closeModal();
    });

    // Lightweight search: use built-in search page navigations
    const input = panel.querySelector('#hc-quick-search');
    const ul = panel.querySelector('#hc-quick-results');
    let t;
    input.addEventListener('input', function(){
      clearTimeout(t);
      const q = input.value.trim();
      ul.innerHTML = '';
      if (!q) return;
      t = setTimeout(() => {
        // Just provide links to the search results page for now
        const li = document.createElement('li');
        li.innerHTML = '<a href="/hc/{{help_center.locale}}/search?utf8=✓&query=' + encodeURIComponent(q) + '">Search “' + q + '” →</a>';
        ul.appendChild(li);
      }, 250);
    });

    // Close on ESC
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureShell);
  } else {
    ensureShell();
  }
})();
