"use client";

import { useEffect } from "react";

/**
 * Lightweight inertial wheel scrolling (no dependencies).
 *
 *  - Mouse-wheel notches are amplified and eased so the page glides and travels
 *    further per notch (the 3D coverflows feel much quicker to roll through).
 *  - Trackpads / touch screens keep their native, already-smooth scrolling.
 *  - Nested scrollers (chat, search results, dialogs) and locked pages are left alone.
 *  - Anchor links and the coverflow "go to film" actions glide instead of jumping.
 *
 * Disabled for `prefers-reduced-motion`.
 */

const WHEEL_SPEED = 1.9; // page px travelled per px of wheel delta
const EASE = 10; // higher = snappier settle (per second)

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function canScrollInside(start: EventTarget | null, dy: number): boolean {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      if (el.hasAttribute("data-native-scroll")) return true;
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight + 1) {
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        if (dy < 0 ? !atTop : !atBottom) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

function pageLocked(): boolean {
  return (
    getComputedStyle(document.body).overflowY === "hidden" ||
    getComputedStyle(document.documentElement).overflowY === "hidden" ||
    document.body.hasAttribute("data-scroll-locked")
  );
}

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !finePointer) return;

    const root = document.documentElement;
    root.dataset.smoothScroll = "on";

    let current = window.scrollY;
    let target = current;
    let written = current;
    let raf = 0;
    let last = 0;

    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);

    const tick = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(0.064, (t - last) / 1000) : 1 / 60;
      last = t;
      const diff = target - current;
      current = Math.abs(diff) < 0.3 ? target : current + diff * (1 - Math.exp(-dt * EASE));
      written = current;
      window.scrollTo({ top: current, left: 0, behavior: "instant" });
      if (current !== target) raf = requestAnimationFrame(tick);
      else last = 0;
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const syncFromBrowser = () => {
      current = target = written = window.scrollY;
      last = 0;
    };

    const animateTo = (top: number) => {
      if (!raf) syncFromBrowser();
      target = clamp(top, 0, maxScroll());
      start();
    };

    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 18;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      // Small pixel deltas = trackpad / smooth-scroll mouse: keep native inertia.
      if (!raf && e.deltaMode === 0 && Math.abs(dy) < 50) return;
      if (pageLocked() || canScrollInside(e.target, dy)) return;
      e.preventDefault();
      if (!raf) syncFromBrowser();
      target = clamp(target + dy * WHEEL_SPEED, 0, maxScroll());
      start();
    };

    // Any scroll we did not cause (scrollbar drag, keyboard, drag-to-scroll) re-syncs.
    const onScroll = () => {
      if (Math.abs(window.scrollY - written) > 2) syncFromBrowser();
    };

    const onScrollTo = (e: Event) => {
      const top = (e as CustomEvent<{ top?: number }>).detail?.top;
      if (typeof top === "number") animateTo(top);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (url.hash.length < 2) return;
      let el: HTMLElement | null = null;
      try {
        el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      if (!el) return;
      e.preventDefault();
      const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      window.history.pushState(null, "", url.hash);
      animateTo(el.getBoundingClientRect().top + window.scrollY - pad);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mrxyz:scrollto", onScrollTo);
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mrxyz:scrollto", onScrollTo);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      delete root.dataset.smoothScroll;
    };
  }, []);

  return null;
}
