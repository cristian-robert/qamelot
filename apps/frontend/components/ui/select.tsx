"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error("Select components must be used within a Select")
  return ctx
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange: onValueChange ?? (() => {}),
      open,
      setOpen,
    }),
    [value, onValueChange, open],
  )

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelectContext()

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <span className="ml-2 text-xs opacity-50">▼</span>
    </button>
  )
}

function SelectValue({ placeholder, formatter }: { placeholder?: string; formatter?: (value: string) => string }) {
  const { value } = useSelectContext()
  if (!value && placeholder) return <span className="text-muted-foreground">{placeholder}</span>
  const display = formatter && value ? formatter(value) : value
  return <span>{display || placeholder}</span>
}

function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useSelectContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    function handleMouseDown(e: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      role="listbox"
      className={cn(
        "relative z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function SelectItem({ className, value, children, ...props }: SelectItemProps) {
  const { value: selected, onValueChange, setOpen } = useSelectContext()

  return (
    <div
      role="option"
      aria-selected={selected === value}
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        selected === value && "bg-accent text-accent-foreground",
        className,
      )}
      onClick={() => {
        onValueChange(value)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
