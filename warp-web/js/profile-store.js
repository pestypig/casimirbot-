// profile-store.js — localStorage CRUD + exports
const ProfileStore = (() => {
  const KEY = 'warp.creations';
  function list(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch{ return []; } }
  function save(profile, {overwrite=false}={}) {
    const arr = list();
    const idx = arr.findIndex(p => p.id === profile.id);
    if(idx>=0 && !overwrite) { // ensure unique id
      profile.id = profile.id + '-' + Math.random().toString(36).slice(2,6);
    }
    const idx2 = arr.findIndex(p => p.id === profile.id);
    if(idx2>=0) arr[idx2] = profile; else arr.unshift(profile);
    localStorage.setItem(KEY, JSON.stringify(arr));
  }
  function get(id){ return list().find(p => p.id===id); }
  function remove(id){ localStorage.setItem(KEY, JSON.stringify(list().filter(p => p.id!==id))); }
  function clearAll(){ localStorage.removeItem(KEY); }
  function prepareForSave(tuple, thumbnail){
    const derived = PhysicsCore.compute(tuple);
    const out = {
      ...tuple,
      thumbnail,
      derived,
      ship: {...tuple.ship, N: derived.N}
    };
    return out;
  }
  function exportJSON(id){
    const p = get(id); if(!p) return;
    const blob = new Blob([JSON.stringify(p,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${p.id}.warp.json`; a.click();
  }
  async function downloadProfileHTML(id){
    const p = (typeof id==='string') ? get(id) : id;
    if(!p) return;
    const html = generateProfileHTML(p);
    const blob = new Blob([html], {type:'text/html'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${p.id}.html`; a.click();
  }
  function generateProfileHTML(p){
    const json = JSON.stringify(p).replace(/</g,'\\u003c');
    return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.name} · Warp Profile</title>
  <link rel="stylesheet" href="./css/base.css" />
</head><body class="page">
  <header class="header"><h1>${p.name}</h1><div class="actions"><a class="btn" href="./spore-pedia.html">Spore-pedia</a></div></header>
  <main class="container">
    <article class="profile">
      <img class="thumb hero" src="${p.thumbnail||''}" alt="${p.name}">
      <section>
        <h2>Hero</h2>
        <div class="row"><span>Author</span><span>@${p.author||'anon'}</span></div>
        <div class="row"><span>Length</span><span>${p.ship.length_m} m</span></div>
        <div class="row"><span>Tiles</span><span id="N">—</span></div>
        <div class="row"><span>P_ship,avg</span><span id="Pship">—</span></div>
        <div class="row"><span>Status</span><span id="status" class="pill">—</span></div>
      </section>
      <section>
        <h2>Cavity</h2>
        <div class="row"><span>a</span><span>${p.tile.a_nm} nm</span></div>
        <div class="row"><span>γ_geo</span><span>${p.tile.gammaGeo}</span></div>
        <div class="row"><span>D</span><span>${p.tile.D_um} µm</span></div>
        <div class="row"><span>h</span><span>${p.tile.h_nm} nm</span></div>
        <div class="row"><span>δa</span><span>${p.drive.deltaA_pm} pm</span></div>
        <div class="row"><span>Q @ f</span><span>${p.drive.Q} @ ${p.drive.f_GHz} GHz</span></div>
      </section>
      <section>
        <h2>Gates</h2>
        <div id="gates">…</div>
      </section>
      <section>
        <h2>Bench Equivalents</h2>
        <div id="results">…</div>
      </section>
      <section>
        <h2>Why this works</h2>
        <ul class="bullets">
          <li>Casimir foundation at a = ${p.tile.a_nm} nm → static energy per tile</li>
          <li>Geometry blue-shift γ_geo = ${p.tile.gammaGeo} from pocket shaping</li>
          <li>Boundary modulation δa = ${p.drive.deltaA_pm} pm at ${p.drive.f_GHz} GHz with Q = ${p.drive.Q}</li>
          <li>Duty ${p.drive.d_eff} and tile count N set ship-avg power</li>
        </ul>
      </section>
    </article>
  </main>
  <script src="./js/physics-core.js"></script>
  <script id="warp-profile" type="application/json">${json}</script>
  <script>
    const data = JSON.parse(document.getElementById('warp-profile').textContent);
    const d = PhysicsCore.compute(data);
    document.getElementById('N').textContent = (d.N||0).toLocaleString();
    document.getElementById('Pship').textContent = (d.P_ship_MW||0).toLocaleString(undefined,{maximumFractionDigits:3}) + ' MW';
    const st = document.getElementById('status'); st.textContent = d.status; st.className = 'pill ' + d.status;
    document.getElementById('gates').innerHTML = PhysicsCore.renderGates(d);
    document.getElementById('results').innerHTML = PhysicsCore.renderResults(d);
  </script>
</body></html>`;
  }
  return { list, save, get, remove, clearAll, exportJSON, prepareForSave, downloadProfileHTML };
})();
