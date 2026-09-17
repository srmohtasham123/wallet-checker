# wallet-checker

A lightweight multi-chain crypto wallet balance checker — no API keys, no dependencies, no backend.

It talks directly to the public RPC endpoints of each network (`eth_getBalance` for native coins, `eth_call` for ERC-20, plus a separate engine for Solana SPL tokens), so it does not depend on any intermediary service (Etherscan / Blockscout / OKLink / …) and needs no signup or key.

**Live demo:** https://srmohtasham123.github.io/wallet-checker/

## Features

- Batch-check many addresses at once (one per line)
- **24 EVM networks + Solana** preconfigured, grouped into popular / niche
- **Multi-network selection** — tick individual chains or a whole group; all checked together
- **Solana support** via a separate RPC engine (`rpc-solana.js`) that understands base58 addresses and SPL tokens. Paste EVM and Solana addresses together and each is checked only on the networks its format fits
- iOS-style network picker (bottom sheet with search, icon and color per chain)
- 1–4 independent RPC fallbacks per network; if one fails or times out (8s), the next is tried automatically
- Add custom ERC-20 / SPL tokens from the UI, with Select All / bulk clear
- Three languages: English (default), Persian, Chinese
- Per-network totals plus a summary table on top ("where do you actually hold funds"), with automatic collapsing of zero-balance networks
- Exports: CSV, styled **Excel** (summary sheet + one sheet per network, colored headers, borders, bold total rows — opens cleanly in Google Sheets / Excel), Markdown summary report, and a shareable **PNG** card (dynamic height, so every funded network is shown — not just the top few)
- Mobile-first design
- No build step and no local dependencies — plain HTML/CSS/JS. The only external dependency is [ExcelJS](https://github.com/exceljs/exceljs), loaded from CDN only when you click the Excel export button (the free alternatives, e.g. SheetJS, cannot do color/border styling)

## Networks (25 total)

**Popular:** Ethereum · BNB Smart Chain · Base · Arbitrum One · Avalanche C-Chain · Polygon PoS · OP Mainnet · Gnosis Chain · Linea · zkSync Era · opBNB · Scroll · Polygon zkEVM (deprecating) · Xai Network · Solana

**Niche:** Soneium · Taiko · RARI Chain · Redstone · Superposition · Mantle · Cronos · Celo · Sonic (Fantom successor) · Moonbeam

Chain IDs and primary RPCs come from chainlist.org, the official Solana docs, and each network's own docs; fallback RPCs from well-known public providers (publicnode.com, llamarpc.com, ankr.com, drpc.org). USDC addresses are taken from [Circle's official documentation](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## Run

No install needed. Serve `index.html` from any simple static server (to avoid CORS issues in some browsers):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly, or host it on GitHub Pages / Vercel.

## Adding a network

In `chains.js`, add an entry to the `CHAINS` object:

```js
mynetwork: {
  id: "mynetwork", name: "My Network", group: "popular", // or "niche"
  chainNumericId: 123, nativeSymbol: "TOKEN", icon: "●", color: "#c9a15a",
  rpcUrls: ["https://rpc.example.com", "https://rpc2.example.com"],
  defaultTokens: [{ symbol: "USDC", address: "0x...", decimals: 6 }],
},
```

## Adding a language

In `i18n.js`, add a block to `TRANSLATIONS` with the same keys as the `en` block, and a button in `.lang-switch` inside `index.html`.

## Known limitations

- Public RPCs are occasionally rate-limited; for heavy use, switch to a dedicated RPC (Alchemy / Infura / Ankr Pro).
- Default token contract addresses should be re-verified against each network's official source before use in a sensitive environment.
- This tool reads current balances only. Automatic monitoring / notifications (e.g. Telegram) would need a separate service (cron / server) and is not implemented.

## License

MIT — see [LICENSE](LICENSE). Persian documentation: [README.fa.md](README.fa.md).
