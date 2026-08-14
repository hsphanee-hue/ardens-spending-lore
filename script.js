const STORAGE_KEY = "strawberry_matcha_purchases";
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzyW5_Ij6tFqCb_lxOcoT-8uhwGuEmkBYahZVxXyuY735amN_LBOXsEJkEi3Vn1C3_aEw/exec";

let purchases = loadPurchases();

// Load data from LocalStorage
function loadPurchases() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch (e) {
        return [];
    }
}

async function fetchPurchasesFromSheet() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const dataFromSheet = await response.json();

        if (Array.isArray(dataFromSheet) && dataFromSheet.length > 0) {
            purchases = dataFromSheet.map(item => ({
                id: String(item.id || ''),
                itemName: item.itemName || 'No Name',
                channel: item.channel || 'N/A',
                category: item.category || 'General',
                status: item.status || 'Pending',
                date: item.date ? String(item.date).split('T')[0] : '',
                itemPrice: Number(item.itemPrice) || 0,
                itemPaymentStatus: item.itemPaymentStatus || 'Not Applicable',
                emsPrice: Number(item.emsPrice) || 0,
                emsPaymentStatus: item.emsPaymentStatus || 'Not Applicable',
                postagePrice: Number(item.postagePrice) || 0,
                postagePaymentStatus: item.postagePaymentStatus || 'Not Applicable',
                remarks: item.remarks || ''
            }));

            savePurchases();
            renderAll(); 
            console.log("Data import successfully");
        }
    } catch (error) {
        console.error("Data import failed:", error);
    }
}

// Save data to LocalStorage
function savePurchases() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
}

let navItems, pages, viewAllBtn, menuToggle, sidebar;
let modal, closeModalBtn, cancelModalBtn, purchaseForm, modalTitle;
let addBtn1, addBtn2;
let editIndexInput, itemNameInput, channelInput, categoryInput, statusInput, dateInput;
let itemPriceInput, itemPaymentInput, emsPriceInput, emsPaymentInput, postagePriceInput, postagePaymentInput, remarksInput, totalPreview;
let searchInput, statusFilter, sortOrder;

document.addEventListener("DOMContentLoaded", () => {
    // Bind Navigation & Layout
    navItems = document.querySelectorAll(".nav-item");
    pages = document.querySelectorAll(".page");
    viewAllBtn = document.getElementById("viewAllBtn");
    menuToggle = document.getElementById("menuToggle");
    sidebar = document.getElementById("sidebar");

    // Bind Modal & Buttons
    modal = document.getElementById("purchaseModal");
    closeModalBtn = document.getElementById("closeModalBtn");
    cancelModalBtn = document.getElementById("cancelModalBtn");
    purchaseForm = document.getElementById("purchaseForm");
    modalTitle = document.getElementById("modalTitle");

    addBtn1 = document.getElementById("addPurchaseBtn1");
    addBtn2 = document.getElementById("addPurchaseBtn2");

    // Bind Form Inputs 
    editIndexInput = document.getElementById("editIndex");
    itemNameInput = document.getElementById("itemName");
    channelInput = document.getElementById("channel");
    categoryInput = document.getElementById("category");
    statusInput = document.getElementById("status");
    dateInput = document.getElementById("date");
    
    itemPriceInput = document.getElementById("itemPrice");
    itemPaymentInput = document.getElementById("itemPayment");
    
    emsPriceInput = document.getElementById("emsPrice");
    emsPaymentInput = document.getElementById("emsPaymentStatus");
    
    postagePriceInput = document.getElementById("postagePrice");
    postagePaymentInput = document.getElementById("postagePaymentStatus");
    
    remarksInput = document.getElementById("remarks");
    totalPreview = document.getElementById("totalPreview");

    // Bind Filters
    searchInput = document.getElementById("searchInput");
    statusFilter = document.getElementById("statusFilter");
    sortOrder = document.getElementById("sortOrder");

    // Init Functions
    initNavigation();
    initModalEvents();
    initFormCalculations();
    initFilters();
    renderAll();

    // Fetch latest from sheet
    fetchPurchasesFromSheet();
});

