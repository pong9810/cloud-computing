// ★ 記得換成實際 IP ★
const A_URL = 'http://電腦A的實際IP';
const B_URL = 'http://電腦B的實際IP';

const employeeColumns = [
  "員工編號", "姓名", "部門",
  "補習班時數", "補習班時薪",
  "家教時數", "家教時薪",
  "出差天數", "出差津貼",
  "獎金", "扣款",
];

const numericColumns = new Set([
  "補習班時數", "補習班時薪",
  "家教時數", "家教時薪",
  "出差天數", "出差津貼",
  "獎金", "扣款",
]);

const state = {
  editingId: null,
  lastDeletedEmployee: null,
};

const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const searchForm = document.getElementById("search-form");
const searchResult = document.getElementById("search-result");
const employeeForm = document.getElementById("employee-form");
const formMessage = document.getElementById("form-message");
const cancelEditButton = document.getElementById("cancel-edit");
const undoDeleteButton = document.getElementById("undo-delete");
const refreshButton = document.getElementById("refresh-btn");
const sortSelect = document.getElementById("sort-select");
const tableBody = document.getElementById("employee-table-body");

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error-text", isError);
}

function getFormPayload() {
  const payload = {};
  employeeColumns.forEach((column) => {
    const input = employeeForm.elements.namedItem(column);
    const rawValue = input ? input.value : "";
    payload[column] = numericColumns.has(column)
      ? Number(rawValue || 0)
      : String(rawValue || "").trim();
  });
  return payload;
}

function resetEmployeeForm() {
  employeeForm.reset();
  state.editingId = null;
  document.getElementById("submit-employee").textContent = "新增員工";
  document.getElementById("emp-id").disabled = false;
  cancelEditButton.hidden = true;
}

function setUndoDeleteState(employee = null) {
  state.lastDeletedEmployee = employee;
  undoDeleteButton.hidden = !employee;
}

function fillEmployeeForm(employee) {
  employeeColumns.forEach((column) => {
    const input = employeeForm.elements.namedItem(column);
    if (input) input.value = employee[column] ?? "";
  });
  state.editingId = employee["員工編號"];
  document.getElementById("submit-employee").textContent = "儲存修改";
  document.getElementById("emp-id").disabled = true;
  cancelEditButton.hidden = false;
  window.scrollTo({ top: employeeForm.offsetTop - 40, behavior: "smooth" });
}

function renderSearchResults(employees) {
  if (!employees.length) {
    searchResult.innerHTML = '<div class="empty-state">找不到符合條件的員工</div>';
    return;
  }
  searchResult.innerHTML = employees.map((employee) => `
    <article class="result-card">
      <div>
        <strong>${employee["姓名"]}</strong>
        <span>${employee["員工編號"]} ・ ${employee["部門"]}</span>
      </div>
      <div class="result-salary">${formatCurrency(employee["個人薪資"])}</div>
    </article>
  `).join("");
}

function renderSummary(summary) {
  document.getElementById("employee-count").textContent = summary.employee_count ?? 0;
  document.getElementById("total-salary").textContent = formatCurrency(summary.total_salary);
  document.getElementById("average-salary").textContent = formatCurrency(summary.average_salary);

  const departmentList = document.getElementById("department-list");
  const departmentEntries = Object.entries(summary.department_totals || {});
  departmentList.innerHTML = departmentEntries.length
    ? departmentEntries.map(([department, total]) =>
        `<li><span>${department}</span><strong>${formatCurrency(total)}</strong></li>`
      ).join("")
    : '<li class="empty-list">尚無部門資料</li>';

  document.getElementById("highest-paid").innerHTML = summary.highest_paid
    ? `<strong>${summary.highest_paid["姓名"]}</strong>
       <span>${summary.highest_paid["員工編號"]}</span>
       <b>${formatCurrency(summary.highest_paid["個人薪資"])}</b>`
    : "尚無資料";

  document.getElementById("lowest-paid").innerHTML = summary.lowest_paid
    ? `<strong>${summary.lowest_paid["姓名"]}</strong>
       <span>${summary.lowest_paid["員工編號"]}</span>
       <b>${formatCurrency(summary.lowest_paid["個人薪資"])}</b>`
    : "尚無資料";
}

