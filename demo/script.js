// --- Neural Network Background ---
const netCanvas = document.getElementById('network-canvas');
const netCtx = netCanvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
netCanvas.width = W;
netCanvas.height = H;

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  netCanvas.width = W;
  netCanvas.height = H;
  dissolveCanvas.width = W;
  dissolveCanvas.height = H;
}
window.addEventListener('resize', resize);

const NODES = 32;
let nodes = [], links = [];
function initNetwork() {
  nodes = [];
  links = [];
  for (let i = 0; i < NODES; i++) {
    nodes.push({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: (Math.random()-0.5)*0.5,
      vy: (Math.random()-0.5)*0.5,
      r: 8 + Math.random()*8,
      active: true
    });
  }
  for (let i = 0; i < NODES; i++) {
    for (let j = i+1; j < NODES; j++) {
      if (Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y) < 180) {
        links.push({a: i, b: j, strength: Math.random()*0.5+0.5});
      }
    }
  }
}
initNetwork();

function animateNetwork() {
  netCtx.clearRect(0, 0, W, H);
  for (let link of links) {
    const n1 = nodes[link.a], n2 = nodes[link.b];
    netCtx.save();
    netCtx.globalAlpha = 0.12*link.strength;
    netCtx.strokeStyle = '#00eaff';
    netCtx.lineWidth = 2*link.strength;
    netCtx.beginPath();
    netCtx.moveTo(n1.x, n1.y);
    netCtx.lineTo(n2.x, n2.y);
    netCtx.stroke();
    netCtx.restore();
  }
  for (let node of nodes) {
    netCtx.save();
    netCtx.globalAlpha = node.active ? 0.5 : 0.1;
    netCtx.beginPath();
    netCtx.arc(node.x, node.y, node.r, 0, 2*Math.PI);
    netCtx.fillStyle = node.active ? '#fff' : '#ff00cc';
    netCtx.shadowColor = node.active ? '#00eaff' : '#ff00cc';
    netCtx.shadowBlur = node.active ? 16 : 8;
    netCtx.fill();
    netCtx.restore();
    node.x += node.vx;
    node.y += node.vy;
    if (node.x < node.r || node.x > W-node.r) node.vx *= -1;
    if (node.y < node.r || node.y > H-node.r) node.vy *= -1;
  }
  requestAnimationFrame(animateNetwork);
}
animateNetwork();

// --- CSV and Phrase Management ---
let phrases = [];
let phraseIndex = 0;

// --- Dissolve Canvas ---
const dissolveCanvas = document.getElementById('dissolve-canvas');
const dissolveCtx = dissolveCanvas.getContext('2d');
dissolveCanvas.width = W;
dissolveCanvas.height = H;

window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  dissolveCanvas.width = W;
  dissolveCanvas.height = H;
});

// --- Typewriter Text Layer ---
const typewriterDiv = document.getElementById('typewriter-text');

// --- Typewriter Animation with Calm Text Shadow Painting ---
const gooeyMarquee = document.getElementById('gooey-marquee');

function animateTypewriter(text, callback) {
  gooeyMarquee.classList.remove('drift');
  typewriterDiv.style.display = 'block';
  let i = 0;
  function type() {
    if (i <= text.length) {
      let html = '';
      for (let j = 0; j < i; j++) {
        html += text[j];
      }
      // Comet tail width and opacity based on progress
      let progress = i / text.length;
      let tailWidth = 24 + 80 * progress; // px
      let tailOpacity = 0.5 + 0.4 * progress;
      if (i > 0 && i < text.length) {
        html += `<span class='comet-tail' style='width:${tailWidth}px;opacity:${tailOpacity}'></span>`;
      }
      typewriterDiv.innerHTML = html;
      i++;
      setTimeout(type, 48 + Math.random() * 32);
    } else {
      // At the end, show a short comet tail at the end
      typewriterDiv.innerHTML = text + `<span class='comet-tail' style='width:40px;opacity:0.7'></span>`;
      setTimeout(() => {
        gooeyMarquee.classList.add('drift');
        if (callback) setTimeout(callback, 1800);
      }, 800);
    }
  }
  type();
}

