import clsx from "clsx";

type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx("animate-spin rounded-full border-b-2", className)}
    />
  );
}
