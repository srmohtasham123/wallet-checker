// app.js
// منطق اصلی: i18n، منوی iOS-style انتخاب چند شبکه، select-all توکن‌ها، اجرای چک، گزارش خلاصه

let selectedChainIds = []; // آرایه شبکه‌های انتخاب‌شده برای چک (چندتایی)
let currentChainId = null; // وقتی فقط یک شبکه انتخاب شده، همون برای پنل توکن‌ها استفاده می‌شه
let lastRunResults = []; // [{chainId, results, tokens}] برای export بعد از هر چک
let sheetPendingSelection = []; // انتخاب موقت داخل باتم‌شیت قبل از زدن Apply

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
const sheetSelectedCount = document.getElementById("sheetSelectedCount");
const sheetApplyBtn = document.getElementById("sheetApplyBtn");

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
const multiChainNote = document.getElementById("multiChainNote");

const checkBtn = document.getElementById("checkBtn");
const statusLine = document.getElementById("statusLine");
const emptyState = document.getElementById("emptyState");
const resultsWrap = document.getElementById("resultsWrap");
const exportBtn = document.getElementById("exportBtn");
const reportBtn = document.getElementById("reportBtn");
const chainCount = document.getElementById("chainCount");
const reportCardSection = document.getElementById("reportCardSection");
const reportCardCanvas = document.getElementById("reportCardCanvas");
const downloadCardBtn = document.getElementById("downloadCardBtn");
const customRpcBtn = document.getElementById("customRpcBtn");
const customRpcForm = document.getElementById("customRpcForm");
const customRpcInput = document.getElementById("customRpcInput");
const customRpcSave = document.getElementById("customRpcSave");
const customRpcClear = document.getElementById("customRpcClear");

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
  document.getElementById("reportCardLabel").textContent = t("reportCardLabel");
  downloadCardBtn.textContent = t("downloadImage");
  customRpcBtn.textContent = customRpcForm.hidden ? t("customRpc") : t("closeForm");
  customRpcInput.placeholder = t("customRpcPlaceholder");
  customRpcSave.textContent = t("save");
  customRpcClear.textContent = t("clear");
  document.getElementById("emptyTitle").textContent = t("emptyTitle");
  document.getElementById("emptySub").textContent = t("emptySub");
  document.getElementById("footerNote").textContent = t("footerNote");
  document.getElementById("trustNote").textContent = t("trustNote");
  document.getElementById("sheetTitle").textContent = t("network");
  chainSearchInput.placeholder = t("searchNetwork");
  sheetApplyBtn.textContent = t("apply");
  multiChainNote.textContent = t("multiChainNote");

  const ids = Object.keys(CHAINS);
  chainCount.textContent = `${ids.length} ${t("chains")}`;

  updateAddressCount();
  renderChainPickerButton();
  renderTokenPanel();

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
  selectedChainIds = [ids[0]];
  currentChainId = ids[0];

  langSwitch.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchLang(btn.dataset.lang));
  });

  applyTranslations();

  chainPickerBtn.addEventListener("click", openChainSheet);
  sheetCloseBtn.addEventListener("click", closeChainSheet);
  chainSheetOverlay.addEventListener("click", (e) => {
    if (e.target === chainSheetOverlay) closeChainSheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !chainSheetOverlay.hidden) closeChainSheet();
  });
  chainSearchInput.addEventListener("input", () => renderChainSheetList(chainSearchInput.value));
  sheetApplyBtn.addEventListener("click", applyChainSelection);

  addressInput.addEventListener("input", updateAddressCount);

  selectAllTokensBtn.addEventListener("click", toggleSelectAllTokens);
  addTokenBtn.addEventListener("click", toggleTokenForm);
  tokenFormCancel.addEventListener("click", closeTokenForm);
  tokenFormSave.addEventListener("click", saveCustomTokenFromForm);
  clearCustomTokensBtn.addEventListener("click", clearAllCustomTokensForCurrentChain);

  checkBtn.addEventListener("click", runCheck);
  exportBtn.addEventListener("click", exportCsv);
  reportBtn.addEventListener("click", exportSummaryReport);
  downloadCardBtn.addEventListener("click", downloadReportCardImage);
  customRpcBtn.addEventListener("click", toggleCustomRpcForm);
  customRpcSave.addEventListener("click", saveCustomRpcForCurrentChain);
  customRpcClear.addEventListener("click", clearCustomRpcForCurrentChain);
}

