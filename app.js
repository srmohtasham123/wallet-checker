// app.js
// منطق اصلی رابط کاربری: انتخاب شبکه، مدیریت توکن‌ها، اجرای چک و رندر نتایج

let currentChainId = null;
let selectedTokens = []; // توکن‌هایی که چک‌باکسشون فعاله
let lastResults = []; // برای export

const chainSelect = document.getElementById("chainSelect");
const addressInput = document.getElementById("addressInput");
const addressCount = document.getElementById("addressCount");
const tokenList = document.getElementById("tokenList");
const checkBtn = document.getElementById("checkBtn");
const statusLine = document.getElementById("statusLine");
const emptyState = document.getElementById("emptyState");
const resultsWrap = document.getElementById("resultsWrap");
const resultsHeadRow = document.getElementById("resultsHeadRow");
const resultsBody = document.getElementById("resultsBody");
const totalsBar = document.getElementById("totalsBar");
const exportBtn = document.getElementById("exportBtn");
const chainCount = document.getElementById("chainCount");

const addTokenBtn = document.getElementById("addTokenBtn");
const tokenModal = document.getElementById("tokenModal");
const tokenSymbolInput = document.getElementById("tokenSymbolInput");
const tokenAddressInput = document.getElementById("tokenAddressInput");
const tokenDecimalsInput = document.getElementById("tokenDecimalsInput");
const tokenModalCancel = document.getElementById("tokenModalCancel");
const tokenModalSave = document.getElementById("tokenModalSave");
const tokenModalClose = document.getElementById("tokenModalClose");

// ===== Init =====

function init() {
  const ids = Object.keys(CHAINS);
  chainCount.textContent = `${ids.length} شبکه`;

  const groups = { "پرطرفدار": [], "کم‌فعال": [] };
  ids.forEach((id) => {
    const g = CHAINS[id].group || "سایر";
    if (!groups[g]) groups[g] = [];
    groups[g].push(id);
  });

  Object.entries(groups).forEach(([groupName, chainIds]) => {
    if (chainIds.length === 0) return;
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    chainIds.forEach((id) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = CHAINS[id].name;
      optgroup.appendChild(opt);
    });
    chainSelect.appendChild(optgroup);
  });

  currentChainId = ids[0];
  chainSelect.value = currentChainId;
  renderTokenList();
  renderChainNote();

  chainSelect.addEventListener("change", () => {
    currentChainId = chainSelect.value;
    renderTokenList();
    renderChainNote();
    resetResults();
  });

  addressInput.addEventListener("input", updateAddressCount);
  updateAddressCount();

  checkBtn.addEventListener("click", runCheck);
  exportBtn.addEventListener("click", exportCsv);

  addTokenBtn.addEventListener("click", () => openTokenModal());
  tokenModalCancel.addEventListener("click", closeTokenModal);
  tokenModalClose.addEventListener("click", closeTokenModal);
  tokenModalSave.addEventListener("click", saveCustomTokenFromModal);

  // کلیک روی پس‌زمینه تیره (بیرون خود باکس مودال) هم مودال را می‌بندد
  tokenModal.addEventListener("click", (e) => {
    if (e.target === tokenModal) closeTokenModal();
  });

  // کلید Escape هم مودال را می‌بندد
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !tokenModal.hidden) closeTokenModal();
  });
}

function renderChainNote() {
  const chain = CHAINS[currentChainId];
  let noteEl = document.getElementById("chainNote");
  if (!noteEl) {
    noteEl = document.createElement("div");
    noteEl.id = "chainNote";
    noteEl.className = "chain-note";
    chainSelect.insertAdjacentElement("afterend", noteEl);
  }
  if (chain.note) {
    noteEl.textContent = `⚠ ${chain.note}`;
    noteEl.hidden = false;
  } else {
    noteEl.hidden = true;
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
  let label = `${all.length} آدرس`;
  if (invalidCount > 0) label += ` (${invalidCount} نامعتبر)`;
  addressCount.textContent = label;
}

// ===== Token list rendering =====

function renderTokenList() {
  tokenList.innerHTML = "";
  const tokens = getTokensForChain(currentChainId);
  const baseCount = (CHAINS[currentChainId].defaultTokens || []).length;

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
      removeBtn.title = "حذف توکن کاستوم";
      removeBtn.addEventListener("click", () => {
        removeCustomToken(currentChainId, token.address);
        renderTokenList();
      });
      chip.appendChild(removeBtn);
    }

    tokenList.appendChild(chip);
  });
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

