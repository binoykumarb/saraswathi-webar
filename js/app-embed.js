// Sidebar + Iframe player with Stories playlist support
import { FilesetResolver, HandLandmarker, GestureRecognizer }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6";

const ALL = window.SARASWATI_PLAYLIST || [];
const hint = document.getElementById('hint');
const gStatus = document.getElementById('gStatus');
const gName   = document.getElementById('gName');
const nowPlaying = document.getElementById('nowPlaying');
const player = document.getElementById('playerFrame');
const plistEl = document.getElementById('plist');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const catSel  = document.getElementById('catSel');
const searchBox = document.getElementById('searchBox');

// NEW: mobile drawer controls
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('togglePlaylist');
const toggleFab = document.getElementById('togglePlaylistFab');
const overlay = document.getElementById('drawerOverlay');

function setDrawer(open){
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('visible', open);
  overlay.hidden = !open;
  toggleBtn?.setAttribute('aria-expanded', String(open));
  toggleFab?.setAttribute('aria-expanded', String(open));
  if (open) sidebar.focus();
}
toggleBtn?.addEventListener('click', ()=> setDrawer(!sidebar.classList.contains('open')));
toggleFab?.addEventListener('click', ()=> setDrawer(!sidebar.classList.contains('open')));
overlay?.addEventListener('click', ()=> setDrawer(false));
window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') setDrawer(false); });

// Start on 'all' and index 0 (VR video first)
let filter = 'all';
let index  = 0;

function ytId(url){
  try{ const u=new URL(url); if (u.hostname.includes('youtu.be')) return u.pathname.slice(1); if (u.hostname.includes('youtube.com')) return u.searchParams.get('v'); }catch{}
  return null;
}
function playlistId(url){
  try{ const u=new URL(url); return u.searchParams.get('list'); }catch{}
  return null;
}

function toEmbed(item){
  if (item.type === 'youtube' || item.type === '3d') {
    const id = ytId(item.url);
    const params = 'rel=0&modestbranding=1&playsinline=1';
    return id ? `https://www.youtube.com/embed/${id}?${params}` : item.url;
  }
  if (item.type === 'youtube_playlist') {
    const pid = playlistId(item.url);
    const params = 'rel=0&modestbranding=1&playsinline=1';
    return pid ? `https://www.youtube.com/embed/videoseries?list=${pid}&${params}` : item.url;
  }
  if (item.type === 'audio') {
    return `/player.html?type=audio&src=${encodeURIComponent(item.url)}&t=${Date.now()}`;
  }
  if (item.type === 'video') {
    return `/player.html?type=video&src=${encodeURIComponent(item.url)}&t=${Date.now()}`;
  }
  return item.url;
}

function saveState(){ localStorage.setItem('sv_filter', filter); localStorage.setItem('sv_index', String(index)); }
function filtered(){
  const q = (searchBox.value||'').toLowerCase().trim();
  const list = filter==='all' ? ALL :
               (filter==='stories' ? ALL.filter(x=>x.type==='youtube_playlist') :
                (filter==='3d' ? ALL.filter(x=>x.type==='3d') : ALL.filter(x=>x.type===filter)));
  return list.filter(x => !q || x.title.toLowerCase().includes(q));
}

function renderList(){
  const L = filtered();
  plistEl.innerHTML = "";
  L.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img'); img.className='thumb';
    if (item.type==='youtube' || item.type==='3d'){ const id = ytId(item.url); img.src = id? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : 'https://dummyimage.com/320x180/000/fff.png&text=YouTube'; }
    else if (item.type==='youtube_playlist'){ img.src = 'https://dummyimage.com/320x180/000/fff.png&text=Playlist'; }
    else { img.src = 'https://dummyimage.com/160x160/000/fff.png&text=Audio'; }
    const meta = document.createElement('div'); meta.className='meta';
    const t = document.createElement('div'); t.className='title'; t.textContent = item.title;
    const ty= document.createElement('div'); ty.className='type'; ty.textContent = item.type.toUpperCase();
    card.onclick = () => { index = i; saveState(); playCurrent(); setDrawer(false); };
    meta.appendChild(t); meta.appendChild(ty);
    card.appendChild(img); card.appendChild(meta);
    plistEl.appendChild(card);
  });
}

function playCurrent(){
  const L = filtered(); if (!L.length) return;
  index = (index + L.length) % L.length;
  const item = L[index];
  nowPlaying.textContent = item.title;
  player.src = toEmbed(item);
}

prevBtn.onclick = () => { const L = filtered(); index = (index - 1 + L.length) % L.length; saveState(); playCurrent(); };
nextBtn.onclick = () => { const L = filtered(); index = (index + 1) % L.length; saveState(); playCurrent(); };
catSel.onchange = () => { filter = catSel.value; index = 0; saveState(); renderList(); playCurrent(); };
searchBox.oninput = () => { index = 0; renderList(); };

renderList(); playCurrent();

// Gestures: Wave => Next, Closed_Fist => Prev
gStatus.textContent = 'loading models…';
let cameraEl = document.querySelector('video[playsinline]');
if (!cameraEl) {
  cameraEl = document.createElement('video');
  cameraEl.autoplay = true; cameraEl.muted = true; cameraEl.playsInline = true;
  cameraEl.style.position='fixed'; cameraEl.style.right='8px'; cameraEl.style.bottom='80px'; cameraEl.style.width='120px'; cameraEl.style.opacity='0.001';
  document.body.appendChild(cameraEl);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:640, height:480 } });
    cameraEl.srcObject = stream;
  } catch (err) { gStatus.textContent = 'camera denied'; console.warn('Camera error', err); }
}
const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm");
const handLM = await HandLandmarker.createFromOptions(vision, { baseOptions:{ modelAssetPath:"https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task" }, runningMode:"VIDEO", numHands:1 });
const gestureRec = await GestureRecognizer.createFromOptions(vision, { baseOptions:{ modelAssetPath:"https://storage.googleapis.com/mediapipe-assets/gesture_recognizer.task" }, runningMode:"VIDEO" });
gStatus.textContent = 'running';

const buf=[]; const MAX=15, AMP=40, COOLDOWN=1200; let last=0;
function waved(){
  if (buf.length<MAX) return false;
  const xs=buf.map(p=>p.x), min=Math.min(...xs), max=Math.max(...xs);
  const amp=max-min; let flips=0;
  for(let i=2;i<xs.length;i++){ const v1=xs[i-1]-xs[i-2], v2=xs[i]-xs[i-1]; if (Math.sign(v1)!==Math.sign(v2)) flips++; }
  return amp>AMP && flips>=3;
}
function loop(){
  if (cameraEl?.readyState >= 2){
    const ts = performance.now();
    const lm = handLM.detectForVideo(cameraEl, ts);
    if (lm?.landmarks?.length){
      const wrist = lm.landmarks[0][0];
      buf.push({ x: wrist.x * cameraEl.videoWidth }); if (buf.length>MAX) buf.shift();
      const g = gestureRec.recognizeForVideo(cameraEl, ts);
      const name = g.gestures?.[0]?.[0]?.categoryName || '–';
      gName.textContent = name;
      const cooldown = (ts - last) > COOLDOWN;
      if (cooldown && waved()){ last=ts; nextBtn.click(); }
      else if (cooldown && name === 'Closed_Fist'){ last=ts; prevBtn.click(); }
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Tap to help with autoplay when needed
window.addEventListener('pointerdown', ()=>{ hint.textContent = "✅ interaction registered"; }, {passive:true});
