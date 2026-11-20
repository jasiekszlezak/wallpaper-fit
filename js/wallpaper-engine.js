window.JNLWallpaperEngine = {
  drawCover(ctx, img, targetW, targetH, extraScale = 1) {
    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight) * extraScale;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);
  },

  drawContain(ctx, img, targetW, targetH, settings) {
    const safeW = targetW * 0.98;
    const safeH = targetH * 0.98;
    const baseScale = Math.min(safeW / img.naturalWidth, safeH / img.naturalHeight);
    const scale = baseScale * (settings.scale / 100);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const maxMoveX = targetW * 0.35;
    const maxMoveY = targetH * 0.35;
    const x = (targetW - w) / 2 + (settings.offsetX / 100) * maxMoveX;
    const y = (targetH - h) / 2 + (settings.offsetY / 100) * maxMoveY;
    ctx.drawImage(img, x, y, w, h);
  },

  drawFillCrop(ctx, img, targetW, targetH, settings) {
    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight) * (settings.scale / 100);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const maxMoveX = Math.max(0, (w - targetW) / 2);
    const maxMoveY = Math.max(0, (h - targetH) / 2);
    const x = (targetW - w) / 2 + (settings.offsetX / 100) * maxMoveX;
    const y = (targetH - h) / 2 + (settings.offsetY / 100) * maxMoveY;
    ctx.drawImage(img, x, y, w, h);
  },

  averageColor(img) {
    const c = document.createElement("canvas");
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
  },

  render(canvas, img, settings) {
    const targetW = Number(settings.width);
    const targetH = Number(settings.height);
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.aspectRatio = `${targetW} / ${targetH}`;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, targetW, targetH);

    if (!img) {
      const grd = ctx.createLinearGradient(0, 0, targetW, targetH);
      grd.addColorStop(0, "#1d4ed8");
      grd.addColorStop(0.5, "#111827");
      grd.addColorStop(1, "#0f766e");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.fillStyle = "rgba(255,255,255,.88)";
      ctx.font = `${Math.round(targetW * 0.055)}px system-ui, Segoe UI, Arial`;
      ctx.textAlign = "center";
      ctx.fillText("JNL Wallpaper Fit", targetW / 2, targetH / 2);
      return;
    }

    if (settings.mode === "fillCrop") {
      this.drawFillCrop(ctx, img, targetW, targetH, settings);
      return;
    }

    if (settings.mode === "fitColor") {
      ctx.fillStyle = this.averageColor(img);
      ctx.fillRect(0, 0, targetW, targetH);
      this.drawContain(ctx, img, targetW, targetH, settings);
      return;
    }

    ctx.save();
    ctx.filter = `blur(${settings.blur}px) brightness(${settings.dim / 100})`;
    this.drawCover(ctx, img, targetW, targetH, 1.12);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = Math.max(10, Math.round(targetW * 0.018));
    ctx.shadowOffsetY = Math.max(4, Math.round(targetH * 0.004));
    this.drawContain(ctx, img, targetW, targetH, settings);
    ctx.restore();
  }
};
