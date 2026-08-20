import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

type TelemetryEvent = { eventType: "CLIENT_ERROR" | "API_ERROR" | "ASSET_FAILURE" | "UPLOAD_FAILURE" | "WEB_VITAL"; severity: "INFO" | "WARNING" | "ERROR"; metricName?: string; metricValue?: number; statusCode?: number };

const route = () => window.location.pathname.slice(0, 180) || "/";

export function OperationalTelemetry() {
  const record = trpc.observability.record.useMutation();
  const recordRef = useRef(record.mutate);
  recordRef.current = record.mutate;

  useEffect(() => {
    const emit = (event: TelemetryEvent) => recordRef.current({ ...event, route: route() });
    const onError = (event: ErrorEvent | Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement || target instanceof HTMLVideoElement || target instanceof HTMLSourceElement) {
        emit({ eventType: "ASSET_FAILURE", severity: "WARNING", metricName: target instanceof HTMLImageElement ? "image" : "media" });
        return;
      }
      emit({ eventType: "CLIENT_ERROR", severity: "ERROR", metricName: "window_error" });
    };
    const onRejection = () => emit({ eventType: "CLIENT_ERROR", severity: "ERROR", metricName: "unhandled_rejection" });
    const onApiError = (event: Event) => { const statusCode = (event as CustomEvent<{ statusCode?: unknown }>).detail?.statusCode; emit({ eventType: "API_ERROR", severity: "WARNING", metricName: "trpc", statusCode: typeof statusCode === "number" ? statusCode : undefined }); };
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("esut-marketplace-api-error", onApiError);

    let lcp = 0;
    let cls = 0;
    let lcpObserver: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver(entries => { const entry = entries.getEntries().at(-1); if (entry) lcp = Math.round(entry.startTime); });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      clsObserver = new PerformanceObserver(entries => { for (const entry of entries.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) if (!entry.hadRecentInput) cls += entry.value ?? 0; });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch { /* PerformanceObserver support is optional; application behaviour remains unaffected. */ }
    const sendVitals = () => { if (lcp > 0) emit({ eventType: "WEB_VITAL", severity: lcp > 4_000 ? "WARNING" : "INFO", metricName: "LCP", metricValue: Math.min(120_000, lcp) }); if (cls > 0) { const value = Math.round(cls * 1_000); emit({ eventType: "WEB_VITAL", severity: value > 250 ? "WARNING" : "INFO", metricName: "CLS", metricValue: value }); } };
    window.addEventListener("pagehide", sendVitals, { once: true });
    return () => { window.removeEventListener("error", onError, true); window.removeEventListener("unhandledrejection", onRejection); window.removeEventListener("esut-marketplace-api-error", onApiError); window.removeEventListener("pagehide", sendVitals); lcpObserver?.disconnect(); clsObserver?.disconnect(); };
  }, []);

  return null;
}
