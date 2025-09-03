import * as React from "react"
import { useClientOnly } from "@/hooks/useClientOnly"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const isClient = useClientOnly()
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!isClient) return
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [isClient])

  return isClient ? isMobile : false
}
