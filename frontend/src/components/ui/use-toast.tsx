"use client";

import React from "react";
import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";

/**
 * Render the HotToaster container.
 */
export function Toaster() {
  return <HotToaster position="top-right" reverseOrder={false} />;
}

/**
 * Safe toast wrapper:
 * - forwards strings and React nodes directly
 * - converts object payloads like { title, description } into a React node via hotToast.custom
 */
export const toast = (payload: any, options?: any) => {
  if (typeof payload === "string" || React.isValidElement(payload)) {
    return hotToast(payload as any, options);
  }

  if (payload && typeof payload === "object") {
    const title = payload.title ?? payload.message ?? payload.heading;
    const description = payload.description ?? payload.body ?? payload.text;

    return hotToast.custom(() => (
      <div
        role="status"
        style={{
          padding: 12,
          background: "#111827",
          color: "#fff",
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
          maxWidth: 420,
        }}
      >
        {title ? (
          <div style={{ fontWeight: 600, marginBottom: description ? 6 : 0 }}>
            {String(title)}
          </div>
        ) : null}
        {description ? (
          <div style={{ fontSize: 13, opacity: 0.95 }}>{String(description)}</div>
        ) : null}
      </div>
    ), options);
  }

  return hotToast(String(payload), options);
};

/**
 * useToast hook — returns toast object for compatibility with hook-based call sites
 */
export const useToast = () => {
  return { toast };
};

export const dismiss = hotToast.dismiss;
export const success = (msgOrObj: any, opts?: any) => toast(msgOrObj, { ...opts, type: "success" });
export const error = (msgOrObj: any, opts?: any) => toast(msgOrObj, { ...opts, type: "error" });

export default {
  Toaster,
  toast,
  useToast,
  dismiss,
  success,
  error,
};