function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const pageId = item.getAttribute("data-page");
            switchPage(pageId);
            if (window.innerWidth <= 820 && sidebar) {
                sidebar.classList.remove("open");
            }
        });
    });

    if (viewAllBtn) viewAllBtn.addEventListener("click", () => switchPage("purchasesPage"));
    if (menuToggle) menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
}

function switchPage(pageId) {
    navItems.forEach(nav => nav.classList.toggle("active", nav.getAttribute("data-page") === pageId));
    pages.forEach(page => page.classList.toggle("active-page", page.id === pageId));
}

function initModalEvents() {
    if (addBtn1) addBtn1.addEventListener("click", () => openModal());
    if (addBtn2) addBtn2.addEventListener("click", () => openModal());

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (purchaseForm) purchaseForm.addEventListener("submit", handleFormSubmit);
}

window.openModal = function(editIdx = -1) {
    purchaseForm.reset();
    editIndexInput.value = editIdx;

    if (editIdx >= 0 && purchases[editIdx]) {
        const item = purchases[editIdx];
        modalTitle.textContent = "Edit Purchase";
        
        itemNameInput.value = item.itemName || "";
        channelInput.value = item.channel || "";
        categoryInput.value = item.category || "";
        statusInput.value = item.status || "Pending";
        dateInput.value = item.date || "";
        
        itemPriceInput.value = item.itemPrice !== undefined ? item.itemPrice : "";
        itemPaymentInput.value = item.itemPaymentStatus || "Unpaid";
        
        emsPriceInput.value = item.emsPrice !== undefined ? item.emsPrice : "";
        emsPaymentInput.value = item.emsPaymentStatus || "Not Applicable";
        
        postagePriceInput.value = item.postagePrice !== undefined ? item.postagePrice : "";
        postagePaymentInput.value = item.postagePaymentStatus || "Not Applicable";
        
        remarksInput.value = item.remarks || "";
    } else {
        modalTitle.textContent = "Add New Purchase";
        dateInput.value = new Date().toISOString().split("T")[0];
    }

    calculateTotalPreview();
    modal.classList.add("open");
};

function closeModal() {
    if (modal) modal.classList.remove("open");
}

function initFormCalculations() {
    const inputs = [itemPriceInput, emsPriceInput, postagePriceInput];
    inputs.forEach(input => {
        if (input) input.addEventListener("input", calculateTotalPreview);
    });
}

function calculateTotalPreview() {
    const item = parseFloat(itemPriceInput.value) || 0;
    const ems = parseFloat(emsPriceInput.value) || 0;
    const postage = parseFloat(postagePriceInput.value) || 0;
    const total = item + ems + postage;
    if (totalPreview) totalPreview.textContent = `RM ${total.toFixed(2)}`;
}

function handleFormSubmit(e) {
    e.preventDefault();

    const idx = parseInt(editIndexInput.value, 10);
    const isEdit = idx >= 0;

    const itemData = {
        action: isEdit ? "update" : "add",
        id: isEdit ? purchases[idx].id : `PUR-${String(Date.now()).slice(-4)}`,
        itemName: itemNameInput.value.trim(),
        channel: channelInput.value.trim() || "N/A",
        category: categoryInput.value.trim() || "General",
        status: statusInput.value,
        date: dateInput.value,
        itemPrice: parseFloat(itemPriceInput.value) || 0,
        itemPaymentStatus: itemPaymentInput.value,
        emsPrice: parseFloat(emsPriceInput.value) || 0,
        emsPaymentStatus: emsPaymentInput.value,
        postagePrice: parseFloat(postagePriceInput.value) || 0,
        postagePaymentStatus: postagePaymentInput.value,
        remarks: remarksInput.value.trim()
    };

    if (isEdit) {
        purchases[idx] = itemData; 
    } else {
        purchases.unshift(itemData); 
    }

    // Auto-sync ke Google Sheets (Sama ada ADD atau EDIT)
    syncToGoogleSheet(itemData);

    savePurchases();
    closeModal();
    renderAll();
}

function syncToGoogleSheet(data) {
    if (!GOOGLE_SHEET_URL) return;

    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("Sync Error:", err));
}

