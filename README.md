# wallet-checker

ابزار سبک برای چک کردن موجودی چند کیف‌پول روی چند شبکه EVM، بدون نیاز به API key.

مستقیم با RPC عمومی هر شبکه صحبت می‌کند (`eth_getBalance` برای native، `eth_call` برای ERC-20)، پس به هیچ سرویس واسطی (Etherscan/Blockscout/OKLink و...) وابسته نیست.

## ویژگی‌ها

- بررسی batch چند آدرس هم‌زمان (هر خط یک آدرس)
- ۲۳ شبکه از پیش تنظیم‌شده، گروه‌بندی‌شده به پرطرفدار/کم‌فعال (قابل گسترش در `chains.js`)
- منوی انتخاب شبکه به سبک iOS (باتم‌شیت با جستجو، آیکون و رنگ هر شبکه)
- هر شبکه ۲ تا ۴ RPC fallback مستقل دارد؛ اگر یکی پاسخ ندهد یا timeout بزند (۸ ثانیه)، خودکار سراغ بعدی می‌رود
- افزودن توکن ERC-20 کاستوم از داخل رابط کاربری (ذخیره در `localStorage`)، با دکمه Select All / پاک‌کردن گروهی
- سه زبان: انگلیسی (پیش‌فرض)، فارسی، چینی — قابل تعویض از نوار بالا
- جمع کل هر توکن/native در پایین جدول
- خروجی CSV و خروجی گزارش خلاصه (Markdown) شامل شبکه، تعداد آدرس، توکن‌های استفاده‌شده و جمع کل
- طراحی بهینه برای موبایل
- بدون build، بدون dependency — فقط HTML/CSS/JS خالص

## شبکه‌های پشتیبانی‌شده (۲۳ شبکه)

همه Chain ID و RPC اصلی از chainlist.org و مستندات رسمی هر شبکه، و RPCهای fallback از ارائه‌دهندگان عمومی شناخته‌شده (publicnode.com, llamarpc.com, ankr.com) گرفته شده‌اند. آدرس‌های USDC از [مستندات رسمی Circle](https://developers.circle.com/stablecoins/usdc-contract-addresses).

**پرطرفدار:** Ethereum · BNB Smart Chain · Base · Arbitrum One · Avalanche C-Chain · Polygon PoS · OP Mainnet · Gnosis Chain · Linea · zkSync Era · Scroll · Polygon zkEVM (در حال منسوخ‌شدن) · Xai Network

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
