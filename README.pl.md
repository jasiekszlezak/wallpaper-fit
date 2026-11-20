# JNL Wallpaper Fit

[Wersja angielska](README.md) · [Aplikacja online](https://www.jnlsoftware.pl/tools/wallpaper-fit/)

Dopasuj zdjęcie do ekranu telefonu. Wybierz kadrowanie, pełne ujęcie na rozmytym tle lub pełne ujęcie na jednolitym tle. Sprawdź strefy pod zegar i pasek nawigacji, a następnie pobierz tapetę JPG lub PNG w wybranej rozdzielczości.

Aplikacja przetwarza zdjęcie lokalnie w przeglądarce przez Canvas API. Automatycznie dobrana rozdzielczość jest podpowiedzią i można ją nadpisać. Przy uruchomieniu przez HTTPS lub localhost aplikacja zapisuje pliki potrzebne do kolejnych uruchomień offline. Interfejs jest dostępny po polsku, angielsku i włosku.

## Uruchomienie lokalne

W katalogu repozytorium uruchom:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Wejdź na [localhost:8000](http://localhost:8000/) i wybierz **Demo** albo wczytaj własne zdjęcie. Na GitHub Pages można opublikować zawartość głównego katalogu gałęzi `main`.
