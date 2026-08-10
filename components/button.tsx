import Link from "next/link";
import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary";

// Structural properties only; each variant supplies its own hover/active
// scale amounts and colors below, so they aren't shared here.
const baseClasses =
  "inline-flex items-center gap-2 rounded-full px-7 py-3 outline-none transition focus-ring";

const variantClasses: Record<Variant, string> = {
  primary:
    "group bg-gray-900 text-white hover:scale-110 hover:bg-gray-950 active:scale-105 dark:bg-white/10",
  secondary:
    "border border-black/15 font-medium text-gray-800 hover:scale-105 hover:bg-black/5 active:scale-100 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10",
};

type LinkButtonProps = { variant?: Variant } & ComponentPropsWithoutRef<
  typeof Link
>;
type PlainButtonProps = { variant?: Variant; href?: undefined } & Omit<
  ComponentPropsWithoutRef<"button">,
  "href"
>;

type ButtonProps = LinkButtonProps | PlainButtonProps;

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const classes = clsx(baseClasses, variantClasses[variant], className);

  if (props.href !== undefined) {
    return (
      <Link
        {...(props as ComponentPropsWithoutRef<typeof Link>)}
        className={classes}
      />
    );
  }

  return (
    <button
      type="button"
      {...(props as ComponentPropsWithoutRef<"button">)}
      className={classes}
    />
  );
}
