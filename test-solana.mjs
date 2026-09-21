// test-solana.mjs
// تست واقعی موتور سولانا: خود فایل‌های پروژه (rpc.js و rpc-solana.js) را در یک
// context مشترک لود می‌کند — دقیقاً همان‌طور که مرورگر با تگ‌های <script> انجام می‌دهد —
// و بعد مشتق‌سازی ATA و خواندن موجودی را روی RPC زندهٔ واقعی می‌سنجد.
//
// اجرا:  node test-solana.mjs
//
// چرا این تست لازم است: ریشهٔ باگ قبلی این بود که getTokenAccountsByOwner از مرورگر
// کار نمی‌کرد. یک تست واحد که فقط توابع داخلی را چک کند این را نمی‌گیرد؛ پس اینجا
// مسیر کامل checkSolanaAddressOnChain روی شبکهٔ واقعی صدا زده می‌شود.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

// ===== لود کردن فایل‌های واقعی پروژه در یک context مشترک =====
// rpc-solana.js به formatUnits و RPC_TIMEOUT_MS از rpc.js تکیه دارد (اسکوپ گلوبال
// مشترک در مرورگر). پس هر دو فایل را در همان context اجرا می‌کنیم تا وابستگی واقعی
// برقرار باشد و هیچ‌چیز استاب نشود.
const context = vm.createContext({
  console,
  fetch,
  AbortController,
  setTimeout,
  clearTimeout,
  performance,
  TextEncoder,
  Uint8Array,
  Uint32Array,
  DataView,
  BigInt,
  Promise,
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  Error,
  parseFloat,
  parseInt,
  isNaN,
});

// هر دو فایل را در یک اسکریپت ترکیب می‌کنیم و یک‌بار اجرا می‌کنیم.
// دلیل: در vm، اعلان‌های const/let در «اسکوپ لغوی» همان اسکریپت می‌مانند و روی
// آبجکت context سوار نمی‌شوند (فقط اعلان‌های function این کار را می‌کنند). پس اگر
// هر فایل را جدا اجرا کنیم، به constهایی مثل SPL_TOKEN_PROGRAM_ID دسترسی نداریم.
// با ترکیب در یک اسکریپت، یک epilogue در همان اسکوپ می‌تواند همه را صادر کند.
const EXPORTS = [
  "isValidSolanaAddress",
  "base58Decode",
  "base58Encode",
  "sha256",
  "deriveAssociatedTokenAddress",
  "checkSolanaAddressOnChain",
  "SPL_TOKEN_PROGRAM_ID",
  "SPL_TOKEN_2022_PROGRAM_ID",
];

const epilogue = `
globalThis.__exports = { ${EXPORTS.map((n) => `${n}: typeof ${n} !== "undefined" ? ${n} : undefined`).join(", ")} };
`;

const combined = [
  readFileSync(join(__dirname, "rpc.js"), "utf8"),
  readFileSync(join(__dirname, "rpc-solana.js"), "utf8"),
  epilogue,
].join("\n;\n");

vm.runInContext(combined, context, { filename: "rpc.js+rpc-solana.js" });

const S = context.__exports;
S.formatUnits = context.formatUnits; // از rpc.js، برای چک تبدیل lamports

// اطمینان از این‌که همهٔ توابع لازم واقعاً از فایل‌ها لود شده‌اند
for (const name of [...EXPORTS, "formatUnits"]) {
  if (S[name] === undefined) {
    console.error(`FATAL: ${name} was not exported from the project files`);
    process.exit(1);
  }
}

