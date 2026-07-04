# wallet-checker

ابزار سبک برای چک کردن موجودی چند کیف‌پول روی چند شبکه EVM، بدون نیاز به API key.

مستقیم با RPC عمومی هر شبکه صحبت می‌کند (`eth_getBalance` برای native، `eth_call` برای توکن‌های ERC-20)، پس به هیچ سرویس واسطی (Etherscan/Blockscout/OKLink و...) وابسته نیست.

## شبکه‌های پشتیبانی‌شده (۲۳ شبکه)

همه Chain ID و RPC از منابع رسمی/chainlist.org در تیر ۱۴۰۵ (ژوئن-جولای ۲۰۲۶) verify شده‌اند. آدرس‌های USDC از [مستندات رسمی Circle](https://developers.circle.com/stablecoins/usdc-contract-addresses) و آدرس‌های WETH از Etherscan/Basescan/Arbiscan رسمی گرفته شده‌اند.

### پرطرفدار (بر اساس TVL)
Ethereum · BNB Smart Chain · Base · Arbitrum One · Avalanche C-Chain · Polygon PoS · OP Mainnet · Gnosis Chain · Linea · zkSync Era · Scroll · Polygon zkEVM (در حال منسوخ‌شدن) · Xai Network

### کم‌فعال / تخصصی‌تر
Soneium · Taiko · RARI Chain · Redstone · Superposition · Mantle · Cronos · Celo · Sonic (جانشین Fantom) · Moonbeam

## ویژگی‌ها

- بررسی batch چند آدرس هم‌زمان (هر خط یک آدرس)
- ۲۳ شبکه از پیش تنظیم‌شده، گروه‌بندی‌شده به پرطرفدار/کم‌فعال (قابل گسترش در `chains.js`)
- افزودن توکن ERC-20 کاستوم از داخل رابط کاربری (ذخیره در `localStorage`)
- جمع کل هر توکن/native در پایین جدول
- خروجی CSV
- بدون build، بدون dependency — فقط HTML/CSS/JS خالص

## اجرا

هیچ نصبی لازم نیست. کافی است `index.html` را با یک سرور استاتیک ساده باز کنید (برای جلوگیری از مشکلات CORS در برخی مرورگرها):

```bash
python3 -m http.server 8000
# سپس در مرورگر: http://localhost:8000
```

یا مستقیم فایل `index.html` را در مرورگر باز کنید (در اغلب مرورگرهای مدرن کار می‌کند).

## افزودن شبکه جدید

در `chains.js`، یک ورودی جدید به آبجکت `CHAINS` اضافه کنید:

```js
mynetwork: {
  id: "mynetwork",
  name: "My Network",
  nativeSymbol: "TOKEN",
  rpcUrls: ["https://rpc.example.com"],
  defaultTokens: [
    { symbol: "USDC", address: "0x...", decimals: 6 },
  ],
},
```

## محدودیت‌های شناخته‌شده

- RPCهای عمومی گاهی rate-limit یا کند می‌شوند؛ برای هر شبکه چند RPC fallback تعریف شده، اما برای استفاده سنگین بهتر است RPC اختصاصی (Alchemy/Infura/Ankr Pro و...) جایگزین کنید.
- آدرس قرارداد توکن‌های پیش‌فرض (USDC/USDT/WETH و...) باید قبل از استفاده در محیط حساس، از منبع رسمی هر شبکه verify شوند.
- این ابزار فقط موجودی لحظه‌ای را می‌خواند؛ مانیتورینگ خودکار/نوتیفیکیشن (مثلاً تلگرام) نیاز به یک سرویس جدا (cron/سرور) دارد که در این نسخه پیاده نشده است.

## لایسنس

MIT — آزاد برای استفاده، تغییر، و انتشار.
