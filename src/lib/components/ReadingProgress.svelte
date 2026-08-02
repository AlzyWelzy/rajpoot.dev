<!--
  Thin fixed bar at the top of the viewport that fills left-to-right as the page
  scrolls, giving a sense of overall position on this long single page.
  Decorative (aria-hidden); the section nav remains the real wayfinding.

  This was motion's `useScroll` + `useSpring`, which meant a scroll listener, a
  spring integrator running every frame, and both of motion's scroll and value
  modules in the bundle — for a 2px decoration. A scroll-driven CSS animation
  does the same job entirely off the main thread.

  Browsers without `animation-timeline` render the bar at scaleX(0), i.e.
  nothing at all, which is the correct fallback for something purely decorative.
-->
<div aria-hidden="true" class="reading-progress"></div>

<style>
  .reading-progress {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 998;
    height: 2px;
    transform: scaleX(0);
    transform-origin: left;
    background-color: #111827;
  }

  :global(html.dark) .reading-progress {
    background-color: rgba(255, 255, 255, 0.7);
  }

  @keyframes reading-progress-grow {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  @supports (animation-timeline: scroll()) {
    .reading-progress {
      animation: reading-progress-grow linear both;
      animation-timeline: scroll(root block);
    }
  }
</style>
