# Manvendra Rajpoot's Portfolio — Plain HTML/CSS/JS

A dependency-free version of my portfolio website, rebuilt with only plain
HTML, CSS, and vanilla JavaScript. No framework, no build step — just open
`index.html` in a browser (or serve the folder statically).

## Technologies Used

- **HTML5** — semantic markup for all sections.
- **CSS3** — custom properties for theming, flex/grid layout, keyframe
  animations, and responsive media queries.
- **Vanilla JavaScript** — renders project/skill/experience lists,
  dark-mode toggle with `localStorage`, active-section tracking with
  `IntersectionObserver`, scroll-reveal animations, and the contact form
  (which opens the user's email client via `mailto:`).

## Running locally

No build step or install required. Either:

- Open `index.html` directly in your browser, or
- Serve the folder with any static server, e.g.:

  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

## Project structure

```
.
├── index.html        # Page markup and section structure
├── styles.css        # All styles, including the light/dark theme
├── script.js         # Content data and interactivity
└── public/           # Images, resume, cover letter, and experience letter
```

## Contact

If you have any questions or want to collaborate on a project, feel free to
reach out at
[manvendra@rajpoot.dev](mailto:manvendra@rajpoot.dev).

Thank you for visiting!
