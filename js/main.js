/* =========================================================
   EUNJOO PET SALON — interactions
   - 전 기기 공통: 네이티브 세로 스크롤(스냅·풀페이지 스와이프 없음)
   - 갤러리 가로 마퀴 + 이미지 클릭 시 커스텀 모달 팝업 + 데스크탑 좌우 넘김 화살표
   - 진입 애니메이션 / 헤더·도트 활성 표시 (IntersectionObserver)
   ========================================================= */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  const root = document.documentElement;
  root.classList.add("js-ready"); // 이 시점부터 [data-anim] 숨김 활성화(안전망)

  const sections = Array.from(document.querySelectorAll("#fullpage .section"));
  const navLinks = document.querySelectorAll(".site-nav a");
  const dotsWrap = document.querySelector(".section-dots");

  /* ---------- 1. 섹션 도트 생성 ---------- */
  sections.forEach((_, i) => {
    const li = document.createElement("li");
    if (i === 0) li.classList.add("is-active");
    li.dataset.goto = i;
    dotsWrap.appendChild(li);
  });
  const dots = dotsWrap.querySelectorAll("li");

  /* ---------- 2. 진입 애니메이션 ---------- */
  function animate(slideEl) {
    if (!slideEl) return;
    const targets = slideEl.querySelectorAll("[data-anim]");
    if (!targets.length) return;
    if (!hasGSAP || prefersReduced) {
      targets.forEach((t) => (t.style.opacity = 1));
      return;
    }
    gsap.fromTo(
      targets,
      { opacity: 0, y: 38 },
      { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.12, overwrite: true }
    );
  }

  /* ---------- 3. 활성 섹션 표시(헤더/도트 + 다크 헤더 반전) ---------- */
  function setActive(index) {
    navLinks.forEach((a, i) => a.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    // 마지막(Contact)은 다크 배경 → 헤더 색 반전
    document.body.classList.toggle("on-dark", index === sections.length - 1);
  }

  /* ---------- 4. 섹션 전환: 자연 스크롤(전 기기 공통) ---------- */
  // 풀페이지 스와이프/스냅 제거 → 스크롤한 만큼 자유롭게 이동.
  // 진입 애니메이션과 헤더/도트 활성화는 IntersectionObserver로 처리.
  const animObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) animate(e.target); }),
    { threshold: 0.2 }
  );
  const activeObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) setActive(sections.indexOf(e.target));
    }),
    { threshold: [0.5] }
  );
  sections.forEach((s) => { animObserver.observe(s); activeObserver.observe(s); });
  animate(sections[0]); // 첫 섹션 즉시 노출(IO 지연 대비)

  /* 섹션 이동 (nav / dots / scroll-hint) — 부드러운 스크롤 */
  function goTo(i) {
    if (sections[i]) {
      sections[i].scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }
  }
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(parseInt(el.dataset.goto, 10));
    });
  });

  /* ---------- 5. 갤러리 렌더: 2줄 자동 흐름(마퀴) ---------- */
  const topTrack = document.getElementById("gallery-top");
  const bottomTrack = document.getElementById("gallery-bottom");
  const marqueeWrap = document.querySelector(".gallery-marquee");
  const SECONDS_PER_CARD = 3; // 카드 1장이 지나가는 데 걸리는 시간(초) — 클수록 느림

  function cardHTML(it, clone) {
    const src = it.image || "";
    const cap = (it.caption || "").replace(/"/g, "&quot;");
    const cls = "gallery-card" + (clone ? " is-clone" : "");
    const aria = clone ? ' aria-hidden="true" tabindex="-1"' : "";
    return (
      '<a class="' + cls + '" href="' + src + '" data-caption="' + cap + '"' + aria + ">" +
        '<img src="' + src + '" alt="' + cap + '" loading="lazy" />' +
        (cap ? '<figcaption><span class="cap-title">' + cap + "</span></figcaption>" : "") +
      "</a>"
    );
  }

  // 한 줄을 채우고, 화면 폭보다 넓도록 반복 + 끊김 없는 루프용으로 2그룹 복제
  function buildRow(track, items) {
    const row = track.parentElement; // .marquee-row
    if (!items.length) { row.style.display = "none"; return; }
    row.style.display = "";

    const liveUnit = items.map((it) => cardHTML(it, false)).join("");
    const cloneUnit = items.map((it) => cardHTML(it, true)).join("");

    track.innerHTML = liveUnit; // 1세트만 먼저 렌더해 폭 측정
    requestAnimationFrame(() => {
      const setW = track.scrollWidth || 1;
      const contW = row.clientWidth || window.innerWidth;
      const repeats = Math.max(1, Math.ceil(contW / setW) + 1);

      let g1 = liveUnit, g2 = cloneUnit;
      for (let i = 1; i < repeats; i++) { g1 += cloneUnit; g2 += cloneUnit; }
      track.innerHTML =
        '<div class="marquee-group">' + g1 + "</div>" +
        '<div class="marquee-group">' + g2 + "</div>";

      const totalCards = items.length * repeats;
      track.style.setProperty("--marquee-dur", totalCards * SECONDS_PER_CARD + "s");
    });
  }

  function renderGallery(items) {
    items = items || [];
    if (!items.length) {
      if (marqueeWrap)
        marqueeWrap.innerHTML =
          '<div class="gallery-empty">등록된 사진이 없습니다. /admin 에서 사진을 추가해 주세요.</div>';
      return;
    }
    const top = items.filter((it) => (it.row || "top") !== "bottom");
    const bottom = items.filter((it) => (it.row || "top") === "bottom");
    buildRow(topTrack, top);
    buildRow(bottomTrack, bottom);
  }

  fetch("data/gallery.json", { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error("gallery.json " + r.status); return r.json(); })
    .then((data) => renderGallery(data.items || data || []))
    .catch((err) => { console.error("[gallery]", err); renderGallery([]); });

  /* ---------- 5-1. 이미지 클릭 → 모달 팝업 ---------- */
  const modal = document.getElementById("img-modal");
  const modalImg = document.getElementById("img-modal-img");
  const modalTag = document.getElementById("img-modal-tag");

  function openModal(src, caption) {
    if (!modal || !src) return;
    modalImg.src = src;
    modalImg.alt = caption || "";
    modalTag.textContent = caption || "";
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modalImg.removeAttribute("src");
    document.body.classList.remove("modal-open");
  }
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  }
  let dragMoved = false; // 모바일에서 좌우로 끌었으면(스와이프) 모달을 열지 않음
  if (marqueeWrap) {
    marqueeWrap.addEventListener("click", (e) => {
      const card = e.target.closest(".gallery-card");
      if (!card) return;
      e.preventDefault();
      if (dragMoved) { dragMoved = false; return; }
      const href = card.getAttribute("href");
      let cap = card.dataset.caption || "";
      if (!cap && href) cap = decodeURIComponent(href.split("/").pop().replace(/\.[^.]+$/, ""));
      openModal(href, cap);
    });
  }

  /* ---------- 5-2. 줄별 화살표로 한 장씩 넘김(데스크탑, 슬라이드 양 끝) ---------- */
  const ONE_CARD_MS = SECONDS_PER_CARD * 1000;
  const trackById = { top: topTrack, bottom: bottomTrack };

  function stepTrack(track, dir) { // dir: +1 다음, -1 이전
    if (!track || !track.getAnimations) return;
    const anim = track.getAnimations()[0];
    if (!anim || !anim.effect) return;
    const dur = anim.effect.getComputedTiming().duration;
    if (!dur || !isFinite(dur)) return;
    let cur = anim.currentTime;
    cur = typeof cur === "number" ? cur : (cur && cur.value) || 0;
    const start = cur;
    const delta = dir * ONE_CARD_MS;
    const t0 = performance.now();
    const D = 420;
    (function frame(now) {
      const p = Math.min(1, (now - t0) / D);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      let v = start + delta * e;
      v = ((v % dur) + dur) % dur;
      try { anim.currentTime = v; } catch (_) {}
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }

  if (marqueeWrap) {
    marqueeWrap.addEventListener("click", (e) => {
      const nav = e.target.closest(".row-nav");
      if (!nav) return;
      e.preventDefault();
      stepTrack(trackById[nav.dataset.row], parseInt(nav.dataset.dir, 10));
    });
  }

  /* ---------- 5-2b. 모바일: 누르면 멈춤 + 좌우로 끌면 직접 이동(스와이프) ---------- */
  // CSS 자동 흐름(Animation)의 currentTime을 손가락으로 스크럽 → 떼면 그 자리에서 다시 흐름
  document.querySelectorAll(".marquee-row").forEach((row) => {
    const track = row.querySelector(".marquee-track");
    if (!track) return;
    const dirSign = row.classList.contains("marquee-row--bottom") ? 1 : -1;
    let anim = null, startX = 0, startY = 0, startTime = 0, tpp = 0, dur = 0, axis = null;

    row.addEventListener("touchstart", (e) => {
      anim = track.getAnimations ? track.getAnimations()[0] : null;
      if (!anim || !anim.effect) { anim = null; return; }
      dur = anim.effect.getComputedTiming().duration;
      const groupW = (track.scrollWidth || 1) / 2;     // 두 그룹 → 한 그룹 폭
      tpp = (dur && groupW) ? dur / groupW : 0;         // 픽셀당 시간(ms)
      try { anim.pause(); } catch (_) {}                // 누르는 동안 멈춤
      const cur = anim.currentTime;
      startTime = typeof cur === "number" ? cur : (cur && cur.value) || 0;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; axis = null; dragMoved = false;
    }, { passive: true });

    row.addEventListener("touchmove", (e) => {
      if (!anim || !tpp || !dur) return;
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x") {
        e.preventDefault();                              // 가로 스와이프: 페이지 세로 스크롤 막고 슬라이드 이동
        dragMoved = true;
        let v = startTime + dirSign * dx * tpp;          // 카드가 손가락을 따라 이동
        v = ((v % dur) + dur) % dur;
        try { anim.currentTime = v; } catch (_) {}
      }
    }, { passive: false });

    const resume = () => { if (anim) { try { anim.play(); } catch (_) {} } };
    row.addEventListener("touchend", resume);
    row.addEventListener("touchcancel", resume);
  });

  /* ---------- 5-3. 이미지 다운로드 방지(우클릭/드래그) ---------- */
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest("img, .img-modal, .gallery-card")) e.preventDefault();
  });
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  /* ---------- 6. 연도 자동 ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
