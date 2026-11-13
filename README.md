# MAJD TV

تطبيق عربي مستقل لتلفزيونات Samsung، يستهدف Tizen 3.0 ودقة 1920×1080. واجهة زرقاء وذهبية، ساعة وتاريخ ميلادي وهجري حسابي، مواقيت صلاة محلية، تطبيقات مفضلة وتنقل بالريموت. مستوحى من [Afnon](https://github.com/egyjs/afnon-android-tv-launcher) مع الاحتفاظ برخصته وإشعاراته؛ لا يحتاج مستودعه للبناء أو التشغيل.

## التحديث 0.2.0

الفرع `codex/global-location-weather` يضيف البحث العالمي بالعربية والإنجليزية، وتقدير IP اختياريًا، وإحداثيات يدوية وتأكيد الموقع قبل حفظه. قاعدة IANA مضمّنة للتوقيت الصيفي دون اتصال؛ 11 طريقة حساب وتصحيح دقائق كل صلاة. طقس Open‑Meteo مع موافقة مستقلة، توقع ساعات قادمة وتخزين آخر بيانات صحيحة، ولغة إنجليزية ووحدات حرارة، وإذاعات MP3Quran عند الطلب.

تُحفظ المفضلة والمدينة السابقة أثناء التحديث. جميع الاتصالات اختيارية وقابلة للإيقاف. لا يتغير الموقع تلقائيًا دون تأكيد حتى عند تفعيل الاقتراح اليومي. راجع [الخدمات والخصوصية](docs/services.md) و[نتائج اختبارات 0.2.0](docs/testing-v020.md). اختبار التلفزيون لهذه النسخة لم يكتمل بعد؛ لا تُعد نتيجة المتصفح إثباتًا لذلك.

## وظائف النسخة الأساسية

- بحث مدن عالمي، وإحداثيات يدوية، و18 مدينة محفوظة دون إنترنت؛ 11 طريقة حساب والعصر الشافعي/الحنفي.
- حساب دون إنترنت بواسطة Adhan، وعد تنازلي يستثني الشروق؛ عشاء أم القرى بعد المغرب بـ120 دقيقة في رمضان الحسابي.
- تاريخ هجري حسابي يبدأ عند المغرب، قابل للتصحيح ±يومين. قد يختلف عن الرؤية الرسمية.
- عرض التطبيقات التي يكشفها Tizen، فتحها، إضافة/إزالة/ترتيب المفضلة، وحفظ محلي.
- وضع ليلي، أسهم وOK وBack. منطقة IANA محفوظة مع قواعد التوقيت الصيفي المضمّنة.
- تنبيه مرئي اختياري أثناء ظهور التطبيق فقط. لا يوجد أذان مسجل أو تنبيه فوق تطبيقات أخرى.
- قسم HDMI تجريبي باستخدام واجهات Samsung الرسمية؛ نجاح الأمر يحتاج تأكيد الصورة على الجهاز.

لا يغيّر التطبيق زر Home أو إعدادات بدء تشغيل التلفزيون. حالة الاختبار الفعلية في [وثيقة التوافق](docs/compatibility.md).

## البناء

يتطلب Node.js 20.19 أو أحدث. أدوات البناء الحديثة تعمل على الكمبيوتر، والحزمة النهائية تُحوّل إلى ES5 لمحرك التلفزيون القديم.

```sh
npm ci
npm test
npm run build
npm run preview
```

افتح `http://127.0.0.1:4173`. لاختبار المتصفح شغّل `node tests/browser.mjs` في طرفية أخرى؛ ثبّت متصفح Playwright باستخدام `npx playwright install chromium` أو عيّن `CHROME_PATH` لمسار Chrome المحلي. تستعمل الاختبارات واجهات Tizen وهمية فقط داخل بيئة الاختبار؛ المعاينة العادية لا تدّعي وجود تطبيقات التلفزيون.

الناتج `dist/MAJD-TV-unsigned.wgt` يحتاج توقيعًا بشهادة Samsung TV خاصة بالمستخدم. راجع [البناء والتثبيت والتحديث](docs/build-install.md) و[التراخيص](THIRD_PARTY_NOTICES.md).

## English

MAJD TV is an independent Arabic Samsung Tizen Web Application targeting Tizen 3.0 / 2017 TVs at 1920×1080. It provides RTL remote navigation, offline prayer calculations for 18 Saudi/Egyptian cities, a next-prayer countdown, Gregorian/arithmetic Hijri dates, installed-app discovery and launch, reorderable favorites, night mode and local preferences. It is a standalone application, not a system Home replacement.

Build with Node 20.19+: `npm ci`, `npm test`, `npm run build`. Preview with `npm run preview`. The output is an **unsigned** WGT. Use your own Samsung TV certificate and distributor DUID authorization following [the installation guide](docs/build-install.md). Keep the application identity and author certificate stable for updates.

Runtime code is bundled and transpiled to ES5, with explicit Math fallbacks; no runtime CDN, Android code, remote fonts or dependency on the original Afnon repository. Modern browser tests are useful but are not proof of Tizen hardware compatibility. [Compatibility evidence and remaining checks](docs/compatibility.md) distinguish these cases.

MIT-licensed source, including attributed adaptations from Afnon. No unlicensed sound recordings, font binaries or third-party images are bundled. Version 0.2 bundles IANA timezones for offline DST, global city search, confirmed IP/manual locations, minute offsets, weather caching, English UI and on-demand Quran radio. All online services require individual consent; see [service terms](docs/services.md) and [test evidence](docs/testing-v020.md). Hijri dates are arithmetic and can differ from local observation. Notifications work only while visible; no background Adhan claim.
