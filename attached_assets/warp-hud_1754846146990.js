/* warp-hud.js — Micro HUD for Natário Warp Visualizer */
(function(){
  function el(tag, attrs={}, children=[]) {
    const e = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'style') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    }
    return e;
  }
  function fmtExp(x){ if(!isFinite(x)) return '—'; const s = x.toExponential(2); return s.replace('e','e'); }

  class WarpHUD {
    constructor(engine, opts={}){
      this.engine = engine;
      const target = typeof opts.container === 'string' ? document.querySelector(opts.container) : (opts.container || null);
      this.root = target || el('div', { class: 'hud-root' });
      if (!target) document.body.appendChild(this.root);

      this.root.appendChild(el('div', {class:'hud-title'}, ['Natário Controls']));
      const row = el('div', {class:'hud-row'}); this.root.appendChild(row);

      const col1 = el('div', {class:'hud-col'});
      col1.appendChild(this._modes()); col1.appendChild(this._toggles()); row.appendChild(col1);

      const col2 = el('div', {class:'hud-col'});
      col2.appendChild(this._pipeline()); row.appendChild(col2);

      const col3 = el('div', {class:'hud-col'});
      col3.appendChild(this._strobing()); col3.appendChild(this._shape()); row.appendChild(col3);

      const foot = el('div', {class:'hud-foot'});
      this.readouts = { betaInst: el('span'), betaAvg: el('span'), betaNet: el('span'), qi: el('span') };
      const r = el('div', {class:'hud-readouts'}, [
        el('div', {class:'r-line'}, ['β_inst: ', this.readouts.betaInst]),
        el('div', {class:'r-line'}, ['β_avg: ', this.readouts.betaAvg ]),
        el('div', {class:'r-line'}, ['β_net: ', this.readouts.betaNet ]),
        el('div', {class:'r-line'}, ['QI ζ: ', this.readouts.qi])
      ]);
      foot.appendChild(r);

      // Sector wheel
      this.wheel = el('canvas', {class:'hud-wheel', width: 140, height: 140});
      foot.appendChild(this.wheel);
      this.root.appendChild(foot);

      // Overlay arrow (drive direction)
      this.overlay = el('canvas', {class:'hud-overlay'});
      const parent = this.engine.canvas.parentElement || document.body;
      parent.appendChild(this.overlay);

      const onResize = ()=>{
        const rect = this.engine.canvas.getBoundingClientRect();
        this.overlay.width = rect.width; this.overlay.height = rect.height;
        this.overlay.style.left = rect.left + 'px'; this.overlay.style.top = rect.top + 'px';
      };
      onResize(); window.addEventListener('resize', onResize);

      const tick = (t)=>{ this._update(t*0.001); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }

    _modes(){
      const box = document.createElement('div'); box.className='hud-box';
      box.appendChild(el('div',{class:'hud-box-title'},['Modes']));
      const mkBtn = (label, mode)=>{
        const b = el('button', {class:'hud-btn'}, [label]);
        b.addEventListener('click', ()=> this.engine.setMode(mode));
        return b;
      };
      box.appendChild(el('div',{class:'btn-row'},[
        mkBtn('HOVER','HOVER'), mkBtn('CRUISE','CRUISE'), mkBtn('TILT','TILT')
      ]));
      return box;
    }

    _toggles(){
      const box = document.createElement('div'); box.className='hud-box';
      box.appendChild(el('div',{class:'hud-box-title'},['Toggles']));

      const inst = el('input',{type:'checkbox'});
      inst.addEventListener('change', ()=> this.engine.toggleInstantaneous(inst.checked));
      box.appendChild(el('label',{class:'hud-check'},[inst,' Show instantaneous (burst)']));

      // York-time toggles
      const kcb = el('input',{type:'checkbox'}); kcb.checked=!!this.engine.uniforms.showK;
      kcb.addEventListener('change', ()=> this.engine.updateUniforms({showK:kcb.checked?1.0:0.0}));
      box.appendChild(el('label',{class:'hud-check'},[kcb,' Color grid by York time θ']));

      const wrap = el('div',{class:'hud-slider'});
      wrap.appendChild(el('div',{class:'s-name'},['θ scale']));
      const rng = el('input',{type:'range', min:'0.2', max:'5.0', step:'0.1', value:this.engine.uniforms.kScale||1.0});
      const out = el('div',{class:'s-out'});
      const upd=()=>{ const v=parseFloat(rng.value); this.engine.updateUniforms({kScale:v}); out.textContent=v.toFixed(2); };
      rng.addEventListener('input',upd); upd(); wrap.appendChild(rng); wrap.appendChild(out); box.appendChild(wrap);

      const wrap2 = el('div',{class:'hud-slider'});
      wrap2.appendChild(el('div',{class:'s-name'},['v_s (viz)']));
      const rng2 = el('input',{type:'range', min:'0.2', max:'5.0', step:'0.1', value:this.engine.uniforms.vShip||1.0});
      const out2 = el('div',{class:'s-out'});
      const upd2=()=>{ const v=parseFloat(rng2.value); this.engine.updateUniforms({vShip:v}); out2.textContent=v.toFixed(2); };
      rng2.addEventListener('input',upd2); upd2(); wrap2.appendChild(rng2); wrap2.appendChild(out2); box.appendChild(wrap2);

      return box;
    }

    _pipeline(){
      const box = document.createElement('div'); box.className='hud-box';
      box.appendChild(el('div',{class:'hud-box-title'},['Energy Pipeline']));
      const add = (label, key, {min, max, step, fmt})=>{
        const wrap = el('div', {class:'hud-slider'});
        const name = el('div', {class:'s-name'}, [label]);
        const range = el('input', {type:'range', min, max, step, value: this.engine.uniforms[key]});
        const out = el('div', {class:'s-out'});
        const update = ()=>{
          let val = parseFloat(range.value);
          this.engine.updateUniforms({[key]: val});
          out.textContent = fmt ? fmt(val) : val.toFixed(2);
        };
        range.addEventListener('input', update); update();
        wrap.appendChild(name); wrap.appendChild(range); wrap.appendChild(out);
        box.appendChild(wrap);
      };
      add('γ_geo', 'gammaGeo', {min:1, max:40, step:0.5});
      add('Q_burst', 'Qburst', {min:1e6, max:1e10, step:1e6, fmt:(v)=>Number(v).toExponential(1)});
      add('Δa/a', 'deltaAOverA', {min:0.0, max:0.2, step:0.005});
      add('Duty', 'dutyCycle', {min:0.01, max:0.5, step:0.005, fmt:(v)=> (v*100).toFixed(1)+'%'});
      return box;
    }

    _strobing(){
      const box = document.createElement('div'); box.className='hud-box';
      box.appendChild(el('div',{class:'hud-box-title'},['Strobing']));
      const add = (label, key, {min, max, step, fmt})=>{
        const wrap = el('div', {class:'hud-slider'});
        const name = el('div', {class:'s-name'}, [label]);
        const range = el('input', {type:'range', min, max, step, value: this.engine.uniforms[key]});
        const out = el('div', {class:'s-out'});
        const update = ()=>{
          const val = parseFloat(range.value);
          this.engine.updateUniforms({[key]: val});
          out.textContent = fmt ? fmt(val) : val.toFixed(2);
        };
        range.addEventListener('input', update); update();
        wrap.appendChild(name); wrap.appendChild(range); wrap.appendChild(out);
        box.appendChild(wrap);
      };
      add('Sectors', 'sectorCount', {min:4, max:800, step:4, fmt:(v)=>v.toFixed(0)});
      add('+β fraction', 'phaseSplit', {min:0.0, max:1.0, step:0.01});
      add('Sector rev/s', 'sectorSpeed', {min:0.1, max:5.0, step:0.1});
      return box;
    }

    _shape(){
      const box = document.createElement('div'); box.className='hud-box';
      box.appendChild(el('div',{class:'hud-box-title'},['Shape & Grid']));

      const axes = this.engine.uniforms.axesClip.slice();
      const addAxis = (label, idx, min, max, step)=>{
        const wrap = el('div', {class:'hud-slider'});
        const name = el('div', {class:'s-name'}, [label]);
        const range = el('input', {type:'range', min, max, step, value: axes[idx]});
        const out = el('div', {class:'s-out'});
        const update = ()=>{
          axes[idx] = parseFloat(range.value);
          this.engine.setEllipsoidAxes(axes[0], axes[1], axes[2]);
          out.textContent = axes[idx].toFixed(2);
        };
        range.addEventListener('input', update); update();
        wrap.appendChild(name); wrap.appendChild(range); wrap.appendChild(out);
        box.appendChild(wrap);
      };
      addAxis('Axis X', 0, 0.15, 0.7, 0.01);
      addAxis('Axis Y', 1, 0.10, 0.5, 0.01);
      addAxis('Axis Z', 2, 0.10, 0.7, 0.01);

      const gridK = el('input',{type:'range', min:'0.02', max:'0.2', step:'0.005', value:this.engine.uniforms.gridK||0.12});
      const gridOut = el('div',{class:'s-out'});
      const gwrap = el('div',{class:'hud-slider'},[ el('div',{class:'s-name'},['Grid Hug K']), gridK, gridOut ]);
      const updG = ()=>{ const v=parseFloat(gridK.value); this.engine.updateUniforms({gridK:v}); gridOut.textContent=v.toFixed(3); };
      gridK.addEventListener('input', updG); updG();
      box.appendChild(gwrap);
      // Wall width (shell thickness)
      const ww = el('input',{type:'range', min:'0.02', max:'0.12', step:'0.005', value:this.engine.uniforms.wallWidth||0.06});
      const wwOut = el('div',{class:'s-out'});
      const wwWrap = el('div',{class:'hud-slider'},[ el('div',{class:'s-name'},['Wall width']), ww, wwOut ]);
      const updWW = ()=>{ const v=parseFloat(ww.value); this.engine.updateUniforms({wallWidth:v}); wwOut.textContent=v.toFixed(3); };
      ww.addEventListener('input', updWW); updWW();
      box.appendChild(wwWrap);


      return box;
    }

    _update(t){
      const U = this.engine.uniforms;
      const sCount = Math.max(1, Math.floor(U.sectorCount || 1));
      const betaInst = (U.gammaGeo || 0) * (U.Qburst || 0) * (U.deltaAOverA || 0);
      const betaAvg  = betaInst * Math.sqrt(Math.max(1e-9, (U.dutyCycle||0)/sCount));
      const net = betaAvg * (2*(U.phaseSplit||0)-1);
      const tiltMag = Math.hypot.apply(null, U.betaGradient||[0,0,0]);
      const zeta = 1.0 / (1.0 + Math.abs(net) + tiltMag);

      this.readouts.betaInst.textContent = fmtExp(betaInst);
      this.readouts.betaAvg .textContent = fmtExp(betaAvg);
      this.readouts.betaNet .textContent = fmtExp(net);
      this.readouts.qi      .textContent = zeta.toFixed(2);

      this._drawWheel(t);
      this._drawOverlay();
    }

    _drawWheel(t){
      const U = this.engine.uniforms;
      const ctx = this.wheel.getContext('2d');
      const w = this.wheel.width, h = this.wheel.height, r = Math.min(w,h)*0.45;
      ctx.clearRect(0,0,w,h);
      const cx=w/2, cy=h/2;
      const sectors = Math.max(2, Math.floor(U.sectorCount||16));
      const split = Math.floor((U.phaseSplit||0.5)*sectors);
      const sectorIndex = (t * (U.sectorSpeed||2) * sectors) % sectors;

      for(let i=0;i<sectors;i++){
        const a0 = (i    )*2*Math.PI/sectors - Math.PI/2;
        const a1 = (i+1.0)*2*Math.PI/sectors - Math.PI/2;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a1,false); ctx.closePath();
        ctx.fillStyle = (i<split)?'#22d3ee':'#f472b6'; // cyan=+β, pink=−β
        ctx.globalAlpha = (Math.abs(i - sectorIndex) < 0.5)? 0.95 : 0.65;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      ctx.font='12px ui-monospace, SFMono, monospace'; ctx.fillStyle='#e2e8f0';
      ctx.fillText('Sector strobing', 8, h-8);
    }

    _drawOverlay(){
      const U = this.engine.uniforms;
      const ctx = this.overlay.getContext('2d');
      const w = this.overlay.width, h = this.overlay.height;
      ctx.clearRect(0,0,w,h);
      const d = U.driveDir || [1,0,0];
      const cx=w*0.5, cy=h*0.85;
      const len = Math.min(w,h)*0.10;
      const ang = Math.atan2(d[2], d[0]);
      const x2 = cx + len*Math.cos(ang);
      const y2 = cy - len*Math.sin(ang);
      ctx.strokeStyle='#eab308'; ctx.lineWidth=3; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x2,y2); ctx.stroke();
      const head = 8;
      const a1 = ang + Math.PI*0.85, a2 = ang - Math.PI*0.85;
      ctx.beginPath();
      ctx.moveTo(x2,y2);
      ctx.lineTo(x2 - head*Math.cos(a1), y2 + head*Math.sin(a1));
      ctx.lineTo(x2 - head*Math.cos(a2), y2 + head*Math.sin(a2));
      ctx.closePath(); ctx.fillStyle='#eab308'; ctx.fill();
      ctx.font='12px ui-monospace, SFMono, monospace';
      ctx.fillStyle='#eab308'; ctx.fillText('drive direction', cx+10, cy-6);
    }
  }
  window.WarpHUD = WarpHUD;
})();