// --- Dissolve Animation (pixel fragmentation/melt/blur) ---
function showMelt(text, callback) {
  // Smudge effect before dissolve
  typewriterDiv.style.display = 'none';
  dissolveCanvas.style.display = 'block';
  dissolveCtx.clearRect(0, 0, W, H);

  // Draw gradient text to canvas for smudge phase
  const fontSize = 48;
  dissolveCtx.save();
  dissolveCtx.font = `bold ${fontSize}px Arial, sans-serif`;
  dissolveCtx.textAlign = 'center';
  dissolveCtx.textBaseline = 'middle';
  const grad = dissolveCtx.createLinearGradient(W/2-150, H/2, W/2+150, H/2);
  grad.addColorStop(0, '#b2f7ff');
  grad.addColorStop(0.4, '#00eaff');
  grad.addColorStop(1, '#6a89cc');
  dissolveCtx.fillStyle = grad;
  dissolveCtx.shadowColor = '#00eaff';
  dissolveCtx.shadowBlur = 16;
  dissolveCtx.fillText(text, W/2, H/2);
  dissolveCtx.restore();

  // Smudge phase: horizontally distort each scanline
  const smudgeSteps = 48; // slower smudge
  let smudgeT = 0;
  function smudgeFrame() {
    // Get the current image data
    const imageData = dissolveCtx.getImageData(W/2-300, H/2-60, 600, 120);
    const data = imageData.data;
    // Clear and redraw with smudge
    dissolveCtx.clearRect(0, 0, W, H);
    for (let y = 0; y < 120; y++) {
      // Smudge amount increases with time and with distance from center
      const relY = (y - 60) / 60;
      const maxShift = 18 * (smudgeT / smudgeSteps) * (0.2 + Math.abs(relY));
      const shift = Math.floor(maxShift * (Math.random() * 0.7 + 0.3));
      // Copy scanline with shift
      dissolveCtx.save();
      dissolveCtx.filter = `blur(${2 + 10 * (smudgeT / smudgeSteps)}px)`;
      dissolveCtx.putImageData(
        new ImageData(
          new Uint8ClampedArray(data.slice(y*600*4, (y+1)*600*4)),
          600, 1
        ),
        W/2-300 + shift, H/2-60 + y
      );
      dissolveCtx.restore();
    }
    smudgeT++;
    if (smudgeT < smudgeSteps) {
      requestAnimationFrame(smudgeFrame);
    } else {
      startDissolve();
    }
  }
  smudgeFrame();

  function startDissolve() {
    // Get image data for particles
    const imageData = dissolveCtx.getImageData(W/2-300, H/2-60, 600, 120);
    const data = imageData.data;
    let particles = [];
    for (let y = 0; y < 120; y += 2) {
      for (let x = 0; x < 600; x += 2) {
        const idx = (y * 600 + x) * 4;
        if (data[idx+3] > 128) {
          const px = W/2-300 + x;
          const py = H/2-60 + y;
          // Give each particle a random direction and speed for dispersal
          const angle = Math.random() * 2 * Math.PI;
          const speed = 0.3 + Math.random() * 0.5; // slower, gentle
          particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 2 + Math.random() * 1.5,
            color: `rgba(${data[idx]},${data[idx+1]},${data[idx+2]},1)`
          });
        }
      }
    }
    let t = 0;
    const maxT = 260; // slower dissolve
    function frame() {
      dissolveCtx.clearRect(0, 0, W, H);
      for (let p of particles) {
        // Animate outward, fade and shrink, but slow and smooth
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 1.01;
        p.vy *= 1.01;
        p.alpha -= 0.002 + Math.random() * 0.002;
        p.size *= 0.995;
        dissolveCtx.save();
        dissolveCtx.globalAlpha = Math.max(0, p.alpha);
        dissolveCtx.filter = `blur(${2 + 18 * (1-p.alpha)}px)`;
        dissolveCtx.fillStyle = p.color;
        dissolveCtx.beginPath();
        dissolveCtx.arc(p.x, p.y, Math.max(0.5, p.size), 0, 2*Math.PI);
        dissolveCtx.fill();
        dissolveCtx.restore();
      }
      // Remove faded particles
      particles = particles.filter(p => p.alpha > 0.05 && p.size > 0.3);
      t++;
      if (particles.length > 0 && t < maxT) {
        requestAnimationFrame(frame);
      } else {
        dissolveCtx.clearRect(0, 0, W, H);
        dissolveCanvas.style.display = 'none';
        if (callback) setTimeout(callback, 800);
      }
    }
    frame();
  }
}

// --- Main Phrase Cycle ---
function showNextPhrase() {
  const text = phrases[phraseIndex];
  phraseIndex = (phraseIndex + 1) % phrases.length;
  animateTypewriter(text, () => showMelt(text, showNextPhrase));
}

// --- Load CSV ---
fetch('extracted_last_words.csv')
  .then(res => res.text())
  .then(data => {
    // 简单按行分割，跳过标题行
    const lines = data.split('\n').filter(line => line.trim() !== '');
    // 跳过第一行（标题行）
    phrases = lines.slice(1).map(line => line.trim());
    showNextPhrase();
  });