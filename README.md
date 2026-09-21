# wallet-checker

A lightweight multi-chain crypto wallet balance checker — no API keys, no dependencies, no backend.

It talks directly to the public RPC endpoints of each network (`eth_getBalance` for native coins, `eth_call` for ERC-20, plus a separate engine for Solana SPL tokens), so it does not depend on any intermediary service (Etherscan / Blockscout / OKLink / …) and needs no signup or key.

**Live demo:** https://srmohtasham123.github.io/wallet-checker/

## Features

- Batch-check many addresses at once (one per line)
- **22 EVM networks + Solana** preconfigured, grouped into popular / niche
- **Multi-network selection** — tick individual chains or a whole group; all checked together
- **Solana support** via a separate RPC engine (`rpc-solana.js`) that understands base58 addresses and SPL tokens. Paste EVM and Solana addresses together and each is checked only on the networks its format fits.
  SPL balances are read by deriving each Associated Token Account locally (PDA derivation, no crypto library) and fetching them in one batched call — see *Why Solana needs a different approach* below
- **Gravity Alpha** (chain 1625) with its verified token list, flagged with a retirement warning
- iOS-style network picker (bottom sheet with search, icon and color per chain)
- 1–4 independent RPC fallbacks per network; if one fails or times out (8s), the next is tried automatically
- Add custom ERC-20 / SPL tokens from the UI, with Select All / bulk clear
- Three languages: English (default), Persian, Chinese
- Per-network totals plus a summary table on top ("where do you actually hold funds"), with automatic collapsing of zero-balance networks
- Exports: CSV, styled **Excel** (summary sheet + one sheet per network, colored headers, borders, bold total rows — opens cleanly in Google Sheets / Excel), Markdown summary report, and a shareable **PNG** card (dynamic height, so every funded network is shown — not just the top few)
- Mobile-first design
- A **visual rule with one meaning**: amber appears only where a real balance was found. Chains, rows, totals and the share card all use it for nothing else, so a funded wallet is findable at a glance after sweeping many networks
- No build step and no local dependencies — plain HTML/CSS/JS. The only external dependency is [ExcelJS](https://github.com/exceljs/exceljs), loaded from CDN only when you click the Excel export button (the free alternatives, e.g. SheetJS, cannot do color/border styling)

## Networks (23 total)

**Popular:** Ethereum · BNB Smart Chain · Base · Arbitrum One · Avalanche C-Chain · Polygon PoS · OP Mainnet · Gnosis Chain · Linea · zkSync Era · opBNB · Scroll · Polygon zkEVM (deprecating) · Xai Network · Solana · Gravity Alpha (retiring)

**Niche:** Soneium · Taiko · Mantle · Cronos · Celo · Sonic (Fantom successor) · Moonbeam

Chain IDs and primary RPCs come from chainlist.org, the official Solana docs, and each network's own docs. USDC addresses are taken from [Circle's official documentation](https://developers.circle.com/stablecoins/usdc-contract-addresses); Gravity's token addresses come from Gravity's own docs and were verified on-chain.

### Every RPC endpoint is tested from a browser

This tool runs entirely in the browser, so an endpoint has to satisfy two things that a `curl` check will not reveal: it must return a CORS header, and it must not need an API key. Every endpoint in `chains.js` was tested with a real `Origin` header. That pass found several dead ones that had been in the list:

| Endpoint | Problem |
|---|---|
| `eth.llamarpc.com`, `base.llamarpc.com`, `arbitrum.llamarpc.com`, `polygon.llamarpc.com` | HTTP 525, no CORS header — was the **primary** RPC for Ethereum and Base |
| `rpc.ankr.com/*` (9 chains) | Now returns `Unauthorized: You must authenticate your request with an API key` |
| `polygon-rpc.com` | HTTP 401 |
| `cloudflare-eth.com` | `Cannot fulfill request` |
| `rpc.api.moonbeam.network`, `moonbeam-rpc.publicnode.com` | Unreachable / 404 |
| `mainnet.rpc.rarichain.org`, `rpc.redstonechain.com`, `rpc.superposition.so` | DNS no longer resolves |

RARI Chain, Redstone and Superposition were removed entirely: Redstone shut down in May 2026, RARI Chain is sunsetting, and Superposition's domain is gone. Keeping them would only produce permanent RPC errors.

## Why Solana needs a different approach

Two independent problems made Solana fail from a browser, and both had to be fixed:

1. **`api.mainnet-beta.solana.com` rejects every browser request with HTTP 403.** It blocks any request carrying an `Origin` header — any origin, including `localhost` — while the identical request without that header returns 200. Solana's own docs describe 403 as "your website has been blocked". The second fallback, `solana.drpc.org`, was also dead on its free plan (`chain is not available on free plan`). Both were replaced with endpoints that work from a browser.

2. **`getTokenAccountsByOwner` is blocked on essentially every keyless endpoint.** publicnode replies `Indexed requests require a personal token`; solanatracker replies `Method getTokenAccountsByOwner is not allowed`; `getProgramAccounts` is disabled with code 410. So even with a reachable RPC, reading SPL balances this way cannot work.

The fix is to stop asking the server which token accounts an address owns, and instead **derive the account address locally**. Every SPL token has exactly one canonical Associated Token Account per owner, and its address is deterministic:

```
ATA = findProgramAddress([owner, tokenProgram, mint], ATA_PROGRAM_ID)
```

`rpc-solana.js` implements the PDA derivation (SHA-256, base58, and an ed25519 on-curve check) with no external library, reads each mint first to learn its real decimals and which token program it belongs to, then fetches all the derived accounts in a single `getMultipleAccounts` call. A useful side effect: cost is two round trips regardless of how many tokens you check, and decimals come from the chain rather than from a hand-maintained config.

`test-solana.mjs` verifies this against on-chain ground truth — it loads the real project files, checks the derived addresses against accounts read independently from the chain, and asserts exact balances. Run it with `node test-solana.mjs`.

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

- Public RPCs are occasionally rate-limited; for heavy use, switch to a dedicated RPC. Every chain also has a **Custom RPC** field in the network picker (the ⚙ icon), which is tried first.
- Default token contract addresses should be re-verified against each network's official source before use in a sensitive environment. Solana decimals are read from the chain, so they cannot go stale; EVM token decimals still come from `chains.js`.
- **Gravity Alpha (L2, chain 1625) is being retired** — assets should be bridged back to Ethereum before 1 November 2026, and the chain is unsettled in December 2026. Its successor is Gravity Mainnet (L1, chain ID 127001), which uses different token addresses.
- This tool reads current balances only. Automatic monitoring / notifications (e.g. Telegram) would need a separate service (cron / server) and is not implemented.

## License

MIT — see [LICENSE](LICENSE). Persian documentation: [README.fa.md](README.fa.md).
