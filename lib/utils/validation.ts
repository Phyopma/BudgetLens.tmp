/**
 * Validates if a string is a valid invitation status
 */
export function isValidInvitationStatus(status: string): boolean {
  return ["pending", "accepted", "rejected"].includes(status);
}
