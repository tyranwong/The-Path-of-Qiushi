/* ============================================================
   求是之路 · 西迁1940 —— 游戏引擎
   功能：三值栏 / 剧情卡 / 结局判定 / localStorage 存档 /
         校史卡逐张解锁 + 非阻塞弹出 / 西迁路线迷你图 / 图鉴
   依赖：window.STORY（data/story.js）、window.HISTORY（data/history.js）
   ============================================================ */
(function () {
  "use strict";

  var SAVE_KEY = "qszl-save-v1";

  var DIMS = [
    { key: "qz", label: "求真" },
    { key: "ws", label: "务实" },
    { key: "dd", label: "担当" },
  ];
  var STATIONS = [
    { label: "杭州" }, { label: "建德" }, { label: "泰和" }, { label: "宜山" }, { label: "湄潭" }
  ];

  var state = {
    current: null,
    values: { qz: 5, ws: 5, dd: 5 },
    unlockedEndings: [],
    unlockedHistory: [],
  };

  /* ---------- 工具 ---------- */
  function clamp(v) { return Math.max(0, Math.min(10, v)); }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function show(id) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.add("hidden");
    $(id).classList.remove("hidden");
  }

  /* ---------- 存档 ---------- */
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || typeof d !== "object") return false;
      state.current = d.current || null;
      state.values = d.values || { qz: 5, ws: 5, dd: 5 };
      state.unlockedEndings = d.unlockedEndings || [];
      state.unlockedHistory = d.unlockedHistory || [];
      if (d.historyUnlocked) state.unlockedHistory = (window.HISTORY || []).map(function (h) { return h.id; });
      return true;
    } catch (e) { return false; }
  }
  function resetRun() { state.current = null; state.values = { qz: 5, ws: 5, dd: 5 }; save(); }

  /* ---------- 结局判定 ---------- */
  function judgeEnding(v) {
    var qz = v.qz, ws = v.ws, dd = v.dd;
    if (qz >= 7 && ws >= 7 && dd >= 7) return "ending_xinhuo";
    if (qz <= 3 && ws <= 3 && dd <= 3) return "ending_zailai";
    var max = Math.max(qz, ws, dd);
    if (qz === max) return "ending_qiushi";
    if (ws === max) return "ending_shigan";
    return "ending_dandang";
  }

  /* ---------- 三值栏 ---------- */
  function renderHud() {
    for (var i = 0; i < DIMS.length; i++) {
      var d = DIMS[i];
      $("bar-" + d.key).style.width = (state.values[d.key] * 10) + "%";
      $("val-" + d.key).textContent = state.values[d.key];
    }
  }
  function applyDelta(delta) {
    if (!delta) return;
    for (var k in delta) {
      if (Object.prototype.hasOwnProperty.call(state.values, k)) state.values[k] = clamp(state.values[k] + delta[k]);
    }
    renderHud();
  }

  /* ---------- 校史卡 ---------- */
  function historyById(id) {
    var arr = window.HISTORY || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function stationOf(id) {
    var n = parseInt(String(id).replace(/\D/g, ""), 10);
    if (isNaN(n)) return null;
    if (n <= 4) return 0;
    if (n <= 8) return 1;
    if (n <= 12) return 2;
    if (n <= 16) return 3;
    return 4;
  }

  /* ---------- 迷你路线图 ---------- */
  function renderRouteMap(station) {
    var wrap = $("route-map-stations");
    wrap.innerHTML = "";
    for (var i = 0; i < STATIONS.length; i++) {
      var cls = "rm-station";
      if (i < station) cls += " done";
      else if (i === station) cls += " cur";
      var el = document.createElement("div");
      el.className = cls;
      el.innerHTML = '<span class="rm-dot"></span><span class="rm-label">' + STATIONS[i].label + '</span>';
      wrap.appendChild(el);
    }
  }

  /* ---------- 校史卡解锁 + 非阻塞弹出 ---------- */
  function unlockHistory(card) {
    var newly = [];
    (card.history || []).forEach(function (id) {
      if (state.unlockedHistory.indexOf(id) === -1) { state.unlockedHistory.push(id); newly.push(id); }
    });
    if (newly.length) showToast(newly);
  }
  function showToast(ids) {
    var t = $("toast");
    var inner;
    if (ids.length === 1) {
      var h = historyById(ids[0]);
      inner = '<div class="toast-title">📜 解锁校史卡</div><div class="toast-name">' + (h ? esc(h.title) : "") + '</div>';
    } else {
      inner = '<div class="toast-title">📜 解锁 ' + ids.length + ' 张校史卡</div>';
    }
    t.innerHTML = inner + '<button class="toast-btn" id="toast-view">查看</button>';
    t.classList.remove("hidden");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.add("hidden"); }, 6500);
    $("toast-view").addEventListener("click", function () { t.classList.add("hidden"); openHistoryModal(ids); });
  }
  function openHistoryModal(ids) {
    var box = $("modal-list");
    box.innerHTML = "";
    ids.forEach(function (id) {
      var h = historyById(id);
      if (!h) return;
      var el = document.createElement("div");
      el.className = "h-card";
      el.innerHTML = '<div class="h-title">' + esc(h.title) + '</div>' +
        '<div class="h-scene">' + esc(h.scene || "") + '</div>' +
        '<div class="h-text">' + esc(h.text || "") + '</div>' +
        '<div class="h-src">出处：' + esc(h.src || "") + '</div>';
      box.appendChild(el);
    });
    $("history-modal").classList.remove("hidden");
  }
  function closeModal() { $("history-modal").classList.add("hidden"); }

  /* ---------- 标题页 ---------- */
  function renderTitle() {
    $("tagline").textContent = (STORY.meta && STORY.meta.subtitle) ? STORY.meta.subtitle : "";
    $("btn-continue").classList.toggle("hidden", !load());
    var n = state.unlockedHistory.length, total = (window.HISTORY || []).length;
    $("btn-history").textContent = "校史图鉴" + (n ? "（" + n + "/" + total + "）" : "");
    $("route-map").classList.add("hidden");
    show("screen-title");
  }

  /* ---------- 剧情卡 ---------- */
  function renderCard(id) {
    var card = STORY.cards && STORY.cards[id];
    if (!card) { console.error("缺少卡片：" + id); return; }
    state.current = id;
    $("card-scene").textContent = card.scene || "";
    $("card-title").textContent = card.title || "";
    $("card-text").textContent = card.text || "";
    var box = $("choices");
    box.innerHTML = "";
    (card.choices || []).forEach(function (c) {
      var b = document.createElement("button");
      b.className = "choice";
      b.textContent = c.text;
      b.addEventListener("click", function () { onChoose(c); });
      box.appendChild(b);
    });
    $("hud").classList.remove("hidden");
    renderHud();
    var st = stationOf(id);
    if (st !== null) { $("route-map").classList.remove("hidden"); renderRouteMap(st); }
    unlockHistory(card);
    save();
    show("screen-card");
  }

  function onChoose(c) {
    applyDelta(c.delta);
    if (!c.goto || c.goto === "@end") showEnding(judgeEnding(state.values));
    else if (c.goto.indexOf("ending_") === 0) showEnding(c.goto);
    else renderCard(c.goto);
  }

  /* ---------- 结局 ---------- */
  function showEnding(key) {
    var ending = (STORY.endings && STORY.endings[key]) || STORY.endings.ending_qiushi;
    if (state.unlockedEndings.indexOf(ending.id) === -1) state.unlockedEndings.push(ending.id);
    $("ending-sub").textContent = ending.subtitle || "";
    $("ending-title").textContent = ending.title || "";
    $("ending-text").textContent = ending.text || "";
    var img = $("cg-ending");
    img.src = ending.cg || "";
    img.style.display = ending.cg ? "" : "none";
    $("route-map").classList.add("hidden");
    save();
    show("screen-ending");
  }

  /* ---------- 图鉴 ---------- */
  function renderHistory() {
    var list = $("history-list");
    list.innerHTML = "";
    (window.HISTORY || []).forEach(function (h) {
      var unlocked = state.unlockedHistory.indexOf(h.id) !== -1;
      var el = document.createElement("div");
      el.className = "h-card" + (unlocked ? "" : " locked");
      if (unlocked) {
        el.innerHTML = '<div class="h-title">' + esc(h.title) + '</div>' +
          '<div class="h-scene">' + esc(h.scene || "") + '</div>' +
          '<div class="h-text">' + esc(h.text || "") + '</div>' +
          '<div class="h-src">出处：' + esc(h.src || "") + '</div>';
      } else {
        el.innerHTML = '<div class="h-title">？？？</div>' +
          '<div class="h-scene">未解锁</div>' +
          '<div class="h-text">继续踏上西迁之路，在旅途中解锁这张校史卡。</div>';
      }
      list.appendChild(el);
    });
    $("route-map").classList.add("hidden");
    show("screen-history");
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    $("btn-start").addEventListener("click", function () { resetRun(); renderCard(STORY.start); });
    $("btn-continue").addEventListener("click", function () {
      if (state.current && STORY.cards[state.current]) renderCard(state.current); else renderCard(STORY.start);
    });
    $("btn-restart").addEventListener("click", function () { resetRun(); renderCard(STORY.start); });
    $("btn-history").addEventListener("click", renderHistory);
    $("btn-history2").addEventListener("click", renderHistory);
    $("btn-back-title").addEventListener("click", renderTitle);
    $("modal-close").addEventListener("click", closeModal);
    $("history-modal").addEventListener("click", function (e) { if (e.target === $("history-modal")) closeModal(); });
    $("rm-toggle").addEventListener("click", function () { $("route-map").classList.toggle("collapsed"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bind();
    renderTitle();
  });
})();
