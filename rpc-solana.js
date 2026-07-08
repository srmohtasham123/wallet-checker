// rpc-solana.js
// موتور مخصوص سولانا: سولانا EVM نیست، پس نمی‌تونه از rpc.js استفاده کنه.
// تفاوت‌های کلیدی: آدرس‌ها base58 (نه 0x)، موجودی native با getBalance (نه eth_getBalance)،
// توکن‌ها SPL هستن (نه ERC-20) و با getTokenAccountsByOwner + encoding جسون‌پارس‌شده خونده می‌شن
// (که خیلی ساده‌تر از ABI decoding دستی EVM‌ه، چون خود RPC مقدار انسان‌خوان برمی‌گردونه).

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SOLANA_LAMPORTS_PER_SOL_DECIMALS = 9;

/**
 * آدرس سولانا معتبر است اگر base58 و طول ۳۲ تا ۴۴ کاراکتر باشد
 * (حروف 0, O, I, l در الفبای base58 وجود ندارند تا با هم اشتباه نشوند)
 */
function isValidSolanaAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

async function solanaRpcCall(rpcUrls, method, params) {
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
 * موجودی native SOL یک آدرس (به lamports، ۱ SOL = ۱۰^۹ lamport)
 */
async function getSolanaNativeBalance(rpcUrls, address) {
  const result = await solanaRpcCall(rpcUrls, "getBalance", [address]);
  const lamports = BigInt(result.value);
  console.debug(`[wallet-checker] Solana native balance ${address} = ${lamports.toString()} lamports`);
  return lamports;
}

/**
 * موجودی یک توکن SPL خاص (بر اساس mint address) برای یک آدرس
 * از encoding=jsonParsed استفاده می‌کنیم که مقدار را از قبل decode شده برمی‌گرداند
 */
async function getSolanaTokenBalance(rpcUrls, mintAddress, walletAddress) {
  const result = await solanaRpcCall(rpcUrls, "getTokenAccountsByOwner", [
    walletAddress,
    { mint: mintAddress },
    { encoding: "jsonParsed" },
  ]);

  if (!result || !result.value || result.value.length === 0) return 0n;

  // اگر چند token account برای همین mint باشد (نادر ولی ممکن)، جمع می‌زنیم
  let total = 0n;
  for (const acc of result.value) {
    const amountStr = acc.account.data.parsed.info.tokenAmount.amount; // رشته u64 خام
    total += BigInt(amountStr);
  }
  return total;
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
        const raw = await getSolanaTokenBalance(chain.rpcUrls, token.address, address);
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
