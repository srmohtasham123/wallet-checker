// rpc-solana.js
// موتور مخصوص سولانا: سولانا EVM نیست، پس نمی‌تونه از rpc.js استفاده کنه.
// تفاوت‌های کلیدی: آدرس‌ها base58 (نه 0x)، موجودی native با getBalance (نه eth_getBalance)،
// و توکن‌ها SPL هستن (نه ERC-20).
//
// ===== چرا این فایل بازنویسی شد (وگرنه توکن‌های SPL هیچ‌وقت خوانده نمی‌شدند) =====
// روش قبلی از getTokenAccountsByOwner استفاده می‌کرد. این متد یک «ایندکس‌شده» است و
// تقریباً همهٔ ارائه‌دهندگان رایگان آن را بلاک کرده‌اند:
//   - solana-rpc.publicnode.com → "Indexed requests require a personal token"
//   - rpc.solanatracker.io      → "Method getTokenAccountsByOwner is not allowed"
//   - getProgramAccounts هم روی publicnode با کد 410 غیرفعال است.
// و خود api.mainnet-beta.solana.com هم به هر درخواست مرورگری (هر هدر Origin) 403 می‌دهد.
// یعنی حتی اگر آن متد مجاز بود، آن endpoint از مرورگر کار نمی‌کرد.
//
// راه‌حل: به‌جای پرسیدن «چه حساب‌های توکنی این آدرس دارد؟» از سرور، آدرس حساب توکن را
// خودمان محلی مشتق می‌کنیم. هر توکن SPL برای هر مالک دقیقاً یک Associated Token Account
// (ATA) استاندارد دارد که آدرسش قطعی و قابل‌محاسبه است (PDA). بعد با getMultipleAccounts
// فقط همان آدرس‌های معلوم را می‌خوانیم — که یک متد کاملاً معمولی و همه‌جا مجاز است.
//
// مزیت جانبی: N درخواست ترتیبی تبدیل می‌شود به ۲ درخواست دسته‌ای، مستقل از تعداد توکن‌ها.
// و decimals هر توکن از خود زنجیره خوانده می‌شود، نه از کانفیگ دستی.

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SPL_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const ATA_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const SOLANA_LAMPORTS_PER_SOL_DECIMALS = 9;

// سقف getMultipleAccounts روی نودهای سولانا ۱۰۰ حساب در هر فراخوانی است
const SOLANA_MAX_ACCOUNTS_PER_CALL = 100;

/**
 * آدرس سولانا معتبر است اگر base58 و طول ۳۲ تا ۴۴ کاراکتر باشد
 * (حروف 0, O, I, l در الفبای base58 وجود ندارند تا با هم اشتباه نشوند)
 */
function isValidSolanaAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

// ===== base58 =====
// سولانا آدرس‌ها را base58 نمایش می‌دهد (نه hex). برای مشتق‌کردن PDA باید به بایت خام
// برگردیم و بعد دوباره به base58 کد کنیم.

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str) {
  let num = 0n;
  for (const ch of str) {
    const idx = B58_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error(`invalid base58 char: ${ch}`);
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  // هر '1' ابتدای رشته یعنی یک بایت صفر (چون صفر در base58 نماینده ندارد)
  let leadingZeros = 0;
  for (const ch of str) {
    if (ch === "1") leadingZeros++;
    else break;
  }
  return Uint8Array.from([...new Array(leadingZeros).fill(0), ...bytes]);
}

function base58Encode(bytes) {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = "";
  while (num > 0n) {
    out = B58_ALPHABET[Number(num % 58n)] + out;
    num /= 58n;
  }
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b === 0) leadingZeros++;
    else break;
  }
  return "1".repeat(leadingZeros) + out;
}

