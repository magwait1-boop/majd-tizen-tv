# Changelog

## 0.2.1 — redesigned home screen (device test)

- Refined the Arabic home screen for 1080p with a navy/gold palette, larger clock and prayer tiles, simplified weather, and a locally bundled Quran verse.
- Bundled Cairo and Amiri under OFL 1.1; retained Tizen 3.0 ES5 build and existing application identity.
- Device update test in progress; no claim of successful hardware verification until launch is confirmed.

## 0.2.0 — global location and weather (development)

- Separate consent for IP.SB location, Open-Meteo/GeoNames search, weather and radio; confirm every new location before saving.
- Worldwide Arabic/English city search, offline coordinate entry and IANA timezone selection; optional daily IP suggestions.
- Bundled Moment Timezone data with offline DST, 11 prayer methods, country suggestions and per-time minute corrections.
- Open-Meteo temperature, feels-like, humidity, wind, high/low and near-term forecast; 45-minute visible refresh with explicit stale-cache state.
- Arabic/English interface and Celsius/Fahrenheit preferences; migrate original city and favorites.
- MP3Quran directory and HTTPS Quran radio player; explicit playback and stop-on-hide, no bundled recordings.
- Added consent/offline/migration/DST tests and independent AlAdhan comparison fixtures.
- Hardware test and release gate remain open; see `docs/testing-v020.md`.

## 0.1.0 — initial preview

- Independent SDK-generated application identity and MAJD TV branding.
- Arabic RTL 1080p dashboard with Gregorian/arithmetic Hijri dates and offline prayers.
- Saudi/Egyptian cities, four calculation methods, Asr and time-offset settings.
- Official Tizen installed-app discovery/launch, persistent ordered favorites and night mode.
- Remote directional navigation, OK and Back; preserve focus after preference changes.
- Experimental official HDMI source selection and visible-only prayer notice.
- ES5 bundle checks, calculation invariants and browser interaction tests.
- No background services, system Home changes, unlicensed recordings or bundled external fonts.
- Official Samsung SDK installation and launch accepted on UA49MU7350 / Tizen 3.0 on 2026-11-11; physical confirmation pending.
- Fixed RTL stage positioning when the TV viewport scales to 1280×720; regression tested at both resolutions.

Hardware evidence is maintained in `docs/compatibility.md`; this entry is not a declaration that physical tests have passed.
