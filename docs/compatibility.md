# Tizen 3.0 compatibility and evidence

Target: Samsung UA49MU7350 (2017), Tizen 3.0, 1920×1080. Samsung documents Chromium M47 for 2017 TVs in its [web engine table](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html).

## Implementation choices

- Bundled standalone HTML/CSS/JS, Babel ES5 transform plus Acorn ES5 parser validation. `Math.trunc` and `Math.sign` fallbacks cover the astronomy library. No modules, optional chaining, async functions, CSS grid, CSS variables or Intl-dependent calendar code reaches the TV.
- Native Arabic system fonts, flex/absolute layout and scaling from 1920×1080. No downloaded font requirement.
- [Application API](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/application-api.html) uses `getAppsInfo`/`launch`, with declared application.info/application.launch privileges. Hidden applications and this app are excluded. Discovery can be restricted by firmware; the UI handles failure.
- [TVWindow API](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/tvwindow-api.html) plus `VIDEOSOURCE` provide experimental HDMI selection. No undocumented application IDs or system writes. When a source changes, the user may still need the remote Source button to view it.
- localStorage holds preferences only; recovery handles corrupted JSON and failed writes. Favorites use application IDs and are filtered against the current catalog without deleting saved unavailable IDs.
- Four methods and 18 supported cities use Adhan 4.4.3 offline. These are astronomical calculations, not a downloaded government timetable. Egypt UTC+2/+3 is manual. Hijri is arithmetic, adjustable ±2 days, changing at sunset. Ramadan's two-hour UmmAlQura isha follows that calendar and adjustment.

## Background and audio limits

[Samsung multitasking guidance](https://developer.samsung.com/smarttv/develop/guides/fundamentals/multitasking.html) describes JavaScript pausing when an app is hidden. MAJD TV only displays prayer notices while visible and stops hidden work. It does not promise an alarm while another app is running or when the TV is off. Android alarm/background/overlay services cannot be ported as web APIs.

Recorded Adhan is omitted pending licensed audio. Quran radio is a later feature requiring permitted station endpoints and real-device TLS/codec testing. No background playback or notification claim is made.

## Evidence for this revision

| Check | Result |
|---|---|
| Standalone source build / WGT | Passed locally |
| Final bundle ES5 syntax | Passed |
| 18 cities × 4 methods × 12 months, prayer order and finite times | Passed |
| Next prayer after Isha, sunrise exclusion, Ramadan interval, Hijri boundaries | Passed |
| Chromium 1080p Arabic layout, remote focus, favorites/reorder/persistence | Passed with mocked Tizen API |
| Legacy Math fallbacks / corrupt preferences | Passed in browser tests |
| Samsung signature | Pending |
| Real UA49MU7350 install and run | Pending connection |
| Physical remote, app launch, HDMI picture | Pending owner/device checks |

Modern Chromium testing does not prove M47 compatibility. Hardware results must be recorded separately; do not promote a release to tested beta before device installation and visible checks.
