import { siteConfig } from "./seo";
import { contactTool, experiencesData, projectsData, skillsData } from "./data";

/**
 * Renders /llms.txt (https://llmstxt.org): a Markdown summary of the site for
 * language models reading it at inference time.
 *
 * Built from the same sources the page renders — lib/seo.ts for identity,
 * lib/data.ts for content — so it can't drift from the site. The layout
 * follows the spec: one H1, a blockquote summary, free-form detail, then H2
 * sections of `- [name](url): notes` link lists, with "Optional" last for
 * links an LLM can skip when context is short.
 *
 * Every link is Markdown and absolute: the file is routinely read detached
 * from the site, and Lighthouse's llms.txt audit fails a file whose links
 * aren't in `[text](url)` form.
 */
export function llmsTxt(): string {
  const { url, location, employer, availability } = siteConfig;
  const at = (hash: string) => `${url}/${hash}`;

  const intro = [
    `${siteConfig.name} is a ${siteConfig.jobTitle} based in ${location.city}, ${location.region}, ${location.country}, currently working at ${link(employer.name, employer.url)}.`,
    availability.open ? `Current status: ${availability.label}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const experience = experiencesData.map(
    (item) =>
      `- ${link(item.title, at("#experience"))}: ${item.date}, ${item.location}. ${item.description}`,
  );

  const projects = projectsData.map((project) => {
    const source =
      project.githubUrl && project.githubUrl !== project.liveUrl
        ? ` Source: ${link("GitHub", project.githubUrl)}.`
        : "";
    return `- ${link(project.title, project.liveUrl ?? project.githubUrl ?? at("#projects"))}: ${project.description} Stack: ${project.tags.join(", ")}.${source}`;
  });

  const contact = [
    `- ${link("Email", `mailto:${siteConfig.email}`)}: ${siteConfig.email}, the most direct way to get in touch.`,
    `- ${link("Contact form", at("#contact"))}: also exposed to in-browser agents as the WebMCP tool \`${contactTool.name}\`; the visitor confirms before anything is sent.`,
    `- ${link("Résumé (PDF)", `${url}/resume`)}: the current résumé.`,
    `- ${link("LinkedIn", siteConfig.linkedin)}: professional profile.`,
    `- ${link("GitHub", siteConfig.github)}: open-source work.`,
  ];

  const optional = [
    `- ${link("Blog", siteConfig.blog)}: technical writing.`,
    `- ${link("X", siteConfig.twitterUrl)}: ${siteConfig.twitter}.`,
  ];

  return [
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    intro,
    `Core skills: ${skillsData.join(", ")}.`,
    `This file summarizes ${link(new URL(url).host, url)}, a single-page portfolio; every section below is also on that page.`,
    section("Experience and education", experience),
    section("Projects", projects),
    section("Contact", contact),
    section("Optional", optional),
  ]
    .join("\n\n")
    .concat("\n");
}

function section(heading: string, items: readonly string[]): string {
  return [`## ${heading}`, "", ...items].join("\n");
}

function link(text: string, href: string): string {
  return `[${text}](${href})`;
}