function initFilters() {
    if (searchInput) searchInput.addEventListener("input", renderTable);
    if (statusFilter) statusFilter.addEventListener("change", renderTable);
    if (sortOrder) sortOrder.addEventListener("change", renderTable);
}

function getFilteredPurchases() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const status = statusFilter ? statusFilter.value : "ALL";
    const sort = sortOrder ? sortOrder.value : "NEWEST";

    let filtered = purchases.filter(item => {
        const matchesSearch = (item.itemName || "").toLowerCase().includes(search) ||
                              (item.channel || "").toLowerCase().includes(search) ||
                              (item.id || "").toLowerCase().includes(search);
        const matchesStatus = status === "ALL" || item.status === status;
        return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
        const totalA = (Number(a.itemPrice) || 0) + (Number(a.emsPrice) || 0) + (Number(a.postagePrice) || 0);
        const totalB = (Number(b.itemPrice) || 0) + (Number(b.emsPrice) || 0) + (Number(b.postagePrice) || 0);

        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;

        if (sort === "NEWEST") return dateB - dateA;
        if (sort === "OLDEST") return dateA - dateB;
        if (sort === "PRICE_HIGH") return totalB - totalA;
        if (sort === "PRICE_LOW") return totalA - totalB;
        return 0;
    });

    return filtered;
}

function renderAll() {
    renderDashboardStats();
    renderRecentDashboard();
    renderTable();
}

function renderDashboardStats() {
    let secured = 0, pending = 0, received = 0, other = 0;
    let pendingPaymentSum = 0;
    let pendingRefundSum = 0;
    let breakdownItemSum = 0, breakdownEmsSum = 0, breakdownPostageSum = 0;
    let grandTotalSpent = 0;

    purchases.forEach(item => {
        const itemP = item.itemPrice || 0;
        const emsP = item.emsPrice || 0;
        const postP = item.postagePrice || 0;
        const total = itemP + emsP + postP;

        if (item.status === "Secured") secured++;
        else if (item.status === "Pending") pending++;
        else if (item.status === "Received") received++;
        else other++;

        const isSpent = item.status !== "Not Secured" && item.status !== "Cancelled";

        if (isSpent) {
            breakdownItemSum += itemP;
            breakdownEmsSum += emsP;
            breakdownPostageSum += postP;
            grandTotalSpent += total;
        }

        if (item.itemPaymentStatus === "Unpaid") pendingPaymentSum += itemP;
        if (item.emsPaymentStatus === "Unpaid") pendingPaymentSum += emsP;
        if (item.postagePaymentStatus === "Unpaid") pendingPaymentSum += postP;

        if (item.itemPaymentStatus === "Refund Pending") pendingRefundSum += itemP;
        if (item.emsPaymentStatus === "Refund Pending") pendingRefundSum += emsP;
        if (item.postagePaymentStatus === "Refund Pending") pendingRefundSum += postP;
    });

    const elSecured = document.getElementById("statSecured");
    const elPending = document.getElementById("statPending");
    const elReceived = document.getElementById("statReceived");
    const elOther = document.getElementById("statOther");

    if (elSecured) elSecured.textContent = secured;
    if (elPending) elPending.textContent = pending;
    if (elReceived) elReceived.textContent = received;
    if (elOther) elOther.textContent = other;

    const elPendingPay = document.getElementById("statPendingPayment");
    const elPendingRef = document.getElementById("statPendingRefund");

    if (elPendingPay) elPendingPay.textContent = `RM ${pendingPaymentSum.toFixed(2)}`;
    if (elPendingRef) elPendingRef.textContent = `RM ${pendingRefundSum.toFixed(2)}`;

    const elBkItem = document.getElementById("breakdownItem");
    const elBkEms = document.getElementById("breakdownEms");
    const elBkPost = document.getElementById("breakdownPostage");

    if (elBkItem) elBkItem.textContent = `RM ${breakdownItemSum.toFixed(2)}`;
    if (elBkEms) elBkEms.textContent = `RM ${breakdownEmsSum.toFixed(2)}`;
    if (elBkPost) elBkPost.textContent = `RM ${breakdownPostageSum.toFixed(2)}`;

    const elTotalSpent = document.getElementById("totalSpent");
    const elTotalCount = document.getElementById("totalCount");

    if (elTotalSpent) elTotalSpent.textContent = `RM ${grandTotalSpent.toFixed(2)}`;
    if (elTotalCount) elTotalCount.textContent = `${purchases.length} items`;
}

