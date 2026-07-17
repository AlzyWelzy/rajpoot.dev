import { experiencesData } from "@/lib/data";

/**
 * Hand-rolled vertical timeline (replaces react-vertical-timeline-component):
 * a center line with alternating cards on desktop, a left rail with stacked
 * cards on mobile. Static markup — no scroll listeners, no extra CSS bundle —
 * themed via the --timeline-* variables in globals.css.
 */
export default function ExperienceTimeline() {
  return (
    <ol className="relative mx-auto mt-12 max-w-185">
      <div
        aria-hidden="true"
        className="absolute left-5 top-0 h-full w-px bg-[color:var(--timeline-arrow)] opacity-40 sm:left-1/2 sm:-translate-x-1/2"
      />
      {experiencesData.map((item, index) => (
        <li key={item.title} className="relative mb-10 pl-14 last:mb-0 sm:pl-0">
          <span
            aria-hidden="true"
            className="absolute left-5 top-3 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-[1.35rem] ring-1 ring-black/5 bg-[color:var(--timeline-icon-bg)] text-[color:var(--timeline-text)] sm:left-1/2"
          >
            {item.icon}
          </span>
          <article
            className={`rounded-lg border border-black/5 bg-[color:var(--timeline-bg)] px-8 py-5 text-left sm:w-[calc(50%-3.25rem)] ${
              index % 2 === 0 ? "sm:mr-auto" : "sm:ml-auto"
            }`}
          >
            <h3 className="font-semibold text-[color:var(--timeline-text)]">
              {item.title}
            </h3>
            <p className="mt-0 font-normal text-[color:var(--timeline-text)]">
              {item.location}
            </p>
            <p className="mt-1 font-normal text-[color:var(--timeline-muted)]">
              {item.description}
            </p>
            <p className="mt-3 text-sm font-medium uppercase tracking-wide text-[color:var(--timeline-muted)]">
              {item.date}
            </p>
          </article>
        </li>
      ))}
    </ol>
  );
}
