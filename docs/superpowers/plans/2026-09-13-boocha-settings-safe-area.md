# Boocha 设置面板顶部安全区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the macOS-style close control and settings title in a non-scrolling top safe area so settings content cannot pass beneath them.

**Architecture:** `SettingsPanel` becomes a fixed shell with two children: a static `settings-panel__safe-area` and a flexing `settings-panel__scroll`. The root panel does not scroll; only the second child owns vertical overflow, so the close control needs no sticky positioning.

**Tech Stack:** React, TypeScript, CSS flex layout, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-09-13-boocha-settings-safe-area-design.md`

## Global Constraints

- The safe area contains the close button and the full visual title only; all editable settings and the footer belong to the scroll region.
- The safe area is non-scrolling and keeps the existing glass treatment.
- The scroll region occupies the remaining panel height and is the only element with `overflow-y: auto`.
- Existing settings saving, live preview, autostart, timer, and bubble interactions must remain unchanged.

---

### Task 1: Split the settings shell into fixed and scrollable regions

**Files:**
- Modify: `src/pet/SettingsPanel.tsx:160-285`
- Modify: `src/pet/SettingsPanel.test.tsx`
- Modify: `src/styles.css:230-340`

**Interfaces:**
- Produces `section.settings-panel > div.settings-panel__safe-area + div.settings-panel__scroll`.
- Produces `button[aria-label="关闭设置"]` as a descendant of `.settings-panel__safe-area`.

- [ ] **Step 1: Write the failing structural test**

```tsx
it("keeps close controls in a non-scrolling safe area", () => {
  renderSettingsPanel();
  const safeArea = container?.querySelector(".settings-panel__safe-area");
  const scrollArea = container?.querySelector(".settings-panel__scroll");

  expect(safeArea?.querySelector('button[aria-label="关闭设置"]')).not.toBeNull();
  expect(safeArea?.textContent).toContain("设置");
  expect(scrollArea?.textContent).toContain("桌宠大小");
  expect(scrollArea?.querySelector('button[aria-label="关闭设置"]')).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/pet/SettingsPanel.test.tsx`

Expected: FAIL because the component has one scrolling root and no safe-area elements.

- [ ] **Step 3: Move fixed controls and scrollable content into the two regions**

```tsx
<section className="settings-panel" aria-label="Boocha 设置面板">
  <div className="settings-panel__safe-area">
    <button className="settings-panel__close-dot" aria-label="关闭设置" />
    <header className="settings-panel__header">…</header>
  </div>
  <div className="settings-panel__scroll">…all sections and footer…</div>
</section>
```

Keep the exact event handlers and `data-tauri-drag-region` attributes on the existing header and close button.

- [ ] **Step 4: Apply the one-scroll-owner CSS layout**

```css
.pet-stage--settings .settings-panel { overflow: hidden; }
.settings-panel { height: 100%; min-height: 0; padding: 0; }
.settings-panel__safe-area { flex: 0 0 auto; padding: 18px 18px 14px; }
.settings-panel__scroll { min-height: 0; flex: 1 1 auto; overflow-y: auto; padding: 0 18px 24px; }
.settings-panel__close-dot { position: static; }
```

Preserve the current panel glass background, close-button styling, section styling, and footer action styling.

- [ ] **Step 5: Run structural and full frontend verification**

Run: `npm test -- --run src/pet/SettingsPanel.test.tsx && npm test && npm run build`

Expected: all tests PASS and the production build succeeds.

- [ ] **Step 6: Verify in the running browser preview**

Open the settings panel, scroll the content region to its middle and bottom, and verify the red close control and the title remain above the scroll content with no overlap.
