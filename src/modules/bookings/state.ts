import type { BookingStatus } from "@/generated/prisma/enums";

/** Booking lifecycle. Every status change in the system goes through canTransition(). */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  PENDING_DISPATCH: ["OFFERED", "ASSIGNED", "NO_DRIVER_FOUND", "CANCELLED"],
  OFFERED: ["ASSIGNED", "PENDING_DISPATCH", "NO_DRIVER_FOUND", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "PENDING_DISPATCH", "CANCELLED"],
  EN_ROUTE: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_DRIVER_FOUND: ["ASSIGNED", "PENDING_DISPATCH", "CANCELLED"],
};

export const canTransition = (from: BookingStatus, to: BookingStatus) => NEXT[from].includes(to);

export const TERMINAL: BookingStatus[] = ["COMPLETED", "CANCELLED"];
/** Statuses where a driver is committed to the job. */
export const DRIVER_ACTIVE: BookingStatus[] = ["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];
export const OPEN: BookingStatus[] = ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND", ...DRIVER_ACTIVE];

/** The single "next step" button a driver sees for each status. */
export const DRIVER_NEXT: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  ASSIGNED: { to: "EN_ROUTE", label: "Start driving to customer" },
  EN_ROUTE: { to: "ARRIVED", label: "I've arrived" },
  ARRIVED: { to: "IN_PROGRESS", label: "Start service (enter PIN)" },
  IN_PROGRESS: { to: "COMPLETED", label: "Complete & collect payment" },
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_DISPATCH: "Finding driver",
  OFFERED: "Finding driver",
  ASSIGNED: "Driver assigned",
  EN_ROUTE: "Driver on the way",
  ARRIVED: "Driver arrived",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_DRIVER_FOUND: "No driver found",
};
