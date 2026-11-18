/* ============================================================
   求是之路 · 西迁1940 —— 游戏引擎
   功能：三值栏 / 剧情卡 / 结局判定 / localStorage 存档 / 校史图鉴
   依赖：window.STORY（data/story.js）、window.HISTORY（data/history.js）
   ============================================================ */
(function () {
  "use strict";

  var SAVE_KEY = "qszl-save-v1";

  // 三值定义（key 与 story.js 的 delta 字段对应）
  var DIMS = [
    { key: "qz", label: "求真", desc: "学问" },
    { key: "ws", label: "务实", desc: "生存与实干" },
    { key: "dd", label: "担当", desc: "家国与守望" },
  ];

  var state = {
    current: null,                       // 当前卡片 id
    values: { qz: 5, ws: 5, dd: 5 },     // 初始各 5，区间 0-10
    unlockedEndings: [],                 // 已解锁结局 id
    historyUnlocked: false,              // 是否已开放图鉴
  };

  /* ---------- 工具 ---------- */
  function clamp(v) { return Math.max(0, Math.min(10, v)); }
  function $(id) { return document.getElementById(id); }
  function show(id) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.add("hidden");
    $(id).classList.remove("hidden");
  }

  /* ---------- 存档 ---------- */
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || typeof d !== "object") return false;
      state.current = d.current || null;
      state.values = d.values || { qz: 5, ws: 5, dd: 5 };
      state.unlockedEndings = d.unlockedEndings || [];
      state.historyUnlocked = !!d.historyUnlocked;
      return true;
    } catch (e) { return false; }
  }
  function resetRun() {
    state.current = null;
    state.values = { qz: 5, ws: 5, dd: 5 };
    save();
  }

  /* ---------- 结局判定 ---------- */
  function judgeEnding(v) {
    var qz = v.qz, ws = v.ws, dd = v.dd;
    // 1) 三者均衡且都高 → 薪火相传（隐藏最佳）
    if (qz >= 7 && ws >= 7 && dd >= 7) return "ending_xinhuo";
    // 2) 三者都低 → 再走一次（成长向）
    if (qz <= 3 && ws <= 3 && dd <= 3) return "ending_zailai";
    // 3) 取最高项；并列时按 求真 > 务实 > 担当 的优先级
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
      if (Object.prototype.hasOwnProperty.call(state.values, k)) {
        state.values[k] = clamp(state.values[k] + delta[k]);
      }
    }
    renderHud();
  }

  /* ---------- 标题页 ---------- */
  function renderTitle() {
    var tag = STORY.meta && STORY.meta.subtitle ? STORY.meta.subtitle : "";
    $("tagline").textContent = tag;
    $("btn-continue").classList.toggle("hidden", !load());
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
    save();
    show("screen-card");
  }

  function onChoose(c) {
    applyDelta(c.delta);
    if (!c.goto || c.goto === "@end") {
      showEnding(judgeEnding(state.values));
    } else if (c.goto.indexOf("ending_") === 0) {
      showEnding(c.goto); // 允许选项直接指定结局（备用）
    } else {
      renderCard(c.goto);
    }
  }

  /* ---------- 结局 ---------- */
  function showEnding(key) {
    var ending = (STORY.endings && STORY.endings[key]) || STORY.endings.ending_qiushi;
    if (state.unlockedEndings.indexOf(ending.id) === -1) state.unlockedEndings.push(ending.id);
    state.historyUnlocked = true;
    $("ending-sub").textContent = ending.subtitle || "";
    $("ending-title").textContent = ending.title || "";
    $("ending-text").textContent = ending.text || "";
    save();
    show("screen-ending");
  }

  /* ---------- 校史图鉴 ---------- */
  function renderHistory() {
    var list = $("history-list");
    list.innerHTML = "";
    (window.HISTORY || []).forEach(function (h) {
      var el = document.createElement("div");
      el.className = "h-card";
      el.innerHTML =
        '<div class="h-title">' + escapeHtml(h.title || "") + '</div>' +
        '<div class="h-scene">' + escapeHtml(h.scene || "") + '</div>' +
        '<div class="h-text">' + escapeHtml(h.text || "") + '</div>' +
        '<div class="h-src">出处：' + escapeHtml(h.src || "") + '</div>';
      list.appendChild(el);
    });
    $("hud").classList.add("hidden");
    show("screen-history");
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    $("btn-start").addEventListener("click", function () {
      resetRun();
      renderCard(STORY.start);
    });
    $("btn-continue").addEventListener("click", function () {
      if (state.current && STORY.cards[state.current]) {
        renderCard(state.current);
      } else {
        renderCard(STORY.start);
      }
    });
    $("btn-restart").addEventListener("click", function () {
      resetRun();
      renderCard(STORY.start);
    });
    $("btn-history").addEventListener("click", renderHistory);
    $("btn-history2").addEventListener("click", renderHistory);
    $("btn-back-title").addEventListener("click", renderTitle);
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    bind();
    renderTitle();
  });
})();
