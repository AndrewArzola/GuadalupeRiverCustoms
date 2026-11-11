// Guadalupe River Customs - site scripts
(function () {
  // TODO: set this to the shop's real email address. Order and quote forms are sent here.
  var SHOP_EMAIL = "info@guadaluperivercustoms.com";
  var UNIT_PRICE = 400;

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Show a styled placeholder when an image hasn't been uploaded yet
  function markPlaceholder(img, holder) {
    function fail() { holder.classList.add("is-placeholder"); }
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  }
  document.querySelectorAll(".carousel-slide img").forEach(function (img) {
    markPlaceholder(img, img.closest(".carousel-slide"));
  });
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    markPlaceholder(img, img.parentElement);
  });

  // Carousel
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel-slide"));
    var dotsWrap = root.querySelector(".carousel-dots");
    var index = 0;
    var timer = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Slide " + (i + 1));
      b.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach(function (d, j) { d.setAttribute("aria-selected", String(j === index)); });
      slides.forEach(function (s, j) { s.setAttribute("aria-hidden", String(j !== index)); });
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }
    function start() { if (!reduceMotion && slides.length > 1) timer = setInterval(next, 6000); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    root.querySelector(".next").addEventListener("click", function () { next(); restart(); });
    root.querySelector(".prev").addEventListener("click", function () { prev(); restart(); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);
    root.tabIndex = 0;
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { next(); restart(); }
      if (e.key === "ArrowLeft") { prev(); restart(); }
    });

    // Swipe on touch screens
    var startX = null;
    root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      startX = null;
      start();
    });

    go(0);
    start();
  });

  // Order subtotal
  var qty = document.querySelector("[data-qty]");
  var subtotal = document.querySelector("[data-subtotal]");
  if (qty && subtotal) {
    var update = function () {
      var n = Math.max(1, parseInt(qty.value, 10) || 1);
      subtotal.textContent = "$" + (n * UNIT_PRICE).toLocaleString();
    };
    qty.addEventListener("input", update);
    update();
  }

  // Forms -> pre-filled email (no server needed)
  document.querySelectorAll("[data-mailto-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var lines = [];
      new FormData(form).forEach(function (value, key) {
        if (String(value).trim()) lines.push(key + ": " + value);
      });
      if (subtotal && form.contains(subtotal)) lines.push("Subtotal: " + subtotal.textContent + " + shipping");
      var subject = form.getAttribute("data-subject") || "Website inquiry";
      window.location.href = "mailto:" + SHOP_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });
})();
