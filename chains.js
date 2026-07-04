// chains.js
// تنظیمات شبکه‌ها: RPC عمومی + توکن‌های پیش‌فرض هر شبکه
// همه آدرس قرارداد USDC از منبع رسمی Circle verify شده: https://developers.circle.com/stablecoins/usdc-contract-addresses
// همه آدرس WETH از Etherscan/Basescan/Arbiscan/Optimistic Etherscan رسمی verify شده.
// برای افزودن شبکه جدید کافیست یک آبجکت جدید به CHAINS اضافه کنید.
// برای افزودن توکن کاستوم از طریق رابط کاربری هم می‌توانید استفاده کنید (در localStorage ذخیره می‌شود).

const CHAINS = {
  // ===== دسته ۱: شبکه‌های پرطرفدار (بر اساس TVL) =====

  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    group: "پرطرفدار",
    chainNumericId: 1,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://eth.llamarpc.com",
      "https://cloudflare-eth.com",
      "https://ethereum-rpc.publicnode.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    ],
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    group: "پرطرفدار",
    chainNumericId: 56,
    nativeSymbol: "BNB",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed1.defibit.io",
    ],
    defaultTokens: [
      { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
      { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    ],
  },
  base: {
    id: "base",
    name: "Base",
    group: "پرطرفدار",
    chainNumericId: 8453,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    ],
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    group: "پرطرفدار",
    chainNumericId: 42161,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum.llamarpc.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
      { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    ],
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche C-Chain",
    group: "پرطرفدار",
    chainNumericId: 43114,
    nativeSymbol: "AVAX",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    ],
  },
  polygon: {
    id: "polygon",
    name: "Polygon PoS",
    group: "پرطرفدار",
    chainNumericId: 137,
    nativeSymbol: "POL",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://polygon.llamarpc.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
      { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    ],
  },
  optimism: {
    id: "optimism",
    name: "OP Mainnet",
    group: "پرطرفدار",
    chainNumericId: 10,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://mainnet.optimism.io",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    ],
  },
  gnosis: {
    id: "gnosis",
    name: "Gnosis Chain",
    group: "پرطرفدار",
    chainNumericId: 100,
    nativeSymbol: "xDAI",
    rpcUrls: [
      "https://rpc.gnosischain.com",
    ],
    defaultTokens: [],
  },
  linea: {
    id: "linea",
    name: "Linea",
    group: "پرطرفدار",
    chainNumericId: 59144,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.linea.build",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", decimals: 6 },
    ],
  },
  zksync: {
    id: "zksync",
    name: "zkSync Era",
    group: "پرطرفدار",
    chainNumericId: 324,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", decimals: 6 },
    ],
  },
  scroll: {
    id: "scroll",
    name: "Scroll",
    group: "پرطرفدار",
    chainNumericId: 534352,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.scroll.io",
    ],
    defaultTokens: [],
  },
  zkevm: {
    id: "zkevm",
    name: "Polygon zkEVM",
    group: "پرطرفدار",
    chainNumericId: 1101,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://zkevm-rpc.com",
    ],
    defaultTokens: [],
    note: "شبکه در حال منسوخ‌شدن — قبل از خاموشی موجودی را منتقل کنید.",
  },
  xai: {
    id: "xai",
    name: "Xai Network",
    group: "پرطرفدار",
    chainNumericId: 660279,
    nativeSymbol: "XAI",
    rpcUrls: [
      "https://xai-chain.net/rpc",
    ],
    defaultTokens: [],
  },

  // ===== دسته ۲: شبکه‌های کم‌فعال‌تر / تخصصی‌تر =====

  soneium: {
    id: "soneium",
    name: "Soneium",
    group: "کم‌فعال",
    chainNumericId: 1868,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.soneium.org",
    ],
    defaultTokens: [],
  },
  taiko: {
    id: "taiko",
    name: "Taiko",
    group: "کم‌فعال",
    chainNumericId: 167000,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.mainnet.taiko.xyz",
    ],
    defaultTokens: [],
  },
  rarichain: {
    id: "rarichain",
    name: "RARI Chain",
    group: "کم‌فعال",
    chainNumericId: 1380012617,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://mainnet.rpc.rarichain.org/http",
    ],
    defaultTokens: [],
  },
  redstone: {
    id: "redstone",
    name: "Redstone",
    group: "کم‌فعال",
    chainNumericId: 690,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.redstonechain.com",
    ],
    defaultTokens: [],
  },
  superposition: {
    id: "superposition",
    name: "Superposition",
    group: "کم‌فعال",
    chainNumericId: 55244,
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://rpc.superposition.so",
    ],
    defaultTokens: [],
  },
  mantle: {
    id: "mantle",
    name: "Mantle",
    group: "کم‌فعال",
    chainNumericId: 5000,
    nativeSymbol: "MNT",
    rpcUrls: [
      "https://rpc.mantle.xyz",
    ],
    defaultTokens: [],
  },
  cronos: {
    id: "cronos",
    name: "Cronos",
    group: "کم‌فعال",
    chainNumericId: 25,
    nativeSymbol: "CRO",
    rpcUrls: [
      "https://evm.cronos.org",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x3D7F2C478aAfdB65542BCB44bCeeC05849999d2D", decimals: 6 },
    ],
  },
  celo: {
    id: "celo",
    name: "Celo",
    group: "کم‌فعال",
    chainNumericId: 42220,
    nativeSymbol: "CELO",
    rpcUrls: [
      "https://forno.celo.org",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
    ],
  },
  sonic: {
    id: "sonic",
    name: "Sonic",
    group: "کم‌فعال",
    chainNumericId: 146,
    nativeSymbol: "S",
    rpcUrls: [
      "https://rpc.soniclabs.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", decimals: 6 },
    ],
    note: "جانشین رسمی Fantom Opera (که غیرفعال شده است).",
  },
  moonbeam: {
    id: "moonbeam",
    name: "Moonbeam",
    group: "کم‌فعال",
    chainNumericId: 1284,
    nativeSymbol: "GLMR",
    rpcUrls: [
      "https://rpc.api.moonbeam.network",
    ],
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