// ===== SHA-256 =====
// یک پیاده‌سازی خالص JS. عمداً از crypto.subtle استفاده نمی‌کنیم چون آن به secure context
// نیاز دارد و اگر کاربر index.html را مستقیم از file:// باز کند ممکن است در دسترس نباشد.
// این نسخه با بردار استاندارد SHA-256("abc") تست شده است.

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256(input) {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const msgLen = input.length;
  const bitLen = msgLen * 8;
  const paddedLen = (msgLen + 9 + 63) & ~63;
  const msg = new Uint8Array(paddedLen);
  msg.set(input);
  msg[msgLen] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 4294967296), false);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = (sha256Rotr(x, 7) ^ sha256Rotr(x, 18) ^ (x >>> 3)) >>> 0;
      const s1 = (sha256Rotr(y, 17) ^ sha256Rotr(y, 19) ^ (y >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 = (sha256Rotr(e, 6) ^ sha256Rotr(e, 11) ^ sha256Rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = (sha256Rotr(a, 2) ^ sha256Rotr(a, 13) ^ sha256Rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outDv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) outDv.setUint32(i * 4, H[i], false);
  return out;
}

// ===== مشتق‌سازی PDA / ATA =====
// الگوریتم رسمی سولانا: یک آدرس می‌تواند «برنامه‌محور» باشد اگر هش حاصل
// روی منحنی ed25519 نیفتد؛ پس با تغییر bump (۲۵۵ تا ۰) دنبال اولین آدرس معتبر می‌گردیم.

const ED25519_P = 2n ** 255n - 19n;
const ED25519_D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");

function bigintMod(a, m) {
  const r = a % m;
  return r < 0n ? r + m : r;
}

function bigintModPow(base, exp, m) {
  let result = 1n;
  let b = bigintMod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = bigintMod(result * b, m);
    b = bigintMod(b * b, m);
    e >>= 1n;
  }
  return result;
}

function bigintModInverse(a, m) {
  // m اول است، پس توان m-2 جواب می‌دهد (فرمات)
  return bigintModPow(a, m - 2n, m);
}

/**
 * آیا این ۳۲ بایت روی منحنی ed25519 قرار دارد؟
 * یک آدرس PDA فقط وقتی معتبر است که روی منحنی نباشد.
 */
function isOnEd25519Curve(bytes) {
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(bytes[i]);
  y &= (1n << 255n) - 1n; // بالاترین بیت flag است، نه بخشی از y
  if (y >= ED25519_P) return false;

  const y2 = bigintMod(y * y, ED25519_P);
  const u = bigintMod(y2 - 1n, ED25519_P);
  const v = bigintMod(ED25519_D * y2 + 1n, ED25519_P);
  const x2 = bigintMod(u * bigintModInverse(v, ED25519_P), ED25519_P);
  if (x2 === 0n) return true;
  // x2 یک باقی‌ماندهٔ درجه دوم است اگر x2^((p-1)/2) == 1 باشد
  return bigintModPow(x2, (ED25519_P - 1n) / 2n, ED25519_P) === 1n;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function createProgramAddressSync(seeds, programIdBytes) {
  const hash = sha256(concatBytes([...seeds, programIdBytes, PDA_MARKER]));
  if (isOnEd25519Curve(hash)) {
    throw new Error("PDA falls on ed25519 curve");
  }
  return hash;
}

function findProgramAddressSync(seeds, programIdBytes) {
  for (let bump = 255; bump >= 0; bump--) {
    try {
      return createProgramAddressSync([...seeds, Uint8Array.from([bump])], programIdBytes);
    } catch (e) {
      // این bump روی منحنی افتاد؛ bump بعدی را امتحان کن
    }
  }
  throw new Error("Unable to find a viable program address bump seed");
}

/**
 * آدرس Associated Token Account استاندارد برای یک (مالک، توکن) مشخص.
 * seeds = [owner, tokenProgram, mint] و programId = ATA program.
 */
function deriveAssociatedTokenAddress(ownerAddress, mintAddress, tokenProgramId) {
  const ownerBytes = base58Decode(ownerAddress);
  const mintBytes = base58Decode(mintAddress);
  const programBytes = base58Decode(tokenProgramId);
  const ataProgramBytes = base58Decode(ATA_PROGRAM_ID);
  const addressBytes = findProgramAddressSync(
    [ownerBytes, programBytes, mintBytes],
    ataProgramBytes
  );
  return base58Encode(addressBytes);
}

// ===== فراخوانی‌های JSON-RPC =====

async function solanaRpcCallOnce(rpcUrls, method, params) {
  let lastError = null;
  for (const url of rpcUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
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
      continue;
    }
  }
  throw lastError || new Error("All Solana RPCs failed");
}

/**
 * دقیقاً مثل rpcCall در rpc.js: اگر کل لیست RPC شکست بخورد، با تاخیر تصادفی
 * (jitter) دوباره امتحان می‌کند تا خطاهای گذرای rate-limit را جذب کند.
 */
async function solanaRpcCall(rpcUrls, method, params) {
  let lastError = null;
  for (let attempt = 0; attempt <= RPC_MAX_RETRIES; attempt++) {
    try {
      return await solanaRpcCallOnce(rpcUrls, method, params);
    } catch (e) {
      lastError = e;
      if (attempt < RPC_MAX_RETRIES) {
        const backoff = 500 * (attempt + 1) + Math.random() * 400;
        await sleep(backoff);
      }
    }
  }
  throw lastError || new Error("All Solana RPCs failed");
}

/**
 * پینگ سبک یک RPC سولانا: از getHealth استفاده می‌کند که دقیقاً برای همین منظور
 * (چک سلامت/دسترسی‌پذیری بدون بار محاسباتی) طراحی شده — سبک‌تر از getBalance.
 * نکته: خود getHealth هم اگر endpoint ترافیک مرورگری را بلاک کرده باشد 403 می‌دهد،
 * که همین اتفاق برای api.mainnet-beta.solana.com می‌افتد؛ پس 403 یک خطای واقعی است.
 */
async function pingSolanaRpc(url) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: [] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // getHealth ممکن است خطای عمدی "unhealthy" برگرداند (یعنی نود هست ولی هنوز sync نشده)؛
    // این هم یعنی RPC در دسترس است و جواب می‌دهد، پس آن را هم موفق حساب می‌کنیم
    return { url, ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (e) {
    clearTimeout(timeoutId);
    return { url, ok: false, latencyMs: null, error: e.message || "failed" };
  }
}

/**
 * موجودی native SOL یک آدرس (به lamports، ۱ SOL = ۱۰^۹ lamport)
 */
async function getSolanaNativeBalance(rpcUrls, address) {
  const result = await solanaRpcCall(rpcUrls, "getBalance", [address]);
  const lamports = BigInt(result.value);
  console.debug(`[wallet-checker] Solana native balance ${address} = ${lamports.toString()} lamports`);
  return lamports;
}

/**
 * خواندن دسته‌ای چند حساب با یک درخواست (به‌جای N درخواست جدا).
 * خروجی: آرایه‌ای هم‌طول با ورودی‌ها؛ جای حساب ناموجود null است.
 */
async function getSolanaAccountsBatch(rpcUrls, addresses) {
  const out = [];
  for (let i = 0; i < addresses.length; i += SOLANA_MAX_ACCOUNTS_PER_CALL) {
    const chunk = addresses.slice(i, i + SOLANA_MAX_ACCOUNTS_PER_CALL);
    const result = await solanaRpcCall(rpcUrls, "getMultipleAccounts", [
      chunk,
      { encoding: "jsonParsed" },
    ]);
    const values = (result && result.value) || [];
    for (let j = 0; j < chunk.length; j++) {
      out.push(values[j] === undefined ? null : values[j]);
    }
  }
  return out;
}

/**
 * موجودی همهٔ توکن‌های SPL داده‌شده برای یک آدرس، با ۲ درخواست دسته‌ای.
 *
 * مرحلهٔ ۱: خود mintها را می‌خوانیم تا بفهمیم هر توکن زیر کدام token program است
 *          (legacy یا Token-2022) و decimals واقعی‌اش چند است. آدرس ATA به token
 *          program وابسته است، پس بدون این مرحله مشتق‌سازی می‌تواند غلط باشد.
 * مرحلهٔ ۲: ATA هر توکن را مشتق و دسته‌ای می‌خوانیم. حساب ناموجود یعنی موجودی صفر
 *          (کاربر هرگز آن توکن را دریافت نکرده) — که با «خطا» فرق دارد.
 */
async function getSolanaTokenBalances(rpcUrls, ownerAddress, tokens) {
  if (tokens.length === 0) return [];

  const results = tokens.map((token) => ({
    symbol: token.symbol,
    address: token.address,
    decimals: token.decimals,
    raw: null,
    formatted: null,
    error: null,
  }));

  // ---- مرحلهٔ ۱: mintها ----
  let mintAccounts;
  try {
    mintAccounts = await getSolanaAccountsBatch(
      rpcUrls,
      tokens.map((tk) => tk.address)
    );
  } catch (e) {
    const msg = e.message || "خطا در خواندن اطلاعات توکن";
    results.forEach((r) => { r.error = msg; });
    return results;
  }

  const deriveInputs = [];
  tokens.forEach((token, i) => {
    const mint = mintAccounts[i];
    const parsed = mint && mint.data && mint.data.parsed;
    if (!parsed || parsed.type !== "mint") {
      // آدرس mint وجود ندارد یا یک حساب mint نیست
      results[i].error = "توکن پیدا نشد (mint نامعتبر)";
      return;
    }
    // decimals از خود زنجیره، نه از کانفیگ — تا اگر کانفیگ قدیمی بود، عدد غلط نشان ندهیم
    results[i].decimals = parsed.info.decimals;
    deriveInputs.push({ index: i, tokenProgram: mint.owner });
  });

  if (deriveInputs.length === 0) return results;

  // ---- مرحلهٔ ۲: مشتق‌سازی ATA و خواندن دسته‌ای ----
  const ataAddresses = [];
  for (const input of deriveInputs) {
    const token = tokens[input.index];
    try {
      ataAddresses.push(
        deriveAssociatedTokenAddress(ownerAddress, token.address, input.tokenProgram)
      );
    } catch (e) {
      results[input.index].error = "خطا در محاسبه آدرس حساب توکن";
      input.failed = true;
      ataAddresses.push(null);
    }
  }

  const readable = deriveInputs.filter((d) => !d.failed);
  const readableAtas = ataAddresses.filter((a) => a !== null);
  if (readable.length === 0) return results;

  let ataAccounts;
  try {
    ataAccounts = await getSolanaAccountsBatch(rpcUrls, readableAtas);
  } catch (e) {
    const msg = e.message || "خطا در خواندن موجودی توکن";
    readable.forEach((d) => { results[d.index].error = msg; });
    return results;
  }

  readable.forEach((input, i) => {
    const account = ataAccounts[i];
    const entry = results[input.index];
    if (!account) {
      // این حساب توکن هرگز ساخته نشده، یعنی کاربر هیچ‌وقت این توکن را نگرفته
      entry.raw = "0";
      entry.formatted = "0";
      return;
    }
    const parsed = account.data && account.data.parsed;
    if (!parsed || !parsed.info || !parsed.info.tokenAmount) {
      entry.error = "ساختار حساب توکن ناشناخته است";
      return;
    }
    const amountStr = parsed.info.tokenAmount.amount;
    entry.raw = amountStr;
    entry.formatted = formatUnits(BigInt(amountStr), entry.decimals);
  });

  return results;
}

/**
 * مسیر جایگزین: اگر کاربر یک RPC اختصاصی داشته باشد که متد ایندکس‌شده را مجاز می‌کند،
 * این مسیر مستقیم‌تر است. فقط وقتی صدا زده می‌شود که مسیر ATA شکست خورده باشد.
 */
async function getSolanaTokenBalancesViaOwnerIndex(rpcUrls, ownerAddress, tokens) {
  return Promise.all(
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
        const result = await solanaRpcCall(rpcUrls, "getTokenAccountsByOwner", [
          ownerAddress,
          { mint: token.address },
          { encoding: "jsonParsed" },
        ]);
        if (!result || !result.value || result.value.length === 0) {
          entry.raw = "0";
          entry.formatted = "0";
          return entry;
        }
        // اگر چند token account برای همین mint باشد (نادر ولی ممکن)، جمع می‌زنیم
        let total = 0n;
        for (const acc of result.value) {
          total += BigInt(acc.account.data.parsed.info.tokenAmount.amount);
        }
        entry.raw = total.toString();
        entry.formatted = formatUnits(total, entry.decimals);
      } catch (e) {
        entry.error = e.message || "خطا در دریافت موجودی توکن";
      }
      return entry;
    })
  );
}

