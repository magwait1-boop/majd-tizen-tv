# 0.2.0 test evidence

Date: 11 November 2026. Development branch: `codex/global-location-weather`.

## Passed locally

- ES5 parsing of the final bundled widget; no runtime Node modules, async/fetch dependency or Intl timezone requirement.
- 18 offline presets × 11 methods × 12 months: finite ordered prayer times. Additional New York, London, Sydney and Jakarta cases and a polar-season unavailable-time case.
- IANA timezone transitions for Cairo, London and New York; fractional-hour Kolkata/Kathmandu offsets; date rollover independent of PC timezone.
- Existing v0.1 city, method, theme and ordered favorites migrate without automatically granting any network consent.
- Browser tests: every service remains uncalled until consent; city result requires confirmation; an IP proposal can be cancelled without replacing the saved location; failed network retains explicitly stale weather and a working countdown; English/Arabic interface and original favorite/remote interactions.
- Real desktop Chromium XHR requests to GeoNames/Open-Meteo geocoding, Open-Meteo forecast and IP.SB returned HTTP 200 and readable JSON. This verifies desktop HTTPS/CORS only, not the TV's TLS stack.

## Independent prayer comparison

Coordinates of public city centers; 11 November 2026; Shafi Asr; no manual corrections. References and exact parameters are committed in `tests/prayer-reference.json`. Values below are **MAJD TV minus AlAdhan**, minutes.

| City / method | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---:|---:|---:|---:|---:|---:|
| Riyadh / Umm al-Qura | 0 | 0 | 0 | -1 | 0 | 0 |
| Cairo / Egyptian | 0 | 0 | +1 | -1 | 0 | 0 |

Differences are consistent with algorithm/rounding conventions in this sample. The sample is not global certification. Official local schedules can include offsets or different conventions. The UI supports ±60-minute per-time corrections and explicitly asks users to compare locally. Polar missing events display unavailable values rather than fabricated times.

## Hardware gate

The existing v0.1 app was installed and launched on Samsung UA49MU7350 / Tizen 3.0. That evidence does not prove the new version. For v0.2, real-TV installation, settings preservation, service HTTPS/CORS, Arabic/English input, weather display and radio sound are pending a connected television. No release is marked hardware-tested until those results are available. The TV previously reported system logging disabled; use official web inspection where supported and the in-app service status screen.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run preview
# separate terminal, with installed Playwright Chromium or CHROME_PATH:
node tests/browser.mjs
node tests/services-browser.mjs
```

Tests use public-city fixtures and mocked service responses. They do not query the developer's real IP. Live checks are separate, consented actions; their private results stay in `.local/`.
