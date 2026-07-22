const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

function loadScript() {
    if (document.getElementById('ga4-script')) return;

    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // A primeira pageview é disparada manualmente via trackPageView,
    // pra não duplicar contagem quando o router redireciona logo no carregamento.
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
}

export function initAnalytics() {
    if (initialized || !MEASUREMENT_ID) return;

    loadScript();
    initialized = true;
}

export function trackPageView(path) {
    if (!MEASUREMENT_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
    });
}
