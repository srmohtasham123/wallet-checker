// app.js
// منطق اصلی: i18n، منوی iOS-style انتخاب شبکه، select-all توکن‌ها، اجرای چک، گزارش خلاصه

let currentChainId = null;
let lastResults = [];
let lastCheckedTokens = [];

// ===== DOM refs =====
const htmlRoot = document.getElementById("htmlRoot");
const langSwitch = document.getElementById("langSwitch");

const chainPickerBtn = document.getElementById("chainPickerBtn");
const chainPickerIcon = document.getElementById("chainPickerIcon");
const chainPickerName = document.getElementById("chainPickerName");
const chainNote = document.getElementById("chainNote");

const chainSheetOverlay = document.getElementById("chainSheetOverlay");
const chainSheet = document.getElementById("chainSheet");
const sheetCloseBtn = document.getElementById("sheetCloseBtn");
const chainSearchInput = document.getElementById("chainSearchInput");
const chainSheetList = document.getElementById("chainSheetList");

const addressInput = document.getElementById("addressInput");
const addressCount = document.getElementById("addressCount");

const selectAllTokensBtn = document.getElementById("selectAllTokensBtn");
const clearCustomTokensBtn = document.getElementById("clearCustomTokensBtn");
const addTokenBtn = document.getElementById("addTokenBtn");
const tokenForm = document.getElementById("tokenForm");
const tokenSymbolInput = document.getElementById("tokenSymbolInput");
const tokenAddressInput = document.getElementById("tokenAddressInput");
const tokenDecimalsInput = document.getElementById("tokenDecimalsInput");
const tokenFormSave = document.getElementById("tokenFormSave");
const tokenFormCancel = document.getElementById("tokenFormCancel");
const tokenFormError = document.getElementById("tokenFormError");
const tokenList = document.getElementById("tokenList");

const checkBtn = document.getElementById("checkBtn");
const statusLine = document.getElementById("statusLine");
const emptyState = document.getElementById("emptyState");
const resultsWrap = document.getElementById("resultsWrap");
const resultsHeadRow = document.getElementById("resultsHeadRow");
const resultsBody = document.getElementById("resultsBody");
const totalsBar = document.getElementById("totalsBar");
const exportBtn = document.getElementById("exportBtn");
const reportBtn = document.getElementById("reportBtn");
const chainCount = document.getElementById("chainCount");

// ===== i18n application =====

function applyTranslations() {
  const lang = getCurrentLang();
  htmlRoot.setAttribute("lang", lang);
  htmlRoot.setAttribute("dir", t("dir") === "rtl" ? "rtl" : "ltr");

  document.getElementById("topbarMetaText").textContent = t("topbarMeta");
  document.getElementById("stepInputLabel").textContent = t("stepInput");
  document.getElementById("networkLabel").textContent = t("network");
  document.getElementById("addressesLabel").firstChild.textContent = t("addresses") + " ";
  document.getElementById("addressesHint").textContent = t("addressesHint");
  document.getElementById("tokensLabel").textContent = t("tokens");
  selectAllTokensBtn.textContent = t("selectAll");
  clearCustomTokensBtn.textContent = t("clearCustomTokens");
  addTokenBtn.textContent = tokenForm.hidden ? t("addCustomToken") : t("closeForm");
  tokenSymbolInput.placeholder = t("symbolPlaceholder");
  tokenAddressInput.placeholder = t("contractPlaceholder");
  tokenDecimalsInput.placeholder = t("decimalsPlaceholder");
  tokenFormSave.textContent = t("add");
  tokenFormCancel.textContent = t("cancel");
  document.getElementById("checkBtnText").textContent = t("checkBalances");
  document.getElementById("stepResultsLabel").textContent = t("stepResults");
  exportBtn.textContent = t("exportCsv");
  reportBtn.textContent = t("exportReport");
  document.getElementById("emptyTitle").textContent = t("emptyTitle");
  document.getElementById("emptySub").textContent = t("emptySub");
  document.getElementById("footerNote").textContent = t("footerNote");
  document.getElementById("sheetTitle").textContent = t("network");
  chainSearchInput.placeholder = t("searchNetwork");

  const ids = Object.keys(CHAINS);
  chainCount.textContent = `${ids.length} ${t("chains")}`;

  updateAddressCount();
  renderChainPickerButton();

  langSwitch.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function switchLang(lang) {
  setCurrentLang(lang);
  applyTranslations();
}

// ===== Init =====

function init() {
  const ids = Object.keys(CHAINS);
  currentChainId = ids[0];

  langSwitch.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchLang(btn.dataset.lang));
  });

  applyTranslations();
  renderTokenList();

  chainPickerBtn.addEventListener("click", openChainSheet);
  sheetCloseBtn.addEventListener("click", closeChainSheet);
  chainSheetOverlay.addEventListener("click", (e) => {
    if (e.target === chainSheetOverlay) closeChainSheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !chainSheetOverlay.hidden) closeChainSheet();
  });
  chainSearchInput.addEventListener("input", () => renderChainSheetList(chainSearchInput.value));

  addressInput.addEventListener("input", updateAddressCount);

  selectAllTokensBtn.addEventListener("click", toggleSelectAllTokens);
  addTokenBtn.addEventListener("click", toggleTokenForm);
  tokenFormCancel.addEventListener("click", closeTokenForm);
  tokenFormSave.addEventListener("click", saveCustomTokenFromForm);
  clearCustomTokensBtn.addEventListener("click", clearAllCustomTokensForCurrentChain);

  checkBtn.addEventListener("click", runCheck);
  exportBtn.addEventListener("click", exportCsv);
  reportBtn.addEventListener("click", exportSummaryReport);
}

