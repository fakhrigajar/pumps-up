import { useEffect, useRef, useState } from 'react'

export function useMeasure() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const read = (box) =>
      setSize((current) =>
        current.width === box.width && current.height === box.height
          ? current
          : { width: box.width, height: box.height },
      )

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) read(node.getBoundingClientRect())
    })
    observer.observe(node)
    read(node.getBoundingClientRect())

    return () => observer.disconnect()
  }, [])

  return [ref, size.width, size.height]
}