// ===== Chain picker (iOS-style bottom sheet, multi-select) =====

function renderChainPickerButton() {
  if (selectedChainIds.length === 1) {
    const chain = CHAINS[selectedChainIds[0]];
    chainPickerIcon.textContent = chain.icon || "●";
    chainPickerIcon.style.background = hexToSoft(chain.color);
    chainPickerIcon.style.color = chain.color;
    chainPickerName.textContent = chain.name;
  } else {
    chainPickerIcon.textContent = "⬢";
    chainPickerIcon.style.background = "var(--accent-soft)";
    chainPickerIcon.style.color = "var(--accent)";
    chainPickerName.textContent = t("networksSelected", { count: selectedChainIds.length });
  }
  renderChainNote();
}

function hexToSoft(hex) {
  if (!hex) return "var(--accent-soft)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

function openChainSheet() {
  sheetPendingSelection = [...selectedChainIds];
  chainSheetOverlay.hidden = false;
  chainSearchInput.value = "";
  // requestAnimationFrame تضمین می‌کند رندر لیست بعد از این‌که مرورگر layout
  // مربوط به نمایان‌شدن overlay را کامل کرد اتفاق بیفتد (محافظ اضافه در کنار
  // فیکس flexbox مربوطه، برای اطمینان بیشتر در مرورگرهای موبایل)
  requestAnimationFrame(() => renderChainSheetList(""));
  setTimeout(() => chainSearchInput.focus(), 50);
}

function closeChainSheet() {
  chainSheetOverlay.hidden = true;
}

function applyChainSelection() {
  if (sheetPendingSelection.length === 0) return; // حداقل یک شبکه باید انتخاب باشد
  selectedChainIds = [...sheetPendingSelection];
  currentChainId = selectedChainIds.length === 1 ? selectedChainIds[0] : currentChainId;
  if (!selectedChainIds.includes(currentChainId)) currentChainId = selectedChainIds[0];
  renderChainPickerButton();
  renderTokenPanel();
  resetResults();
  closeChainSheet();
}

function renderChainSheetList(query) {
  chainSheetList.innerHTML = "";
  const q = query.trim().toLowerCase();
  const ids = Object.keys(CHAINS).filter((id) => {
    if (!q) return true;
    return CHAINS[id].name.toLowerCase().includes(q) || id.includes(q);
  });

  updateSheetSelectedCount();

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

    const labelRow = document.createElement("div");
    labelRow.className = "sheet-group-row";

    const label = document.createElement("span");
    label.className = "sheet-group-label";
    label.textContent = groupLabels[groupKey];

    const groupCheckbox = document.createElement("input");
    groupCheckbox.type = "checkbox";
    groupCheckbox.className = "sheet-group-checkbox";
    const allInGroupSelected = groups[groupKey].every((id) => sheetPendingSelection.includes(id));
    groupCheckbox.checked = allInGroupSelected;
    groupCheckbox.addEventListener("change", () => {
      if (groupCheckbox.checked) {
        groups[groupKey].forEach((id) => {
          if (!sheetPendingSelection.includes(id)) sheetPendingSelection.push(id);
        });
      } else {
        sheetPendingSelection = sheetPendingSelection.filter((id) => !groups[groupKey].includes(id));
      }
      renderChainSheetList(chainSearchInput.value);
    });

    labelRow.appendChild(groupCheckbox);
    labelRow.appendChild(label);
    chainSheetList.appendChild(labelRow);

    groups[groupKey].forEach((id) => {
      const chain = CHAINS[id];
      const isSelected = sheetPendingSelection.includes(id);
      const item = document.createElement("div");
      item.className = "sheet-item" + (isSelected ? " selected" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "sheet-item-checkbox";
      checkbox.checked = isSelected;

      const icon = document.createElement("span");
      icon.className = "sheet-item-icon";
      icon.textContent = chain.icon || "●";
      icon.style.background = hexToSoft(chain.color);
      icon.style.color = chain.color;

      const name = document.createElement("span");
      name.className = "sheet-item-name";
      name.textContent = chain.name;

      item.appendChild(checkbox);
      item.appendChild(icon);
      item.appendChild(name);

      const toggle = () => {
        if (sheetPendingSelection.includes(id)) {
          sheetPendingSelection = sheetPendingSelection.filter((x) => x !== id);
        } else {
          sheetPendingSelection.push(id);
        }
        renderChainSheetList(chainSearchInput.value);
      };

      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle();
      });
      item.addEventListener("click", toggle);

      chainSheetList.appendChild(item);
    });
  });
}

