/* Nurro's tour of Codex.

   The callout itself is scifi-ui's holotip (tutorial-callout.js, the EyeWire II
   tutorial step). This file only decides when a tour starts. A page that has a
   tour lists its steps in <ol class="holotip-steps" id="tour" hidden>; see the
   tour block in search.html and index.html.

   The tour runs by itself once per browser, about two seconds after the page
   has loaded. It runs again whenever the Tour link in the nav is clicked, or
   when a page is opened with ?tour=1. The once-per-browser flag is written
   only when the visitor ends the tour (Done, the close button, or Escape), so
   a tour cut off by a page change comes back on the next page that has one. */

(function () {
  "use strict";

  var KEY = "codexNurroTourSeen";
  var CHAPTER_KEY = "codexNurroTourChapter";
  var CHAPTER_TTL = 30 * 60 * 1000;   /* a story left half told is forgotten after half an hour */
  var DELAY = 2000;

  /* The story runs across pages. A hand off step names the chapter the next
     page should open with; the page picks the step list whose
     data-holotip-chapter matches, or its default list. localStorage, not
     sessionStorage, because the out link opens a new tab. */
  function chapter() {
    try {
      var raw = localStorage.getItem(CHAPTER_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || Date.now() - c.t > CHAPTER_TTL) { localStorage.removeItem(CHAPTER_KEY); return null; }
      return c.name;
    } catch (e) { return null; }
  }
  function setChapter(name) {
    try {
      if (name) localStorage.setItem(CHAPTER_KEY, JSON.stringify({ name: name, t: Date.now() }));
      else localStorage.removeItem(CHAPTER_KEY);
    } catch (e) { /* storage may be off */ }
  }

  function seen() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function remember() {
    try { localStorage.setItem(KEY, "1"); } catch (e) { /* storage may be off */ }
  }

  /* A target that is in the DOM but not on screen (a nav link inside the
     collapsed phone menu) would pin the callout to the top left corner. A
     centred card with no beak is what holotip already does for a missing
     target, so an unseen target is treated as missing. */
  function shown(selector) {
    var t = selector && document.querySelector(selector);
    return !!(t && t.getClientRects().length);
  }

  var current = null;

  function listFor(name) {
    var list = name && document.querySelector('.holotip-steps[data-holotip-chapter="' + name + '"]');
    return list || document.getElementById("tour");
  }

  function build(name) {
    if (!window.holotip) return null;
    var list = listFor(name);
    if (!list) return null;
    var tour = window.holotip.fromList(list);
    if (!tour) return null;
    tour.steps.forEach(function (s) { if (!shown(s.target)) s.target = null; });
    var stopped = tour.stop.bind(tour);
    tour.stop = function () {
      /* the story is over, wherever it ended */
      remember();
      setChapter(null);
      if (current === tour) current = null;
      return stopped();
    };
    /* a hand off keeps the story alive: the next page opens on its chapter */
    tour.onHandoff = function (step) { if (step.goto) setChapter(step.goto); };
    return tour;
  }

  function start(name) {
    if (current) current.stop();
    current = build(name);
    if (current) current.start();
    return current;
  }

  function init() {
    var list = document.getElementById("tour");
    var link = document.getElementById("nav_tour");
    if (link && list) {
      /* the Tour link starts the page's own tour from the top */
      link.addEventListener("click", function (e) { e.preventDefault(); setChapter(null); start(null); });
    }
    if (!list) return;
    var forced = /[?&]tour=1(?:&|$)/.test(window.location.search);
    var name = chapter();
    if (forced || name || !seen()) window.setTimeout(function () { start(forced ? null : name); }, forced ? 300 : DELAY);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* for checks from outside; nothing on the page reads this */
  window.codexTour = { start: start, key: KEY, chapterKey: CHAPTER_KEY, get chapter() { return chapter(); }, get current() { return current; } };
})();
