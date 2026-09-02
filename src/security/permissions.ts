export type Permission = "READ" | "WRITE" | "DESTRUCTIVE" | "TRANSACTIONAL";
export const confirmationRequired = (permission: Permission) => permission === "DESTRUCTIVE" || permission === "TRANSACTIONAL";
