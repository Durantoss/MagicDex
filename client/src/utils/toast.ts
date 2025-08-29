// src/utils/toast.ts
export function showToast(
  message: string,
  type: "success" | "error" = "success",
  duration = 3000
) {
  // Remove any existing toast so they don't stack
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Append to body
  document.body.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 10px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);

  // Optional haptic feedback for mobile
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}