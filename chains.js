// chains.js
// تنظیمات شبکه‌ها: چند RPC fallback + توکن‌های پیش‌فرض + آیکون/رنگ برای منوی انتخاب
// همه آدرس USDC از مستندات رسمی Circle verify شده: https://developers.circle.com/stablecoins/usdc-contract-addresses
// همه RPC اصلی از chainlist.org و مستندات رسمی هر شبکه؛ RPCهای fallback اضافه از publicnode.com/llamarpc.com
// (الگوی آدرس‌دهی این دو سرویس برای Base و Arbitrum مستقیماً verify شده است).

const CHAINS = {
  ethereum: {
    id: "ethereum", chainType: "evm", name: "Ethereum", group: "popular", chainNumericId: 1,
    nativeSymbol: "ETH", icon: "⟠", color: "#627eea",
    rpcUrls: [
      "https://eth.llamarpc.com",
      "https://ethereum-rpc.publicnode.com",
      "https://cloudflare-eth.com",
      "https://rpc.ankr.com/eth",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    ],
  },
  bsc: {
    id: "bsc", chainType: "evm", name: "BNB Smart Chain", group: "popular", chainNumericId: 56,
    nativeSymbol: "BNB", icon: "◆", color: "#f0b90b",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-rpc.publicnode.com",
      "https://bsc-dataseed1.defibit.io",
      "https://rpc.ankr.com/bsc",
    ],
    defaultTokens: [
      { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
      { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    ],
  },
  base: {
    id: "base", chainType: "evm", name: "Base", group: "popular", chainNumericId: 8453,
    nativeSymbol: "ETH", icon: "◐", color: "#0052ff",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://base.llamarpc.com",
      "https://rpc.ankr.com/base",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    ],
  },
  arbitrum: {
    id: "arbitrum", chainType: "evm", name: "Arbitrum One", group: "popular", chainNumericId: 42161,
    nativeSymbol: "ETH", icon: "◣", color: "#28a0f0",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one-rpc.publicnode.com",
      "https://arbitrum.llamarpc.com",
      "https://rpc.ankr.com/arbitrum",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
      { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    ],
  },
  avalanche: {
    id: "avalanche", chainType: "evm", name: "Avalanche C-Chain", group: "popular", chainNumericId: 43114,
    nativeSymbol: "AVAX", icon: "▲", color: "#e84142",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
      "https://rpc.ankr.com/avalanche",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    ],
  },
  polygon: {
    id: "polygon", chainType: "evm", name: "Polygon PoS", group: "popular", chainNumericId: 137,
    nativeSymbol: "POL", icon: "⬡", color: "#8247e5",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://polygon-bor-rpc.publicnode.com",
      "https://polygon.llamarpc.com",
      "https://rpc.ankr.com/polygon",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
      { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    ],
  },
  optimism: {
    id: "optimism", chainType: "evm", name: "OP Mainnet", group: "popular", chainNumericId: 10,
    nativeSymbol: "ETH", icon: "○", color: "#ff0420",
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://optimism-rpc.publicnode.com",
      "https://rpc.ankr.com/optimism",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    ],
  },
  gnosis: {
    id: "gnosis", chainType: "evm", name: "Gnosis Chain", group: "popular", chainNumericId: 100,
    nativeSymbol: "xDAI", icon: "◈", color: "#3e6957",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://gnosis-rpc.publicnode.com",
      "https://rpc.ankr.com/gnosis",
    ],
    defaultTokens: [],
  },
  linea: {
    id: "linea", chainType: "evm", name: "Linea", group: "popular", chainNumericId: 59144,
    nativeSymbol: "ETH", icon: "▬", color: "#121212",
    rpcUrls: [
      "https://rpc.linea.build",
      "https://linea-rpc.publicnode.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", decimals: 6 },
    ],
  },
  zksync: {
    id: "zksync", chainType: "evm", name: "zkSync Era", group: "popular", chainNumericId: 324,
    nativeSymbol: "ETH", icon: "◆", color: "#8c8dfc",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
      "https://zksync.drpc.org",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", decimals: 6 },
    ],
  },
  opbnb: {
    id: "opbnb", chainType: "evm", name: "opBNB", group: "popular", chainNumericId: 204,
    nativeSymbol: "BNB", icon: "◆", color: "#f0b90b",
    rpcUrls: [
      "https://opbnb-mainnet-rpc.bnbchain.org",
      "https://opbnb.drpc.org",
    ],
    defaultTokens: [],
  },
  scroll: {
    id: "scroll", chainType: "evm", name: "Scroll", group: "popular", chainNumericId: 534352,
    nativeSymbol: "ETH", icon: "◫", color: "#ffeeda",
    rpcUrls: [
      "https://rpc.scroll.io",
      "https://scroll-rpc.publicnode.com",
    ],
    defaultTokens: [],
  },
  zkevm: {
    id: "zkevm", chainType: "evm", name: "Polygon zkEVM", group: "popular", chainNumericId: 1101,
    nativeSymbol: "ETH", icon: "⬡", color: "#8247e5",
    rpcUrls: [
      "https://zkevm-rpc.com",
      "https://rpc.ankr.com/polygon_zkevm",
    ],
    defaultTokens: [],
    note: "Network is being deprecated — move funds before shutdown.",
  },
  xai: {
    id: "xai", chainType: "evm", name: "Xai Network", group: "popular", chainNumericId: 660279,
    nativeSymbol: "XAI", icon: "✕", color: "#ff3b3b",
    rpcUrls: [
      "https://xai-chain.net/rpc",
    ],
    defaultTokens: [],
  },
  solana: {
    id: "solana", chainType: "solana", name: "Solana", group: "popular", chainNumericId: null,
    nativeSymbol: "SOL", icon: "◎", color: "#14f195",
    rpcUrls: [
      "https://api.mainnet-beta.solana.com",
      "https://solana.drpc.org",
    ],
    // توکن‌های SPL: address اینجا همان mint address توکن است (نه قرارداد ERC-20)
    defaultTokens: [
      { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
      { symbol: "USDT", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
    ],
  },

  soneium: {
    id: "soneium", chainType: "evm", name: "Soneium", group: "niche", chainNumericId: 1868,
    nativeSymbol: "ETH", icon: "◔", color: "#000000",
    rpcUrls: [
      "https://rpc.soneium.org",
      "https://soneium.drpc.org",
    ],
    defaultTokens: [],
  },
  taiko: {
    id: "taiko", chainType: "evm", name: "Taiko", group: "niche", chainNumericId: 167000,
    nativeSymbol: "ETH", icon: "▧", color: "#e81899",
    rpcUrls: [
      "https://rpc.mainnet.taiko.xyz",
      "https://mainnet.taiko-rpc.com",
      "https://rpc.ankr.com/taiko",
    ],
    defaultTokens: [],
  },
  rarichain: {
    id: "rarichain", chainType: "evm", name: "RARI Chain", group: "niche", chainNumericId: 1380012617,
    nativeSymbol: "ETH", icon: "◇", color: "#00d4aa",
    rpcUrls: ["https://mainnet.rpc.rarichain.org/http"],
    defaultTokens: [],
  },
  redstone: {
    id: "redstone", chainType: "evm", name: "Redstone", group: "niche", chainNumericId: 690,
    nativeSymbol: "ETH", icon: "▮", color: "#e63946",
    rpcUrls: ["https://rpc.redstonechain.com"],
    defaultTokens: [],
  },
  superposition: {
    id: "superposition", chainType: "evm", name: "Superposition", group: "niche", chainNumericId: 55244,
    nativeSymbol: "ETH", icon: "∞", color: "#7b2ff7",
    rpcUrls: ["https://rpc.superposition.so"],
    defaultTokens: [],
  },
  mantle: {
    id: "mantle", chainType: "evm", name: "Mantle", group: "niche", chainNumericId: 5000,
    nativeSymbol: "MNT", icon: "▨", color: "#000000",
    rpcUrls: ["https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com"],
    defaultTokens: [],
  },
  cronos: {
    id: "cronos", chainType: "evm", name: "Cronos", group: "niche", chainNumericId: 25,
    nativeSymbol: "CRO", icon: "◉", color: "#002d74",
    rpcUrls: ["https://evm.cronos.org", "https://cronos-evm-rpc.publicnode.com"],
    defaultTokens: [
      { symbol: "USDC", address: "0x3D7F2C478aAfdB65542BCB44bCeeC05849999d2D", decimals: 6 },
    ],
  },
  celo: {
    id: "celo", chainType: "evm", name: "Celo", group: "niche", chainNumericId: 42220,
    nativeSymbol: "CELO", icon: "◕", color: "#fcff52",
    rpcUrls: [
      "https://forno.celo.org",
      "https://rpc.ankr.com/celo",
      "https://celo.drpc.org",
      "https://celo.api.onfinality.io/public",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
    ],
  },
  sonic: {
    id: "sonic", chainType: "evm", name: "Sonic", group: "niche", chainNumericId: 146,
    nativeSymbol: "S", icon: "»", color: "#fe9a2d",
    rpcUrls: [
      "https://rpc.soniclabs.com",
      "https://sonic.drpc.org",
      "https://rpc.ankr.com/sonic",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", decimals: 6 },
    ],
    note: "Official successor to Fantom Opera (now deprecated).",
  },
  moonbeam: {
    id: "moonbeam", chainType: "evm", name: "Moonbeam", group: "niche", chainNumericId: 1284,
    nativeSymbol: "GLMR", icon: "☾", color: "#53cbc9",
    rpcUrls: ["https://rpc.api.moonbeam.network", "https://moonbeam-rpc.publicnode.com"],
    defaultTokens: [],
  },
};

// کلید ذخیره‌سازی توکن‌های کاستوم کاربر در localStorage
const CUSTOM_TOKENS_KEY = "wallet_checker_custom_tokens_v1";

function loadCustomTokens() {
  try {
    const raw = localStorage.getItem(CUSTOM_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCustomTokens(data) {
  localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(data));
}

function getTokensForChain(chainId) {
  const base = CHAINS[chainId]?.defaultTokens || [];
  const custom = loadCustomTokens()[chainId] || [];
  return [...base, ...custom];
}

function addCustomToken(chainId, token) {
  const all = loadCustomTokens();
  if (!all[chainId]) all[chainId] = [];
  all[chainId].push(token);
  saveCustomTokens(all);
}

function removeCustomToken(chainId, address) {
  const all = loadCustomTokens();
  if (!all[chainId]) return;
  all[chainId] = all[chainId].filter(
    (t) => t.address.toLowerCase() !== address.toLowerCase()
  );
  saveCustomTokens(all);
}

// ===== Custom RPC override =====
// اگر RPCهای پیش‌فرض یک شبکه ناپایدار بودند (مثلاً Taiko/Redstone که گاهی همه
// endpointهای عمومی‌شان هم‌زمان مشکل دارند)، کاربر می‌تواند یک RPC اختصاصی
// جایگزین وارد کند که همیشه قبل از بقیه امتحان می‌شود.

const RPC_OVERRIDE_KEY = "wallet_checker_rpc_overrides_v1";

function loadRpcOverrides() {
  try {
    const raw = localStorage.getItem(RPC_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveRpcOverride(chainId, url) {
  const all = loadRpcOverrides();
  all[chainId] = url;
  localStorage.setItem(RPC_OVERRIDE_KEY, JSON.stringify(all));
}

function clearRpcOverride(chainId) {
  const all = loadRpcOverrides();
  delete all[chainId];
  localStorage.setItem(RPC_OVERRIDE_KEY, JSON.stringify(all));
}

function getEffectiveRpcUrls(chainId) {
  const overrides = loadRpcOverrides();
  let base = CHAINS[chainId]?.rpcUrls || [];
  if (overrides[chainId]) {
    base = [overrides[chainId], ...base];
  }

  // اگر این شبکه در همین سشن پینگ شده، سریع‌ترین RPCهای موفق را اول قرار می‌دهیم.
  // این فقط در حافظه است (نه localStorage) و با رفرش صفحه از بین می‌رود، دقیقاً
  // همان‌طور که خواسته شد ("خودکار سریع‌ترین را اول بذاره برای همون سشن").
  const pings = rpcPingResults[chainId];
  if (!pings || pings.length === 0) return base;

  const pingedUrlSet = new Set(pings.map((p) => p.url));
  const successOrdered = pings
    .filter((p) => p.ok)
    .sort((a, b) => a.latencyMs - b.latencyMs)
    .map((p) => p.url);
  const failedUrls = pings.filter((p) => !p.ok).map((p) => p.url);
  const unpingedUrls = base.filter((u) => !pingedUrlSet.has(u));

  return [...successOrdered, ...unpingedUrls, ...failedUrls];
}

// ===== نتایج پینگ RPC (فقط در حافظه، مخصوص همین سشن مرورگر) =====
// دقیقاً شبیه Chainlist: کاربر با کلیک روی "Ping" وضعیت و تاخیر هر RPC یک شبکه را
// می‌بیند، و برای بقیه همین سشن، سریع‌ترین RPCهای موفق خودکار اول امتحان می‌شوند.

let rpcPingResults = {}; // chainId -> [{ url, ok, latencyMs, error? }]

function recordPingResults(chainId, results) {
  rpcPingResults[chainId] = results;
}

function getPingResults(chainId) {
  return rpcPingResults[chainId] || null;
}
