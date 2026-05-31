const stateKey = "ai-review-booster-responses";

const fields = {
  businessName: document.querySelector("#business-name"),
  googleLink: document.querySelector("#google-link"),
  whatsappNumber: document.querySelector("#whatsapp-number"),
  customerName: document.querySelector("#customer-name"),
  inviteMessage: document.querySelector("#invite-message"),
  feedbackBusiness: document.querySelector("#feedback-business"),
  reviewSuggestion: document.querySelector("#review-suggestion"),
  googleReviewBtn: document.querySelector("#google-review-btn"),
  privateNote: document.querySelector("#private-note"),
  submitState: document.querySelector("#submit-state"),
};

const views = {
  dashboard: document.querySelector("#dashboard-view"),
  feedback: document.querySelector("#feedback-view"),
};

const responsesTable = document.querySelector("#responses-table");
const happyFlow = document.querySelector("#happy-flow");
const privateFlow = document.querySelector("#private-flow");
const ratingButtons = Array.from(document.querySelectorAll("[data-rating]"));

let selectedRating = 0;

function loadResponses() {
  const raw = localStorage.getItem(stateKey);
  if (!raw) return seedResponses();
  try {
    return JSON.parse(raw);
  } catch {
    return seedResponses();
  }
}

function seedResponses() {
  const now = new Date();
  return [
    {
      customer: "سارة",
      rating: 5,
      status: "happy",
      note: "تجربة ممتازة والخدمة سريعة",
      createdAt: new Date(now.getTime() - 1000 * 60 * 42).toISOString(),
    },
    {
      customer: "عبدالله",
      rating: 2,
      status: "private",
      note: "انتظرت وقت طويل قبل الرد",
      createdAt: new Date(now.getTime() - 1000 * 60 * 84).toISOString(),
    },
  ];
}

function saveResponses(responses) {
  localStorage.setItem(stateKey, JSON.stringify(responses));
}

function getResponses() {
  const responses = loadResponses();
  saveResponses(responses);
  return responses;
}

function updateInviteMessage() {
  const business = fields.businessName.value.trim() || "النشاط";
  const customer = fields.customerName.value.trim() || "عميلنا";
  const url = `${location.origin}${location.pathname}#feedback`;
  fields.feedbackBusiness.textContent = business;
  fields.googleReviewBtn.href = fields.googleLink.value.trim() || "#";
  fields.reviewSuggestion.value = `تجربتي مع ${business} كانت ممتازة، الخدمة واضحة والتعامل احترافي.`;
  fields.inviteMessage.value =
    `السلام عليكم ${customer}، سعدنا بخدمتك في ${business}.\n\n` +
    `نقدر تقييمك للتجربة من هنا:\n${url}\n\n` +
    `إذا كانت تجربتك ممتازة بنرسل لك رابط تقييم Google، وإذا عندك ملاحظة توصل لنا بشكل خاص ونحلها.`;
}

function renderMetrics(responses) {
  const total = responses.length;
  const happy = responses.filter((item) => item.status === "happy").length;
  const privateCount = responses.filter((item) => item.status === "private").length;
  const average = total
    ? responses.reduce((sum, item) => sum + item.rating, 0) / total
    : 0;

  document.querySelector("#metric-total").textContent = total;
  document.querySelector("#metric-happy").textContent = happy;
  document.querySelector("#metric-private").textContent = privateCount;
  document.querySelector("#metric-average").textContent = average.toFixed(1);
}

function renderTable(responses) {
  responsesTable.innerHTML = "";
  responses
    .slice()
    .reverse()
    .forEach((item) => {
      const row = document.createElement("tr");
      const statusText = item.status === "happy" ? "تحويل إلى Google" : "شكوى خاصة";
      const date = new Intl.DateTimeFormat("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(new Date(item.createdAt));

      row.innerHTML = `
        <td>${escapeHtml(item.customer)}</td>
        <td>${item.rating} / 5</td>
        <td><span class="status ${item.status}">${statusText}</span></td>
        <td>${escapeHtml(item.note || "-")}</td>
        <td>${date}</td>
      `;
      responsesTable.appendChild(row);
    });
}

function renderDashboard() {
  const responses = getResponses();
  renderMetrics(responses);
  renderTable(responses);
  updateInviteMessage();
}

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
  if (name === "feedback") {
    location.hash = "feedback";
  } else {
    history.replaceState(null, "", location.pathname);
    renderDashboard();
  }
}

function setRating(rating) {
  selectedRating = rating;
  ratingButtons.forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.rating) === rating);
  });
  fields.submitState.textContent = "";
  happyFlow.classList.toggle("hidden", rating < 4);
  privateFlow.classList.toggle("hidden", rating >= 4);

  if (rating >= 4) {
    addResponse({
      customer: fields.customerName.value.trim() || "عميل جديد",
      rating,
      status: "happy",
      note: "عميل راضي، تم توجيهه لتقييم Google",
    });
    fields.submitState.textContent = "تم تسجيل العميل كعميل راضي.";
  }
}

function addResponse(item) {
  const responses = getResponses();
  responses.push({
    ...item,
    createdAt: new Date().toISOString(),
  });
  saveResponses(responses);
}

function exportCsv() {
  const rows = [["customer", "rating", "status", "note", "createdAt"]];
  getResponses().forEach((item) => {
    rows.push([item.customer, item.rating, item.status, item.note, item.createdAt]);
  });
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-review-booster-responses.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#open-feedback-demo").addEventListener("click", () => showView("feedback"));
document.querySelector("#back-dashboard").addEventListener("click", () => showView("dashboard"));
document.querySelector("#export-csv").addEventListener("click", exportCsv);
document.querySelector("#reset-demo").addEventListener("click", () => {
  localStorage.removeItem(stateKey);
  renderDashboard();
});
document.querySelector("#copy-invite").addEventListener("click", async () => {
  updateInviteMessage();
  await navigator.clipboard.writeText(fields.inviteMessage.value);
  fields.inviteMessage.focus();
});
document.querySelector("#send-private").addEventListener("click", () => {
  if (!selectedRating || selectedRating > 3) return;
  addResponse({
    customer: fields.customerName.value.trim() || "عميل جديد",
    rating: selectedRating,
    status: "private",
    note: fields.privateNote.value.trim() || "لم يكتب العميل تفاصيل إضافية",
  });
  fields.submitState.textContent = "تم إرسال الملاحظة لصاحب النشاط بشكل خاص.";
  fields.privateNote.value = "";
});

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => setRating(Number(button.dataset.rating)));
});

[fields.businessName, fields.googleLink, fields.whatsappNumber, fields.customerName].forEach((field) => {
  field.addEventListener("input", updateInviteMessage);
});

if (location.hash === "#feedback") {
  showView("feedback");
} else {
  renderDashboard();
}
