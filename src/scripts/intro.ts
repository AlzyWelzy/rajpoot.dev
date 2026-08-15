import {
  activeSectionState,
  beginNavigation,
} from "@/lib/stores/active-section";

// The only interactive behavior on this otherwise-static section: make the
// nav's active pill jump to "Contact" immediately on click instead of
// waiting for the scroll-spy to catch up mid-scroll. No island needed —
// this is a one-off event listener, not anything that re-renders.
document.getElementById("intro-contact-link")?.addEventListener("click", () => {
  activeSectionState.value = "Contact";
  beginNavigation();
});
