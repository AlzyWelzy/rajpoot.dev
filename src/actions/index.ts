import { defineAction, ActionError } from "astro:actions";
import { submitContactForm } from "@/lib/contact";

export const server = {
  submitContact: defineAction({
    accept: "form",
    handler: async (formData: FormData, context) => {
      const result = await submitContactForm(formData, context.request);
      if (result.error) {
        throw new ActionError({ code: result.code, message: result.error });
      }
      return result.data;
    },
  }),
};