// ===== Chain picker (iOS-style bottom sheet) =====

function renderChainPickerButton() {
  const chain = CHAINS[currentChainId];
  chainPickerIcon.textContent = chain.icon || "●";
  chainPickerIcon.style.background = hexToSoft(chain.color);
  chainPickerIcon.style.color = chain.color;
  chainPickerName.textContent = chain.name;
  renderChainNote();
}

function hexToSoft(hex) {
  // یک نسخه کم‌رنگ از رنگ شبکه برای پس‌زمینه آیکون می‌سازد
  if (!hex) return "var(--accent-soft)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

function openChainSheet() {
  chainSheetOverlay.hidden = false;
  chainSearchInput.value = "";
  renderChainSheetList("");
  setTimeout(() => chainSearchInput.focus(), 50);
}

function closeChainSheet() {
  chainSheetOverlay.hidden = true;
}

function renderChainSheetList(query) {
  chainSheetList.innerHTML = "";
  const q = query.trim().toLowerCase();
  const ids = Object.keys(CHAINS).filter((id) => {
    if (!q) return true;
    return CHAINS[id].name.toLowerCase().includes(q) || id.includes(q);
  });

  if (ids.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sheet-empty";
    empty.textContent = "—";
    chainSheetList.appendChild(empty);
    return;
  }

  const groups = { popular: [], niche: [] };
  ids.forEach((id) => {
    const g = CHAINS[id].group === "niche" ? "niche" : "popular";
    groups[g].push(id);
  });

  const groupLabels = { popular: t("groupPopular"), niche: t("groupNiche") };

  ["popular", "niche"].forEach((groupKey) => {
    if (groups[groupKey].length === 0) return;
    const label = document.createElement("div");
    label.className = "sheet-group-label";
    label.textContent = groupLabels[groupKey];
    chainSheetList.appendChild(label);

    groups[groupKey].forEach((id) => {
      const chain = CHAINS[id];
      const item = document.createElement("div");
      item.className = "sheet-item" + (id === currentChainId ? " selected" : "");

      const icon = document.createElement("span");
      icon.className = "sheet-item-icon";
      icon.textContent = chain.icon || "●";
      icon.style.background = hexToSoft(chain.color);
      icon.style.color = chain.color;

      const name = document.createElement("span");
      name.className = "sheet-item-name";
      name.textContent = chain.name;

      item.appendChild(icon);
      item.appendChild(name);

      if (id === currentChainId) {
        const check = document.createElement("span");
        check.className = "sheet-item-check";
        check.textContent = "✓";
        item.appendChild(check);
      }

      item.addEventListener("click", () => selectChain(id));
      chainSheetList.appendChild(item);
    });
  });
}

function selectChain(id) {
  currentChainId = id;
  renderChainPickerButton();
  renderTokenList();
  resetResults();
  closeChainSheet();
}

function renderChainNote() {
  const chain = CHAINS[currentChainId];
  if (chain.note) {
    chainNote.textContent = `⚠ ${chain.note}`;
    chainNote.hidden = false;
  } else {
    chainNote.hidden = true;
  }
}

// ===== Address input =====

function parseAddresses() {
  return addressInput.value
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function updateAddressCount() {
  const all = parseAddresses();
  const valid = all.filter(isValidAddress);
  const invalidCount = all.length - valid.length;
  let label = `${all.length} ${t("addressCount")}`;
  if (invalidCount > 0) label += ` (${invalidCount} ${t("invalid")})`;
  addressCount.textContent = label;
}

// ===== Token list rendering =====

function renderTokenList() {
  tokenList.innerHTML = "";
  const tokens = getTokensForChain(currentChainId);
  const baseCount = (CHAINS[currentChainId].defaultTokens || []).length;
  const hasCustom = tokens.length > baseCount;
  clearCustomTokensBtn.hidden = !hasCustom;

  tokens.forEach((token, idx) => {
    const isCustom = idx >= baseCount;
    const chip = document.createElement("div");
    chip.className = "token-chip";

    const left = document.createElement("div");
    left.className = "token-chip-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.symbol = token.symbol;
    checkbox.dataset.address = token.address;
    checkbox.dataset.decimals = token.decimals;

    const labelWrap = document.createElement("div");
    const symbolSpan = document.createElement("div");
    symbolSpan.className = "token-symbol";
    symbolSpan.textContent = token.symbol;
    const addrSpan = document.createElement("div");
    addrSpan.className = "token-addr";
    addrSpan.textContent = shortenAddress(token.address);
    labelWrap.appendChild(symbolSpan);
    labelWrap.appendChild(addrSpan);

    left.appendChild(checkbox);
    left.appendChild(labelWrap);
    chip.appendChild(left);

    if (isCustom) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "token-remove";
      removeBtn.textContent = "✕";
      removeBtn.title = "remove";
      removeBtn.addEventListener("click", () => {
        removeCustomToken(currentChainId, token.address);
        renderTokenList();
      });
      chip.appendChild(removeBtn);
    }

    tokenList.appendChild(chip);
  });
}

function toggleSelectAllTokens() {
  const boxes = tokenList.querySelectorAll('input[type="checkbox"]');
  const allChecked = Array.from(boxes).every((b) => b.checked);
  boxes.forEach((b) => (b.checked = !allChecked));
  selectAllTokensBtn.textContent = allChecked ? t("selectAll") : t("deselectAll");
}

function getCheckedTokens() {
  const boxes = tokenList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(boxes).map((b) => ({
    symbol: b.dataset.symbol,
    address: b.dataset.address,
    decimals: parseInt(b.dataset.decimals, 10),
  }));
}

function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ===== Custom token inline form =====

function toggleTokenForm() {
  if (tokenForm.hidden) openTokenForm();
  else closeTokenForm();
}

function openTokenForm() {
  tokenForm.hidden = false;
  tokenSymbolInput.value = "";
  tokenAddressInput.value = "";
  tokenDecimalsInput.value = "18";
  tokenFormError.hidden = true;
  addTokenBtn.textContent = t("closeForm");
  tokenSymbolInput.focus();
}

function closeTokenForm() {
  tokenForm.hidden = true;
  tokenFormError.hidden = true;
  addTokenBtn.textContent = t("addCustomToken");
}

function showTokenFormError(msg) {
  tokenFormError.textContent = msg;
  tokenFormError.hidden = false;
}

function saveCustomTokenFromForm() {
  const symbol = tokenSymbolInput.value.trim();
  const address = tokenAddressInput.value.trim();
  const decimals = parseInt(tokenDecimalsInput.value, 10);

  if (!symbol) return showTokenFormError(t("errSymbol"));
  if (!isValidAddress(address)) return showTokenFormError(t("errAddress"));
  if (isNaN(decimals) || decimals < 0 || decimals > 36) return showTokenFormError(t("errDecimals"));

  addCustomToken(currentChainId, { symbol, address, decimals });
  renderTokenList();
  closeTokenForm();
}

function clearAllCustomTokensForCurrentChain() {
  const all = loadCustomTokens();
  if (!all[currentChainId] || all[currentChainId].length === 0) return;
  const count = all[currentChainId].length;
  if (!confirm(t("confirmClear", { count }))) return;
  all[currentChainId] = [];
  saveCustomTokens(all);
  renderTokenList();
}

// ===== Run check =====

function resetResults() {
  emptyState.hidden = false;
  resultsWrap.hidden = true;
  exportBtn.disabled = true;
  reportBtn.disabled = true;
  lastResults = [];
  lastCheckedTokens = [];
}

function setStatus(text, kind) {
  statusLine.textContent = text;
  statusLine.className = "status-line" + (kind ? ` ${kind}` : "");
}

async function runCheck() {
  const addresses = parseAddresses().filter(isValidAddress);
  if (addresses.length === 0) {
    setStatus(t("errNoAddress"), "error");
    return;
  }

  const tokens = getCheckedTokens();
  const chain = CHAINS[currentChainId];

  checkBtn.disabled = true;
  setStatus(t("statusChecking", { count: addresses.length, chain: chain.name }), "active");

  emptyState.hidden = true;
  resultsWrap.hidden = false;
  buildResultsHeader(tokens);
  resultsBody.innerHTML = "";

  const rowEls = addresses.map((addr) => buildLoadingRow(addr, tokens));
  rowEls.forEach((row) => resultsBody.appendChild(row.tr));

  const results = [];
  let completed = 0;

  await Promise.all(
    addresses.map(async (addr, i) => {
      const result = await checkAddressOnChain(chain, addr, tokens);
      results[i] = result;
      fillRow(rowEls[i], result, tokens);
      completed++;
      setStatus(t("statusProgress", { done: completed, total: addresses.length }), "active");
    })
  );

  lastResults = results;
  lastCheckedTokens = tokens;
  renderTotals(results, tokens, chain);
  setStatus(t("statusDone", { count: addresses.length, chain: chain.name }), "");
  checkBtn.disabled = false;
  exportBtn.disabled = false;
  reportBtn.disabled = false;
}

function buildResultsHeader(tokens) {
  resultsHeadRow.innerHTML = "";
  const cols = ["Address", `${CHAINS[currentChainId].nativeSymbol} (${t("native")})`, ...tokens.map((t) => t.symbol)];
  cols.forEach((c) => {
    const th = document.createElement("th");
    th.textContent = c;
    resultsHeadRow.appendChild(th);
  });
}

function buildLoadingRow(address, tokens) {
  const tr = document.createElement("tr");

  const addrTd = document.createElement("td");
  addrTd.className = "addr-cell";
  addrTd.textContent = address;
  tr.appendChild(addrTd);

  const nativeTd = document.createElement("td");
  nativeTd.className = "balance-cell";
  const nativeLoading = document.createElement("span");
  nativeLoading.className = "balance-loading";
  nativeTd.appendChild(nativeLoading);
  tr.appendChild(nativeTd);

  const tokenTds = tokens.map(() => {
    const td = document.createElement("td");
    td.className = "balance-cell";
    const loading = document.createElement("span");
    loading.className = "balance-loading";
    td.appendChild(loading);
    tr.appendChild(td);
    return td;
  });

  return { tr, nativeTd, tokenTds };
}

function fillRow(rowEls, result, tokens) {
  rowEls.nativeTd.innerHTML = "";
  rowEls.nativeTd.appendChild(renderBalanceCell(result.native));

  tokens.forEach((token, i) => {
    const tokenResult = result.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
    rowEls.tokenTds[i].innerHTML = "";
    rowEls.tokenTds[i].appendChild(renderBalanceCell(tokenResult));
  });
}

function renderBalanceCell(entry) {
  const span = document.createElement("span");
  if (!entry) {
    span.className = "balance-error";
    span.textContent = "—";
    return span;
  }
  if (entry.error) {
    span.className = "balance-error";
    span.textContent = t("error");
    span.title = entry.error;
    return span;
  }
  const num = parseFloat(entry.formatted);
  if (num === 0) {
    span.className = "balance-zero";
    span.textContent = "0";
  } else {
    span.className = "balance-value";
    span.textContent = formatDisplay(entry.formatted);
  }
  return span;
}

function formatDisplay(value) {
  const num = parseFloat(value);
  if (num === 0) return "0";
  if (num < 0.000001) return num.toExponential(2);
  const [whole, frac] = value.split(".");
  if (!frac) return whole;
  return `${whole}.${frac.slice(0, 6)}`;
}

function renderTotals(results, tokens, chain) {
  totalsBar.innerHTML = "";

  const nativeTotal = results.reduce((sum, r) => {
    if (r.native.error) return sum;
    return sum + parseFloat(r.native.formatted);
  }, 0);
  totalsBar.appendChild(buildTotalItem(chain.nativeSymbol, nativeTotal));

  tokens.forEach((token) => {
    const total = results.reduce((sum, r) => {
      const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
      if (!tr || tr.error) return sum;
      return sum + parseFloat(tr.formatted);
    }, 0);
    totalsBar.appendChild(buildTotalItem(token.symbol, total));
  });
}

function buildTotalItem(label, value) {
  const div = document.createElement("div");
  div.className = "total-item";
  const l = document.createElement("div");
  l.className = "total-label";
  l.textContent = `${t("total")} ${label}`;
  const v = document.createElement("div");
  v.className = "total-value";
  v.textContent = formatDisplay(value.toString());
  div.appendChild(l);
  div.appendChild(v);
  return div;
}

// ===== Export CSV =====

function exportCsv() {
  if (lastResults.length === 0) return;
  const tokens = lastCheckedTokens;
  const chain = CHAINS[currentChainId];

  const headers = ["address", chain.nativeSymbol, ...tokens.map((tk) => tk.symbol)];
  const rows = lastResults.map((r) => {
    const nativeVal = r.native.error ? "ERROR" : r.native.formatted;
    const tokenVals = tokens.map((token) => {
      const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
      if (!tr) return "";
      return tr.error ? "ERROR" : tr.formatted;
    });
    return [r.address, nativeVal, ...tokenVals];
  });

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  downloadFile(csv, `wallet-balances-${chain.id}-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

// ===== Export summary report =====

function exportSummaryReport() {
  if (lastResults.length === 0) return;
  const tokens = lastCheckedTokens;
  const chain = CHAINS[currentChainId];

  const nativeTotal = lastResults.reduce((sum, r) => r.native.error ? sum : sum + parseFloat(r.native.formatted), 0);
  const tokenTotals = tokens.map((token) => {
    const total = lastResults.reduce((sum, r) => {
      const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
      if (!tr || tr.error) return sum;
      return sum + parseFloat(tr.formatted);
    }, 0);
    return { symbol: token.symbol, total };
  });

  const lines = [];
  lines.push(`# ${t("reportTitle")}`);
  lines.push("");
  lines.push(`- ${t("reportGenerated")}: ${new Date().toISOString()}`);
  lines.push(`- ${t("reportChain")}: ${chain.name} (chainId: ${chain.chainNumericId})`);
  lines.push(`- ${t("reportAddressCount")}: ${lastResults.length}`);
  lines.push(`- ${t("reportTokensUsed")}: ${chain.nativeSymbol} (${t("native")}), ${tokens.map((tk) => tk.symbol).join(", ") || "—"}`);
  lines.push("");
  lines.push(`## ${t("reportTotals")}`);
  lines.push("");
  lines.push(`- ${chain.nativeSymbol}: ${formatDisplay(nativeTotal.toString())}`);
  tokenTotals.forEach((tt) => {
    lines.push(`- ${tt.symbol}: ${formatDisplay(tt.total.toString())}`);
  });
  lines.push("");
  lines.push(`## ${t("address")}`);
  lines.push("");
  lines.push(`| ${t("address")} | ${chain.nativeSymbol} | ${tokens.map((tk) => tk.symbol).join(" | ")} |`);
  lines.push(`|---|---|${tokens.map(() => "---").join("|")}|`);
  lastResults.forEach((r) => {
    const nativeVal = r.native.error ? "ERR" : formatDisplay(r.native.formatted);
    const tokenVals = tokens.map((token) => {
      const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
      if (!tr) return "";
      return tr.error ? "ERR" : formatDisplay(tr.formatted);
    });
    lines.push(`| ${r.address} | ${nativeVal} | ${tokenVals.join(" | ")} |`);
  });

  downloadFile(lines.join("\n"), `wallet-checker-report-${chain.id}-${Date.now()}.md`, "text/markdown;charset=utf-8;");
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Boot =====
init();
