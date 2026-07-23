import { useEffect, useRef } from 'react'

// Load script Turnstile sekali saja untuk seluruh aplikasi
let scriptDimuat = false
function muatScriptTurnstile() {
  if (scriptDimuat) return
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
  script.async = true
  document.head.appendChild(script)
  scriptDimuat = true
}

// Pemakaian: <Captcha onVerify={(token) => setToken(token)} />
export default function Captcha({ onVerify }) {
  const ref = useRef(null)
  const widgetId = useRef(null)

  useEffect(() => {
    muatScriptTurnstile()

    const interval = setInterval(() => {
      if (window.turnstile && ref.current && widgetId.current === null) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          callback: onVerify,
          'expired-callback': () => onVerify(null),
        })
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={ref} className="mb-4" />
}
