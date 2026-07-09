# wallet-checker

ابزار سبک برای چک کردن موجودی چند کیف‌پول روی چند شبکه EVM، بدون نیاز به API key.

مستقیم با RPC عمومی هر شبکه صحبت می‌کند (`eth_getBalance` برای native، `eth_call` برای ERC-20)، پس به هیچ سرویس واسطی (Etherscan/Blockscout/OKLink و...) وابسته نیست.

## ویژگی‌ها

- بررسی batch چند آدرس هم‌زمان (هر خط یک آدرس)
- **۲۴ شبکه** از پیش تنظیم‌شده (۲۳ شبکه EVM + سولانا)، گروه‌بندی‌شده به پرطرفدار/کم‌فعال
- **انتخاب چندشبکه‌ای هم‌زمان** — چک‌باکس روی هر شبکه یا کل یک گروه، همه با هم چک می‌شوند
- **پشتیبانی سولانا** — موتور RPC جدا (`rpc-solana.js`) که آدرس‌های base58 و توکن‌های SPL را می‌فهمد؛ اگر آدرس‌های EVM و سولانا با هم پیست شوند، هرکدام خودکار فقط روی شبکه‌ی متناسب با فرمتشان چک می‌شوند
- منوی انتخاب شبکه به سبک iOS (باتم‌شیت با جستجو، آیکون و رنگ هر شبکه)
- هر شبکه ۱ تا ۴ RPC fallback مستقل دارد؛ اگر یکی پاسخ ندهد یا timeout بزند (۸ ثانیه)، خودکار سراغ بعدی می‌رود
- افزودن توکن ERC-20/SPL کاستوم از داخل رابط کاربری، با دکمه Select All / پاک‌کردن گروهی
- سه زبان: انگلیسی (پیش‌فرض)، فارسی، چینی
- جمع کل هر توکن/native در پایین جدول هر شبکه
- خروجی CSV، **خروجی Excel واقعی و استایل‌دار** (شیت خلاصه + یک شیت جدا برای هر شبکه، با هدر رنگی، border، و ردیف جمع کل بولد — مناسب برای باز کردن در Google Sheets/Excel)، خروجی گزارش خلاصه (Markdown)، و کارنامه تصویری قابل‌اشتراک‌گذاری (PNG با ارتفاع پویا که همه شبکه‌های دارای موجودی را کامل نشان می‌دهد، نه فقط چندتای برتر)
- جدول خلاصه بالای نتایج ("کجا واقعاً موجودی داری") + جمع‌شدن خودکار شبکه‌های صفر تا مجبور نباشید بین ده‌ها بخش خالی اسکرول کنید
- طراحی بهینه برای موبایل
- بدون build، بدون dependency محلی — فقط HTML/CSS/JS خالص. تنها استثنا: دکمه "خروجی Excel" کتابخانه [ExcelJS](https://github.com/exceljs/exceljs) را از CDN (cdnjs.cloudflare.com) بارگذاری می‌کند، چون نسخه رایگان کتابخانه‌های جایگزین (SheetJS) قابلیت رنگ/border ندارند. این تنها وابستگی خارجی پروژه است و فقط هنگام کلیک روی آن دکمه لود می‌شود.

## شبکه‌های پشتیبانی‌شده (۲۴ شبکه)

همه Chain ID و RPC اصلی از chainlist.org، مستندات رسمی Solana، و مستندات هر شبکه، و RPCهای fallback از ارائه‌دهندگان عمومی شناخته‌شده (publicnode.com, llamarpc.com, ankr.com, drpc.org) گرفته شده‌اند. آدرس‌های USDC از [مستندات رسمی Circle](https://developers.circle.com/stablecoins/usdc-contract-addresses).

**پرطرفدار:** Ethereum · BNB Smart Chain · Base · Arbitrum One · Avalanche C-Chain · Polygon PoS · OP Mainnet · Gnosis Chain · Linea · zkSync Era · Scroll · Polygon zkEVM (در حال منسوخ‌شدن) · Xai Network · **Solana**

**کم‌فعال/تخصصی:** Soneium · Taiko · RARI Chain · Redstone · Superposition · Mantle · Cronos · Celo · Sonic (جانشین Fantom) · Moonbeam

## اجرا

هیچ نصبی لازم نیست. کافی است `index.html` را با یک سرور استاتیک ساده باز کنید (برای جلوگیری از مشکلات CORS در برخی مرورگرها):

```bash
python3 -m http.server 8000
# سپس در مرورگر: http://localhost:8000
```

یا مستقیم فایل `index.html` را در مرورگر باز کنید، یا روی GitHub Pages / Vercel میزبانی کنید.

## افزودن شبکه جدید

در `chains.js`، یک ورودی جدید به آبجکت `CHAINS` اضافه کنید:

```js
mynetwork: {
  id: "mynetwork", name: "My Network", group: "popular", // یا "niche"
  chainNumericId: 123, nativeSymbol: "TOKEN", icon: "●", color: "#c9a15a",
  rpcUrls: ["https://rpc.example.com", "https://rpc2.example.com"],
  defaultTokens: [{ symbol: "USDC", address: "0x...", decimals: 6 }],
},
```

## افزودن زبان جدید

در `i18n.js`، یک بلوک جدید به `TRANSLATIONS` با همان کلیدهای بلوک `en` اضافه کنید، و یک دکمه در `.lang-switch` داخل `index.html`.

## محدودیت‌های شناخته‌شده

- RPCهای عمومی گاهی rate-limit می‌شوند؛ برای استفاده سنگین، RPC اختصاصی (Alchemy/Infura/Ankr Pro) جایگزین کنید.
- آدرس قرارداد توکن‌های پیش‌فرض باید قبل از استفاده در محیط حساس، از منبع رسمی هر شبکه verify شوند.
- این ابزار فقط موجودی لحظه‌ای را می‌خواند؛ مانیتورینگ خودکار/نوتیفیکیشن (مثلاً تلگرام) نیاز به یک سرویس جدا (cron/سرور) دارد که در این نسخه پیاده نشده است.

## لایسنس

MIT — آزاد برای استفاده، تغییر، و انتشار.
