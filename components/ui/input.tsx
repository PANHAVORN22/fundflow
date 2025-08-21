import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // If caller passed a `value` but didn't provide `onChange`, React will
  // warn that the input is read-only. To avoid that warning while keeping
  // the passed value as the initial value, convert `value` -> `defaultValue`
  // when no `onChange` handler is present.
  const incoming: any = props;
  let finalProps: any = props;

  if (incoming && incoming.hasOwnProperty("value") && !incoming.onChange) {
    // move value to defaultValue and remove value to make the input uncontrolled
    const { value, ...rest } = incoming;
    finalProps = { defaultValue: value, ...rest };
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...finalProps}
    />
  )
}

export { Input }
