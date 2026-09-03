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
  var DELAY = 2000;

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

  function build() {
    if (!window.holotip) return null;
    var tour = window.holotip.fromList("#tour");
    if (!tour) return null;
    tour.steps.forEach(function (s) { if (!shown(s.target)) s.target = null; });
    var stopped = tour.stop.bind(tour);
    tour.stop = function () {
      remember();
      if (current === tour) current = null;
      return stopped();
    };
    return tour;
  }

  function start() {
    if (current) current.stop();
    current = build();
    if (current) current.start();
    return current;
  }

  function init() {
    var list = document.getElementById("tour");
    var link = document.getElementById("nav_tour");
    if (link && list) {
      link.addEventListener("click", function (e) { e.preventDefault(); start(); });
    }
    if (!list) return;
    var forced = /[?&]tour=1(?:&|$)/.test(window.location.search);
    if (forced || !seen()) window.setTimeout(start, forced ? 300 : DELAY);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* for checks from outside; nothing on the page reads this */
  window.codexTour = { start: start, key: KEY, get current() { return current; } };
})();
