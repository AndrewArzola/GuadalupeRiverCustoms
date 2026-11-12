// Guadalupe River Customs - site scripts
(function () {
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

  // Showcase: one tab per project folder, each with its own photo carousel
  var projects = window.SHOWCASE_PROJECTS || [];
  var root = document.querySelector("[data-carousel]");
  var tabsWrap = document.querySelector("[data-project-tabs]");
  if (root && tabsWrap && projects.length) {
    var track = root.querySelector(".carousel-track");
    var count = root.querySelector(".carousel-count");
    var thumbsWrap = document.querySelector(".carousel-thumbs");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var slides = [];
    var thumbs = [];
    var index = 0;
    var timer = null;
    var current = null;

    var tabs = projects.map(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.textContent = p.title;
      b.addEventListener("click", function () { showProject(p); restart(); });
      tabsWrap.appendChild(b);
      return b;
    });

    function showProject(p) {
      current = p;
      tabs.forEach(function (t, i) { t.setAttribute("aria-selected", String(projects[i] === p)); });
      track.innerHTML = "";
      thumbsWrap.innerHTML = "";
      slides = p.items.map(function (item, i) {
        var li = document.createElement("li");
        li.className = "carousel-slide";
        var label = p.title + ", " + (item.type === "video" ? "video" : "photo") + " " + (i + 1);
        var media;
        if (item.type === "video") {
          media = document.createElement("video");
          media.controls = true;
          media.playsInline = true;
          media.preload = "metadata";
          media.setAttribute("aria-label", label);
          media.addEventListener("play", stop);
        } else {
          media = document.createElement("img");
          media.alt = label;
          media.decoding = "async";
        }
        media.setAttribute("data-src", item.src);
        li.appendChild(media);
        track.appendChild(li);
        return li;
      });
      thumbs = p.items.map(function (item, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show " + (item.type === "video" ? "video" : "photo") + " " + (i + 1));
        if (item.type === "video") {
          b.className = "is-video";
        } else {
          var img = document.createElement("img");
          img.src = item.src;
          img.alt = "";
          img.loading = "lazy";
          b.appendChild(img);
        }
        b.addEventListener("click", function () { go(i); restart(); });
        thumbsWrap.appendChild(b);
        return b;
      });
      track.style.transition = "none";
      go(0);
      void track.offsetWidth;
      track.style.transition = "";
    }

    function load(i) {
      var s = slides[i];
      if (!s) return;
      var m = s.firstChild;
      var src = m.getAttribute("data-src");
      if (src) { m.src = src; m.removeAttribute("data-src"); }
    }

    function go(i) {
      var n = slides.length;
      if (!n) return;
      var prevSlide = slides[index];
      index = (i + n) % n;
      if (prevSlide && prevSlide.firstChild.tagName === "VIDEO") prevSlide.firstChild.pause();
      load(index); load((index + 1) % n); load((index - 1 + n) % n);
      track.style.transform = "translateX(" + -index * 100 + "%)";
      slides.forEach(function (s, j) { s.setAttribute("aria-hidden", String(j !== index)); });
      thumbs.forEach(function (t, j) { t.setAttribute("aria-current", String(j === index)); });
      var active = thumbs[index];
      if (active) thumbsWrap.scrollTo({ left: active.offsetLeft - thumbsWrap.clientWidth / 2 + active.clientWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
      count.textContent = current.title + " · " + (index + 1) + " / " + n;
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }
    function start() {
      var onVideo = slides[index] && slides[index].firstChild.tagName === "VIDEO";
      if (!reduceMotion && !timer && slides.length > 1 && !onVideo) timer = setInterval(next, 6000);
    }
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

    showProject(projects[0]);
    start();
  }

  // Store product gallery
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var main = g.querySelector("[data-gallery-main]");
    var buttons = g.querySelectorAll(".product-thumbs button");
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        main.src = b.querySelector("img").src;
        main.alt = "Stark Varg subcage, photo " + (i + 1);
        buttons.forEach(function (o) { o.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
      });
    });
  });

  // Order subtotal
  var qty = document.querySelector("[data-qty]");
  var subtotal = document.querySelector("[data-subtotal]");
  var subtotalField = document.querySelector("[data-subtotal-field]");
  if (qty && subtotal) {
    var update = function () {
      var n = Math.max(1, parseInt(qty.value, 10) || 1);
      subtotal.textContent = "$" + (n * UNIT_PRICE).toLocaleString();
      if (subtotalField) subtotalField.value = subtotal.textContent + " + shipping (add-ons quoted separately)";
    };
    qty.addEventListener("input", update);
    update();
  }

  // Foot plate: show the plastics warning and require the customer to acknowledge it
  var footplate = document.querySelector("[data-footplate]");
  var notice = document.querySelector("[data-footplate-notice]");
  var ack = document.querySelector("[data-footplate-ack]");
  if (footplate && notice && ack) {
    var sync = function () {
      notice.hidden = !footplate.checked;
      ack.required = footplate.checked;
      if (!footplate.checked) ack.checked = false;
    };
    footplate.addEventListener("change", sync);
    sync();
  }

  // Forms -> Formspree (AJAX). Without JavaScript the form still posts to Formspree normally.
  document.querySelectorAll("[data-formspree]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = "form-status" + (kind ? " is-" + kind : "");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      button.disabled = true;
      setStatus("Sending…");
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) {
              var msg = data.errors && data.errors.length
                ? data.errors.map(function (er) { return er.message; }).join(" ")
                : "Something went wrong.";
              throw new Error(msg);
            }
          });
        })
        .then(function () {
          form.reset();
          if (qty) qty.dispatchEvent(new Event("input"));
          if (footplate) footplate.dispatchEvent(new Event("change"));
          setStatus(form.getAttribute("data-success") || "Thanks! Your message was sent.", "success");
        })
        .catch(function (err) {
          setStatus(err.message + " Please try again, or email Nick@guadalupeRiverCustoms.com.", "error");
        })
        .then(function () { button.disabled = false; });
    });
  });
})();
