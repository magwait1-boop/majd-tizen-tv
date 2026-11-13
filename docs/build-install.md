# البناء والتثبيت والتحديث / Build, install and update

## Source build

Clone this repository alone. Install Node.js 20.19+ and run:

```sh
npm ci
npm test
npm run build
```

`dist/widget/` contains the standalone web payload; `dist/MAJD-TV-unsigned.wgt` is a ZIP widget ready for signing. `app/` is source, `scripts/` is computer-only tooling. No sibling checkout is required. Edit `app/style.css` for design, `app/dashboard.js` for behavior and `app/prayer.js` for calculations. Rebuild after edits. Run browser tests as described in README. Tests must pass before tagging a release.

## Samsung signing

Install official Tizen Studio, TV Extensions Tools and Samsung Certificate Extension. Create a Samsung **TV** profile in Certificate Manager; enter credentials in Samsung's UI, not a source file. Add your television's DUID to its distributor certificate. Use Device Manager → Permit to install applications if required. Verify certificate dates and the active CLI profile with:

```powershell
& 'C:\tizen-studio\tools\ide\bin\tizen.bat' security-profiles list
```

Use your actual SDK path and profile name. Example:

```powershell
New-Item -ItemType Directory -Force dist/signed | Out-Null
$outputDir=(Resolve-Path dist/signed).Path
$widgetPath=(Resolve-Path dist/MAJD-TV-unsigned.wgt).Path
& 'C:\tizen-studio\tools\ide\bin\tizen.bat' package -t wgt -s YOUR_TV_PROFILE -o $outputDir -- $widgetPath
node scripts/verify-package.mjs dist/signed/MAJD-TV-unsigned.wgt
```

The verifier checks archive identity, required signed entries and SHA-256/SHA-512 file digests. Installation on an authorized TV is the final signature/platform check. A successful CLI exit alone does not establish that signing occurred. Keep signed widgets private: distributor signatures can include device identifiers and certificates. Public releases should distribute source or unsigned WGT only.

## Install and run

Enable Developer Mode in TV Apps, enter the development PC address and restart as Samsung instructs. Both devices must be on the same LAN. Replace placeholders locally:

```powershell
& 'C:\tizen-studio\tools\sdb.exe' connect TV_IP:26101
& 'C:\tizen-studio\tools\sdb.exe' devices
& 'C:\tizen-studio\tools\ide\bin\tizen.bat' install -s TV_IP:26101 -n MAJD-TV-unsigned.wgt -- $outputDir
& 'C:\tizen-studio\tools\ide\bin\tizen.bat' run -s TV_IP:26101 -p SETZfpkE27.MajdTV
```

المعرّف مستقل عن CleanFrame وعن Afnon. لا تحذف التطبيقات الموجودة. لا تستعمل ADB أو تغييرات Home أو النظام. أخطاء 118 قد تتعلق بتصريح الشهادة؛ افحص رسالة المثبّت والشهادة وPermit بدل تغيير المعرف عشوائيًا.

Check the screen and remote arrows/OK/Back, change city, verify times against the chosen local authority, add/reorder two favorites, close/reopen and test launching an installed application. HDMI requires a connected source and a visual check; command acceptance is insufficient. Browser mocks are not a hardware result.

## Updates and forks

Keep `SETZfpkE27.MajdTV`, package `SETZfpkE27`, and your original author certificate for in-place MAJD TV updates. Increment widget version in `app/config.xml` and package.json, run tests/build, sign and install. Preserve the author certificate offline securely. For a separately named fork installed alongside MAJD TV, generate a fresh application identity with the Samsung SDK and update config and verifier expectations deliberately.

لا تضع كلمات المرور أو شهادات p12 أو ملفات profiles.xml أو DUID أو عناوين الأجهزة في Git. `.local/` و`dist/` مستبعدان؛ لا تستخدم `git add -f` لهما. الشهادة لا تنتقل مع GitHub؛ كل مطور يستخدم ملف توقيعه الخاص.

## Version 0.2 updates

Do not clear localStorage or uninstall to update. The original preference key is retained; the migration preserves city, method, night mode and favorite order, maps known cities to IANA zones, and leaves all network consent disabled until explicitly enabled. Backups of the previous signed package and Git source are kept privately in `.local/backups/`.

Update only this application with the same identity and author certificate. Rollback by signing the saved source with that certificate; retain a private preference backup before downgrading. Older versions do not understand custom global locations, so a downgrade can require selecting an old preset city again.
