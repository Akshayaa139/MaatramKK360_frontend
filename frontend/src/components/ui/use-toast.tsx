"use client";

import React from "react";
import { Toaster as HotToaster, toast as hotToast, Toast } from "react-hot-toast";

/**
 * Render the HotToaster container.
 */
export function Toaster() {
  return <HotToaster position="top-right" reverseOrder={false} />;
}

/**
 * Type definitions for toast payloads and options
 */
type ToastPayload =
  | string
  | React.ReactNode
  | { title?: string; description?: string; message?: string; heading?: string; body?: string; text?: string };

type ToastOptions = Partial<Pick<Toast, "id" | "icon" | "duration" | "ariaProps" | "className" | "style" | "position" | "iconTheme">> & {
  type?: "success" | "error" | "loading" | "blank" | "custom";
};


/**
 * Safe toast wrapper:
 * - forwards strings and React nodes directly
 * - converts object payloads like { title, description } into a React node via hotToast.custom
 */
export const toast = (payload: ToastPayload, options?: ToastOptions) => {
  if (typeof payload === "string") {
    return hotToast(payload, options);
  }

  if (React.isValidElement(payload)) {
    return hotToast.custom(() => payload, options);
  }

  if (payload && typeof payload === "object") {
    // Cast to access properties safely since we checked it's an object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payload as Record<string, any>;
    const title = p.title ?? p.message ?? p.heading;
    const description = p.description ?? p.body ?? p.text;

    return hotToast.custom(
      () => (
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
            <div style={{ fontSize: 13, opacity: 0.95 }}>
              {String(description)}
            </div>
          ) : null}
        </div>
      ),
      options
    );
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
export const success = (msgOrObj: ToastPayload, opts?: ToastOptions) =>
  toast(msgOrObj, { ...opts, type: "success" });
export const error = (msgOrObj: ToastPayload, opts?: ToastOptions) =>
  toast(msgOrObj, { ...opts, type: "error" });

const toastExports = {
  Toaster,
  toast,
  useToast,
  dismiss,
  success,
  error,
};

export default toastExports;
