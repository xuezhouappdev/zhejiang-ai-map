(function () {
  "use strict";

  const root = document.getElementById("policyDetailRoot");
  const bcName = document.getElementById("bcPolicyName");
  if (!root) return;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));

  const getQueryId = () => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("id");
    if (raw == null || raw === "") return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : raw;
  };

  const findPolicy = id => {
    const list = window.POLICIES_DATA?.policies || [];
    if (typeof id === "number") return list.find(p => Number(p.id) === id);
    return list.find(p => String(p.id) === String(id));
  };

  const renderNotFound = () => {
    root.innerHTML = `
      <div class="policy-detail-empty">
        <p>未找到对应的政策信息。</p>
        <p style="margin-top:14px"><a href="policies.html" style="color:#1e40af;text-decoration:none">← 返回政策体系</a></p>
      </div>
    `;
    if (bcName) bcName.textContent = "未找到";
  };

  const renderPolicy = policy => {
    const name = policy.name || "未命名政策";
    if (bcName) bcName.textContent = name;
    document.title = `${name}｜浙江省人工智能高质量发展工作图谱`;

    const category = policy.category || "未分类";
    const issuer = policy.issuer || "—";
    const department = policy.department || "—";
    const date = policy.date || "—";
    const id = policy.id ?? "—";
    const pdfUrl = policy.pdfUrl || "";
    const pdfName = pdfUrl.split("/").pop() || `${name}.pdf`;

    const downloadButton = pdfUrl
      ? `<a class="policy-detail-download" href="${esc(pdfUrl)}" download="${esc(pdfName)}" aria-label="下载政策文件 PDF">
           <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
           <span>下载 PDF</span>
         </a>`
      : "";

    root.innerHTML = `
      <section class="policy-detail-hero">
        ${downloadButton}
        <span class="category-tag">所属领域：${esc(category)}</span>
        <h2>${esc(name)}</h2>
        <div class="policy-detail-meta">
          <div class="policy-detail-meta-item">
            <span>政策编号</span>
            <strong>${esc(id)}</strong>
          </div>
          <div class="policy-detail-meta-item">
            <span>发文层级</span>
            <strong>${esc(issuer)}</strong>
          </div>
          <div class="policy-detail-meta-item">
            <span>责任部门</span>
            <strong>${esc(department)}</strong>
          </div>
          <div class="policy-detail-meta-item">
            <span>发文时间</span>
            <strong>${esc(date)}</strong>
          </div>
        </div>
      </section>

      <section class="policy-detail-card">
        <h3>政策摘要</h3>
        <p class="placeholder-text">
          政策摘要、政策正文、配套实施细则等内容将在此展示。
          当前版本仅展示政策基础信息，更多详情请关注后续版本更新。
        </p>
      </section>

      <section class="policy-detail-card">
        <h3>详细信息</h3>
        <dl>
          <dt>政策名称</dt><dd>${esc(name)}</dd>
          <dt>所属领域</dt><dd>${esc(category)}</dd>
          <dt>发文层级</dt><dd>${esc(issuer)}</dd>
          <dt>责任部门</dt><dd>${esc(department)}</dd>
          <dt>发文时间</dt><dd>${esc(date)}</dd>
        </dl>
      </section>
    `;
  };

  const id = getQueryId();
  if (id == null) {
    renderNotFound();
    return;
  }
  const policy = findPolicy(id);
  if (!policy) {
    renderNotFound();
    return;
  }
  renderPolicy(policy);
})();