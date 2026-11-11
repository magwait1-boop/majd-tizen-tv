# Third-party notices and asset review

## Afnon Android TV Launcher

Reference: https://github.com/egyjs/afnon-android-tv-launcher
Reviewed commit: `245cf80dc83c6b93d9eed861c1faa256405fe6b1`.
Copyright (c) 2026 egyjs and Afnon contributors. MIT; full notice in `licenses/Afnon-MIT.txt` and root LICENSE.

Adapted city coordinates and names from Android `Prefs.java`. The lapis/gold palette, Arabic prayer dashboard and arch motif are design references. The Tizen UI, navigation and application adapter were written for this project. Android package management, intents, background services and Home integration cannot be reused on Tizen. The Astro/TypeScript Web Preview is a design reference; its modern runtime was not copied into the TV widget.

## Adhan JavaScript 4.4.3

https://github.com/batoulapps/adhan-js
Copyright (c) 2016 Batoul Apps. MIT; full license in `licenses/Adhan-MIT.txt`.
Bundled by the build script for offline astronomical calculations. Package versions are pinned in package-lock.json.

## Assets

No Afnon sound recordings are redistributed: the referenced recording repositories did not establish a redistribution permission suitable for this package. No third-party image files or font binaries are included. Tahoma/Arial are system font references only, not distributed fonts. The arch is inline vector geometry written for this UI; original project attribution is retained for its design inspiration. The displayed verse is Quran 4:103, typed as text without a bundled calligraphy image or recording.

Do not add a downloaded audio recording, icon, station logo or font without recording its source and redistribution license here. Build/test tool dependencies retain their own npm package licenses and are not copied into the TV widget. The widget includes all runtime license notices.