// ===== داده‌های مرجع (ground truth) =====
// این مقادیر مستقیماً از خود زنجیره گرفته شده‌اند: یک بار getTokenAccountsByOwner روی
// api.mainnet-beta.solana.com (که از backend جواب می‌دهد و ۱۸۷ حساب توکن برگرداند)
// صدا زده شد و آدرس ATA هر mint ثبت شد. این مستقل از کد ماست، پس مرجع معتبری است.
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const OWNER = USDC_MINT; // این آدرس خودش هم USDC دارد هم USDT
const OWNER_USDC_ATA = "7Sa6JgAHBKWiEkqW3tJu3umYtSDxcouhRurwQeN1589X";
const OWNER_USDT_ATA = "BFPTmMykCQtdH5NjzHcS3A4qwB2TDUDntTsFnf6YYKus";
// موجودی‌های مرجع همان لحظه (برای چک این‌که عدد درست خوانده می‌شود، نه فقط «خطا ندارد»)
const OWNER_USDC_RAW = "360695780007";
const OWNER_USDT_RAW = "2777936196";

console.log("\n=== 1. primitives ===");

// SHA-256 با بردار استاندارد NIST
const abcHash = [...S.sha256(new TextEncoder().encode("abc"))]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
check(
  "sha256('abc') matches NIST vector",
  abcHash === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  abcHash
);

// base58 باید رفت‌وبرگشت‌پذیر باشد
check("base58 roundtrip", S.base58Encode(S.base58Decode(USDC_MINT)) === USDC_MINT);

// اعتبارسنجی آدرس
check("valid Solana address accepted", S.isValidSolanaAddress(USDC_MINT) === true);
check(
  "EVM address rejected as Solana",
  S.isValidSolanaAddress("0xBF18B110Df46AC5E75d43459d9A89cb0c7c2C6F1") === false
);
check("empty string rejected", S.isValidSolanaAddress("") === false);

// formatUnits (از rpc.js) — همان تابعی که موتور سولانا استفاده می‌کند
check("formatUnits(1500000, 6) = 1.5", S.formatUnits(1500000n, 6) === "1.5");
check("formatUnits(0, 6) = 0", S.formatUnits(0n, 6) === "0");
check(
  "formatUnits(1000000000, 9) = 1 (1 SOL in lamports)",
  S.formatUnits(1000000000n, 9) === "1"
);

console.log("\n=== 2. ATA derivation vs on-chain ground truth ===");

const derivedUsdc = S.deriveAssociatedTokenAddress(OWNER, USDC_MINT, S.SPL_TOKEN_PROGRAM_ID);
check("USDC ATA matches on-chain account", derivedUsdc === OWNER_USDC_ATA, derivedUsdc);

const derivedUsdt = S.deriveAssociatedTokenAddress(OWNER, USDT_MINT, S.SPL_TOKEN_PROGRAM_ID);
check("USDT ATA matches on-chain account", derivedUsdt === OWNER_USDT_ATA, derivedUsdt);

// مشتق‌سازی باید قطعی باشد (همان ورودی → همان خروجی)
check(
  "derivation is deterministic",
  S.deriveAssociatedTokenAddress(OWNER, USDC_MINT, S.SPL_TOKEN_PROGRAM_ID) === derivedUsdc
);

// Token-2022 باید آدرس متفاوتی بدهد (چون token program داخل seeds است)
const derived2022 = S.deriveAssociatedTokenAddress(OWNER, USDC_MINT, S.SPL_TOKEN_2022_PROGRAM_ID);
check("Token-2022 program yields a different ATA", derived2022 !== derivedUsdc, derived2022);

console.log("\n=== 3. live RPC: full address check (the path that used to fail) ===");

const chain = {
  id: "solana",
  chainType: "solana",
  nativeSymbol: "SOL",
  rpcUrls: [
    "https://solana-rpc.publicnode.com",
    "https://solana.publicnode.com",
    "https://rpc.solanatracker.io/public",
  ],
};

const tokens = [
  { symbol: "USDC", address: USDC_MINT, decimals: 6 },
  { symbol: "USDT", address: USDT_MINT, decimals: 6 },
];

let result;
try {
  result = await S.checkSolanaAddressOnChain(chain, OWNER, tokens);
} catch (e) {
  console.log("  threw:", e.message);
}

