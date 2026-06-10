import type { CandidateInput } from "./policies.ts";

export async function collectExploreCandidates(page: any): Promise<CandidateInput[]> {
  return page.evaluate(() => {
    const oldMarkers = document.querySelectorAll("[data-omnia-readonly-explore]");
    oldMarkers.forEach((element) => element.removeAttribute("data-omnia-readonly-explore"));

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
    }

    function textOf(element: Element): string {
      const appTitle = element.querySelector?.(".app-layer-title")?.textContent || "";
      const value =
        appTitle ||
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        (element as HTMLElement).innerText ||
        element.textContent ||
        "";
      return value.replace(/\s+/g, " ").trim();
    }

    function rowTextOf(element: Element): string {
      const cellText = Array.from(element.querySelectorAll("td, [role='gridcell'], .ag-cell"))
        .map((cell) => (cell as HTMLElement).innerText || cell.textContent || "")
        .join(" ");
      return (cellText || (element as HTMLElement).innerText || element.textContent || element.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function pathOf(href: string): string {
      if (!href) return "";
      try {
        return new URL(href, location.origin).pathname;
      } catch {
        return "";
      }
    }

    let index = 0;
    const interactive = Array.from(document.querySelectorAll("a[href], [role='link'], [role='tab'], [role='menuitem'], [role='button'], button, [mat-icon-button], .mat-mdc-icon-button, button[aria-haspopup='menu'], button.apps-layer-btn"))
      .filter(visible)
      .map((element) => {
        const marker = `target-${Date.now()}-${index++}`;
        element.setAttribute("data-omnia-readonly-explore", marker);
        const href = element.getAttribute("href") || (element as HTMLAnchorElement).href || "";
        return {
          selector: `[data-omnia-readonly-explore="${marker}"]`,
          role: element.getAttribute("role") || element.tagName.toLowerCase(),
          tag: element.tagName.toLowerCase(),
          text: textOf(element),
          appTitle: (element.querySelector?.(".app-layer-title")?.textContent || "").replace(/\s+/g, " ").trim(),
          ariaLabel: element.getAttribute("aria-label") || "",
          title: element.getAttribute("title") || "",
          href,
          path: pathOf(href),
          selected: element.getAttribute("aria-selected") || false,
          expanded: element.getAttribute("aria-expanded") || false,
          disabled: (element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") || false,
          hasPopup: element.getAttribute("aria-haspopup") || "",
          currentPath: location.pathname,
          classes: (element.getAttribute("class") || "").toString(),
          inAppLayerMenu: Boolean(element.closest(".app-layer-panel, .mat-mdc-menu-panel, [role='menu']")),
        };
      });

    const inputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='password']):not([type='checkbox']):not([type='radio']), textarea"))
      .filter(visible)
      .map((element) => {
        const marker = `target-${Date.now()}-${index++}`;
        element.setAttribute("data-omnia-readonly-explore", marker);
        const input = element as HTMLInputElement;
        return {
          selector: `[data-omnia-readonly-explore="${marker}"]`,
          role: element.getAttribute("role") || "input",
          tag: element.tagName.toLowerCase(),
          text: textOf(element),
          ariaLabel: element.getAttribute("aria-label") || "",
          title: element.getAttribute("title") || "",
          placeholder: input.placeholder || "",
          name: input.name || "",
          inputType: input.type || "",
          href: "",
          path: "",
          selected: false,
          expanded: false,
          disabled: (element as HTMLInputElement).disabled || element.getAttribute("aria-disabled") || false,
          hasPopup: "",
          currentPath: location.pathname,
          classes: (element.getAttribute("class") || "").toString(),
          inAppLayerMenu: false,
        };
      });

    const rows = Array.from(document.querySelectorAll("tr, [role='row'], .ag-row, .mat-mdc-row"))
      .filter(visible)
      .filter((element) => !element.closest("thead, [role='columnheader']"))
      .filter((element) => !element.querySelector("th, [role='columnheader'], .ag-header-cell"))
      .map((element) => {
        const marker = `target-${Date.now()}-${index++}`;
        element.setAttribute("data-omnia-readonly-explore", marker);
        return {
          selector: `[data-omnia-readonly-explore="${marker}"]`,
          role: element.getAttribute("role") || "row",
          tag: element.tagName.toLowerCase(),
          text: rowTextOf(element),
          ariaLabel: element.getAttribute("aria-label") || "",
          title: element.getAttribute("title") || "",
          href: "",
          path: "",
          selected: element.getAttribute("aria-selected") || false,
          expanded: element.getAttribute("aria-expanded") || false,
          disabled: element.getAttribute("aria-disabled") || false,
          hasPopup: "",
          currentPath: location.pathname,
          classes: (element.getAttribute("class") || "").toString(),
          inAppLayerMenu: false,
        };
      });

    return [...interactive, ...inputs, ...rows];
  });
}
