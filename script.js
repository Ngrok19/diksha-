 (() => {
 const pages = Array.from(document.querySelectorAll('.page'));

  const slider = document.getElementById('slider');

  const total = pages.length;

  let idx = 0; // zero-based page index

  const typedPages = new Set();

  // show specified page index (0-based)

  function show(i){

    idx = Math.max(0, Math.min(total - 1, i));

    const x = -idx * window.innerWidth;

    slider.style.transform = `translateX(${x}px)`;

    // run enter effects

    pages.forEach((p, j) => {

      if (j === idx) {

        p.classList.add('in-view');

      } else {

        p.classList.remove('in-view');

      }

    });

    // run human-like typewriter for page (if any)

    runTypewriter(idx);

    // mirror page index: page6 is index 5 (0-based)

    if (idx === 5) {

      // animate mirror text in with fade

      const mt = document.querySelector('.mirror-text');

      if (mt) { mt.style.opacity='1'; mt.style.transform='translateY(0)'; }

    } else {

      // hide mirror text with fade and stop camera if active

      const mt = document.querySelector('.mirror-text');

      if (mt) { mt.style.opacity='0'; mt.style.transform='translateY(15px)'; }

      stopCamera();

    }

    // final page (index 6) actions

    if (idx === 6) {

      runFinal();

    }

  }

  // navigation via buttons (delegated)

  document.addEventListener('click', (e) => {

    const btn = e.target.closest('button[data-action], #doneBtn, #skipMirror');

    if (!btn) return;

    if (btn.id === 'doneBtn') { show(0); return; }

    if (btn.id === 'skipMirror') { show(idx + 1); return; }

    const action = btn.dataset.action;

    if (action === 'next') show(idx + 1);

    if (action === 'prev') show(idx - 1);

  });

  // typewriter: human-like speed, pauses at punctuation

  function runTypewriter(pageIndex) {

    const p = pages[pageIndex];

    if (!p) return;

    const el = p.querySelector('.type');

    if (!el) return;

    if (typedPages.has(pageIndex)) return; // run once

    typedPages.add(pageIndex);

    const full = el.dataset.text || el.getAttribute('data-text') || el.innerText || "";

    el.textContent = "";

    let i = 0;

    function nextChar() {

      if (i > full.length) return;

      el.textContent = full.slice(0, i);

      i++;

      // naturalistic delay:

      const char = full[i-1] || '';

      let delay = 35 + Math.random()*45; // base delay - more natural

      if (char === ' '){ delay = 10 + Math.random()*30; }              // pause on spaces

      if (/[.,!?]/.test(char)) delay += 180 + Math.random()*200;       // longer pause on punctuation

      if (i % 25 === 0) delay += 60;                                  // deeper breathing pauses

      setTimeout(nextChar, delay);

    }

    nextChar();

  }

  // touch swipe support

  (function swipe(){

    let sx=0, sy=0;

    window.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});

    window.addEventListener('touchend', e => {

      const dx = e.changedTouches[0].clientX - sx;

      const dy = Math.abs(e.changedTouches[0].clientY - sy);

      if (Math.abs(dx) > 50 && dy < 120) { if (dx < 0) show(idx+1); else show(idx-1); }

    }, {passive:true});

  })();

  // camera mirror controls (start/stop)

  const video = document.getElementById('mirrorVideo');

  const cameraFrame = document.getElementById('cameraFrame');

  let streamRef = null;

  if (cameraFrame) {

    cameraFrame.addEventListener('click', async () => {

      if (streamRef) return; // already active

      try {

        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });

        streamRef = s;

        video.srcObject = s;

        await video.play().catch(()=>{});

        // small visual cue (flash)

        cameraFrame.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)';

      } catch(err) {

        console.warn("Camera unavailable/denied", err);

      }

    });

  }

  function stopCamera(){

    if (streamRef) {

      streamRef.getTracks().forEach(t => t.stop());

      streamRef = null;

      if (cameraFrame) cameraFrame.style.boxShadow = '';

    }

  }

  // final page animation + confetti

  const finalCard = document.querySelector('.final-card');

  const finalAnim = document.getElementById('finalAnim');

  const confettiCanvas = document.getElementById('confettiCanvas');

  function runFinal(){

    if (finalAnim) {

      // reveal text

      finalAnim.style.opacity = '1';

      finalAnim.style.transform = 'translateY(0)';

    }

    // confetti burst

    runConfetti(confettiCanvas, 140);

  }

  // lightweight confetti (canvas)

  function runConfetti(canvas, count = 80) {

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const DPR = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * DPR;

    canvas.height = canvas.clientHeight * DPR;

    ctx.scale(DPR, DPR);

    const W = canvas.clientWidth, H = canvas.clientHeight;

    const colors = ['#ff9bb3','#ffd46f','#7cc6ff','#9b8cff','#b2f2d6'];

    const pieces = [];

    for (let i=0;i<count;i++){

      pieces.push({

        x: Math.random()*W,

        y: Math.random()*-H*0.6,

        vx: (Math.random()-0.5)*6, vy: 1+Math.random()*6,

        size: 6+Math.random()*8, rot: Math.random()*360,

        color: colors[Math.floor(Math.random()*colors.length)],

        life:0, ttl: 80+Math.random()*90

      });

    }

    let raf=0;

    function frame(){

      ctx.clearRect(0,0,canvas.width,canvas.height);

      for (let p of pieces){

        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.vx*0.6; p.life++;

        ctx.save();

        ctx.translate(p.x, p.y);

        ctx.rotate(p.rot*Math.PI/180);

        ctx.fillStyle = p.color;

        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);

        ctx.restore();

      }

      if (pieces.every(p=>p.life>p.ttl)) { cancelAnimationFrame(raf); setTimeout(()=>ctx.clearRect(0,0,canvas.width,canvas.height),200); return; }

      raf = requestAnimationFrame(frame);

    }

    frame();

  }

  // start at page 0

  show(0);

  // resize -> recalc position

  window.addEventListener('resize', ()=> show(idx));

  // keyboard nav (optional)

  window.addEventListener('keydown', (e)=>{

    if (e.key === 'ArrowRight') show(idx+1);

    if (e.key === 'ArrowLeft') show(idx-1);

  });

})();