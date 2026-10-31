import { cn } from "@/lib/utils";

const widths = {
  /** For most pages, such as lists of posts */
  default: "max-w-3xl py-8",
  /** For small forms, such as logging in */
  narrow: "max-w-sm py-12",
};

type MainProps = React.ComponentProps<"main"> & {
  width?: keyof typeof widths;
};

/** A page's main content, centred and spaced so pages share one layout */
export function Main({ width = "default", className, ...props }: MainProps) {
  return (
    <main
      className={cn("mx-auto flex w-full flex-col gap-6 px-4", widths[width], className)}
      {...props}
    />
  );
}
