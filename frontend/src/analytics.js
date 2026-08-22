const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

let initialized = false
let lastPageLocation = ''

export function initGA() {
  if (typeof window === 'undefined' || !MEASUREMENT_ID || initialized) {
    return initialized
  }

  if (!document.querySelector(`script[data-ga4-id="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.dataset.ga4Id = MEASUREMENT_ID
    document.head.appendChild(script)
  }

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
  initialized = true
  return true
}

export function trackPageview() {
  if (!initGA()) return

  const pagePath = `${window.location.pathname}${window.location.search}`
  const pageLocation = window.location.href
  if (lastPageLocation === pageLocation) return

  lastPageLocation = pageLocation
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: `${window.location.hostname}${window.location.pathname}`,
  })
}
