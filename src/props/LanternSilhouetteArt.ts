import * as THREE from 'three';
import type { LanternStyle } from './LanternIdentity';

/** Flat painted paper and bent bamboo: the same silhouette serves the craft tray and hero prop. */
export function drawLanternSilhouette(style: LanternStyle, paper: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d')!;
  c.lineJoin = 'round'; c.lineCap = 'round';

  const bamboo = style === 'star' ? '#d1a363' : '#98591f';
  const fineBamboo = '#f3cc88';
  const fill = (path: Path2D, top: string, bottom: string, line = 12,
    warmth?: { x: number; y: number; radius: number; core: string; rim: string }) => {
    if (paper) {
      const wash = warmth
        ? c.createRadialGradient(warmth.x, warmth.y, 8, warmth.x, warmth.y, warmth.radius)
        : c.createLinearGradient(105, 105, 430, 410);
      if (warmth) {
        wash.addColorStop(0, warmth.core);
        wash.addColorStop(.48, top);
        wash.addColorStop(1, warmth.rim);
      } else {
        wash.addColorStop(0, top); wash.addColorStop(1, bottom);
      }
      c.fillStyle = wash; c.fill(path);
    }
    // The shaped lantern has separate frame and paper planes. Painting bamboo
    // into both textures doubled the contour and veiled the cellophane color.
    if (!paper || style === 'star') {
      c.strokeStyle = bamboo; c.lineWidth = style === 'star' ? line : line * .5; c.stroke(path);
      if (style === 'star') {
        c.strokeStyle = fineBamboo;
        c.lineWidth = Math.max(2, line * .19);
        c.stroke(path);
      }
    }
  };
  const rib = (path: Path2D, width = 6) => {
    if (paper && style !== 'star') return;
    c.strokeStyle = bamboo; c.lineWidth = style === 'star' ? width : width * .62; c.stroke(path);
    if (style === 'star') {
      c.strokeStyle = '#f3d296'; c.lineWidth = 1.3; c.stroke(path);
    }
  };
  const knot = (x: number, y: number) => {
    if (paper) return;
    c.fillStyle = '#b27635'; c.beginPath(); c.arc(x, y, 5.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8b36c'; c.beginPath(); c.arc(x - 1.5, y - 1.5, 1.5, 0, Math.PI * 2); c.fill();
  };

  if (style === 'star') {
    const star = new Path2D();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 89 : 201;
      const x = 256 + Math.cos(a) * r, y = 262 + Math.sin(a) * r;
      if (!i) star.moveTo(x, y); else star.lineTo(x, y);
    }
    star.closePath(); fill(star, '#f79b58', '#d44438', 13);
    const hoop = new Path2D(); hoop.arc(256, 262, 80, 0, Math.PI * 2);
    rib(hoop, 7);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const p = new Path2D(); p.moveTo(256, 262);
      p.lineTo(256 + Math.cos(a) * 201, 262 + Math.sin(a) * 201); rib(p, 5);
    }
  } else if (style === 'carp') {
    const tail = new Path2D();
    tail.moveTo(145, 251); tail.bezierCurveTo(100, 222, 78, 175, 58, 154);
    tail.quadraticCurveTo(56, 233, 86, 256);
    tail.quadraticCurveTo(56, 283, 58, 361);
    tail.bezierCurveTo(84, 325, 111, 295, 150, 278); tail.closePath();
    fill(tail, '#fbbf24', '#bd5e0d', 13,
      { x: 150, y: 260, radius: 150, core: '#ffe069', rim: '#b95112' });
    const fin = new Path2D();
    fin.moveTo(176, 210); fin.quadraticCurveTo(217, 128, 270, 139);
    fin.quadraticCurveTo(291, 154, 306, 191); fin.closePath();
    fill(fin, '#f59e0b', '#b45309', 10,
      { x: 230, y: 215, radius: 115, core: '#ffd34d', rim: '#ae4815' });
    const body = new Path2D();
    body.moveTo(122, 255); body.bezierCurveTo(148, 165, 251, 158, 345, 188);
    body.quadraticCurveTo(394, 202, 440, 245);
    body.quadraticCurveTo(451, 259, 438, 272);
    body.bezierCurveTo(357, 347, 208, 363, 140, 294);
    body.quadraticCurveTo(124, 276, 122, 255); body.closePath();
    fill(body, '#e11d48', '#a91532', 15,
      { x: 255, y: 276, radius: 205, core: '#f97316', rim: '#991b2b' });
    const gill = new Path2D(); gill.moveTo(372, 202); gill.quadraticCurveTo(332, 252, 371, 300); rib(gill, 6);
    const spine = new Path2D(); spine.moveTo(153, 253); spine.quadraticCurveTo(259, 203, 354, 253); rib(spine, 5);
    const belly = new Path2D(); belly.moveTo(172, 295); belly.quadraticCurveTo(269, 322, 351, 289); rib(belly, 4);
    if (paper) {
      c.strokeStyle = 'rgba(255,194,92,.8)'; c.lineWidth = 2.3;
      for (let x = 182; x < 340; x += 35) {
        for (let y = 220; y < 304; y += 31) {
          c.beginPath(); c.arc(x + (y % 2 ? 12 : 0), y, 18, .1, 2.9); c.stroke();
        }
      }
      c.fillStyle = '#3c2a2d'; c.beginPath(); c.arc(401, 235, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff4db'; c.beginPath(); c.arc(403, 232, 2.6, 0, Math.PI * 2); c.fill();
    }
    knot(145, 250); knot(438, 258);
  } else if (style === 'butterfly') {
    const wing = (right: boolean) => {
      c.save(); if (right) { c.translate(512, 0); c.scale(-1, 1); }
      const upper = new Path2D();
      upper.moveTo(255, 260); upper.bezierCurveTo(204, 211, 138, 103, 80, 107);
      upper.bezierCurveTo(48, 119, 48, 214, 91, 249);
      upper.bezierCurveTo(135, 284, 208, 281, 255, 274); upper.closePath();
      fill(upper, '#dc2626', '#9f1239', 14,
        { x: 253, y: 265, radius: 232, core: '#f97316', rim: '#9f1239' });
      const lower = new Path2D();
      lower.moveTo(253, 269); lower.bezierCurveTo(196, 284, 128, 263, 99, 286);
      lower.bezierCurveTo(76, 312, 109, 393, 154, 399);
      lower.bezierCurveTo(207, 400, 248, 332, 257, 282); lower.closePath();
      fill(lower, '#e11d48', '#97113d', 13,
        { x: 252, y: 269, radius: 193, core: '#f3731c', rim: '#97113d' });
      const ribs = [new Path2D(), new Path2D(), new Path2D()];
      ribs[0].moveTo(250, 266); ribs[0].quadraticCurveTo(139, 192, 78, 120);
      ribs[1].moveTo(244, 269); ribs[1].quadraticCurveTo(131, 246, 68, 208);
      ribs[2].moveTo(250, 282); ribs[2].quadraticCurveTo(177, 316, 146, 389);
      ribs.forEach(path => rib(path, 5));
      if (paper) {
        for (const [x, y, r] of [[115, 173, 24], [164, 225, 20], [150, 327, 18]]) {
          c.fillStyle = '#fbbf24'; c.beginPath(); c.ellipse(x, y, r, r * .66, -.35, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#ffdf83'; c.lineWidth = 2; c.stroke();
        }
      }
      c.restore();
    };
    wing(false); wing(true);
    const body = new Path2D(); body.ellipse(256, 269, 24, 105, 0, 0, Math.PI * 2);
    fill(body, '#f59e0b', '#b45309', 9,
      { x: 256, y: 269, radius: 126, core: '#ffe071', rim: '#b45309' });
    const antenna = new Path2D();
    antenna.moveTo(250, 177); antenna.quadraticCurveTo(210, 119, 191, 128);
    antenna.moveTo(262, 177); antenna.quadraticCurveTo(302, 119, 321, 128); rib(antenna, 5);
    knot(256, 260);
  } else {
    const ear = (x: number, lean: number) => {
      const outer = new Path2D();
      outer.moveTo(x - 22, 226); outer.bezierCurveTo(x - 30 + lean, 162, x - 36 + lean, 63, x - 8 + lean, 48);
      outer.bezierCurveTo(x + 22 + lean, 39, x + 31 + lean, 147, x + 24, 225); outer.closePath();
      fill(outer, '#e11d48', '#a71634', 11,
        { x, y: 219, radius: 185, core: '#f97316', rim: '#901530' });
      if (paper) {
        c.strokeStyle = '#fbbf24'; c.lineWidth = 18; c.beginPath();
        c.moveTo(x, 189); c.quadraticCurveTo(x + lean, 104, x + lean, 74); c.stroke();
        c.strokeStyle = 'rgba(255,239,171,.75)'; c.lineWidth = 3; c.beginPath();
        c.moveTo(x + 3, 186); c.quadraticCurveTo(x + lean + 3, 104, x + lean + 3, 83); c.stroke();
      }
      rib(new Path2D(`M${x} 220 Q${x + lean} 132 ${x + lean} 56`), 4);
    };
    ear(323, -16); ear(374, 10);
    const tail = new Path2D(); tail.ellipse(122, 321, 37, 39, 0, 0, Math.PI * 2);
    fill(tail, '#fbbf24', '#bd5e0d', 10,
      { x: 183, y: 331, radius: 120, core: '#ffe073', rim: '#b65d16' });
    const body = new Path2D();
    body.moveTo(129, 331); body.bezierCurveTo(143, 267, 211, 239, 285, 262);
    body.bezierCurveTo(357, 280, 376, 349, 351, 390);
    body.quadraticCurveTo(265, 425, 164, 391); body.quadraticCurveTo(112, 372, 129, 331);
    body.closePath(); fill(body, '#e11d48', '#a71634', 14,
      { x: 250, y: 339, radius: 178, core: '#f97316', rim: '#981b36' });
    if (paper) {
      // A saffron belly gives the handmade rabbit the same red-and-gold rhythm as
      // the star lantern while leaving a crimson silhouette around its edge.
      c.save(); c.clip(body);
      const bellyLight = c.createRadialGradient(258, 342, 6, 258, 342, 102);
      bellyLight.addColorStop(0, '#ffd650');
      bellyLight.addColorStop(.6, '#fbbf24');
      bellyLight.addColorStop(1, '#e88718');
      c.fillStyle = bellyLight;
      c.beginPath(); c.ellipse(258, 342, 101, 64, -.08, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ac5220'; c.lineWidth = 3; c.stroke();
      c.restore();
    }
    const head = new Path2D();
    head.moveTo(281, 252); head.bezierCurveTo(296, 208, 355, 190, 393, 217);
    head.quadraticCurveTo(420, 232, 439, 266); head.quadraticCurveTo(423, 297, 383, 311);
    head.quadraticCurveTo(333, 321, 285, 293); head.closePath();
    fill(head, '#fbbf24', '#bd5e0d', 13,
      { x: 323, y: 278, radius: 154, core: '#ffe37d', rim: '#d6781e' });
    rib(new Path2D('M166 343 Q238 294 307 308'), 5);
    rib(new Path2D('M213 263 Q250 338 218 395'), 4);
    rib(new Path2D('M289 269 Q315 323 303 408'), 4);
    rib(new Path2D('M351 217 Q364 259 383 309'), 4);
    if (paper) {
      c.fillStyle = 'rgba(214,35,64,.65)'; c.beginPath();
      c.ellipse(374, 278, 22, 14, -.18, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#a91e32'; c.beginPath(); c.arc(392, 246, 7.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#331d25'; c.beginPath(); c.arc(393, 245, 4.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c51d34'; c.beginPath(); c.moveTo(430, 265);
      c.lineTo(438, 268); c.lineTo(431, 273); c.fill();
      c.fillStyle = '#b91c36'; c.beginPath(); c.moveTo(282, 298);
      c.quadraticCurveTo(299, 316, 322, 315);
      c.quadraticCurveTo(315, 337, 301, 360);
      c.quadraticCurveTo(290, 345, 282, 320); c.closePath(); c.fill();
      c.strokeStyle = '#f0aa50'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,208,122,.8)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(290, 313); c.quadraticCurveTo(300, 326, 305, 340); c.stroke();
      c.strokeStyle = 'rgba(255,224,143,.75)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(160, 354); c.quadraticCurveTo(226, 391, 315, 376); c.stroke();
    }
    knot(143, 330); knot(348, 386);
  }
  return canvas;
}

export function createLanternArtTexture(style: LanternStyle, paper: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(drawLanternSilhouette(style, paper));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A candle wash clipped to the cut-paper silhouette, so its light lives inside the lantern. */
export function createLanternCoreTexture(style: LanternStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d')!;
  const core = style === 'rabbit' ? { x: 250, y: 338, radius: 170 }
    : style === 'carp' ? { x: 260, y: 275, radius: 190 }
      : { x: 256, y: 270, radius: 185 };
  const glow = c.createRadialGradient(core.x, core.y, 8, core.x, core.y, core.radius);
  glow.addColorStop(0, 'rgba(255,243,160,.84)');
  glow.addColorStop(.36, 'rgba(255,204,92,.38)');
  glow.addColorStop(.73, 'rgba(255,129,66,.10)');
  glow.addColorStop(1, 'rgba(255,129,66,0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, 512, 512);
  c.globalCompositeOperation = 'destination-in';
  c.drawImage(drawLanternSilhouette(style, true), 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