function updateSheetSelectedCount() {
  sheetSelectedCount.textContent = t("networksSelected", { count: sheetPendingSelection.length });
  sheetApplyBtn.disabled = sheetPendingSelection.length === 0;
}

function renderChainNote() {
  if (selectedChainIds.length !== 1) {
    chainNote.hidden = true;
    return;
  }
  const chain = CHAINS[selectedChainIds[0]];
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

function isValidEvmAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// isValidSolanaAddress از rpc-solana.js میاد (global scope مشترک)

function isValidAddressForChain(addr, chainId) {
  const chain = CHAINS[chainId];
  if (!chain) return false;
  if (chain.chainType === "solana") return isValidSolanaAddress(addr);
  return isValidEvmAddress(addr);
}

function isAddressValidForAnySelected(addr) {
  return selectedChainIds.some((id) => isValidAddressForChain(addr, id));
}

function updateAddressCount() {
  const all = parseAddresses();
  const valid = all.filter(isAddressValidForAnySelected);
  const invalidCount = all.length - valid.length;
  let label = `${all.length} ${t("addressCount")}`;
  if (invalidCount > 0) label += ` (${invalidCount} ${t("invalid")})`;
  addressCount.textContent = label;
}

// ===== Token panel: full UI for single chain, simplified note for multi-chain =====

function renderTokenPanel() {
  const isSingle = selectedChainIds.length === 1;

  tokenList.hidden = !isSingle;
  selectAllTokensBtn.hidden = !isSingle;
  addTokenBtn.hidden = !isSingle;
  clearCustomTokensBtn.hidden = !isSingle || !hasCustomTokensForCurrentChain();
  multiChainNote.hidden = isSingle;
  customRpcBtn.hidden = !isSingle;

  if (isSingle) {
    currentChainId = selectedChainIds[0];
    renderTokenList();
    closeCustomRpcForm();
  } else {
    closeTokenForm();
    closeCustomRpcForm();
  }
}

function hasCustomTokensForCurrentChain() {
  const all = loadCustomTokens();
  return !!(all[currentChainId] && all[currentChainId].length > 0);
}

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
  if (!isValidAddressForChain(address, currentChainId)) return showTokenFormError(t("errAddress"));
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

// ===== Custom RPC override (inline form, همان الگوی فرم توکن کاستوم) =====

function toggleCustomRpcForm() {
  if (customRpcForm.hidden) openCustomRpcForm();
  else closeCustomRpcForm();
}

function openCustomRpcForm() {
  customRpcForm.hidden = false;
  const overrides = loadRpcOverrides();
  customRpcInput.value = overrides[currentChainId] || "";
  customRpcBtn.textContent = t("closeForm");
  customRpcInput.focus();
}

function closeCustomRpcForm() {
  customRpcForm.hidden = true;
  customRpcBtn.textContent = t("customRpc");
}

function saveCustomRpcForCurrentChain() {
  const url = customRpcInput.value.trim();
  if (!url) return;
  saveRpcOverride(currentChainId, url);
  setStatus(t("customRpcSaved"), "");
  closeCustomRpcForm();
}

function clearCustomRpcForCurrentChain() {
  clearRpcOverride(currentChainId);
  customRpcInput.value = "";
  setStatus(t("customRpcCleared"), "");
}

// ===== Run check (multi-chain aware) =====

function resetResults() {
  emptyState.hidden = false;
  resultsWrap.hidden = true;
  resultsWrap.innerHTML = "";
  reportCardSection.hidden = true;
  exportBtn.disabled = true;
  reportBtn.disabled = true;
  lastRunResults = [];
}

function setStatus(text, kind) {
  statusLine.textContent = text;
  statusLine.className = "status-line" + (kind ? ` ${kind}` : "");
}

async function runCheck() {
  const allAddresses = parseAddresses();
  const anyValid = allAddresses.some(isAddressValidForAnySelected);
  if (!anyValid) {
    setStatus(t("errNoAddress"), "error");
    return;
  }

  checkBtn.disabled = true;
  emptyState.hidden = true;
  resultsWrap.hidden = false;
  resultsWrap.innerHTML = "";
  lastRunResults = [];

  const isSingle = selectedChainIds.length === 1;
  const isMulti = !isSingle;

  // برای هر شبکه، فقط آدرس‌هایی که فرمتشان با نوع آن شبکه (EVM یا سولانا) مطابقت دارد چک می‌شوند
  const perChainAddresses = {};
  selectedChainIds.forEach((chainId) => {
    perChainAddresses[chainId] = allAddresses.filter((a) => isValidAddressForChain(a, chainId));
  });

  let totalDone = 0;
  const totalWork = selectedChainIds.reduce((sum, id) => sum + perChainAddresses[id].length, 0);

  // جایگاه جدول خلاصه بالای صفحه (در حالت چندشبکه‌ای) - بعد از اتمام همه چک‌ها پر می‌شود
  const summaryPlaceholder = document.createElement("div");
  if (isMulti) resultsWrap.appendChild(summaryPlaceholder);

  const chainFindings = []; // برای ساخت جدول خلاصه: { chain, nonZeroEntries: [{symbol, total}] }

  for (const chainId of selectedChainIds) {
    const chain = CHAINS[chainId];
    const addresses = perChainAddresses[chainId];
    const tokens = isSingle ? getCheckedTokens() : (chain.defaultTokens || []);
    const checkFn = chain.chainType === "solana" ? checkSolanaAddressOnChain : checkAddressOnChain;
    // اگر کاربر RPC اختصاصی برای این شبکه ذخیره کرده باشد، اول از همه امتحان می‌شود
    const effectiveChain = { ...chain, rpcUrls: getEffectiveRpcUrls(chainId) };

    if (addresses.length === 0) {
      // هیچ آدرسی با فرمت این شبکه مطابقت نداشت (مثلاً فقط آدرس EVM دادی ولی سولانا هم انتخاب کردی)
      const section = buildChainSection(chain, tokens, []);
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "chain-section-empty";
      emptyMsg.textContent = "—";
      section.container.appendChild(emptyMsg);
      if (section.statusBadge) section.statusBadge.textContent = "—";
      if (section.container.tagName === "DETAILS") section.container.open = false;
      resultsWrap.appendChild(section.container);
      continue;
    }

    setStatus(t("statusChecking", { count: addresses.length, chain: chain.name }), "active");

    const section = buildChainSection(chain, tokens, addresses);
    resultsWrap.appendChild(section.container);

    const results = [];
    await Promise.all(
      addresses.map(async (addr, i) => {
        const result = await checkFn(effectiveChain, addr, tokens);
        results[i] = result;
        fillRow(section.rowEls[i], result, tokens);
        totalDone++;
        setStatus(t("statusProgress", { done: totalDone, total: totalWork }), "active");
      })
    );

    renderChainTotals(section.totalsBar, results, tokens, chain);
    lastRunResults.push({ chainId, chain, results, tokens });

    // محاسبه اینکه آیا این شبکه اصلاً موجودی غیرصفر داشته، برای collapse خودکار
    const nonZeroEntries = computeNonZeroTotals(results, tokens, chain);
    const hasBalance = nonZeroEntries.length > 0;
    if (section.container.tagName === "DETAILS") section.container.open = hasBalance;
    if (section.statusBadge) {
      section.statusBadge.textContent = hasBalance ? "●" : "—";
      section.statusBadge.classList.toggle("has-balance", hasBalance);
    }
    if (isMulti) chainFindings.push({ chain, nonZeroEntries });
  }

  if (isMulti) {
    const summaryTable = buildGrandSummary(chainFindings);
    summaryPlaceholder.replaceWith(summaryTable);
  }

  const chainNames = selectedChainIds.map((id) => CHAINS[id].name).join(", ");
  setStatus(t("statusDone", { count: totalWork, chain: chainNames }), "");
  checkBtn.disabled = false;
  exportBtn.disabled = false;
  reportBtn.disabled = false;

  if (lastRunResults.length > 0) {
    reportCardSection.hidden = false;
    await renderReportCard();
  }
}

// محاسبه لیست موجودی‌های غیرصفر یک شبکه (جمع همه آدرس‌ها)، برای جدول خلاصه و برای
// تصمیم collapse خودکار
function computeNonZeroTotals(results, tokens, chain) {
  const entries = [];
  const nativeTotal = results.reduce((sum, r) => r.native.error ? sum : sum + parseFloat(r.native.formatted || "0"), 0);
  if (nativeTotal > 0) entries.push({ symbol: chain.nativeSymbol, total: nativeTotal });

  tokens.forEach((token) => {
    const total = results.reduce((sum, r) => {
      const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
      if (!tr || tr.error) return sum;
      return sum + parseFloat(tr.formatted || "0");
    }, 0);
    if (total > 0) entries.push({ symbol: token.symbol, total });
  });

  return entries;
}

// جدول خلاصه بالای صفحه: فقط شبکه‌هایی که موجودی دارند به‌صورت کامل نشان داده می‌شوند؛
// شبکه‌های کاملاً صفر به‌صورت یک خط جمع‌وجور در پایین لیست می‌شوند تا کاربر مجبور
// نباشد بین ده‌ها بخش خالی برای پیداکردن پول واقعی اسکرول کند.
function buildGrandSummary(chainFindings) {
  const wrap = document.createElement("div");
  wrap.className = "grand-summary";

  const withBalance = chainFindings.filter((f) => f.nonZeroEntries.length > 0);
  const withoutBalance = chainFindings.filter((f) => f.nonZeroEntries.length === 0);

  const title = document.createElement("div");
  title.className = "grand-summary-title";
  title.textContent = t("grandSummaryTitle");
  wrap.appendChild(title);

  if (withBalance.length === 0) {
    const none = document.createElement("div");
    none.className = "grand-summary-empty";
    none.textContent = t("grandSummaryNone");
    wrap.appendChild(none);
  } else {
    const table = document.createElement("table");
    table.className = "results-table grand-summary-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    [t("chainSection"), t("cardTopFind")].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    withBalance
      .sort((a, b) => b.nonZeroEntries.length - a.nonZeroEntries.length)
      .forEach(({ chain, nonZeroEntries }) => {
        const tr = document.createElement("tr");
        const chainTd = document.createElement("td");
        chainTd.className = "grand-summary-chain-cell";
        const icon = document.createElement("span");
        icon.className = "chain-section-icon";
        icon.textContent = chain.icon || "●";
        icon.style.background = hexToSoft(chain.color);
        icon.style.color = chain.color;
        chainTd.appendChild(icon);
        chainTd.appendChild(document.createTextNode(chain.name));
        tr.appendChild(chainTd);

        const valuesTd = document.createElement("td");
        valuesTd.className = "balance-cell";
        valuesTd.textContent = nonZeroEntries
          .map((e) => `${formatDisplay(e.total.toString())} ${e.symbol}`)
          .join(" · ");
        tr.appendChild(valuesTd);

        tbody.appendChild(tr);
      });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  if (withoutBalance.length > 0) {
    const zeroLine = document.createElement("div");
    zeroLine.className = "grand-summary-zero-line";
    zeroLine.textContent = `${t("grandSummaryZero")}: ${withoutBalance.map((f) => f.chain.name).join(", ")}`;
    wrap.appendChild(zeroLine);
  }

  return wrap;
}

function buildChainSection(chain, tokens, addresses) {
  const isMulti = selectedChainIds.length > 1;
  let container, contentHost, statusBadge = null;

  if (isMulti) {
    // در حالت چندشبکه‌ای، از details/summary بومی مرورگر استفاده می‌کنیم تا
    // بدون نیاز به جاوااسکریپت اضافه، هر شبکه قابل جمع‌شدن/بازشدن باشد.
    container = document.createElement("details");
    container.className = "chain-section chain-section-collapsible";
    container.open = true; // تا پایان بارگذاری، باز نگه داشته می‌شود

    const summary = document.createElement("summary");
    summary.className = "chain-section-heading";
    const icon = document.createElement("span");
    icon.className = "chain-section-icon";
    icon.textContent = chain.icon || "●";
    icon.style.background = hexToSoft(chain.color);
    icon.style.color = chain.color;
    const name = document.createElement("span");
    name.textContent = chain.name;
    statusBadge = document.createElement("span");
    statusBadge.className = "chain-section-status";
    statusBadge.textContent = "…";
    summary.appendChild(icon);
    summary.appendChild(name);
    summary.appendChild(statusBadge);
    container.appendChild(summary);

    contentHost = document.createElement("div");
    contentHost.className = "chain-section-body";
    container.appendChild(contentHost);
  } else {
    container = document.createElement("div");
    container.className = "chain-section";
    contentHost = container;
  }

  if (addresses.length === 0) {
    return { container, rowEls: [], totalsBar: document.createElement("div"), statusBadge };
  }

  const table = document.createElement("table");
  table.className = "results-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const cols = [t("address"), `${chain.nativeSymbol} (${t("native")})`, ...tokens.map((tk) => tk.symbol)];
  cols.forEach((c) => {
    const th = document.createElement("th");
    th.textContent = c;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rowEls = addresses.map((addr) => {
    const row = buildLoadingRow(addr, tokens);
    tbody.appendChild(row.tr);
    return row;
  });
  table.appendChild(tbody);

  const totalsBar = document.createElement("div");
  totalsBar.className = "totals-bar";

  contentHost.appendChild(table);
  contentHost.appendChild(totalsBar);

  return { container, rowEls, totalsBar, statusBadge };
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

function renderChainTotals(totalsBar, results, tokens, chain) {
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

// ===== Export CSV (multi-chain aware) =====

function exportCsv() {
  if (lastRunResults.length === 0) return;

  const lines = [];
  lastRunResults.forEach(({ chain, results, tokens }) => {
    lines.push(`# ${chain.name}`);
    const headers = ["address", chain.nativeSymbol, ...tokens.map((tk) => tk.symbol)];
    lines.push(headers.join(","));
    results.forEach((r) => {
      const nativeVal = r.native.error ? "ERROR" : r.native.formatted;
      const tokenVals = tokens.map((token) => {
        const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
        if (!tr) return "";
        return tr.error ? "ERROR" : tr.formatted;
      });
      lines.push([r.address, nativeVal, ...tokenVals].join(","));
    });
    lines.push("");
  });

  const filenamePart = lastRunResults.length === 1 ? lastRunResults[0].chain.id : "multichain";
  downloadFile(lines.join("\n"), `wallet-balances-${filenamePart}-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

// ===== Export summary report (multi-chain aware) =====

function exportSummaryReport() {
  if (lastRunResults.length === 0) return;

  const lines = [];
  lines.push(`# ${t("reportTitle")}`);
  lines.push("");
  lines.push(`- ${t("reportGenerated")}: ${new Date().toISOString()}`);
  lines.push(`- ${t("reportAddressCount")}: ${parseAddresses().filter(isAddressValidForAnySelected).length}`);
  lines.push("");

  lastRunResults.forEach(({ chain, results, tokens }) => {
    const nativeTotal = results.reduce((sum, r) => r.native.error ? sum : sum + parseFloat(r.native.formatted), 0);
    const tokenTotals = tokens.map((token) => {
      const total = results.reduce((sum, r) => {
        const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
        if (!tr || tr.error) return sum;
        return sum + parseFloat(tr.formatted);
      }, 0);
      return { symbol: token.symbol, total };
    });

    lines.push(`## ${t("reportChain")}: ${chain.name} (chainId: ${chain.chainNumericId})`);
    lines.push("");
    lines.push(`### ${t("reportTotals")}`);
    lines.push(`- ${chain.nativeSymbol}: ${formatDisplay(nativeTotal.toString())}`);
    tokenTotals.forEach((tt) => {
      lines.push(`- ${tt.symbol}: ${formatDisplay(tt.total.toString())}`);
    });
    lines.push("");
    lines.push(`| ${t("address")} | ${chain.nativeSymbol} | ${tokens.map((tk) => tk.symbol).join(" | ")} |`);
    lines.push(`|---|---|${tokens.map(() => "---").join("|")}|`);
    results.forEach((r) => {
      const nativeVal = r.native.error ? "ERR" : formatDisplay(r.native.formatted);
      const tokenVals = tokens.map((token) => {
        const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
        if (!tr) return "";
        return tr.error ? "ERR" : formatDisplay(tr.formatted);
      });
      lines.push(`| ${r.address} | ${nativeVal} | ${tokenVals.join(" | ")} |`);
    });
    lines.push("");
  });

  const filenamePart = lastRunResults.length === 1 ? lastRunResults[0].chain.id : "multichain";
  downloadFile(lines.join("\n"), `wallet-checker-report-${filenamePart}-${Date.now()}.md`, "text/markdown;charset=utf-8;");
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

// ===== Shareable report card (canvas-rendered PNG) =====
// طراحی: به‌جای نمایش یک عدد "بزرگ‌ترین موجودی" که بین توکن‌های مختلف قابل مقایسه
// نیست (مثلاً SOL با XAI)، مجموع استیبل‌کوین‌ها (USDC/USDT) را جمع می‌زنیم که چون
// هرکدام تقریباً ۱ دلار ارزش دارند، یک رقم دلاری واقعی و قابل دفاع بدون نیاز به
// API قیمت به دست می‌دهد.

function computeReportCardStats() {
  const stats = {
    totalChains: lastRunResults.length,
    chainsWithBalance: 0,
    totalAddressChecks: 0,
    stablecoinTotal: 0,
    emptyPairs: 0,
    topFindings: [], // آرایه‌ای از { amount, symbol, chainName } - حداکثر ۳ مورد
  };

  const distinctAddresses = new Set();
  const allFindings = []; // همه (شبکه، نماد، جمع) های غیرصفر برای انتخاب چندتای برتر

  lastRunResults.forEach(({ chain, results, tokens }) => {
    let chainHasBalance = false;

    const nativeTotal = results.reduce((sum, r) => {
      distinctAddresses.add(r.address);
      return r.native.error ? sum : sum + parseFloat(r.native.formatted || "0");
    }, 0);
    if (nativeTotal > 0) {
      allFindings.push({ amount: nativeTotal, symbol: chain.nativeSymbol, chainName: chain.name });
      chainHasBalance = true;
    }

    tokens.forEach((token) => {
      const tokenTotal = results.reduce((sum, r) => {
        const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
        if (!tr || tr.error) return sum;
        const val = parseFloat(tr.formatted || "0");
        const symbolUpper = token.symbol.toUpperCase();
        if (symbolUpper === "USDC" || symbolUpper === "USDT") stats.stablecoinTotal += val;
        return sum + val;
      }, 0);
      if (tokenTotal > 0) {
        allFindings.push({ amount: tokenTotal, symbol: token.symbol, chainName: chain.name });
        chainHasBalance = true;
      }
    });

    if (chainHasBalance) stats.chainsWithBalance++;

    // شمارش جفت‌های آدرس-شبکه کاملاً صفر (برای stat "empty pairs")
    results.forEach((r) => {
      const nativeVal = r.native.error ? 0 : parseFloat(r.native.formatted || "0");
      const tokensSum = tokens.reduce((s, token) => {
        const tr = r.tokens.find((tk) => tk.address.toLowerCase() === token.address.toLowerCase());
        return tr && !tr.error ? s + parseFloat(tr.formatted || "0") : s;
      }, 0);
      if (nativeVal + tokensSum === 0) stats.emptyPairs++;
    });
  });

  // انتخاب ۳ مورد برتر (فقط برای برجسته‌کردن چند یافته جالب، نه ادعای مقایسه دقیق مالی بین توکن‌های مختلف)
  stats.topFindings = allFindings.sort((a, b) => b.amount - a.amount).slice(0, 3);
  stats.totalAddressChecks = distinctAddresses.size;
  return stats;
}

async function renderReportCard() {
  const stats = computeReportCardStats();
  const canvas = reportCardCanvas;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // اطمینان از لود شدن فونت‌های کاستوم قبل از رسم متن روی canvas
  try { await document.fonts.ready; } catch (e) { /* در صورت خطا با فونت پیش‌فرض ادامه می‌دهیم */ }

  const COL_BG = "#17140f";
  const COL_PANEL = "#1e1a13";
  const COL_BORDER = "#3a3225";
  const COL_TEXT = "#ece3d1";
  const COL_TEXT_DIM = "#a89a80";
  const COL_ACCENT = "#c9a15a";

  // پس‌زمینه
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, W, H);

  // خطوط ظریف افقی، یادآور طرح دفتر حساب خود ابزار
  ctx.strokeStyle = "rgba(201,161,90,0.05)";
  ctx.lineWidth = 1;
  for (let y = 40; y < H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // برند بالای کارت
  ctx.fillStyle = COL_ACCENT;
  ctx.font = "600 22px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("◆", 60, 70);
  ctx.fillStyle = COL_TEXT;
  ctx.font = "600 24px 'Source Serif 4', Georgia, serif";
  ctx.fillText("wallet-checker", 90, 72);

  // هدلاین اصلی: مجموع استیبل‌کوین (اگر پیدا شده باشد)
  let cursorY = 180;
  if (stats.stablecoinTotal > 0) {
    ctx.fillStyle = COL_TEXT_DIM;
    ctx.font = "500 20px 'Inter', sans-serif";
    ctx.fillText(`≈ $${stats.stablecoinTotal.toFixed(2)} ${t("cardStablecoinsFound")}`, 60, cursorY);
    cursorY += 64;
    ctx.fillStyle = COL_ACCENT;
    ctx.font = "700 76px 'IBM Plex Mono', monospace";
    ctx.fillText(`$${stats.stablecoinTotal.toFixed(2)}`, 60, cursorY);
    cursorY += 70;
  } else {
    ctx.fillStyle = COL_TEXT_DIM;
    ctx.font = "500 22px 'Inter', sans-serif";
    ctx.fillText(t("cardNoStable"), 60, cursorY);
    cursorY += 70;
  }

  // خط جداکننده
  ctx.strokeStyle = COL_BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, cursorY);
  ctx.lineTo(W - 60, cursorY);
  ctx.stroke();
  cursorY += 50;

  // ردیف آمار کوچک‌تر (سه ستون)
  const statCols = [
    { label: t("cardChainsWithBalance"), value: `${stats.chainsWithBalance}/${stats.totalChains}` },
    { label: t("cardAddressesChecked"), value: stats.totalAddressChecks.toString() },
    { label: t("cardEmptyWallets"), value: stats.emptyPairs.toString() },
  ];
  const colWidth = (W - 120) / 3;
  statCols.forEach((col, i) => {
    const x = 60 + i * colWidth;
    ctx.fillStyle = COL_TEXT;
    ctx.font = "700 40px 'IBM Plex Mono', monospace";
    ctx.fillText(col.value, x, cursorY);
    ctx.fillStyle = COL_TEXT_DIM;
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText(col.label.toUpperCase(), x, cursorY + 26);
  });
  cursorY += 90;

  // بخش "موجودی‌های قابل‌توجه" - تا ۳ مورد برتر (نه فقط یکی)
  if (stats.topFindings.length > 0) {
    ctx.strokeStyle = COL_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, cursorY);
    ctx.lineTo(W - 60, cursorY);
    ctx.stroke();
    cursorY += 40;

    ctx.fillStyle = COL_TEXT_DIM;
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText(t("cardTopFind").toUpperCase(), 60, cursorY);
    cursorY += 38;

    stats.topFindings.forEach((finding) => {
      const amountStr = finding.amount < 0.000001
        ? finding.amount.toExponential(2)
        : finding.amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
      ctx.fillStyle = COL_TEXT;
      ctx.font = "600 26px 'IBM Plex Mono', monospace";
      ctx.fillText(`${amountStr} ${finding.symbol}`, 60, cursorY);
      ctx.fillStyle = COL_TEXT_DIM;
      ctx.font = "italic 400 15px 'Source Serif 4', Georgia, serif";
      ctx.fillText(finding.chainName, 460, cursorY);
      cursorY += 42;
    });
  }

  // فوتر برند
  ctx.fillStyle = COL_TEXT_DIM;
  ctx.font = "400 14px 'Inter', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(t("cardBrand"), W - 60, H - 40);
  ctx.textAlign = "left";
}

function downloadReportCardImage() {
  reportCardCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-checker-card-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ===== Boot =====
init();