function renderRecentDashboard() {
    const listContainer = document.getElementById("recentPurchasesList");
    const emptyState = document.getElementById("emptyDashboard");

    if (!listContainer) return;

    if (purchases.length === 0) {
        listContainer.style.display = "none";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    listContainer.style.display = "block";
    if (emptyState) emptyState.style.display = "none";

    const recent = purchases.slice(0, 4);
    listContainer.innerHTML = recent.map(item => {
        const total = (item.itemPrice || 0) + (item.emsPrice || 0) + (item.postagePrice || 0);
        return `
            <div class="purchase-card">
                <div>
                    <div class="item-id">${escapeHTML(item.id)}</div>
                    <div class="item-name">${escapeHTML(item.itemName)}</div>
                    <div class="item-category">${escapeHTML(item.category)}</div>
                </div>
                <div class="channel-name">${escapeHTML(item.channel)}</div>
                <div class="amount">RM ${total.toFixed(2)}</div>
                <div class="card-statuses">
                    <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHTML(item.status)}</span>
                    <div class="payment-summary">
                        ${createPaymentMini("Item", item.itemPaymentStatus)}
                        ${createPaymentMini("EMS", item.emsPaymentStatus)}
                        ${createPaymentMini("Postage", item.postagePaymentStatus)}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderTable() {
    const tableBody = document.getElementById("purchasesTableBody");
    const emptyState = document.getElementById("emptyPurchases");
    if (!tableBody) return;

    const filtered = getFilteredPurchases();

    if (filtered.length === 0) {
        tableBody.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";
    tableBody.innerHTML = filtered.map(item => {
        const origIdx = purchases.findIndex(p => p.id === item.id);
        const total = (item.itemPrice || 0) + (item.emsPrice || 0) + (item.postagePrice || 0);

        return `
            <tr>
                <td>
                    <div class="table-id">${escapeHTML(item.id)}</div>
                    <div class="table-item"><strong>${escapeHTML(item.itemName)}</strong></div>
                    <small style="color: var(--matcha-muted);">${escapeHTML(item.date || 'No Date')}</small>
                </td>
                <td>
                    <div>${escapeHTML(item.channel)}</div>
                    <small style="color: var(--matcha-muted);">${escapeHTML(item.category)}</small>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHTML(item.status)}</span>
                </td>
                <td>
                    <div class="payment-summary">
                        ${createPaymentMini("Item", item.itemPaymentStatus)}
                        ${createPaymentMini("EMS", item.emsPaymentStatus)}
                        ${createPaymentMini("Postage", item.postagePaymentStatus)}
                    </div>
                </td>
                <td><strong>RM ${total.toFixed(2)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-button" onclick="openModal(${origIdx})" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="icon-button" onclick="deletePurchase(${origIdx})" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

window.deletePurchase = function(idx) {
    if (confirm("girl are you sure about this?")) {
        const deletedItem = purchases[idx];
        
        // Remove from memory & local storage
        purchases.splice(idx, 1);
        savePurchases();
        renderAll();

        // Sync delete action to Google Sheets
        if (deletedItem && deletedItem.id) {
            syncToGoogleSheet({
                action: "delete",
                id: deletedItem.id
            });
        }
    }
};

function getStatusBadgeClass(status) {
    switch (status) {
        case "Secured": return "status-secured";
        case "Pending": return "status-pending";
        case "Received": return "status-received";
        case "Cancelled": return "status-cancelled";
        default: return "status-not-secured";
    }
}

function createPaymentMini(label, status) {
    if (!status || status === "Not Applicable") return "";
    const safeClass = escapeHTML(status).replace(/\s+/g, '-');
    return `
        <span class="payment-mini ${safeClass}" title="${escapeHTML(label)}: ${escapeHTML(status)}">
            ${escapeHTML(label)} · ${escapeHTML(status)}
        </span>
    `;
}

function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, match => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[match];
    });
}