if (!result) {
  check("checkSolanaAddressOnChain returned a result", false, "threw or undefined");
} else {
  check(
    "native balance fetched without error",
    result.native.error === null,
    result.native.error || ""
  );
  check(
    "native balance is a positive number",
    Number(result.native.formatted) > 0,
    String(result.native.formatted)
  );

  const usdc = result.tokens.find((t) => t.symbol === "USDC");
  const usdt = result.tokens.find((t) => t.symbol === "USDT");

  check("USDC token entry present", !!usdc);
  check("USDC balance fetched without error", usdc && usdc.error === null, usdc && usdc.error);
  check(
    "USDC balance is positive (SPL read works end-to-end)",
    usdc && Number(usdc.formatted) > 0,
    usdc && usdc.formatted
  );
  check(
    "USDC decimals read from chain, not config",
    usdc && usdc.decimals === 6,
    usdc && String(usdc.decimals)
  );
  check("USDT entry present", !!usdt);
  check("USDT fetched without error", usdt && usdt.error === null, usdt && usdt.error);

  // چک مقدار دقیق، نه فقط «خطا ندارد» — این ثابت می‌کند عدد درست خوانده شده است.
  check(
    "USDC raw amount matches on-chain value exactly",
    usdc && usdc.raw === OWNER_USDC_RAW,
    usdc && `got ${usdc.raw}, expected ${OWNER_USDC_RAW}`
  );
  check(
    "USDC formatted amount is correct",
    usdc && usdc.formatted === "360695.780007",
    usdc && usdc.formatted
  );
  check(
    "USDT raw amount matches on-chain value exactly",
    usdt && usdt.raw === OWNER_USDT_RAW,
    usdt && `got ${usdt.raw}, expected ${OWNER_USDT_RAW}`
  );

  console.log("\n  live result:", JSON.stringify(result, null, 2));
}

console.log("\n=== 4. a wallet with no token accounts reports 0, not an error ===");
// یک آدرس تازه و تصادفی می‌سازیم: چون کلید خصوصی‌اش وجود ندارد، مطمئناً هیچ حساب
// توکنی روی زنجیره ندارد. باید صفر برگردد، نه خطا — چون «حساب توکن وجود ندارد»
// یعنی «موجودی صفر»، نه «نتوانستیم بخوانیم». این تفکیک برای کاربر مهم است.
// (آدرس‌های معروف برای این آزمون مناسب نیستند: 11111111111111111111111111111112
//  واقعاً ۲۵۱ SOL دارد و 9WzDXwBb... واقعاً USDC دارد.)
const emptyOwner = S.base58Encode(randomBytes(32));
console.log(`  (generated fresh unused address: ${emptyOwner})`);
try {
  const emptyResult = await S.checkSolanaAddressOnChain(chain, emptyOwner, tokens);
  const t0 = emptyResult.tokens.find((t) => t.symbol === "USDC");
  check(
    "wallet with no USDC token account reports 0 (not an error)",
    t0 && t0.error === null && t0.formatted === "0",
    t0 ? `error=${t0.error} formatted=${t0.formatted}` : "missing"
  );
  check(
    "its native SOL balance is also 0, not an error",
    emptyResult.native.error === null && emptyResult.native.formatted === "0",
    `error=${emptyResult.native.error} formatted=${emptyResult.native.formatted}`
  );
} catch (e) {
  check("empty wallet check did not throw", false, e.message);
}

console.log("\n=== 5. the old approach is genuinely unusable from a browser ===");
// این تست ریشهٔ باگ را مستند می‌کند: همان متدی که کد قبلی استفاده می‌کرد، روی
// endpointهای عمومی یا بلاک است یا از مرورگر 403 می‌گیرد. اگر روزی این وضعیت عوض
// شد، این تست می‌شکند و یادآوری می‌کند که می‌توان دوباره به روش ساده‌تر برگشت.
try {
  const res = await fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://srmohtasham123.github.io" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [OWNER, { mint: USDC_MINT }, { encoding: "jsonParsed" }],
    }),
  });
  check(
    "public Solana RPC still blocks browser requests (403)",
    res.status === 403,
    `status=${res.status} — if this changed, the ATA workaround may no longer be needed`
  );
} catch (e) {
  check("public Solana RPC reachability probe", false, e.message);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
