// Scroll-reveal: fade + rise elements as they enter the viewport.
(function () {
"use strict";

function ready(fn) {
  if (document.readyState !== "loading") { fn(); }
else { document.addEventListener("DOMContentLoaded", fn); }
}

ready(function () {
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Elements we want to animate on scroll.
var selectors = [
".page__content h1",
".page__content h2",
".page__content p",
".archive__item",
".name-card",
".name-section h1",
".story-section h1",
".story-content p"
];

var targets = [];
selectors.forEach(function (sel) {
  document.querySelectorAll(sel).forEach(function (el) { targets.push(el); });
});

if (reduce || !("IntersectionObserver" in window)) {
targets.forEach(function (el) { el.classList.add("reveal", "is-visible"); });
return;
}

targets.forEach(function (el) { el.classList.add("reveal"); });

var io = new IntersectionObserver(function (entries) {
entries.forEach(function (entry) {
  if (entry.isIntersecting) {
entry.target.classList.add("is-visible");
io.unobserve(entry.target);
  }
});
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

targets.forEach(function (el) { io.observe(el); });
});
})();
