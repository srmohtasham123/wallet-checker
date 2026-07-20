// rpc.js
// موتور اصلی: ارتباط مستقیم با RPC شبکه‌ها (بدون نیاز به API key یا اکسپلورر خاص)
// از متد استاندارد JSON-RPC استفاده می‌کند: eth_getBalance برای native، eth_call برای ERC-20

const RPC_TIMEOUT_MS = 8000;
const PING_TIMEOUT_MS = 6000;
const RPC_MAX_RETRIES = 2; // اگر همه RPCهای یک شبکه شکست خوردند، تا این تعداد کل لیست را دوباره امتحان می‌کنیم

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * یک تلاش واحد: هر RPC لیست را به‌ترتیب امتحان می‌کند تا جواب بگیرد
 */
async function rpcCallOnce(rpcUrls, method, params) {
  let lastError = null;
  for (const url of rpcUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || "RPC error");
      return json.result;
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e;
      continue; // امتحان RPC بعدی در همین لیست
    }
  }
  throw lastError || new Error("All RPCs failed");
}

/**
 * یک درخواست JSON-RPC به یک یا چند RPC امتحان می‌کند تا جواب بگیرد (fallback خودکار).
 * اگر کل لیست RPC در یک تلاش شکست بخورد (مثلاً به‌خاطر rate-limit موقت ناشی از حجم
 * بالای درخواست‌های هم‌زمان)، به‌جای تسلیم فوری، کمی صبر می‌کند (با jitter تصادفی تا
 * چند درخواست هم‌زمان دقیقاً هم‌لحظه دوباره نزنند) و کل لیست را دوباره امتحان می‌کند —
 * تا سقف RPC_MAX_RETRIES بار. این دقیقاً همان چیزی است که خطاهای گذرا زیر بار سنگین را
 * (که در تست ۳۹۱۲ چک هم‌زمان دیده شد) به‌طور طبیعی جذب می‌کند.
 */
async function rpcCall(rpcUrls, method, params) {
  let lastError = null;
  for (let attempt = 0; attempt <= RPC_MAX_RETRIES; attempt++) {
    try {
      return await rpcCallOnce(rpcUrls, method, params);
    } catch (e) {
      lastError = e;
      if (attempt < RPC_MAX_RETRIES) {
        const backoff = 500 * (attempt + 1) + Math.random() * 400;
        await sleep(backoff);
      }
    }
  }
  throw lastError || new Error("All RPCs failed");
}

/**
 * پینگ سبک یک RPC تکی: از eth_blockNumber استفاده می‌کند چون سبک‌ترین متد ممکن است
 * (بدون جستجوی state، بدون محاسبه، فقط عدد آخرین بلاک). برای اندازه‌گیری تاخیر واقعی
 * استفاده می‌شود، نه برای چک موجودی.
 */
async function pingEvmRpc(url) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return { url, ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (e) {
    clearTimeout(timeoutId);
    return { url, ok: false, latencyMs: null, error: e.message || "failed" };
  }
}

/**
 * موجودی native (مثل ETH, XAI, BNB) یک آدرس را برمی‌گرداند (به صورت BigInt wei)
 */
async function getNativeBalance(rpcUrls, address) {
  const hex = await rpcCall(rpcUrls, "eth_getBalance", [address, "latest"]);
  const raw = BigInt(hex);
  console.debug(`[wallet-checker] native balance ${address} = ${hex} = ${raw.toString()} wei`);
  return raw;
}

/**
 * موجودی یک توکن ERC-20 برای یک آدرس را با eth_call مستقیم می‌خواند
 * بدون نیاز به ethers.js — فقط ABI encoding دستی برای balanceOf(address)
 */
async function getTokenBalance(rpcUrls, tokenAddress, walletAddress) {
  // selector تابع balanceOf(address) = 0x70a08231
  const selector = "0x70a08231";
  const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
  const data = selector + paddedAddress;

  const hex = await rpcCall(rpcUrls, "eth_call", [
    { to: tokenAddress, data },
    "latest",
  ]);

  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

/**
 * تبدیل مقدار خام (wei/smallest unit) به عدد قابل‌خواندن بر اساس decimals
 */
function formatUnits(value, decimals) {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
}

/**
 * چک کامل یک آدرس روی یک شبکه: موجودی native + همه توکن‌های داده‌شده
 * نتیجه شامل وضعیت خطا برای هر آیتم به صورت جداگانه است تا یک خطا کل را متوقف نکند
 */
async function checkAddressOnChain(chain, address, tokens) {
  const result = {
    address,
    chainId: chain.id,
    native: { symbol: chain.nativeSymbol, raw: null, formatted: null, error: null },
    tokens: [],
  };

  // موجودی native
  try {
    const raw = await getNativeBalance(chain.rpcUrls, address);
    result.native.raw = raw.toString();
    result.native.formatted = formatUnits(raw, 18);
  } catch (e) {
    result.native.error = e.message || "خطا در دریافت موجودی";
  }

  // موجودی هر توکن (موازی برای سرعت بیشتر)
  const tokenResults = await Promise.all(
    tokens.map(async (token) => {
      const entry = {
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals,
        raw: null,
        formatted: null,
        error: null,
      };
      try {
        const raw = await getTokenBalance(chain.rpcUrls, token.address, address);
        entry.raw = raw.toString();
        entry.formatted = formatUnits(raw, token.decimals);
      } catch (e) {
        entry.error = e.message || "خطا در دریافت موجودی توکن";
      }
      return entry;
    })
  );
  result.tokens = tokenResults;

  return result;
}
