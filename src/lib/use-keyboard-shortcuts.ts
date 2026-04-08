"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(extraShortcuts?: ShortcutAction[]) {
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Esc always works - close dialogs, blur inputs
      if (e.key === "Escape") {
        if (isInput) {
          (target as HTMLInputElement).blur();
          return;
        }
      }

      // Don't fire shortcuts when typing in inputs
      if (isInput) return;

      // "/" - Focus search
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // "n" - New / Create (context-sensitive)
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (pathname?.includes("/patients")) {
          router.push("/dashboard/patients/new");
        } else if (pathname?.includes("/prescriptions")) {
          router.push("/dashboard/prescriptions/new");
        } else if (pathname?.includes("/billing")) {
          router.push("/dashboard/billing/new");
        }
        return;
      }

      // "g" then key - Go to navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        const handleNext = (ev: KeyboardEvent) => {
          window.removeEventListener("keydown", handleNext);
          ev.preventDefault();
          switch (ev.key) {
            case "d":
              router.push("/dashboard");
              break;
            case "p":
              router.push("/dashboard/patients");
              break;
            case "r":
              router.push("/dashboard/prescriptions");
              break;
            case "b":
              router.push("/dashboard/billing");
              break;
            case "s":
              router.push("/dashboard/settings");
              break;
          }
        };
        window.addEventListener("keydown", handleNext, { once: true });
        setTimeout(
          () => window.removeEventListener("keydown", handleNext),
          1500
        );
        return;
      }

      // "?" - Show keyboard shortcuts help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        const existing = document.getElementById("keyboard-shortcuts-help");
        if (existing) {
          existing.remove();
          return;
        }
        showShortcutsHelp();
        return;
      }

      // Run extra shortcuts
      if (extraShortcuts) {
        for (const shortcut of extraShortcuts) {
          if (
            e.key === shortcut.key &&
            !!shortcut.ctrl === (e.ctrlKey || e.metaKey)
          ) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [router, pathname, extraShortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function showShortcutsHelp() {
  const overlay = document.createElement("div");
  overlay.id = "keyboard-shortcuts-help";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)";
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const shortcuts = [
    ["/", "Focus search"],
    ["n", "New item (context-sensitive)"],
    ["Esc", "Close dialog / blur input"],
    ["g d", "Go to Dashboard"],
    ["g p", "Go to Patients"],
    ["g r", "Go to Prescriptions"],
    ["g b", "Go to Billing"],
    ["g s", "Go to Settings"],
    ["?", "Show this help"],
  ];

  const rows = shortcuts
    .map(
      ([key, desc]) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9">
        <span style="font-family:monospace;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px;font-weight:600">${key}</span>
        <span style="color:#64748b;font-size:13px;margin-left:24px">${desc}</span>
      </div>`
    )
    .join("");

  overlay.innerHTML = `<div style="background:white;border-radius:12px;padding:24px;width:360px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700;color:#0f172a">Keyboard Shortcuts</h3>
      <span style="font-size:12px;color:#94a3b8;cursor:pointer" onclick="this.closest('#keyboard-shortcuts-help').remove()">ESC to close</span>
    </div>
    ${rows}
  </div>`;

  document.body.appendChild(overlay);
}
