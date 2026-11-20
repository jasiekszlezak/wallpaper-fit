# JNL Wallpaper Fit

[Instrukcja po polsku](README.pl.md) · [Live app](https://www.jnlsoftware.pl/tools/wallpaper-fit/)

Fit a photo to your phone screen. Crop to fill, preserve the whole picture with a blurred or solid background, or adjust the crop by hand. Preview the areas typically covered by the clock and navigation, then export a JPEG or PNG at the chosen resolution.


Wallpaper Fit is a static web app. The Canvas API processes the image locally. Device detection is an estimate and dimensions can be set manually. The service worker caches the app on HTTPS and localhost for subsequent offline visits. The interface is available in Polish, English and Italian.

## Run locally

From the repository directory, start an HTTP server:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000/) and use **Demo** or choose your own photo. For a static deployment, serve this directory over HTTPS. In GitHub Pages, select **Deploy from a branch**, then **main** and **/(root)**.

## Source

- `index.html` and `css/` — interface and styling
- `js/wallpaper-engine.js` — Canvas rendering
- `js/app.js` and `js/i18n.js` — UI, browser settings and translations
- `data/phones.json`, `manifest.webmanifest` and `service-worker.js` — device presets and PWA support

Developed by [JNL Software](https://www.jnlsoftware.pl/).