// ===== Custom token modal =====

function openTokenModal() {
  tokenSymbolInput.value = "";
  tokenAddressInput.value = "";
  tokenDecimalsInput.value = "18";
  tokenModal.hidden = false;
  tokenSymbolInput.focus();
}

function closeTokenModal() {
  tokenModal.hidden = true;
}

function saveCustomTokenFromModal() {
  const symbol = tokenSymbolInput.value.trim();
  const address = tokenAddressInput.value.trim();
  const decimals = parseInt(tokenDecimalsInput.value, 10);

  if (!symbol) return alert("نماد توکن را وارد کن.");
  if (!isValidAddress(address)) return alert("آدرس قرارداد توکن معتبر نیست.");
  if (isNaN(decimals) || decimals < 0 || decimals > 36) return alert("Decimals نامعتبر است.");

  addCustomToken(currentChainId, { symbol, address, decimals });
  renderTokenList();
  closeTokenModal();
}

// ===== Run check =====

function resetResults() {
  emptyState.hidden = false;
  resultsWrap.hidden = true;
  exportBtn.disabled = true;
  lastResults = [];
}

function setStatus(text, kind) {
  statusLine.textContent = text;
  statusLine.className = "status-line" + (kind ? ` ${kind}` : "");
}

async function runCheck() {
  const addresses = parseAddresses().filter(isValidAddress);
  if (addresses.length === 0) {
    setStatus("حداقل یک آدرس معتبر وارد کن.", "error");
    return;
  }

  const tokens = getCheckedTokens();
  const chain = CHAINS[currentChainId];

  checkBtn.disabled = true;
  setStatus(`در حال بررسی ${addresses.length} آدرس روی ${chain.name}…`, "active");

  emptyState.hidden = true;
  resultsWrap.hidden = false;
  buildResultsHeader(tokens);
  resultsBody.innerHTML = "";

  // ردیف‌های loading را اول رندر کن تا کاربر فیدبک فوری ببیند
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
      setStatus(`در حال بررسی… (${completed}/${addresses.length})`, "active");
    })
  );

  lastResults = results;
  renderTotals(results, tokens, chain);
  setStatus(`تمام شد — ${addresses.length} آدرس روی ${chain.name} بررسی شد.`, "");
  checkBtn.disabled = false;
  exportBtn.disabled = false;
}

function buildResultsHeader(tokens) {
  resultsHeadRow.innerHTML = "";
  const cols = ["آدرس", CHAINS[currentChainId].nativeSymbol, ...tokens.map((t) => t.symbol)];
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
    const tokenResult = result.tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase());
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
    span.textContent = "خطا";
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
  // حداکثر ۶ رقم اعشار برای خوانایی، بدون گرد کردن مقدار واقعی که ذخیره شده
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
      const tr = r.tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase());
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
  l.textContent = `جمع ${label}`;
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
  const tokens = getCheckedTokens();
  const chain = CHAINS[currentChainId];

  const headers = ["address", chain.nativeSymbol, ...tokens.map((t) => t.symbol)];
  const rows = lastResults.map((r) => {
    const nativeVal = r.native.error ? "ERROR" : r.native.formatted;
    const tokenVals = tokens.map((token) => {
      const tr = r.tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase());
      if (!tr) return "";
      return tr.error ? "ERROR" : tr.formatted;
    });
    return [r.address, nativeVal, ...tokenVals];
  });

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wallet-balances-${chain.id}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Boot =====
init();
