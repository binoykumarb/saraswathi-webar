// Media Hub controller (vanilla JS).
// Renders playlist, filters, and plays content in right panel.
// Supports: webxr (iframe), youtube/youtube_playlist (iframe embed), audio (native <audio>).
(function(){
  const listEl = document.getElementById('list');
  const catSel = document.getElementById('cat');
  const countEl = document.getElementById('count');
  const stage = document.getElementById('stage');
  const toast = document.getElementById('toast');
  const input = document.getElementById('q');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  const playlist = (window.SARASWATI_PLAYLIST || []).slice();
  let filtered = playlist.slice();
  // Category select
  if (catSel){
    const cats = buildCategories(playlist);
    catSel.innerHTML = cats.map(c => `<option value="${c}">${c==='all'?'All':humanCat(c)}</option>`).join('');
    catSel.value = 'all';
  }
  let idx = 0;

  function categoryOf(item){
    if (item.category) return item.category;
    if (item.type === 'image') return 'images';
    if (item.type === 'webxr') return 'vr';
    if (item.type === 'audio') return 'audio';
    if (item.type === 'youtube' || item.type === 'youtube_playlist') return 'video';
    return 'other';
  }
  function humanCat(c){
    if (c === 'images') return 'Images';
    if (c === 'vr') return 'VR';
    if (c === 'audio') return 'Audio';
    if (c === 'video') return 'Video';
    return c[0].toUpperCase() + c.slice(1);
  }
  function buildCategories(items){
    const set = new Set(items.map(categoryOf));
    return ['all', ...Array.from(set)];
  }

  let currentAudio = null;

  function showToast(t, ms=1600){
    toast.textContent = t;
    toast.style.display = 'block';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.style.display='none', ms);
  }

  function typeBadge(t){
    if (t === 'webxr') return 'VR';
    if (t === 'image') return 'Image';
    if (t === 'audio') return 'Audio';
    if (t === 'youtube') return 'Video';
    if (t === 'youtube_playlist') return 'Playlist';
    return t || 'Item';
  }

  function itemHTML(item, active){
    return '<div class="item'+(active?' active':'')+'" data-id="'+item.id+'">'
      + '<div class="badge">'+ typeBadge(item.type) +'</div>'
      + '<div class="meta"><div class="title">'+ item.title +'</div><div class="type">'+ (item.type||'') +'</div></div>'
      + '</div>';
  }

  function renderList(){
    listEl.innerHTML = filtered.map((it, i)=> itemHTML(it, i===idx)).join('');
  }

  function setActive(i){
    idx = Math.max(0, Math.min(filtered.length-1, i));
    renderList();
    play(filtered[idx]);
  }

  function toEmbed(item){
    // webxr is same-origin page
    if (item.type === 'webxr') return item.url;
    // YT single
    if (item.type === 'youtube'){
      try{
        const u = new URL(item.url);
        let id = u.searchParams.get('v');
        if (!id && u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
        return 'https://www.youtube.com/embed/' + id + '?rel=0&modestbranding=1&playsinline=1';
      }catch{ return item.url; }
    }
    // YT playlist
    if (item.type === 'youtube_playlist'){
      try{
        const u = new URL(item.url);
        const pid = u.searchParams.get('list');
        return 'https://www.youtube.com/embed/videoseries?list=' + pid + '&rel=0&modestbranding=1&playsinline=1';
      }catch{ return item.url; }
    }
    return item.url;
  }

  function clearStage(){
    stage.innerHTML = '';
    if (currentAudio){ try{ currentAudio.pause(); }catch{} }
    currentAudio = null;
  }

  function play(item){
    clearStage();
    // mark active
    Array.from(document.querySelectorAll('.item')).forEach((el,i)=>{
      el.classList.toggle('active', i===idx);
    });

    if (item.type === 'audio'){
      const box = document.createElement('div');
      box.className = 'audioBox';
      const h2 = document.createElement('h2'); h2.textContent = item.title;
      const au = document.createElement('audio');
      au.controls = true; au.autoplay = true; au.src = item.url;
      au.style.width = 'min(640px, 90vw)';
      currentAudio = au;
      box.appendChild(h2);
      box.appendChild(au);
      stage.appendChild(box);
      showToast('Playing: ' + item.title);
      return;
    }

    // iframe-based types
    const iframe = document.createElement('iframe');
    iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking; camera; microphone; accelerometer; gyroscope';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'no-referrer';

    // Ensure WebXR page is same-origin and points to your A-Frame scene
    iframe.src = toEmbed(item);
    stage.appendChild(iframe);
    showToast('Loading: ' + item.title);
  }

  // List click handler
  listEl.addEventListener('click', (e)=>{
    const card = e.target.closest('.item');
    if (!card) return;
    const i = Array.from(listEl.children).indexOf(card);
    setActive(i);
  });

  // Prev / Next
  prevBtn.onclick = ()=> setActive((idx - 1 + filtered.length) % filtered.length);
  nextBtn.onclick = ()=> setActive((idx + 1) % filtered.length);

  // Search
  if (catSel){
    catSel.addEventListener('change', ()=>{
      const q = input.value.trim().toLowerCase();
      const cat = catSel.value;
      filtered = playlist.filter(it => {
        const byCat = (cat==='all') || categoryOf(it)===cat;
        const byText = !q || it.title.toLowerCase().includes(q);
        return byCat && byText;
      });
      idx = 0;
      renderList();
    });
  }
  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    const cat = catSel ? catSel.value : 'all';
    filtered = playlist.filter(it => {
      const byCat = (cat==='all') || categoryOf(it)===cat;
      const byText = !q || it.title.toLowerCase().includes(q);
      return byCat && byText;
    });
    idx = 0;
    renderList();
  });

  // Boot
  renderList();
  if (filtered.length) play(filtered[idx]);
})();