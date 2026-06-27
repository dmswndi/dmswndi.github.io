/* =========================================================
   EUNJOO PET SALON — interactions
   - 데스크톱(마우스): 풀페이지 세로 Swiper (섹션 슬라이드)
   - 모바일/태블릿(터치·좁은 화면): 네이티브 세로 스크롤 + 스크롤 스냅
   - 갤러리 가로 Swiper + GLightbox 확대 (공통)
   - 진입 애니메이션 / 활성 표시 (두 모드 모두 지원)
   ========================================================= */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const NATIVE_MQ = "(max-width: 1024px), (pointer: coarse)";
  const useNative = window.matchMedia(NATIVE_MQ).matches;

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

  /* ---------- 4. 모드별 섹션 전환 ---------- */
  let fullpage = null;

  if (useNative) {
    /* 모바일/태블릿: 네이티브 스크롤 */
    root.classList.add("native-scroll");

    const animObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) animate(e.target); }),
      { threshold: 0.2 }
    );
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            setActive(sections.indexOf(e.target));
          }
        });
      },
      { threshold: [0.5] }
    );
    sections.forEach((s) => { animObserver.observe(s); activeObserver.observe(s); });

    // 첫 섹션 즉시 노출(IO 지연 대비)
    animate(sections[0]);
  } else {
    /* 데스크톱: 풀페이지 세로 Swiper */
    fullpage = new Swiper("#fullpage", {
      direction: "vertical",
      slidesPerView: 1,
      speed: 850,
      mousewheel: { thresholdDelta: 12, releaseOnEdges: true },
      keyboard: { enabled: true },
      touchReleaseOnEdges: true,
      on: {
        init(sw) { animate(sw.slides[sw.activeIndex]); setActive(0); },
        slideChangeTransitionStart(sw) {
          animate(sw.slides[sw.activeIndex]);
          setActive(sw.activeIndex);
        },
      },
    });
  }

  /* 섹션 이동 (nav / dots / scroll-hint) */
  function goTo(i) {
    if (fullpage) fullpage.slideTo(i);
    else sections[i].scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
  }
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(parseInt(el.dataset.goto, 10));
    });
  });

  /* 화면 회전/리사이즈로 모드가 바뀌면 한 번 새로고침해 깔끔히 재구성 */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const nowNative = window.matchMedia(NATIVE_MQ).matches;
      if (nowNative !== useNative) window.location.reload();
    }, 300);
  });

  /* ---------- 5. 갤러리 렌더 + Swiper + Lightbox ---------- */
  const track = document.getElementById("gallery-track");
  let lightbox = null;

  function renderGallery(items) {
    if (!items || !items.length) {
      track.innerHTML =
        '<div class="swiper-slide gallery-empty">등록된 사진이 없습니다. /admin 에서 사진을 추가해 주세요.</div>';
      return;
    }

    track.innerHTML = items
      .map((it) => {
        const src = it.image || "";
        const cap = it.caption || "";
        const cat = (it.category || "").toUpperCase();
        return (
          '<div class="swiper-slide">' +
            '<a class="gallery-card glightbox" href="' + src + '"' +
               ' data-gallery="grooming" data-glightbox="title: ' + cap + '">' +
              '<img src="' + src + '" alt="' + cap + '" loading="lazy" />' +
              "<figcaption>" +
                (cat ? '<span class="cap-cat">' + cat + "</span><br/>" : "") +
                '<span class="cap-title">' + cap + "</span>" +
              "</figcaption>" +
            "</a>" +
          "</div>"
        );
      })
      .join("");

    new Swiper(".gallery-swiper", {
      slidesPerView: "auto",
      spaceBetween: 22,
      grabCursor: true,
      speed: 600,
      navigation: { nextEl: ".gallery-next", prevEl: ".gallery-prev" },
      pagination: { el: ".gallery-pagination", clickable: true },
      breakpoints: { 861: { spaceBetween: 30 } },
      nested: true, // 풀페이지(세로) 안의 가로 스와이프 충돌 방지(데스크톱)
    });

    if (lightbox) lightbox.destroy();
    lightbox = GLightbox({ selector: ".glightbox", loop: true, touchNavigation: true });
  }

  fetch("data/gallery.json", { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error("gallery.json " + r.status); return r.json(); })
    .then((data) => renderGallery(data.items || data || []))
    .catch((err) => { console.error("[gallery]", err); renderGallery([]); });

  /* ---------- 6. 연도 자동 ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
