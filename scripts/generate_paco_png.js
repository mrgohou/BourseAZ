import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

async function generatePacoPng() {
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Clear background (transparent PNG)
  ctx.clearRect(0, 0, width, height);

  // Ground Shadow
  const groundGrad = ctx.createRadialGradient(400, 750, 20, 400, 750, 250);
  groundGrad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = groundGrad;
  ctx.beginPath();
  ctx.ellipse(400, 750, 220, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helper functions for 3D sphere/cylinder shading
  function draw3DSphere(cx, cy, r, baseColor, lightColor, darkColor) {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, darkColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. LEFT EAR (Behind)
  ctx.save();
  ctx.translate(250, 240);
  ctx.rotate(-0.2);
  // Outer Ear
  const lEarGrad = ctx.createRadialGradient(-30, -20, 10, 0, 0, 140);
  lEarGrad.addColorStop(0, '#86EFAC');
  lEarGrad.addColorStop(0.5, '#4ADE80');
  lEarGrad.addColorStop(1, '#15803D');
  ctx.fillStyle = lEarGrad;
  ctx.beginPath();
  ctx.ellipse(-110, -20, 100, 130, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Inner Pink Ear
  const lInnerGrad = ctx.createRadialGradient(-110, -20, 10, -110, -20, 90);
  lInnerGrad.addColorStop(0, '#FBCFE8');
  lInnerGrad.addColorStop(0.6, '#F472B6');
  lInnerGrad.addColorStop(1, '#BE185D');
  ctx.fillStyle = lInnerGrad;
  ctx.beginPath();
  ctx.ellipse(-110, -20, 75, 100, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. RIGHT EAR (Behind)
  ctx.save();
  ctx.translate(550, 240);
  ctx.rotate(0.2);
  // Outer Ear
  const rEarGrad = ctx.createRadialGradient(30, -20, 10, 0, 0, 140);
  rEarGrad.addColorStop(0, '#86EFAC');
  rEarGrad.addColorStop(0.5, '#4ADE80');
  rEarGrad.addColorStop(1, '#15803D');
  ctx.fillStyle = rEarGrad;
  ctx.beginPath();
  ctx.ellipse(110, -20, 100, 130, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Inner Pink Ear
  const rInnerGrad = ctx.createRadialGradient(110, -20, 10, 110, -20, 90);
  rInnerGrad.addColorStop(0, '#FBCFE8');
  rInnerGrad.addColorStop(0.6, '#F472B6');
  rInnerGrad.addColorStop(1, '#BE185D');
  ctx.fillStyle = rInnerGrad;
  ctx.beginPath();
  ctx.ellipse(110, -20, 75, 100, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. BODY (3D Chubby Torso)
  const bodyGrad = ctx.createRadialGradient(360, 480, 20, 400, 520, 240);
  bodyGrad.addColorStop(0, '#86EFAC');
  bodyGrad.addColorStop(0.4, '#4ADE80');
  bodyGrad.addColorStop(0.8, '#22C55E');
  bodyGrad.addColorStop(1, '#15803D');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(400, 530, 175, 200, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft Belly Highlight
  const bellyGrad = ctx.createRadialGradient(400, 550, 10, 400, 550, 120);
  bellyGrad.addColorStop(0, 'rgba(187, 247, 208, 0.6)');
  bellyGrad.addColorStop(0.7, 'rgba(74, 222, 128, 0.2)');
  bellyGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(400, 550, 110, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. LEGS & FEET
  // Left Leg
  draw3DSphere(300, 690, 75, '#4ADE80', '#86EFAC', '#15803D');
  // Left Toenails
  ctx.fillStyle = '#DCFCE7';
  ctx.beginPath(); ctx.arc(265, 740, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(295, 750, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(325, 742, 14, 0, Math.PI * 2); ctx.fill();

  // Right Leg
  draw3DSphere(500, 690, 75, '#4ADE80', '#86EFAC', '#15803D');
  // Right Toenails
  ctx.fillStyle = '#DCFCE7';
  ctx.beginPath(); ctx.arc(475, 742, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(505, 750, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(535, 740, 14, 0, Math.PI * 2); ctx.fill();

  // 5. LEFT ARM (On Hip)
  ctx.save();
  ctx.translate(240, 480);
  ctx.rotate(0.3);
  const lArmGrad = ctx.createRadialGradient(-20, 0, 5, 0, 0, 70);
  lArmGrad.addColorStop(0, '#86EFAC');
  lArmGrad.addColorStop(0.6, '#4ADE80');
  lArmGrad.addColorStop(1, '#15803D');
  ctx.fillStyle = lArmGrad;
  ctx.beginPath();
  ctx.ellipse(-30, 30, 45, 80, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. RIGHT ARM (Waving 👋 High!)
  ctx.save();
  ctx.translate(560, 450);
  // Arm Stem
  const rArmGrad = ctx.createLinearGradient(0, 0, 100, -180);
  rArmGrad.addColorStop(0, '#22C55E');
  rArmGrad.addColorStop(0.5, '#4ADE80');
  rArmGrad.addColorStop(1, '#86EFAC');
  ctx.strokeStyle = rArmGrad;
  ctx.lineWidth = 85;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(60, -60, 110, -120, 80, -210);
  ctx.stroke();

  // Hand / Palm
  draw3DSphere(640 - 560, 220 - 450, 50, '#4ADE80', '#BBF7D0', '#16A34A');
  // Fingers
  draw3DSphere(600 - 560, 180 - 450, 22, '#4ADE80', '#DCFCE7', '#16A34A');
  draw3DSphere(635 - 560, 160 - 450, 22, '#4ADE80', '#DCFCE7', '#16A34A');
  draw3DSphere(675 - 560, 175 - 450, 22, '#4ADE80', '#DCFCE7', '#16A34A');
  draw3DSphere(700 - 560, 205 - 450, 20, '#4ADE80', '#DCFCE7', '#16A34A');
  ctx.restore();

  // 7. HEAD (Big Friendly 3D Sphere)
  draw3DSphere(400, 280, 185, '#4ADE80', '#BBF7D0', '#15803D');

  // Head Hair Tuft
  ctx.fillStyle = '#4ADE80';
  ctx.beginPath();
  ctx.moveTo(380, 100);
  ctx.quadraticCurveTo(395, 60, 400, 95);
  ctx.quadraticCurveTo(420, 65, 415, 102);
  ctx.fill();

  // 8. EYES (Glossy Pixar Style)
  function draw3DEye(cx, cy, radiusX, radiusY) {
    // White Sclera
    const eyeGrad = ctx.createRadialGradient(cx - radiusX * 0.3, cy - radiusY * 0.3, 5, cx, cy, radiusY);
    eyeGrad.addColorStop(0, '#FFFFFF');
    eyeGrad.addColorStop(0.85, '#F1F5F9');
    eyeGrad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris / Pupil (Deep Warm Brown)
    const irisGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, radiusX * 0.65);
    irisGrad.addColorStop(0, '#78350F');
    irisGrad.addColorStop(0.6, '#451A03');
    irisGrad.addColorStop(1, '#000000');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 3, radiusX * 0.62, radiusY * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight (Bright white 3D specular dots)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - radiusX * 0.25, cy - radiusY * 0.25, radiusX * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + radiusX * 0.2, cy + radiusY * 0.25, radiusX * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  draw3DEye(335, 245, 42, 52);
  draw3DEye(465, 245, 42, 52);

  // Eyebrows
  ctx.strokeStyle = '#180A03';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(335, 180, 45, Math.PI * 1.15, Math.PI * 1.75);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(465, 180, 45, Math.PI * 1.25, Math.PI * 1.85);
  ctx.stroke();

  // Cheeks Blush
  const blushGrad1 = ctx.createRadialGradient(280, 305, 5, 280, 305, 25);
  blushGrad1.addColorStop(0, 'rgba(244, 114, 182, 0.6)');
  blushGrad1.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = blushGrad1;
  ctx.beginPath(); ctx.arc(280, 305, 25, 0, Math.PI * 2); ctx.fill();

  const blushGrad2 = ctx.createRadialGradient(520, 305, 5, 520, 305, 25);
  blushGrad2.addColorStop(0, 'rgba(244, 114, 182, 0.6)');
  blushGrad2.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = blushGrad2;
  ctx.beginPath(); ctx.arc(520, 305, 25, 0, Math.PI * 2); ctx.fill();

  // 9. HAPPY SMILE & TONGUE
  ctx.fillStyle = '#450A0A';
  ctx.beginPath();
  ctx.moveTo(340, 310);
  ctx.quadraticCurveTo(400, 400, 460, 310);
  ctx.closePath();
  ctx.fill();

  // Tongue
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(340, 310);
  ctx.quadraticCurveTo(400, 400, 460, 310);
  ctx.closePath();
  ctx.clip();

  const tongueGrad = ctx.createLinearGradient(400, 330, 400, 390);
  tongueGrad.addColorStop(0, '#FB7185');
  tongueGrad.addColorStop(1, '#E11D48');
  ctx.fillStyle = tongueGrad;
  ctx.beginPath();
  ctx.arc(400, 375, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 10. TRUNK (Elephant Nose)
  ctx.save();
  ctx.strokeStyle = '#4ADE80';
  ctx.lineWidth = 45;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const trunkGrad = ctx.createRadialGradient(380, 280, 10, 400, 360, 120);
  trunkGrad.addColorStop(0, '#86EFAC');
  trunkGrad.addColorStop(0.5, '#4ADE80');
  trunkGrad.addColorStop(1, '#15803D');

  ctx.strokeStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(400, 275);
  ctx.bezierCurveTo(380, 340, 360, 400, 420, 410);
  ctx.bezierCurveTo(460, 415, 475, 375, 445, 345);
  ctx.bezierCurveTo(430, 330, 400, 345, 415, 365);
  ctx.stroke();

  // Snout hole detail
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.ellipse(425, 362, 10, 14, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Wrinkles on trunk
  ctx.strokeStyle = 'rgba(21, 128, 61, 0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(395, 305, 18, -0.8, 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(390, 325, 18, -0.8, 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(388, 345, 18, -0.8, 0.5); ctx.stroke();
  ctx.restore();

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: rx => true });
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'paco.png'), buffer);
  console.log('Successfully generated public/paco.png! Size:', buffer.length);
}

generatePacoPng().catch(console.error);
