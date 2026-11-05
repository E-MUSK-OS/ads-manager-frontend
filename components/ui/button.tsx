import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border text-sm font-medium whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-xs",
        primary:
          "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-xs",
        secondary:
          "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:text-slate-950",
        outline:
          "bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950 hover:border-slate-400",
        ghost:
          "bg-transparent text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-950",
        danger:
          "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-xs",
        destructive:
          "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-xs",
        link: "text-indigo-600 underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-7 gap-1 px-2.5 text-xs",
        lg: "h-9 gap-2 px-4 text-base",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
