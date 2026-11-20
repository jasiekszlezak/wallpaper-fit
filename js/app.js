(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "jnl-wallpaper-fit-0.6-settings";

  const elements = {
    fileInput: $("fileInput"), dropZone: $("dropZone"), fileInfo: $("fileInfo"),
    detectInfo: $("detectInfo"), advancedDetails: $("advancedDetails"),
    phoneSelect: $("phoneSelect"), phoneSearch: $("phoneSearch"), phoneCount: $("phoneCount"),
    brandFilter: $("brandFilter"), resolutionSelect: $("resolutionSelect"),
    targetWidth: $("targetWidth"), targetHeight: $("targetHeight"),
    fitMode: $("fitMode"), scale: $("scale"), offsetX: $("offsetX"), offsetY: $("offsetY"),
    blur: $("blur"), dim: $("dim"), quality: $("quality"),
    scaleValue: $("scaleValue"), offsetXValue: $("offsetXValue"), offsetYValue: $("offsetYValue"),
    blurValue: $("blurValue"), dimValue: $("dimValue"), qualityValue: $("qualityValue"),
    wallpaperCanvas: $("wallpaperCanvas"), renderInfo: $("renderInfo"), selectedInfo: $("selectedInfo"),
    exportName: $("exportName"), exportFormat: $("exportFormat"), downloadBtn: $("downloadBtn"),
    resetBtn: $("resetBtn"), demoBtn: $("demoBtn"), detectScreenBtn: $("detectScreenBtn"),
    swapBtn: $("swapBtn"), portraitBtn: $("portraitBtn"), useDefaultBtn: $("useDefaultBtn"),
    safeZonesToggle: $("safeZonesToggle"), phoneFrame: $("phoneFrame"), readyInfo: $("readyInfo"),
    previewSection: $("previewSection"),
    tabPhones: $("tabPhones"), tabResolutions: $("tabResolutions"),
    phonesTab: $("phonesTab"), resolutionsTab: $("resolutionsTab"),
    installBanner: $("installBanner"), installBtn: $("installBtn"), installCloseBtn: $("installCloseBtn")
  };

  let image = null;
  let phones = [];
  let commonResolutions = [];
  let filteredPhones = [];
  let selectedLabel = "";
  let saveTimer = null;
  let deferredInstallPrompt = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  }

  function isLikelyMobile() {
    const ua = navigator.userAgent || "";
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const smallScreen = Math.min(screen.width, screen.height) <= 1024;
    return uaMobile || (coarse && smallScreen);
  }

  function normalizePortrait(width, height) {
    const w = Number(width), h = Number(height);
    return { width: Math.min(w, h), height: Math.max(w, h) };
  }

  function settings() {
    return {
      width: clamp(Number(elements.targetWidth.value), 240, 10000),
      height: clamp(Number(elements.targetHeight.value), 240, 10000),
      mode: elements.fitMode.value,
      scale: Number(elements.scale.value),
      offsetX: Number(elements.offsetX.value),
      offsetY: Number(elements.offsetY.value),
      blur: Number(elements.blur.value),
      dim: Number(elements.dim.value)
    };
  }

  function persistSettingsDebounced() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          width: elements.targetWidth.value,
          height: elements.targetHeight.value,
          fitMode: elements.fitMode.value,
          scale: elements.scale.value,
          offsetX: elements.offsetX.value,
          offsetY: elements.offsetY.value,
          blur: elements.blur.value,
          dim: elements.dim.value,
          quality: elements.quality.value,
          exportFormat: elements.exportFormat.value,
          selectedLabel,
          advancedOpen: elements.advancedDetails.open,
          safeZones: elements.safeZonesToggle.checked
        }));
      } catch (error) {}
    }, 120);
  }

  function restoreSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      const assign = (el, value) => { if (value !== undefined && value !== null) el.value = value; };
      assign(elements.targetWidth, s.width);
      assign(elements.targetHeight, s.height);
      assign(elements.fitMode, s.fitMode);
      assign(elements.scale, s.scale);
      assign(elements.offsetX, s.offsetX);
      assign(elements.offsetY, s.offsetY);
      assign(elements.blur, s.blur);
      assign(elements.dim, s.dim);
      assign(elements.quality, s.quality);
      assign(elements.exportFormat, s.exportFormat);
      if (s.selectedLabel) selectedLabel = s.selectedLabel;
      elements.advancedDetails.open = !!s.advancedOpen;
      elements.safeZonesToggle.checked = s.safeZones !== false;
      updateSafeZones();
      return true;
    } catch (error) {
      return false;
    }
  }

  function updateLabels() {
    elements.scaleValue.textContent = `${elements.scale.value}%`;
    elements.offsetXValue.textContent = `${elements.offsetX.value}%`;
    elements.offsetYValue.textContent = `${elements.offsetY.value}%`;
    elements.blurValue.textContent = `${elements.blur.value} px`;
    elements.dimValue.textContent = `${elements.dim.value}%`;
    elements.qualityValue.textContent = `${elements.quality.value}%`;
  }

  function updateExportName() {
    const w = elements.targetWidth.value;
    const h = elements.targetHeight.value;
    const current = elements.exportName.value.trim();
    if (!current || current.startsWith("jnl-wallpaper-fit-")) {
      elements.exportName.value = `jnl-wallpaper-fit-${w}x${h}`;
    }
  }

  function updatePhoneFrameAspect() {
    const w = Number(elements.targetWidth.value), h = Number(elements.targetHeight.value);
    if (elements.phoneFrame && w > 0 && h > 0) elements.phoneFrame.style.aspectRatio = `${w} / ${h}`;
  }

  function updateSafeZones() {
    elements.phoneFrame.classList.toggle("show-safe-zones", elements.safeZonesToggle.checked);
  }

  function setDetectMessage(kind, extra) {
    const w = elements.targetWidth.value, h = elements.targetHeight.value;
    if (kind === "mobile") {
      elements.detectInfo.textContent = `${JNLI18N.t("detected_mobile")}: ${w}×${h}. ${JNLI18N.t("detected_hint")} ${extra || ""}`;
    } else if (kind === "desktop") {
      elements.detectInfo.textContent = `${JNLI18N.t("detected_desktop")} ${w}×${h}. ${JNLI18N.t("detected_hint")}`;
    } else {
      elements.detectInfo.textContent = `${JNLI18N.t("detected_manual")}: ${w}×${h}.`;
    }
  }

  function render() {
    updateLabels();
    updateExportName();
    updatePhoneFrameAspect();
    updateSafeZones();
    const s = settings();
    elements.renderInfo.textContent = `${s.width} × ${s.height}`;
    elements.selectedInfo.textContent = selectedLabel || "";
    JNLWallpaperEngine.render(elements.wallpaperCanvas, image, s);
    persistSettingsDebounced();
  }

  function setResolution(width, height, label, messageKind = "manual", messageExtra = "") {
    const normalized = normalizePortrait(width, height);
    elements.targetWidth.value = normalized.width;
    elements.targetHeight.value = normalized.height;
    selectedLabel = label || `${normalized.width}×${normalized.height}`;
    setDetectMessage(messageKind, messageExtra);
    render();
  }

  function detectScreen(force = false) {
    const dpr = window.devicePixelRatio || 1;
    const mobile = isLikelyMobile();

    if (!mobile && !force) {
      setResolution(1080, 2408, "Default: Android FHD+ 1080×2408", "desktop");
      return;
    }

    const rawScreenW = Math.round(screen.width || window.innerWidth);
    const rawScreenH = Math.round(screen.height || window.innerHeight);
    const cssW = Math.round(window.innerWidth || rawScreenW);
    const cssH = Math.round(window.innerHeight || rawScreenH);
    let best = { width: Math.round(rawScreenW * dpr), height: Math.round(rawScreenH * dpr) };

    if (Math.max(best.width, best.height) > 5000) {
      best = { width: rawScreenW, height: rawScreenH };
    }

    const extra = `(DPR ${dpr}, viewport ${cssW}×${cssH})`;
    setResolution(best.width, best.height, `Auto: ${Math.min(best.width, best.height)}×${Math.max(best.width, best.height)}`, "mobile", extra);
  }

  function scrollToPreview() {
    window.setTimeout(() => {
      elements.previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
      elements.readyInfo.hidden = false;
    }, 180);
  }

  function loadImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      image = img;
      elements.fileInfo.textContent = `${file.name} — ${img.naturalWidth}×${img.naturalHeight}`;
      render();
      scrollToPreview();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      elements.fileInfo.textContent = JNLI18N.t("file_error");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function downloadWallpaper() {
    const mime = elements.exportFormat.value;
    const quality = Number(elements.quality.value) / 100;
    const ext = mime === "image/png" ? "png" : "jpg";
    const rawName = elements.exportName.value.trim() || "jnl-wallpaper-fit";
    const safeName = rawName.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");

    elements.wallpaperCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, mime, quality);
  }

  function resetFraming() {
    elements.scale.value = 96;
    elements.offsetX.value = 0;
    elements.offsetY.value = 0;
    elements.blur.value = 34;
    elements.dim.value = 72;
    render();
  }

  function createDemoImage() {
    const c = document.createElement("canvas");
    c.width = 1600; c.height = 900;
    const ctx = c.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, c.width, c.height);
    bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(.45, "#111827"); bg.addColorStop(1, "#78350f");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + i * 0.006})`;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(800, 420, 150 + i * 50, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 230, 150, .95)"; ctx.beginPath(); ctx.arc(800, 260, 58, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 30; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(800, 325); ctx.lineTo(800, 560); ctx.stroke();
    ctx.strokeStyle = "#bfdbfe"; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(800, 375); ctx.lineTo(670, 500); ctx.moveTo(800, 375); ctx.lineTo(930, 500); ctx.stroke();
    ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 28; ctx.beginPath(); ctx.moveTo(800, 560); ctx.lineTo(690, 810); ctx.moveTo(800, 560); ctx.lineTo(930, 810); ctx.stroke();
    ctx.fillStyle = "rgba(191, 219, 254, .92)"; ctx.beginPath(); ctx.ellipse(800, 540, 160, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(655, 805, 85, 18); ctx.fillRect(895, 805, 85, 18);
    const img = new Image();
    img.onload = () => { image = img; elements.fileInfo.textContent = "demo-wallpaper-stage.png — 1600×900"; render(); scrollToPreview(); };
    img.src = c.toDataURL("image/png");
  }

  async function initPhones() {
    const data = await JNLPhones.load();
    phones = data.phones || [];
    commonResolutions = data.common_resolutions || [];
    fillBrandFilter(); fillResolutionList(); filterPhones();
  }

  function fillBrandFilter() {
    const brands = JNLPhones.uniqueBrands(phones);
    elements.brandFilter.innerHTML = "";
    const all = document.createElement("option");
    all.value = ""; all.textContent = JNLI18N.t("all_brands");
    elements.brandFilter.appendChild(all);
    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand; option.textContent = brand;
      elements.brandFilter.appendChild(option);
    });
  }

  function fillResolutionList() {
    elements.resolutionSelect.innerHTML = "";
    commonResolutions.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index); option.textContent = JNLPhones.labelResolution(item);
      elements.resolutionSelect.appendChild(option);
    });
  }

  function filterPhones() {
    const q = elements.phoneSearch.value.trim().toLowerCase();
    const brand = elements.brandFilter.value;
    filteredPhones = phones.filter((phone) => {
      const text = `${phone.brand} ${phone.model} ${phone.width}x${phone.height} ${phone.notes || ""}`.toLowerCase();
      return (!brand || phone.brand === brand) && (!q || text.includes(q));
    });
    elements.phoneSelect.innerHTML = "";
    filteredPhones.forEach((phone, index) => {
      const option = document.createElement("option");
      option.value = String(index); option.textContent = JNLPhones.labelPhone(phone);
      elements.phoneSelect.appendChild(option);
    });
    elements.phoneCount.textContent = `${filteredPhones.length} / ${phones.length}`;
  }

  function applyPhoneSelection() {
    const phone = filteredPhones[Number(elements.phoneSelect.value)];
    if (phone) setResolution(phone.width, phone.height, JNLPhones.labelPhone(phone), "manual");
  }

  function applyResolutionSelection() {
    const item = commonResolutions[Number(elements.resolutionSelect.value)];
    if (item) setResolution(item.width, item.height, JNLPhones.labelResolution(item), "manual");
  }

  function swapDimensions() {
    const w = elements.targetWidth.value;
    elements.targetWidth.value = elements.targetHeight.value;
    elements.targetHeight.value = w;
    selectedLabel = `${elements.targetWidth.value}×${elements.targetHeight.value}`;
    setDetectMessage("manual"); render();
  }

  function forcePortrait() {
    const normalized = normalizePortrait(elements.targetWidth.value, elements.targetHeight.value);
    elements.targetWidth.value = normalized.width;
    elements.targetHeight.value = normalized.height;
    selectedLabel = `${normalized.width}×${normalized.height}`;
    setDetectMessage("manual"); render();
  }

  function useDefaultResolution() {
    setResolution(1080, 2408, "Default: Android FHD+ 1080×2408", "manual");
  }

  function activateTab(name) {
    const tabs = [
      { name: "phones", btn: elements.tabPhones, panel: elements.phonesTab },
      { name: "resolutions", btn: elements.tabResolutions, panel: elements.resolutionsTab }
    ];
    tabs.forEach((tab) => {
      const active = tab.name === name;
      tab.btn.classList.toggle("active", active);
      tab.panel.classList.toggle("active", active);
    });
  }

  function setLanguage(lang) {
    JNLI18N.setLanguage(lang);
    fillBrandFilter(); fillResolutionList(); filterPhones();
    setDetectMessage(selectedLabel.startsWith("Auto:") ? "mobile" : "manual");
  }

  function initPwa() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      elements.installBanner.hidden = false;
    });

    elements.installBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      elements.installBanner.hidden = true;
    });

    elements.installCloseBtn.addEventListener("click", () => {
      elements.installBanner.hidden = true;
    });
  }

  function bindEvents() {
    elements.fileInput.addEventListener("change", (event) => loadImageFile(event.target.files[0]));

    ["dragenter", "dragover"].forEach((name) => {
      elements.dropZone.addEventListener(name, (event) => {
        event.preventDefault(); elements.dropZone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((name) => {
      elements.dropZone.addEventListener(name, (event) => {
        event.preventDefault(); elements.dropZone.classList.remove("drag-over");
      });
    });

    elements.dropZone.addEventListener("drop", (event) => loadImageFile(event.dataTransfer.files[0]));

    elements.phoneSearch.addEventListener("input", filterPhones);
    elements.brandFilter.addEventListener("change", filterPhones);
    elements.phoneSelect.addEventListener("change", applyPhoneSelection);
    elements.phoneSelect.addEventListener("dblclick", applyPhoneSelection);
    elements.resolutionSelect.addEventListener("change", applyResolutionSelection);
    elements.resolutionSelect.addEventListener("dblclick", applyResolutionSelection);

    [
      elements.targetWidth, elements.targetHeight, elements.fitMode, elements.scale,
      elements.offsetX, elements.offsetY, elements.blur, elements.dim, elements.quality,
      elements.exportFormat
    ].forEach((el) => el.addEventListener("input", render));

    elements.targetWidth.addEventListener("change", () => setDetectMessage("manual"));
    elements.targetHeight.addEventListener("change", () => setDetectMessage("manual"));
    elements.advancedDetails.addEventListener("toggle", persistSettingsDebounced);
    elements.safeZonesToggle.addEventListener("change", render);

    elements.downloadBtn.addEventListener("click", downloadWallpaper);
    elements.resetBtn.addEventListener("click", resetFraming);
    elements.demoBtn.addEventListener("click", createDemoImage);
    elements.detectScreenBtn.addEventListener("click", () => detectScreen(true));
    elements.swapBtn.addEventListener("click", swapDimensions);
    elements.portraitBtn.addEventListener("click", forcePortrait);
    elements.useDefaultBtn.addEventListener("click", useDefaultResolution);

    elements.tabPhones.addEventListener("click", () => activateTab("phones"));
    elements.tabResolutions.addEventListener("click", () => activateTab("resolutions"));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("year").textContent = new Date().getFullYear();
    bindEvents(); initPwa(); await initPhones();
    const restored = restoreSettings();
    const requestedLanguage = new URLSearchParams(location.search).get("lang");
    const language = ["pl", "en", "it"].includes(requestedLanguage) ? requestedLanguage : "pl";
    setLanguage(language);
    document.querySelectorAll("a.pill[hreflang]").forEach(link => {
      const active = link.hreflang === language;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (!restored) detectScreen(false);
    else { setDetectMessage(selectedLabel.startsWith("Auto:") ? "mobile" : "manual"); render(); }
  });
})();
