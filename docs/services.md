# الخدمات والخصوصية / Services and privacy

Reviewed 11 November 2026. All services are optional. The app makes **no location, search, weather or radio request before its corresponding consent**. Preferences remain in localStorage under the original key; there is no developer server, analytics or secret client API key. A service inevitably receives the connecting public IP even when coordinates are not sent.

| Feature | Provider and data sent | Use and limitations |
|---|---|---|
| Approximate IP location | `api.ip.sb/geoip`: connecting IP and normal request metadata | Personal-use API; MaxMind/IPinfo-based estimate. No GPS, accuracy radius or accuracy guarantee. Result must be confirmed before replacing saved location. Raw IP is not stored by the app. |
| Global city search | `geocoding-api.open-meteo.com`: query text and interface language | GeoNames data; CC BY 4.0. Only submitted searches, no keystroke requests. Country/region/timezone shown to disambiguate names. Arabic translations vary; English search remains available. |
| Weather | `api.open-meteo.com`: confirmed coordinates (four decimal places), IANA timezone | Personal, non-commercial free API; CC BY 4.0 attribution. Model estimates, not guaranteed measurements. Refresh every 45 minutes while visible; failures preserve last good data and show it as cached. |
| Quran radio | `www.mp3quran.net` station directory; `qurango.net` / `backup.qurango.net` chosen stream | Connecting IP only, no location. List loads on request, audio starts only on station selection, stops when hidden. Content stays with provider; no recordings redistributed. |

Consent can be revoked individually in Settings → Consent and privacy. Revoking weather aborts an in-flight request; revoking IP disables automatic suggestions; revoking radio stops audio. IP suggestions are off by default. When enabled, at most one daily automatic proposal is made while the dashboard is visible; even then the selected location never changes without confirmation.

IP location can be wrong by a city or much more, especially with VPNs, mobile carriers and ISP gateways. Confirm the displayed city/region/coordinates. Manual coordinates and the bundled timezone selector require no network. Country-based calculation-method suggestions are conveniences, not official religious guidance.

Cached weather displays observation/model time and fetch time. Data older than one hour, a failed refresh, or a backwards clock change is marked cached/not live. Times use the selected location's timezone; the details page includes full ISO timestamps. No weather is invented on failure. The basic dashboard, clock, prayer calculation and favorites continue offline.

The bundled IANA timezone database handles DST offline. It must be updated when governments change future rules: update Moment Timezone deliberately, rerun the DST tests and rebuild. Manual coordinates require the user to choose the appropriate IANA zone; geographic borders cannot be inferred from longitude alone.

## Provider references

- [IP.SB API](https://ip.sb/api/), [personal/commercial plans](https://ip.sb/pricing/), [terms](https://ip.sb/terms-of-use/), [privacy](https://ip.sb/privacy-policy/). Commercial/production deployments must arrange the appropriate provider plan; do not embed a private key in the widget.
- [Open-Meteo terms and privacy](https://open-meteo.com/en/terms), [forecast API](https://open-meteo.com/en/docs), [GeoNames geocoding](https://open-meteo.com/en/docs/geocoding-api). Free access is for non-commercial use, with published rate limits. Attribution appears on the dashboard/details and consent screens. Commercial developers need an appropriate service arrangement outside this keyless personal build.
- [MP3Quran API](https://www.mp3quran.net/ar/api) and [provider's permission statement](https://apiquran.mp3quran.net/ar/contact-us). The provider states its site content is available for use, including commercial use. No MIT claim is made over recordings; MAJD TV only streams the provider's published endpoints.
- [AlAdhan API](https://aladhan.com/prayer-times-api) is used **only for public-city development comparison fixtures**, never called by the app. It is an independent computational reference, not proof of agreement with an official local timetable.

ipapi.co was evaluated and excluded because its free plan is for trial/development rather than deployed use. There is no silent fallback to a different location provider, HTTP endpoint or CORS proxy.