/**
 * چک کامل یک آدرس سولانا: موجودی native + همه توکن‌های SPL داده‌شده
 * ساختار خروجی دقیقاً مشابه checkAddressOnChain در rpc.js است تا app.js
 * بتواند بدون تغییر منطق، نتیجه هر دو نوع شبکه را یکسان رندر کند.
 */
async function checkSolanaAddressOnChain(chain, address, tokens) {
  const result = {
    address,
    chainId: chain.id,
    native: { symbol: chain.nativeSymbol, raw: null, formatted: null, error: null },
    tokens: [],
  };

  try {
    const raw = await getSolanaNativeBalance(chain.rpcUrls, address);
    result.native.raw = raw.toString();
    result.native.formatted = formatUnits(raw, SOLANA_LAMPORTS_PER_SOL_DECIMALS);
  } catch (e) {
    result.native.error = e.message || "خطا در دریافت موجودی";
  }

  if (tokens.length === 0) return result;

  let tokenResults = await getSolanaTokenBalances(chain.rpcUrls, address, tokens);

  // اگر همهٔ توکن‌ها با خطا برگشتند، یعنی مسیر مشتق‌سازی ATA به هر دلیلی جواب نداده؛
  // آن‌وقت یک‌بار مسیر ایندکس‌شده را امتحان می‌کنیم (روی RPC اختصاصی کاربر ممکن است مجاز باشد).
  const allFailed = tokenResults.every((t) => t.error);
  if (allFailed) {
    const viaIndex = await getSolanaTokenBalancesViaOwnerIndex(
      chain.rpcUrls,
      address,
      tokens
    );
    const indexHadSuccess = viaIndex.some((t) => !t.error);
    if (indexHadSuccess) tokenResults = viaIndex;
  }

  result.tokens = tokenResults;
  return result;
}
