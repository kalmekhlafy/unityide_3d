/**
 * UnityIDE 3D — main.js
 * Three.js r160 UMD global (no ES modules, no importmap)
 * Sovereign development environment — immersive 3D experience
 */
(function () {
  'use strict';

  /* ── Guard ─────────────────────────────────────────────── */
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded — 3D scene skipped.');
    return;
  }

  /* ── Skip on mobile (canvas is hidden via CSS, skip JS too) */
  if (window.innerWidth < 900) {
    initUI();
    return;
  }

  /* ════════════════════════════════════════════════════════
     CONSTANTS & STATE
  ════════════════════════════════════════════════════════ */
  var clock   = new THREE.Clock();
  var mouse   = { x: 0, y: 0, nx: 0, ny: 0 }; // normalised -1..1
  var scrollY = 0;
  var scrollP = 0; // 0..1 over entire page

  /* Section waypoints — camera position + lookAt target */
  var waypoints = [
    /* 0 Hero     */ { pos: new THREE.Vector3( 0,  4, 32), look: new THREE.Vector3( 4, 0.5,  0) },
    /* 1 Vision   */ { pos: new THREE.Vector3(-4,  2,  8), look: new THREE.Vector3( 0, 0,  -10) },
    /* 2 Vault    */ { pos: new THREE.Vector3( 2,  6, -4), look: new THREE.Vector3( 0, 0,  -22) },
    /* 3 Footer   */ { pos: new THREE.Vector3( 0, 18, 20), look: new THREE.Vector3( 0, 0,    0) },
  ];

  var camPosTarget  = waypoints[0].pos.clone();
  var camLookTarget = waypoints[0].look.clone();
  var camLookCurr   = waypoints[0].look.clone();

  /* ════════════════════════════════════════════════════════
     RENDERER + SCENE + CAMERA
  ════════════════════════════════════════════════════════ */
  var canvas   = document.getElementById('c');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputColorSpace    = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020617, 0.018);

  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.copy(waypoints[0].pos);
  camera.lookAt(waypoints[0].look);

  /* ════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════ */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function makeGlowSprite(hexColor, size) {
    var sz  = 256;
    var cnv = document.createElement('canvas');
    cnv.width = cnv.height = sz;
    var ctx = cnv.getContext('2d');
    var r   = parseInt(hexColor.slice(1, 3), 16);
    var g   = parseInt(hexColor.slice(3, 5), 16);
    var b   = parseInt(hexColor.slice(5, 7), 16);
    var grad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
    grad.addColorStop(0,    'rgba(' + r + ',' + g + ',' + b + ',1)');
    grad.addColorStop(0.35, 'rgba(' + r + ',' + g + ',' + b + ',0.4)');
    grad.addColorStop(1,    'rgba(' + r + ',' + g + ',' + b + ',0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, sz, sz);
    var tex = new THREE.CanvasTexture(cnv);
    var mat = new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.9
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
  }

  /* ════════════════════════════════════════════════════════
     LIGHTS
  ════════════════════════════════════════════════════════ */
  scene.add(new THREE.AmbientLight(0x0a1020, 3));

  var pBlue = new THREE.PointLight(0x3b82f6, 6, 50);
  pBlue.position.set(4, 4, 8);
  scene.add(pBlue);

  var pPurple = new THREE.PointLight(0xa855f7, 3, 40);
  pPurple.position.set(-10, 8, -5);
  scene.add(pPurple);

  var pVault = new THREE.PointLight(0x10b981, 5, 30);
  pVault.position.set(0, 2, -22);
  scene.add(pVault);

  var pCore = new THREE.PointLight(0x3b82f6, 8, 20);
  pCore.position.set(4, 1, 0);
  scene.add(pCore);

  /* ════════════════════════════════════════════════════════
     1. NEON GRID FLOOR (custom shader)
  ════════════════════════════════════════════════════════ */
  var GRID_VERT = [
    'varying vec3 vWorld;',
    'void main() {',
    '  vec4 w = modelMatrix * vec4(position, 1.0);',
    '  vWorld = w.xyz;',
    '  gl_Position = projectionMatrix * viewMatrix * w;',
    '}'
  ].join('\n');

  var GRID_FRAG = [
    'uniform float uTime;',
    'varying vec3 vWorld;',
    'void main() {',
    '  vec2 uv = vWorld.xz * 0.12;',
    '  vec2 g = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);',
    '  float line = min(g.x, g.y);',
    '  float grid = 1.0 - min(line, 1.0);',
    '  float pulse = 0.5 + 0.5 * sin(uTime * 0.8 + vWorld.x * 0.15 + vWorld.z * 0.1);',
    '  float dist = 1.0 - smoothstep(0.0, 50.0, length(vWorld.xz));',
    '  vec3 col = mix(vec3(0.05, 0.1, 0.22), vec3(0.23, 0.51, 0.96), grid * pulse);',
    '  gl_FragColor = vec4(col, grid * dist * 0.65);',
    '}'
  ].join('\n');

  var gridUniforms = { uTime: { value: 0 } };
  var gridMat  = new THREE.ShaderMaterial({
    uniforms:    gridUniforms,
    vertexShader:   GRID_VERT,
    fragmentShader: GRID_FRAG,
    transparent: true,
    side:        THREE.DoubleSide,
    extensions:  { derivatives: true }
  });
  var gridGeo  = new THREE.PlaneGeometry(220, 220, 1, 1);
  var gridMesh = new THREE.Mesh(gridGeo, gridMat);
  gridMesh.rotation.x = -Math.PI / 2;
  gridMesh.position.y = -7;
  scene.add(gridMesh);

  /* ════════════════════════════════════════════════════════
     2. STAR FIELD (far background dots)
  ════════════════════════════════════════════════════════ */
  (function buildStars() {
    var N    = 3500;
    var pos  = new Float32Array(N * 3);
    var cols = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = 130 + Math.random() * 70;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      var t = Math.random();
      cols[i * 3]     = 0.6 + t * 0.4;
      cols[i * 3 + 1] = 0.7 + t * 0.3;
      cols[i * 3 + 2] = 1.0;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(cols, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.35, vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, depthWrite: false, transparent: true, opacity: 0.8
    });
    scene.add(new THREE.Points(geo, mat));
  }());

  /* ════════════════════════════════════════════════════════
     3. FLOATING PARTICLE FIELD (mid-range)
  ════════════════════════════════════════════════════════ */
  var particlePositions, particleVelocities, particleSystem;
  (function buildParticles() {
    var N  = 1800;
    particlePositions  = new Float32Array(N * 3);
    particleVelocities = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      particlePositions[i * 3]     = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      particleVelocities[i * 3]     = (Math.random() - 0.5) * 0.008;
      particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.18, color: 0x3b82f6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, depthWrite: false, transparent: true, opacity: 0.55
    });
    particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);
  }());

  /* ════════════════════════════════════════════════════════
     4. HERO — ENCRYPTED VAULT CUBE
  ════════════════════════════════════════════════════════ */
  var vaultGroup = new THREE.Group();
  vaultGroup.position.set(7, 0.5, 4);
  scene.add(vaultGroup);

  /* Inner translucent box */
  var boxGeo  = new THREE.BoxGeometry(5, 5, 5);
  var boxMat  = new THREE.MeshPhongMaterial({
    color: 0x0a1e40, emissive: 0x0d2766, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.25, side: THREE.DoubleSide
  });
  var boxMesh = new THREE.Mesh(boxGeo, boxMat);
  vaultGroup.add(boxMesh);

  /* Glowing wireframe edges */
  var edgesGeo = new THREE.EdgesGeometry(boxGeo);
  var edgesMat = new THREE.LineBasicMaterial({
    color: 0x3b82f6, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  vaultGroup.add(new THREE.LineSegments(edgesGeo, edgesMat));

  /* Glow sprite at cube center */
  var cubeGlow = makeGlowSprite('#3b82f6', 14);
  vaultGroup.add(cubeGlow);

  /* Small interior light */
  var cubeLight = new THREE.PointLight(0x3b82f6, 3, 12);
  vaultGroup.add(cubeLight);

  /* 3 orbiting torus rings around the cube */
  var ringColors = [0x3b82f6, 0xa855f7, 0x10b981];
  var ringRadii  = [4.5, 5.5, 6.2];
  var ringTubes  = [0.045, 0.035, 0.055];
  var ringAxes   = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0.3).normalize(),
    new THREE.Vector3(0.5, 0.5, 0.5).normalize()
  ];
  var ringMeshes = [];
  for (var ri = 0; ri < 3; ri++) {
    var tGeo = new THREE.TorusGeometry(ringRadii[ri], ringTubes[ri], 8, 80);
    var tMat = new THREE.MeshPhongMaterial({
      color: ringColors[ri], emissive: ringColors[ri], emissiveIntensity: 0.8,
      transparent: true, opacity: 0.8
    });
    var tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.userData.axis  = ringAxes[ri];
    tMesh.userData.speed = 0.3 + ri * 0.18;
    vaultGroup.add(tMesh);
    ringMeshes.push(tMesh);
  }

  /* ════════════════════════════════════════════════════════
     5. FEATURES — HOLOGRAPHIC FLOATING PANELS (z ~ -10)
  ════════════════════════════════════════════════════════ */
  var panelData = [
    { pos: [-8, 1, -10], rot: 0.25,  color: '#3b82f6', label: 'Isolated\nContexts',  icon: 'shield' },
    { pos: [ 0, 2, -13], rot: 0,      color: '#a855f7', label: 'Native\nPerformance', icon: 'bolt'   },
    { pos: [ 8, 1, -10], rot: -0.25, color: '#10b981', label: 'Zero\nKnowledge',     icon: 'key'    },
  ];

  var holoGroup = new THREE.Group();
  scene.add(holoGroup);

  panelData.forEach(function (d) {
    var g  = new THREE.PlaneGeometry(5, 6);
    var m  = new THREE.MeshBasicMaterial({
      color: d.color.replace('#', '0x'),
      transparent: true, opacity: 0.04, side: THREE.DoubleSide
    });
    var panel = new THREE.Mesh(g, m);
    panel.position.set(d.pos[0], d.pos[1], d.pos[2]);
    panel.rotation.y = d.rot;
    holoGroup.add(panel);

    /* Glowing border wireframe */
    var bGeo = new THREE.EdgesGeometry(g);
    var bMat = new THREE.LineBasicMaterial({
      color: d.color.replace('#', '0x'),
      transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    var border = new THREE.LineSegments(bGeo, bMat);
    border.position.copy(panel.position);
    border.rotation.copy(panel.rotation);
    holoGroup.add(border);

    /* Glow sprite */
    var gs = makeGlowSprite(d.color, 8);
    gs.position.set(d.pos[0], d.pos[1], d.pos[2]);
    holoGroup.add(gs);
  });

  /* ════════════════════════════════════════════════════════
     6. VAULT SECTION — 3D CORE (z ~ -22)
  ════════════════════════════════════════════════════════ */
  var vaultCoreGroup = new THREE.Group();
  vaultCoreGroup.position.set(0, 0, -22);
  scene.add(vaultCoreGroup);

  /* Central glowing sphere */
  var coreGeo = new THREE.SphereGeometry(1.6, 32, 32);
  var coreMat = new THREE.MeshPhongMaterial({
    color: 0x1a3a6e, emissive: 0x3b82f6, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85
  });
  vaultCoreGroup.add(new THREE.Mesh(coreGeo, coreMat));

  /* Glow sprite on vault core */
  var coreGlowA = makeGlowSprite('#3b82f6', 18);
  var coreGlowB = makeGlowSprite('#a855f7', 10);
  vaultCoreGroup.add(coreGlowA);
  vaultCoreGroup.add(coreGlowB);

  /* 3 nested torus rings at different axes */
  var coreRingDefs = [
    { r: 3.5, tube: 0.06, color: 0x3b82f6, axis: new THREE.Vector3(1, 0, 0), speed: 0.5  },
    { r: 5.0, tube: 0.05, color: 0xa855f7, axis: new THREE.Vector3(0, 1, 0), speed: 0.33 },
    { r: 6.5, tube: 0.04, color: 0x10b981, axis: new THREE.Vector3(0.5, 0.5, 0).normalize(), speed: 0.2 },
  ];
  var coreRings = [];
  coreRingDefs.forEach(function (def) {
    var tg = new THREE.TorusGeometry(def.r, def.tube, 8, 90);
    var tm = new THREE.MeshPhongMaterial({
      color: def.color, emissive: def.color, emissiveIntensity: 0.7,
      transparent: true, opacity: 0.75
    });
    var t = new THREE.Mesh(tg, tm);
    t.userData.axis  = def.axis;
    t.userData.speed = def.speed;
    vaultCoreGroup.add(t);
    coreRings.push(t);
  });

  /* Orbiting particles around vault core */
  (function buildCoreParticles() {
    var N   = 300;
    var pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = 2.5 + Math.random() * 5;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.2, color: 0x3b82f6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, depthWrite: false, transparent: true, opacity: 0.7
    });
    vaultCoreGroup.add(new THREE.Points(geo, mat));
  }());

  /* ════════════════════════════════════════════════════════
     7. FLOATING CODE FRAGMENTS (abstract line art)
  ════════════════════════════════════════════════════════ */
  (function buildCodeFragments() {
    var positions = [
      /* L-shape 1 */
      [[-15, 3, 5], [-15, -1, 5]], [[-15, -1, 5], [-12, -1, 5]],
      /* L-shape 2 */
      [[12, 5, 2], [12, 2, 2]], [[12, 2, 2], [16, 2, 2]],
      /* Bracket left */
      [[-18, 6, -8], [-20, 6, -8]], [[-20, 6, -8], [-20, 0, -8]], [[-20, 0, -8], [-18, 0, -8]],
      /* Bracket right */
      [[18, 6, -6], [20, 6, -6]], [[20, 6, -6], [20, 0, -6]], [[20, 0, -6], [18, 0, -6]],
      /* Random lines */
      [[-5, 8, -2], [5, 8, -2]], [[0, 10, 4], [0, 10, -4]],
      [[-14, 0, -15], [-8, 0, -15]], [[8, 0, -16], [14, 0, -16]],
    ];
    var pts = [];
    positions.forEach(function (seg) {
      pts.push(new THREE.Vector3(seg[0][0], seg[0][1], seg[0][2]));
      pts.push(new THREE.Vector3(seg[1][0], seg[1][1], seg[1][2]));
    });
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: 0x1e40af, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.LineSegments(geo, mat));
  }());

  /* ════════════════════════════════════════════════════════
     SCROLL LOGIC
  ════════════════════════════════════════════════════════ */
  function updateScroll() {
    scrollY = window.scrollY;
    var maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollP = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

    /* Update progress bar */
    var fill = document.getElementById('scroll-bar');
    if (fill) fill.style.width = (scrollP * 100) + '%';

    /* Map scroll progress → waypoint */
    var sections    = 4;
    var secProgress = scrollP * (sections - 1); // 0..3
    var secIdx      = Math.min(Math.floor(secProgress), sections - 2);
    var secFrac     = secProgress - secIdx;

    var wpA = waypoints[secIdx];
    var wpB = waypoints[secIdx + 1];

    camPosTarget.lerpVectors(wpA.pos, wpB.pos, secFrac);
    camLookTarget.lerpVectors(wpA.look, wpB.look, secFrac);
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ════════════════════════════════════════════════════════
     MOUSE TRACKING
  ════════════════════════════════════════════════════════ */
  window.addEventListener('mousemove', function (e) {
    mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* ════════════════════════════════════════════════════════
     ANIMATION LOOP
  ════════════════════════════════════════════════════════ */
  function animate() {
    requestAnimationFrame(animate);

    var t  = clock.getElapsedTime();
    var dt = clock.getDelta ? 0.016 : 0.016;

    /* Smooth mouse */
    mouse.x += (mouse.nx - mouse.x) * 0.05;
    mouse.y += (mouse.ny - mouse.y) * 0.05;

    /* ── Update grid time ── */
    gridUniforms.uTime.value = t;

    /* ── Camera smooth follow ── */
    var lerpSpeed = 0.032;
    camera.position.lerp(camPosTarget, lerpSpeed);
    camera.position.x += mouse.x * 0.6;
    camera.position.y -= mouse.y * 0.3;
    camLookCurr.lerp(camLookTarget, lerpSpeed);
    camera.lookAt(camLookCurr);

    /* ── Lights breathe with mouse ── */
    pBlue.position.x   = 4 + mouse.x * 3;
    pBlue.position.y   = 4 - mouse.y * 2;
    pPurple.position.x = -10 + mouse.x * 2;

    /* ── Vault cube rotation ── */
    vaultGroup.rotation.y += 0.004;
    vaultGroup.rotation.x  = Math.sin(t * 0.25) * 0.15;
    vaultGroup.position.y  = 0.5 + Math.sin(t * 0.4) * 0.4;

    /* ── Orbit rings around cube ── */
    for (var i = 0; i < ringMeshes.length; i++) {
      var rm = ringMeshes[i];
      rm.rotateOnAxis(rm.userData.axis, rm.userData.speed * 0.012);
    }

    /* ── Vault core rings ── */
    for (var j = 0; j < coreRings.length; j++) {
      var cr = coreRings[j];
      cr.rotateOnAxis(cr.userData.axis, cr.userData.speed * 0.012);
    }

    /* ── Vault core pulse ── */
    var pulse = 0.85 + Math.sin(t * 1.8) * 0.15;
    coreMat.emissiveIntensity = pulse;
    coreGlowA.material.opacity = 0.6 + Math.sin(t * 1.2) * 0.3;
    coreGlowB.material.opacity = 0.4 + Math.sin(t * 1.5 + 1) * 0.2;
    pVault.intensity = 4 + Math.sin(t * 1.8) * 2;

    /* ── Holo panels gentle float ── */
    holoGroup.children.forEach(function (child, idx) {
      if (child.position) {
        child.position.y += Math.sin(t * 0.5 + idx * 0.8) * 0.003;
      }
    });

    /* ── Particle drift ── */
    var pPos = particleSystem.geometry.attributes.position.array;
    for (var p = 0; p < pPos.length / 3; p++) {
      pPos[p * 3]     += particleVelocities[p * 3];
      pPos[p * 3 + 1] += particleVelocities[p * 3 + 1];
      pPos[p * 3 + 2] += particleVelocities[p * 3 + 2];
      /* Wrap bounds */
      if (Math.abs(pPos[p * 3])     > 40) particleVelocities[p * 3]     *= -1;
      if (Math.abs(pPos[p * 3 + 1]) > 20) particleVelocities[p * 3 + 1] *= -1;
      if (Math.abs(pPos[p * 3 + 2]) > 40) particleVelocities[p * 3 + 2] *= -1;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  /* ════════════════════════════════════════════════════════
     RESIZE
  ════════════════════════════════════════════════════════ */
  window.addEventListener('resize', function () {
    if (window.innerWidth < 900) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ════════════════════════════════════════════════════════
     UI — Terminal typing + card reveal (always runs)
  ════════════════════════════════════════════════════════ */
  function initUI() {
    /* Terminal typing effect */
    var typed  = document.getElementById('typed-cmd');
    if (typed) {
      var cmds   = ['unity sync --team-alpha', 'unity vault seal', 'unity audit --live'];
      var cmdIdx = 0, charIdx = 0, typing = true;
      setInterval(function () {
        if (!typed) return;
        var cmd = cmds[cmdIdx];
        if (typing) {
          typed.textContent = cmd.slice(0, ++charIdx);
          if (charIdx >= cmd.length) { typing = false; }
        } else {
          typed.textContent = cmd.slice(0, --charIdx);
          if (charIdx <= 0) { typing = true; cmdIdx = (cmdIdx + 1) % cmds.length; }
        }
      }, 80);
    }

    /* Scroll-reveal for glass cards */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.glass-card, .vault-item').forEach(function (el) {
      observer.observe(el);
    });

    /* Scroll progress bar (for mobile fallback too) */
    window.addEventListener('scroll', function () {
      var maxS = document.body.scrollHeight - window.innerHeight;
      var pct  = maxS > 0 ? (window.scrollY / maxS) * 100 : 0;
      var bar  = document.getElementById('scroll-bar');
      if (bar) bar.style.width = pct + '%';
    }, { passive: true });
  }

  initUI();
  animate();

}());
