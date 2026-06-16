import { describe, expect, it } from "vitest";

import { getErrorMessage, isValidEmail, validateString } from "./utils";

describe("validateString", () => {
  it("accepts a non-empty string within the limit", () => {
    expect(validateString("hello", 10)).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(validateString("", 10)).toBe(false);
  });

  it("rejects a string over the max length", () => {
    expect(validateString("toolong", 3)).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(validateString(undefined, 10)).toBe(false);
    expect(validateString(null, 10)).toBe(false);
    expect(validateString(42, 10)).toBe(false);
    expect(validateString({}, 10)).toBe(false);
  });

  it("accepts a string exactly at the max length", () => {
    expect(validateString("abc", 3)).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects addresses without an @ or domain dot", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@.com")).toBe(false);
  });

  it("rejects addresses with whitespace", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("user@ex ample.com")).toBe(false);
  });
});

describe("getErrorMessage", () => {
  it("reads the message from an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("reads the message from an object with a message field", () => {
    expect(getErrorMessage({ message: "from object" })).toBe("from object");
  });

  it("returns a string error as-is", () => {
    expect(getErrorMessage("plain string")).toBe("plain string");
  });

  it("falls back for unknown shapes", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong");
    expect(getErrorMessage(123)).toBe("Something went wrong");
  });
});
