// chains.js
// تنظیمات شبکه‌ها: RPC عمومی + توکن‌های پیش‌فرض هر شبکه
// برای افزودن شبکه جدید کافیست یک آبجکت جدید به CHAINS اضافه کنید.
// برای افزودن توکن کاستوم از طریق رابط کاربری هم می‌توانید استفاده کنید (در localStorage ذخیره می‌شود).

const CHAINS = {
  xai: {
    id: "xai",
    name: "Xai Network",
    nativeSymbol: "XAI",
    rpcUrls: [
      "https://xai-chain.net/rpc",
      "https://xai-mainnet.gelato.digital",
    ],
    explorerTokenApi: null, // در صورت نیاز بعدا قابل اضافه شدن
    defaultTokens: [
      // { symbol: "USDC", address: "0x...", decimals: 6 }
    ],
  },
  zkevm: {
    id: "zkevm",
    name: "Polygon zkEVM",
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://zkevm-rpc.com",
      "https://rpc.ankr.com/polygon_zkevm",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", decimals: 6 },
      { symbol: "USDT", address: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", decimals: 6 },
      { symbol: "WETH", address: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9", decimals: 18 },
    ],
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum Mainnet",
    nativeSymbol: "ETH",
    rpcUrls: [
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://cloudflare-eth.com",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    ],
  },
  polygon: {
    id: "polygon",
    name: "Polygon PoS",
    nativeSymbol: "POL",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://rpc.ankr.com/polygon",
    ],
    defaultTokens: [
      { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
      { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
      { symbol: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18 },
    ],
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    nativeSymbol: "BNB",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://rpc.ankr.com/bsc",
    ],
    defaultTokens: [
      { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
      { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    ],
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
