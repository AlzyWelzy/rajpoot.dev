"use client";

import SectionHeading from "./section-heading";
import Testimonial from "./testimonial";
import { testimonialsData } from "@/lib/data";

export default function Testimonials() {
  // Renders nothing until there's at least one real endorsement — no empty
  // heading, no placeholder cards.
  if (testimonialsData.length === 0) return null;

  return (
    <section
      id="testimonials"
      aria-label="Testimonials"
      className="mb-28 w-full max-w-4xl scroll-mt-28 sm:mb-40"
    >
      <SectionHeading>What people say</SectionHeading>

      <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
        {testimonialsData.map((testimonial, i) => (
          <Testimonial
            key={`${testimonial.author}-${i}`}
            index={i}
            {...testimonial}
          />
        ))}
      </ul>
    </section>
  );
}
