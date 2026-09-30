/**
 * WebMCP (Web Model Context Protocol) support.
 *
 * WebMCP lets a page expose actions to an in-browser AI agent as typed tools
 * instead of leaving the agent to drive the DOM. This site uses only the
 * *declarative* half: annotating the contact form with `tool*` attributes
 * makes the browser register it as a tool and synthesize its JSON Schema from
 * the form's controls. https://github.com/webmachinelearning/webmcp
 *
 * Browsers without WebMCP ignore every attribute here and every member typed
 * optional below, so none of this needs feature detection to be safe.
 */

declare module "react" {
  // Parameter names must match @types/react's declarations for the merge.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface FormHTMLAttributes<T> {
    /** Registers the form as a WebMCP tool under this name. */
    toolname?: string;
    /** What the tool does, for the agent. Required alongside `toolname`. */
    tooldescription?: string;
    /** Human-readable tool name for browser UI. */
    tooltitle?: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    /** Description of this control's parameter in the tool's schema. */
    toolparamdescription?: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TextareaHTMLAttributes<T> {
    /** Description of this control's parameter in the tool's schema. */
    toolparamdescription?: string;
  }
}

/** `SubmitEvent` as extended by WebMCP for a submission an agent triggered. */
export type AgentSubmitEvent = SubmitEvent & {
  readonly agentInvoked: true;
  /**
   * Hands the agent the tool's result. The browser serializes whatever the
   * promise resolves to (objects as JSON). Only callable while the event is
   * dispatching, and only after `preventDefault()`.
   */
  respondWith(result: Promise<unknown>): void;
};

/**
 * True when an AI agent submitted the form through its WebMCP tool, meaning
 * the browser is waiting on `respondWith()` for the tool's result.
 *
 * Duck-typed rather than checked with `instanceof SubmitEvent`: both members
 * only exist where WebMCP is enabled, and that is exactly the condition.
 */
export function isAgentSubmit(event: Event): event is AgentSubmitEvent {
  const candidate = event as Partial<AgentSubmitEvent>;
  return (
    candidate.agentInvoked === true &&
    typeof candidate.respondWith === "function"
  );
}
