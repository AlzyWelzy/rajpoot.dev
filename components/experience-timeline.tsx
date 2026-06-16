"use client";

import React from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

import { experiencesData } from "@/lib/data";

const contentStyle: React.CSSProperties = {
  background: "var(--timeline-bg)",
  color: "var(--timeline-text)",
  boxShadow: "none",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  textAlign: "left",
  padding: "1.3rem 2rem",
};

const contentArrowStyle: React.CSSProperties = {
  borderRight: "0.4rem solid var(--timeline-arrow)",
};

const iconStyle: React.CSSProperties = {
  background: "var(--timeline-icon-bg)",
  color: "var(--timeline-text)",
  fontSize: "1.5rem",
  boxShadow: "none",
};

export default function ExperienceTimeline() {
  return (
    <VerticalTimeline lineColor="">
      {experiencesData.map((item) => (
        <React.Fragment key={item.title}>
          <VerticalTimelineElement
            visible
            contentStyle={contentStyle}
            contentArrowStyle={contentArrowStyle}
            date={item.date}
            icon={item.icon}
            iconStyle={iconStyle}
          >
            <h3 className="font-semibold text-[color:var(--timeline-text)]">
              {item.title}
            </h3>
            <p className="font-normal !mt-0 text-[color:var(--timeline-text)]">
              {item.location}
            </p>
            <p className="!mt-1 !font-normal text-[color:var(--timeline-muted)]">
              {item.description}
            </p>
          </VerticalTimelineElement>
        </React.Fragment>
      ))}
    </VerticalTimeline>
  );
}
