/* Samaksh Travels — scroll-driven 3D stage (Three.js r128, all models are procedural) */
(function () {
  'use strict';
  var root = document.documentElement;
  var canvas = document.getElementById('scene');

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  if (!window.THREE || !canvas || !webglOK()) {
    root.classList.add('no3d', 'still');
    window.SamakshScene = null;
    return;
  }

  var THREE = window.THREE;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.innerWidth < 900;
  var FOG = 0x06080b;

  /* ---------- renderer / scene / camera ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, powerPreference: 'high-performance', preserveDrawingBuffer: /[?&]debug/.test(location.search) });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG);
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x20150a, 0.42));
  var key = new THREE.DirectionalLight(0xffd0a0, 1.55); key.position.set(-6, 9, 9); scene.add(key);
  var rim = new THREE.DirectionalLight(0x7fb7d9, 1.7); rim.position.set(9, 3, -7); scene.add(rim);
  var fill = new THREE.PointLight(0xf2a950, 0.5, 40); fill.position.set(0, -2, 8); scene.add(fill);

  /* ---------- terrain (GPU displaced wireframe mountains, flows with scroll) ---------- */
  var uniforms = {
    uOffset: { value: 0 },
    uLow: { value: new THREE.Color(0x3d7298) },
    uHigh: { value: new THREE.Color(0xf2a950) },
    uFog: { value: new THREE.Color(FOG) },
    uSolid: { value: 0 }
  };
  var VERT = [
    'uniform float uOffset; uniform vec3 uLow; uniform vec3 uHigh;',
    'varying vec3 vColor; varying float vFade;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float ridge(vec2 p){float v=0.,a=.55;for(int i=0;i<5;i++){float n=1.-abs(2.*noise(p)-1.);v+=a*n*n;p=p*2.07+vec2(17.1,9.3);a*=.5;}return v;}',
    'void main(){',
    ' vec3 p=position;',
    ' vec2 q=vec2(p.x,p.z-uOffset)*0.032;',
    ' float h=ridge(q);',
    ' float valley=smoothstep(4.,34.,abs(p.x));',
    ' float y=mix(0.,h,valley*.9+.1)*26.-12.;',
    ' p.y=y;',
    ' vec4 mv=modelViewMatrix*vec4(p,1.);',
    ' gl_Position=projectionMatrix*mv;',
    ' vFade=1.-smoothstep(80.,230.,-mv.z);',
    ' float t=clamp((y+12.)/22.,0.,1.);',
    ' vColor=mix(uLow,uHigh,pow(t,1.5));',
    '}'
  ].join('\n');
  var FRAG = [
    'uniform vec3 uFog; uniform float uSolid;',
    'varying vec3 vColor; varying float vFade;',
    'void main(){',
    ' vec3 c=uSolid>.5? uFog*1.2+vColor*.05 : vColor*1.55;',
    ' gl_FragColor=vec4(mix(uFog,c,vFade),1.);',
    '}'
  ].join('\n');

  var seg = mobile ? 90 : 170;
  var tGeo = new THREE.PlaneGeometry(240, 280, seg, seg);
  tGeo.rotateX(-Math.PI / 2);
  function terrainMat(solid) {
    var u = {};
    for (var k in uniforms) u[k] = uniforms[k];
    u.uSolid = { value: solid ? 1 : 0 };
    return new THREE.ShaderMaterial({
      uniforms: u, vertexShader: VERT, fragmentShader: FRAG, wireframe: !solid,
      polygonOffset: solid, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
  }
  var terrain = new THREE.Group();
  terrain.add(new THREE.Mesh(tGeo, terrainMat(true)));
  terrain.add(new THREE.Mesh(tGeo, terrainMat(false)));
  terrain.position.set(0, 0, -110);
  terrain.children.forEach(function (m) { m.frustumCulled = false; });
  scene.add(terrain);

  /* sun glow + stars */
  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,196,120,.95)'); gr.addColorStop(.2, 'rgba(242,150,70,.5)');
    gr.addColorStop(.55, 'rgba(230,100,50,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, toneMapped: false }));
  sun.scale.set(220, 220, 1); sun.position.set(26, 18, -250); scene.add(sun);

  var starN = mobile ? 250 : 600, sp = new Float32Array(starN * 3);
  for (var s = 0; s < starN; s++) {
    var th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.85 + 0.12);
    sp[s * 3] = 380 * Math.sin(ph) * Math.cos(th); sp[s * 3 + 1] = 380 * Math.cos(ph); sp[s * 3 + 2] = -380 * Math.abs(Math.sin(ph) * Math.sin(th)) - 20;
  }
  var sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  var stars = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xa8bdd3, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.65, fog: false }));
  scene.add(stars);

  /* ---------- procedural vehicle models (nose points to +x) ---------- */
  var M = {
    body: new THREE.MeshStandardMaterial({ color: 0xd9dfe7, roughness: 0.38, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14181e, roughness: 0.55, metalness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2a3a, roughness: 0.15, metalness: 0.7 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xf2a950, roughness: 0.42, metalness: 0.2 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xfff1c9 }),
    win: new THREE.MeshBasicMaterial({ color: 0xffc878, toneMapped: false }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8b95a1, roughness: 0.35, metalness: 0.8 }),
    green: new THREE.MeshStandardMaterial({ color: 0x1d3a2c, roughness: 0.8, metalness: 0 })
  };
  function mesh(geo, mat, x, y, z) { var o = new THREE.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); return o; }
  function box(w, h, d, m, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z); }
  function cyl(rt, rb, h, m, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), m); }
  function shape(pts) { var s = new THREE.Shape(); pts.forEach(function (p, i) { i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }); return s; }
  /* side profile (x,y) extruded sideways, centred on z=0 */
  function profile(pts, depth, mat, bevel) {
    bevel = bevel === undefined ? 0.07 : bevel;
    var d = depth - bevel * 2;
    var g = new THREE.ExtrudeGeometry(shape(pts), { depth: d, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, 0, -d / 2);
    return new THREE.Mesh(g, mat);
  }
  function wheel(r, w) {
    var g = new THREE.Group();
    var t = cyl(r, r, w, M.dark, 28); t.rotation.x = Math.PI / 2;
    var h = cyl(r * 0.55, r * 0.55, w * 1.05, M.steel, 20); h.rotation.x = Math.PI / 2;
    g.add(t, h); return g;
  }
  function normalise(g, size, vertical) {
    var b = new THREE.Box3().setFromObject(g), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    g.position.sub(c);
    var w = new THREE.Group(); w.add(g);
    w.scale.setScalar(size / (vertical ? sz.y : Math.max(sz.x, sz.z)));
    return w;
  }

  function buildPlane() {
    var g = new THREE.Group();
    /* fuselage: slender body, rounded nose, long tapered tail */
    var prof = [], y;
    for (y = -6.4; y <= 6.2; y += 0.2) {
      var r = 1;
      if (y > 3.8) r = Math.sqrt(Math.max(0, 1 - Math.pow((y - 3.8) / 2.4, 2))) * 0.98 + 0.02;
      else if (y < -2.2) r = 1 - 0.86 * Math.pow((-2.2 - y) / 4.2, 1.5);
      prof.push(new THREE.Vector2(Math.max(0.03, r), y));
    }
    var fg = new THREE.LatheGeometry(prof, 48); fg.rotateZ(-Math.PI / 2);
    g.add(new THREE.Mesh(fg, M.body));
    /* grey belly (lower half, a hair larger) */
    var bp = prof.map(function (p) { return new THREE.Vector2(p.x * 1.004, p.y); });
    var bg = new THREE.LatheGeometry(bp, 48, 0, Math.PI); bg.rotateZ(-Math.PI / 2);
    var belly = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: 0x8e99a6, roughness: 0.5, metalness: 0.3 }));
    belly.scale.set(1, 0.96, 0.96); belly.position.y = -0.04; g.add(belly);
    function wing(pts, thick, mat) {
      var geo = new THREE.ExtrudeGeometry(shape(pts), { depth: thick, bevelEnabled: false }); geo.rotateX(Math.PI / 2);
      return new THREE.Mesh(geo, mat || M.body);
    }
    [1, -1].forEach(function (side) {
      /* main wing, swept, with winglet */
      var w = wing([[2.2, .9], [-2.6, 7.4], [-3.6, 7.4], [-2.1, .9]], .16); w.position.y = -.5; w.scale.z = side; g.add(w);
      var wl = new THREE.ExtrudeGeometry(shape([[-2.6, 0], [-3.9, 1.7], [-4.3, 1.7], [-3.5, 0]]), { depth: .08, bevelEnabled: false });
      wl.translate(0, 0, -.04); var wlm = new THREE.Mesh(wl, M.accent); wlm.position.set(0, -.5, side * 7.42); wlm.rotation.x = side * .12; g.add(wlm);
      /* control-surface lines */
      g.add(box(.05, .02, 2.6, M.dark, -1.9 - 0 , -.40, side * 2.6), box(.05, .02, 2.4, M.dark, -2.9, -.40, side * 5.8));
      /* tailplane */
      var st = wing([[-4.3, .4], [-6, 3.2], [-6.8, 3.2], [-5.6, .4]], .1); st.position.y = .55; st.scale.z = side; g.add(st);
      /* engine: nacelle, fan lip, fan, exhaust, pylon */
      var ex = side * 2.9;
      var nac = cyl(.62, .5, 2.3, M.steel, 36); nac.rotation.z = Math.PI / 2; nac.position.set(.9, -1.35, ex); g.add(nac);
      var lip = mesh(new THREE.TorusGeometry(.6, .06, 12, 36), M.body, 2.05, -1.35, ex); lip.rotation.y = Math.PI / 2; g.add(lip);
      var fan = cyl(.55, .55, .05, M.dark, 36); fan.rotation.z = Math.PI / 2; fan.position.set(2.0, -1.35, ex); g.add(fan);
      var hub = mesh(new THREE.SphereGeometry(.17, 16, 12), M.steel, 2.05, -1.35, ex); g.add(hub);
      var exh = mesh(new THREE.ConeGeometry(.34, .8, 24), M.dark, -.6, -1.35, ex); exh.rotation.z = Math.PI / 2; g.add(exh);
      g.add(box(1.8, .55, .12, M.body, .9, -.9, ex));
      /* cabin windows + cockpit */
      for (var i = 0; i < 20; i++) g.add(box(.2, .26, .05, M.glass, -3.6 + i * .42, .42, side * (Math.sqrt(1 - .0) * .975)));
      g.add(box(.7, .3, .05, M.glass, 4.55, .38, side * .72));
      g.add(box(.3, .06, .05, M.accent, 4.2, .08, side * .98));
    });
    /* cheat line + door outline */
    var cl = new THREE.Mesh(new THREE.CylinderGeometry(1.012, 1.012, 9.6, 48, 1, true), M.accent);
    cl.visible = false;
    /* vertical stabiliser + livery */
    var fin = new THREE.ExtrudeGeometry(shape([[-4.0, .9], [-5.9, 4.8], [-6.7, 4.8], [-6.2, .9]]), { depth: .14, bevelEnabled: false });
    fin.translate(0, 0, -.07); g.add(new THREE.Mesh(fin, M.accent));
    g.add(box(.9, .04, .04, M.dark, -5.9, 4.8, 0));
    g.add(mesh(new THREE.SphereGeometry(.28, 16, 12), M.dark, 6.15, 0, 0)); /* radome tip */
    g.add(box(.5, .1, 2.0, M.glass, 5.3, .62, 0)); /* windshield */
    return normalise(g, 7.6);
  }

  function roundRect(w, y0, y1, rt, rb) {
    var s = new THREE.Shape(), x = w / 2;
    s.moveTo(-x + rb, y0); s.lineTo(x - rb, y0); s.quadraticCurveTo(x, y0, x, y0 + rb); s.lineTo(x, y1 - rt);
    s.quadraticCurveTo(x, y1, x - rt, y1); s.lineTo(-x + rt, y1); s.quadraticCurveTo(-x, y1, -x, y1 - rt);
    s.lineTo(-x, y0 + rb); s.quadraticCurveTo(-x, y0, -x + rb, y0); return s;
  }

  function buildTrain() {
    var g = new THREE.Group(), L = 5.2, GAP = .3, Y0 = .8, Y1 = 3.3, W = 2.3, yc = (Y0 + Y1) / 2;
    var carGeo = new THREE.ExtrudeGeometry(roundRect(W, Y0, Y1, .95, .15), { depth: L, bevelEnabled: false, curveSegments: 12 });
    carGeo.rotateY(Math.PI / 2); carGeo.translate(-L / 2, 0, 0);
    var skirtM = new THREE.MeshStandardMaterial({ color: 0x20262e, roughness: .6, metalness: .4 });
    var centers = [0, -(L + GAP)];
    centers.forEach(function (cx, ci) {
      var car = new THREE.Mesh(carGeo, M.body); car.position.x = cx; g.add(car);
      g.add(box(L - .3, .42, W - .15, skirtM, cx, Y0 - .05, 0));
      g.add(box(L - .6, .1, 1.1, M.steel, cx, Y1 + .02, 0)); /* roof AC */
      [1, -1].forEach(function (s) {
        for (var k = 0; k < 4; k++) g.add(box(.82, .62, .06, M.glass, cx - 1.65 + k * 1.1 + (ci ? .0 : -.25), 2.55, s * (W / 2 + .005)));
        g.add(box(L - .1, .16, .05, M.accent, cx, 1.62, s * (W / 2 + .005)));
        g.add(box(L - .1, .05, .05, M.accent, cx, 1.35, s * (W / 2 + .005)));
        g.add(box(.7, 1.6, .05, M.steel, cx + L / 2 - .7, 2.0, s * (W / 2 + .006))); /* door */
        [-1.8, 1.8].forEach(function (bx) {
          [-.78, .78].forEach(function (bz) { var w = wheel(.42, .14); w.position.set(cx + bx, .62, bz); g.add(w); });
          g.add(box(.5, .25, 1.5, skirtM, cx + bx, .66, 0));
        });
      });
    });
    /* streamlined noses at both ends */
    function nose(x, dir) {
      var n = mesh(new THREE.SphereGeometry(1, 48, 28), M.body, x + dir * 0, yc, 0);
      n.scale.set(2.9, (Y1 - Y0) / 2, W / 2); g.add(n);
      var vis = mesh(new THREE.SphereGeometry(1, 32, 18), M.glass, x + dir * 1.35, yc + .55, 0);
      vis.scale.set(1.35, .55, W / 2 - .12); g.add(vis);
      g.add(box(.08, .14, .8, M.glow, x + dir * 2.8, yc - .45, 0));
      g.add(box(.12, .22, 1.6, M.accent, x + dir * 2.55, yc - .75, 0));
      [1, -1].forEach(function (s) { g.add(box(.08, .12, .24, M.glow, x + dir * 2.7, yc - .55, s * .75)); });
    }
    nose(L / 2, 1); nose(centers[1] - L / 2, -1);
    /* pantograph */
    var pc = centers[1];
    g.add(box(.9, .08, .6, M.dark, pc, Y1 + .12, 0));
    [1, -1].forEach(function (s) { var a = box(.05, .05, 1.2, M.steel, pc - .1, Y1 + .55, s * .0); a.rotation.z = s * .0; a.scale.set(1, 1, 1); });
    var arm1 = box(.06, 1.0, .06, M.steel, pc - .25, Y1 + .6, .25); arm1.rotation.z = .5; g.add(arm1);
    var arm2 = box(.06, 1.0, .06, M.steel, pc - .25, Y1 + .6, -.25); arm2.rotation.z = .5; g.add(arm2);
    g.add(box(.7, .05, .06, M.dark, pc - .5, Y1 + 1.05, 0));
    /* track: ballast, sleepers, rails */
    var tl = 30;
    g.add(box(tl, .14, 3.6, new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 1 }), -2.6, .0, 0));
    for (var i = -18; i <= 18; i++) g.add(box(.28, .1, 2.8, M.dark, i * .85 - 2.6, .1, 0));
    g.add(box(tl, .14, .13, M.steel, -2.6, .22, .76), box(tl, .14, .13, M.steel, -2.6, .22, -.76));
    return normalise(g, 7.4);
  }

  function buildHeli() {
    var g = new THREE.Group();
    var cab = mesh(new THREE.SphereGeometry(1, 36, 24), M.accent); cab.scale.set(2.4, 1.35, 1.25); g.add(cab);
    var lower = mesh(new THREE.SphereGeometry(1, 36, 24), M.body); lower.scale.set(2.35, .9, 1.22); lower.position.y = -.35; g.add(lower);
    var glass = mesh(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * .62), M.glass); glass.scale.set(1.25, 1.1, 1.08); glass.position.set(1.15, .15, 0); g.add(glass);
    var boom = cyl(.14, .5, 5.2, M.body, 20); boom.rotation.z = Math.PI / 2; boom.position.set(-4.2, .35, 0); g.add(boom);
    var fin = box(.9, 1.6, .1, M.accent, -6.6, .95, 0); fin.rotation.z = .35; g.add(fin);
    var hs = box(.9, .08, 1.5, M.body, -6.1, .4, 0); g.add(hs);
    var mast = cyl(.12, .16, .7, M.dark, 12); mast.position.y = 1.5; g.add(mast);
    var rotor = new THREE.Group(); rotor.position.y = 1.9; rotor.name = 'rotor';
    for (var i = 0; i < 4; i++) { var b = box(7, .05, .3, M.dark, 0, 0, 0); b.position.x = 0; b.rotation.y = i * Math.PI / 2; rotor.add(b); }
    rotor.add(cyl(.22, .22, .12, M.steel, 16)); g.add(rotor);
    var tr = new THREE.Group(); tr.position.set(-6.7, 1.2, .15); tr.name = 'tail';
    for (var j = 0; j < 2; j++) { var tb = box(.08, 1.3, .12, M.dark, 0, 0, 0); tb.rotation.x = j * Math.PI / 2; tr.add(tb); } g.add(tr);
    [1, -1].forEach(function (s) {
      var sk = cyl(.07, .07, 4.2, M.steel, 10); sk.rotation.z = Math.PI / 2; sk.position.set(.4, -1.85, s * 1.1); g.add(sk);
      var nose = cyl(.07, .07, .9, M.steel, 10); nose.rotation.z = Math.PI / 2 - .5; nose.position.set(2.7, -1.65, s * 1.1); g.add(nose);
      [1.4, -.8].forEach(function (x) { var st = cyl(.06, .06, 1.1, M.steel, 8); st.position.set(x, -1.3, s * 1.0); st.rotation.x = s * .25; g.add(st); });
      g.add(box(1.2, .5, .06, M.glass, -.4, .1, s * 1.2));
      g.add(box(2.6, .08, .06, M.body, -.4, -.5, s * 1.19));
    });
    var w = normalise(g, 9.5); w.userData.rotor = rotor; w.userData.tail = tr; return w;
  }

  function buildCab() {
    var g = new THREE.Group();
    g.add(profile([[-3.3, .55], [-3.3, 1.55], [-2.9, 1.7], [-2.5, 2.55], [.7, 2.55], [1.8, 1.75], [3.1, 1.6], [3.4, 1.1], [3.3, .55]], 2.1, M.body, .09));
    g.add(profile([[-2.2, 1.78], [-2.2, 2.4], [.55, 2.4], [1.45, 1.78]], 2.16, M.glass, 0));
    [1, -1].forEach(function (s) {
      [-2.1, 2.1].forEach(function (x) { var w = wheel(.52, .38); w.position.set(x, .52, s * 1.02); g.add(w); });
      g.add(box(.12, .26, .5, M.glow, 3.4, 1.15, s * .75));
      g.add(box(.1, .22, .4, M.accent, -3.35, 1.35, s * .8));
      g.add(box(6.4, .1, .05, M.accent, 0, 1.05, s * 1.075));
    });
    g.add(box(.08, .1, 1.3, M.dark, 3.38, .75, 0));
    var rack = box(3.6, .08, 1.6, M.dark, -.9, 2.66, 0); g.add(rack);
    return normalise(g, 9);
  }

  function buildTempo() {
    var g = new THREE.Group();
    g.add(profile([[-4.6, .6], [-4.6, 3.3], [3.5, 3.3], [4.6, 2.3], [4.6, .6]], 2.4, M.body, .1));
    g.add(profile([[-4.2, 1.8], [-4.2, 2.95], [3.3, 2.95], [4.1, 2.25], [4.1, 1.8]], 2.46, M.glass, 0));
    [1, -1].forEach(function (s) {
      [-2.9, 2.7].forEach(function (x) { var w = wheel(.58, .4); w.position.set(x, .58, s * 1.12); g.add(w); });
      g.add(box(9, .12, .05, M.accent, -.2, 1.4, s * 1.225));
      g.add(box(.12, .3, .6, M.glow, 4.62, 1.1, s * .8));
      for (var i = 0; i < 6; i++) g.add(box(.05, 1.15, .06, M.body, -3.4 + i * 1.3, 2.38, s * 1.23));
    });
    g.add(box(.1, .14, 1.7, M.dark, 4.62, .72, 0));
    g.add(box(4.2, .1, 1.6, M.dark, -.6, 3.4, 0));
    return normalise(g, 9.6);
  }

  function buildHotel() {
    var g = new THREE.Group();
    g.add(box(7.4, 1.3, 5, M.body, 0, .65, 0));
    g.add(box(4.6, 6.4, 3.4, M.body, -.4, 4.5, 0));
    g.add(box(4.9, .22, 3.7, M.accent, -.4, 7.8, 0));
    g.add(box(3.2, .12, 2.2, M.dark, 2.6, 1.34, 0));
    var cano = box(3.2, .16, 2.4, M.accent, 3.2, 1.45, 1.4); g.add(cano);
    g.add(box(2.0, 1.0, .08, M.glass, 3.6, .55, 2.52));
    var sign = box(2.6, .5, .12, M.accent, -.4, 8.3, 0); g.add(sign);
    /* lit windows */
    var wg = new THREE.PlaneGeometry(.42, .5), wm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), n = 0;
    var cols = 6, rows = 9, inst = new THREE.InstancedMesh(wg, wm, cols * rows * 2 + 40), dm = new THREE.Object3D(), col = new THREE.Color();
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      [1, -1].forEach(function (f) {
        dm.position.set(-.4 - 2 + c * .8 + .1, 2.1 + r * .66, f * 1.71); dm.rotation.y = f > 0 ? 0 : Math.PI; dm.updateMatrix();
        inst.setMatrixAt(n, dm.matrix);
        col.setHex(Math.random() > .4 ? 0xff9f3a : 0x16202b); inst.setColorAt(n, col); n++;
      });
    }
    inst.count = n; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    g.add(inst);
    var ground = box(10, .12, 7.6, M.dark, 0, -.02, 0); g.add(ground);
    return normalise(g, 7.6, true);
  }

  var vehicles = [buildPlane(), buildTrain(), buildHeli(), buildCab(), buildTempo(), buildHotel()];
  var N = vehicles.length;
  var stage = new THREE.Group(); scene.add(stage);
  vehicles.forEach(function (v) { v.visible = false; stage.add(v); });

  /* hero plane (second instance, flies away as you scroll) */
  var heroPlane = new THREE.Group(), heroInner = buildPlane();
  heroInner.rotation.y = -Math.PI / 2; heroInner.scale.multiplyScalar(0.75);
  heroPlane.add(heroInner); scene.add(heroPlane);

  /* palette per chapter */
  var PAL = [0xf2a950, 0xe9857a, 0xf0c36a, 0x6fc3d9, 0x9bb0f2, 0xf2a950].map(function (h) { return new THREE.Color(h); });
  var HERO_PAL = new THREE.Color(0xf2a950);

  /* ---------- scroll model ---------- */
  var heroEl = document.getElementById('hero'), showEl = document.getElementById('showcase');
  var geo = { heroH: 1, showTop: 1, showH: 1, vh: 1, vw: 1 };
  function measure() {
    var sy = window.scrollY || 0;
    geo.vw = window.innerWidth; geo.vh = window.innerHeight;
    geo.heroH = heroEl.offsetHeight;
    geo.showTop = showEl.getBoundingClientRect().top + sy;
    geo.showH = showEl.offsetHeight;
  }
  function size() {
    mobile = window.innerWidth < 900;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    measure();
    dirty = true;
  }
  var dirty = true;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var mx = 0, my = 0, tmx = 0, tmy = 0;
  window.addEventListener('pointermove', function (e) { tmx = e.clientX / window.innerWidth * 2 - 1; tmy = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });
  window.addEventListener('resize', size);

  var state = { stage: 0, s: 0, visible: true };
  var api = { onStage: null, state: state };
  var lookAt = new THREE.Vector3(), camPos = new THREE.Vector3();
  var offsetBase = 0, last = 0, tintTarget = new THREE.Color();

  function frame(time) {
    if (document.hidden) return;
    var t = time / 1000, dt = Math.min(0.05, t - last || 0.016); last = t;
    var sy = window.scrollY || 0;
    var endY = geo.showTop + geo.showH;
    var onScreen = sy < endY + geo.vh * 0.2;
    state.visible = onScreen;
    if (!onScreen) return;
    if (reduce && !dirty) return;

    var heroP = clamp(sy / Math.max(1, geo.heroH - geo.vh), 0, 1);
    var transP = smooth(0, 1, clamp((sy - (geo.heroH - geo.vh) * 0.55) / Math.max(1, geo.showTop - (geo.heroH - geo.vh) * 0.55), 0, 1));
    var showP = clamp((sy - geo.showTop) / Math.max(1, geo.showH - geo.vh), 0, 1);

    if (reduce) { heroP = 0; transP = 0; showP = 0; }

    /* terrain flows with scroll + a slow idle drift */
    offsetBase += reduce ? 0 : dt * 1.6;
    uniforms.uOffset.value = sy * 0.055 + offsetBase;

    mx = lerp(mx, tmx, 0.05); my = lerp(my, tmy, 0.05);
    var par = mobile || reduce ? 0 : 1;

    /* chapter value s in [0, N-1] with dwell on each stage */
    var p = clamp((showP - 0.04) / 0.92, 0, 1) * (N - 1);
    var i0 = Math.min(N - 2, Math.floor(p)), f = smooth(0.32, 0.68, p - i0);
    var sv = i0 + f;
    state.s = sv;
    var idx = Math.round(sv);
    if (idx !== state.stage) { state.stage = idx; if (api.onStage) api.onStage(idx); }

    /* camera: hero -> showcase */
    var heroCam = { x: 0, y: lerp(2.2, 7.5, heroP), z: 21, ty: lerp(-0.5, -4, heroP), tz: -40 };
    var showCam = { x: 0, y: 1.2, z: 15.5, ty: 0.2, tz: 0 };
    var k = transP;
    camPos.set(lerp(heroCam.x, showCam.x, k) + mx * 1.2 * par, lerp(heroCam.y, showCam.y, k) - my * 0.5 * par, lerp(heroCam.z, showCam.z, k));
    lookAt.set(0, lerp(heroCam.ty, showCam.ty, k), lerp(heroCam.tz, showCam.tz, k));
    camera.position.copy(camPos); camera.lookAt(lookAt);
    camera.fov = lerp(46, 40, k); camera.updateProjectionMatrix();

    /* terrain placement: sink slightly in showcase so the vehicle owns the frame */
    terrain.position.y = lerp(0, -2.5, k);
    sun.position.y = lerp(18, 26, k);

    /* hero plane */
    var hp = heroP;
    heroPlane.visible = hp < 0.985 && k < 0.5;
    var bob = reduce ? 0 : Math.sin(t * 1.1) * 0.12;
    var narrowV = camera.aspect < 1;
    var x0 = narrowV ? 1.3 : 4.2, y0 = narrowV ? 2.5 : 0.6;
    heroPlane.scale.setScalar(narrowV ? 0.55 : 1);
    var px = lerp(x0, 12, hp), py = lerp(y0, 9, hp) + bob, pz = lerp(6, -62, hp);
    heroPlane.position.set(px, py, pz);
    lookAt.set(lerp(x0, 12, hp + .02) + 5 * (1 - hp), lerp(y0, 9, hp + .02) + .6, lerp(6, -62, hp + .02) - 6);
    heroPlane.lookAt(lookAt);
    heroPlane.rotateZ((reduce ? 0 : Math.sin(t * .8) * 0.05) - 0.28 * (1 - hp) - 0.5 * smooth(0.0, 0.5, hp) * (1 - smooth(.5, 1, hp)));
    heroPlane.rotation.order = 'YXZ';

    /* vehicles */
    var wide = geo.vw / geo.vh > 1.15;
    var visW = 2 * Math.tan(THREE.MathUtils.degToRad(40) / 2) * 15.5 * camera.aspect;
    var offX = wide ? visW * 0.21 : 0, offY = wide ? 0 : 2.5, base = wide ? Math.min(1.1, visW * 0.46 / 9) : Math.min(0.8, visW * 0.8 / 9);
    var showVisible = transP > 0.35;
    for (var i = 0; i < N; i++) {
      var v = vehicles[i], d = sv - i, ad = Math.abs(d);
      var vis = showVisible && ad < 0.99;
      v.visible = vis;
      if (!vis) continue;
      var e = Math.pow(ad, 1.6) * Math.sign(d);
      var enter = i === 0 ? smooth(0.35, 0.95, transP) : 1;
      v.position.set(offX - e * 9 * (wide ? 1 : 0.55), offY + (wide ? 0 : 0) - ad * 0.6 + (reduce ? 0 : Math.sin(t * 0.9 + i) * 0.12), -ad * 3 - (1 - enter) * 6);
      v.rotation.y = (i === 1 || i === 4 ? -0.62 : i === 5 ? 0.5 : -0.5) - d * 1.8 + (reduce ? 0 : Math.sin(t * 0.35 + i) * 0.08);
      v.rotation.z = i === 0 ? 0.08 - d * 0.1 : 0;
      v.scale.setScalar(base * (1 - 0.25 * Math.min(1, ad)) * enter);
      if (i === 2 && !reduce) { var rt = v.userData.rotor; if (rt) rt.rotation.y += dt * 24; if (v.userData.tail) v.userData.tail.rotation.x += dt * 30; }
    }
    /* chapter colour shift */
    var a = PAL[Math.floor(sv)], b = PAL[Math.min(N - 1, Math.floor(sv) + 1)];
    tintTarget.copy(a).lerp(b, sv - Math.floor(sv));
    var tint = HERO_PAL.clone().lerp(tintTarget, k);
    uniforms.uHigh.value.lerp(tint, 0.1);
    stars.rotation.y = t * 0.004;

    renderer.render(scene, camera);
    dirty = false;
    api.heroP = heroP; api.showP = showP;
  }

  api.frame = frame;
  api.measure = measure;
  api.goToStage = function (i) {
    var pn = (i / (N - 1)) * 0.92 + 0.04;
    return geo.showTop + pn * (geo.showH - geo.vh);
  };
  api.stages = N;
  api.vehicles = vehicles;
  api.invalidate = function () { dirty = true; };
  window.SamakshScene = api;

  size();
  /* first paint, then fade the canvas in */
  frame(performance.now());
  requestAnimationFrame(function () { root.classList.add('scene-on'); });
  if (reduce) root.classList.add('still');
  window.addEventListener('load', function () { measure(); dirty = true; });
})();
