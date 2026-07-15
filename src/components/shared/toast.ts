"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastMessage = Parameters<typeof sonnerToast>[0];
type ToastVariant = "base" | "success" | "warning" | "error";

type AppToastOptions = Omit<ExternalToast, "description"> & {
  title?: ToastMessage;
  description?: ExternalToast["description"];
};

const variantTitles: Record<ToastVariant, string> = {
  base: "Informazione",
  success: "Operazione completata",
  warning: "Attenzione",
  error: "Errore",
};

function showToast(
  variant: ToastVariant,
  message: ToastMessage,
  options: AppToastOptions = {}
) {
  const {
    title = variantTitles[variant],
    description = message,
    ...toastOptions
  } = options;

  if (variant === "base") {
    return sonnerToast.info(title, { ...toastOptions, description });
  }

  return sonnerToast[variant](title, { ...toastOptions, description });
}

const baseToast = (message: ToastMessage, options?: AppToastOptions) =>
  showToast("base", message, options);

export const toast = Object.assign(baseToast, {
  base: baseToast,
  info: baseToast,
  success: (message: ToastMessage, options?: AppToastOptions) =>
    showToast("success", message, options),
  warning: (message: ToastMessage, options?: AppToastOptions) =>
    showToast("warning", message, options),
  error: (message: ToastMessage, options?: AppToastOptions) =>
    showToast("error", message, options),
  dismiss: sonnerToast.dismiss,
});

export type { AppToastOptions, ToastVariant };
