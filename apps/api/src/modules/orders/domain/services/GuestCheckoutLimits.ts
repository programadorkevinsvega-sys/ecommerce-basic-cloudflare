export const GUEST_CHECKOUT_LIMITS = {
  pendingPerIp: 3,
  pendingPerEmail: 2,
  pendingPerCart: 2,
  emailsPerRecipient: 3,
  pendingWindowMinutes: 30,
  emailWindowMinutes: 60,
} as const;