function getEmployeeNumberValue(employeeId) {
  const match = String(employeeId || "").match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortEmployees(employees) {
  const sortedEmployees = [...employees];
  switch (sortSelect.value) {
    case "employee-desc":
      sortedEmployees.sort((a, b) => getEmployeeNumberValue(b["員工編號"]) - getEmployeeNumberValue(a["員工編號"]));
      break;
    case "salary-desc":
      sortedEmployees.sort((a, b) => Number(b["個人薪資"] || 0) - Number(a["個人薪資"] || 0));
      break;
    case "salary-asc":
      sortedEmployees.sort((a, b) => Number(a["個人薪資"] || 0) - Number(b["個人薪資"] || 0));
      break;
    default:
      sortedEmployees.sort((a, b) => getEmployeeNumberValue(a["員工編號"]) - getEmployeeNumberValue(b["員工編號"]));
  }
  return sortedEmployees;
}

function renderEmployees(employees) {
  if (!employees.length) {
    tableBody.innerHTML = '<tr><td colspan="13" class="empty-row">目前沒有員工資料</td></tr>';
    return;
  }
  tableBody.innerHTML = sortEmployees(employees).map((employee) => `
    <tr>
      <td>${employee["員工編號"]}</td>
      <td>${employee["姓名"]}</td>
      <td>${employee["部門"]}</td>
      <td>${employee["補習班時數"]}</td>
      <td>${employee["補習班時薪"]}</td>
      <td>${employee["家教時數"]}</td>
      <td>${employee["家教時薪"]}</td>
      <td>${employee["出差天數"]}</td>
      <td>${employee["出差津貼"]}</td>
      <td>${employee["獎金"]}</td>
      <td>${employee["扣款"]}</td>
      <td class="salary-cell">${formatCurrency(employee["個人薪資"] || 0)}</td>
      <td>
        <div class="action-group">
          <button type="button" class="table-button edit-button" data-action="edit" data-id="${employee["員工編號"]}">編輯</button>
          <button type="button" class="table-button delete-button" data-action="delete" data-id="${employee["員工編號"]}">刪除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失敗");
  return data;
}

async function loadDashboard() {
  try {
    // 向 B 電腦要計算結果
    const report = await fetchJson(`${B_URL}/calculate/all`);
    renderSummary(report.total_salary);
    renderEmployees(report.employees);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="13" class="empty-row">${error.message}</td></tr>`;
  }
}

// 上傳 Excel → 送到 A
uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById("excel-file");
  if (!fileInput.files.length) {
    setStatus(uploadMessage, "請先選擇 Excel 檔案", true);
    return;
  }
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  try {
    const data = await fetchJson(`${A_URL}/api/upload`, { method: "POST", body: formData });
    setStatus(uploadMessage, `${data.message}，已更新薪資資料。`);
    await loadDashboard();
  } catch (error) {
    setStatus(uploadMessage, error.message, true);
  }
});

// 查詢員工 → 先問 B 算薪資，B 再去拿 A 的資料
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const keyword = document.getElementById("search-keyword").value.trim();
  if (!keyword) {
    searchResult.innerHTML = '<div class="empty-state">請輸入員工編號或姓名</div>';
    return;
  }
  try {
    const data = await fetchJson(`${A_URL}/api/employees/search?keyword=${encodeURIComponent(keyword)}`);
    // 幫搜尋結果算薪資
    const withSalary = data.employees.map(emp => ({
      ...emp,
      個人薪資: (emp['補習班時數'] * emp['補習班時薪']) +
                (emp['家教時數'] * emp['家教時薪']) +
                (emp['出差天數'] * emp['出差津貼']) +
                emp['獎金'] - emp['扣款']
    }));
    renderSearchResults(withSalary);
  } catch (error) {
    searchResult.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
});

// 新增 / 編輯員工 → 送到 A
employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getFormPayload();
  const isEditing = Boolean(state.editingId);
  const url = isEditing
    ? `${A_URL}/api/employees/${encodeURIComponent(state.editingId)}`
    : `${A_URL}/api/employees`;
  const method = isEditing ? "PUT" : "POST";
  try {
    const data = await fetchJson(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(formMessage, data.message);
    resetEmployeeForm();
    await loadDashboard();
  } catch (error) {
    setStatus(formMessage, error.message, true);
  }
});

cancelEditButton.addEventListener("click", () => {
  resetEmployeeForm();
  setStatus(formMessage, "已取消編輯");
});

undoDeleteButton.addEventListener("click", async () => {
  if (!state.lastDeletedEmployee) return;
  try {
    const data = await fetchJson(`${A_URL}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.lastDeletedEmployee),
    });
    setStatus(formMessage, `${data.employee["姓名"]} 已恢復`);
    setUndoDeleteState(null);
    await loadDashboard();
  } catch (error) {
    setStatus(formMessage, error.message, true);
  }
});

refreshButton.addEventListener("click", async () => { await loadDashboard(); });
sortSelect.addEventListener("change", async () => { await loadDashboard(); });

tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const employeeId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    try {
      const employee = await fetchJson(`${A_URL}/api/employees/${encodeURIComponent(employeeId)}`);
      fillEmployeeForm(employee);
      setStatus(formMessage, `正在編輯 ${employee["姓名"]} 的資料`);
    } catch (error) {
      setStatus(formMessage, error.message, true);
    }
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`確定要刪除員工 ${employeeId} 嗎？`);
    if (!confirmed) return;
    try {
      const deletedEmployee = await fetchJson(`${A_URL}/api/employees/${encodeURIComponent(employeeId)}`);
      const data = await fetchJson(`${A_URL}/api/employees/${encodeURIComponent(employeeId)}`, { method: "DELETE" });
      setUndoDeleteState(deletedEmployee);
      setStatus(formMessage, `${data.message}，可按下方按鈕復原`);
      if (state.editingId === employeeId) resetEmployeeForm();
      await loadDashboard();
    } catch (error) {
      setStatus(formMessage, error.message, true);
    }
  }
});

resetEmployeeForm();
loadDashboard();