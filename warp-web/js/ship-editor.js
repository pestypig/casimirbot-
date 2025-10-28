// ship-editor.js — Three.js ship prism + live binding to PhysicsCore
// Exposes: ShipEditor.init(canvas, { profile, onUpdate })
// - profile: a PhysicsCore tuple; editor will read ship.{length_m,width_m,depth_m}
// - onUpdate: callback({profile, derived}) when setProfile() or setSize() changes
const ShipEditor = (() => {
  function init(canvas, { profile=null, onUpdate=null } = {}){
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const light = new THREE.DirectionalLight(0xffffff, 1); light.position.set(1,1,1);
    const amb = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(light, amb);
    const mat = new THREE.MeshStandardMaterial({color:0x3a86ff, metalness:0.2, roughness:0.6});
    // Unit box; we'll scale in meters to visualize L × W × D
    const geo = new THREE.BoxGeometry(1, 1, 1, 8, 2, 2);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    camera.position.set(3.0, 2.2, 3.0);
    camera.lookAt(0,0,0);
    function resize(){
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      camera.aspect = rect.width/rect.height; camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    }
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    function render(){ renderer.render(scene, camera); requestAnimationFrame(render); }
    render();
    // --- UI banner (status + quick readouts)
    async function capture(){
      // return data URL for thumbnail
      return canvas.toDataURL('image/png');
    }
    // overlay
    const banner = document.createElement('div');
    banner.style.cssText = 'position:absolute; top:8px; right:8px; background:#111a; color:#fff; padding:6px 10px; border-radius:8px; font:12px/1.2 system-ui; pointer-events:none; min-width:200px; text-align:right;';
    canvas.parentElement.style.position='relative';
    canvas.parentElement.appendChild(banner);
    function setBanner(msg, tone='ok'){
      banner.textContent = msg || '';
      const colors = { ok:'#2ecc71', warn:'#f1c40f', fail:'#e74c3c' };
      banner.style.border = `1px solid ${colors[tone]||'#888'}`;
      banner.style.boxShadow = `0 0 12px ${colors[tone]||'#888'}55`;
    }

    // ---- Live linkage to PhysicsCore
    let currentProfile = profile || window?.lastWarpProfile || null;
    let lastDerived = null;

    function computeAndUpdate(){
      if (!currentProfile || (typeof PhysicsCore === 'undefined')) {
        setBanner('No profile / PhysicsCore not loaded', 'warn');
        return;
      }
      const d = PhysicsCore.compute(currentProfile);
      lastDerived = d;
      // Ship prism scaling (meters): x=length, y=depth, z=width
      const L = Math.max(0.1, Number(currentProfile.ship?.length_m)||1);
      const W = Math.max(0.1, Number(currentProfile.ship?.width_m)||1);
      const D = Math.max(0.1, Number(currentProfile.ship?.depth_m)||0.5);
      mesh.scale.set(L, D, W);
      // Color cue from status
      const tone = d.status==='ok' ? 'ok' : (d.status==='warn' ? 'warn' : 'fail');
      mat.color.set(tone==='ok' ? 0x2ecc71 : tone==='warn' ? 0xf1c40f : 0xe74c3c);
      // Banner contents (concise)
      setBanner(
        `L×W×D = ${L.toFixed(1)}×${W.toFixed(1)}×${D.toFixed(2)} m\n` +
        `P_ship = ${ (d.P_ship_MW||0).toExponential(2) } MW · N=${d.N}\n` +
        `R1=${(d.R1||0).toExponential(2)} · R2=${(d.R2||0).toExponential(2)} · status=${d.status}`,
        tone
      );
      // Notify host
      if (typeof onUpdate === 'function') {
        try { onUpdate({ profile: currentProfile, derived: d }); } catch {}
      }
      return d;
    }

    // External API: set ship dimensions (keeps other params)
    function setSize(length_m, width_m, depth_m){
      if (!currentProfile) return;
      currentProfile.ship = {
        ...(currentProfile.ship||{}),
        length_m: Number(length_m),
        width_m: Number(width_m),
        depth_m: Number(depth_m ?? currentProfile.ship?.depth_m ?? 0.5),
        // keep area_m2 consistent if not user-driven: default rectangle
        area_m2: Number(length_m)*Number(width_m)
      };
      computeAndUpdate();
    }

    // External API: replace full profile (e.g., after form edits)
    function setProfile(p){
      currentProfile = p;
      // attempt to sync area if not provided
      if (currentProfile?.ship) {
        const L = Number(currentProfile.ship.length_m||1);
        const W = Number(currentProfile.ship.width_m||1);
        if (!Number.isFinite(currentProfile.ship.area_m2)) {
          currentProfile.ship.area_m2 = L*W;
        }
      }
      computeAndUpdate();
    }

    // Initialize
    if (currentProfile?.ship) {
      setProfile(currentProfile);
    } else {
      // fallback to a visible default
      setSize(100, 20, 0.5);
    }

    return { setSize, setProfile, capture, computeAndUpdate, getDerived: ()=>lastDerived };
  }
  return { init };
})();
