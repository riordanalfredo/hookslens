import type { WaterfallEntry } from "../types";
import { createId } from "../../id";

export class WaterfallTracker {
  private entries: WaterfallEntry[] = [];

  constructor(private readonly maxEntries: number) {}

  add(
    entry: Pick<
      WaterfallEntry,
      "key" | "route" | "origin" | "startedAt" | "concurrent"
    >,
  ) {
    this.entries.unshift({
      id: createId(),
      completedAt: null,
      duration: null,
      status: "pending",
      httpStatus: null,
      ...entry,
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }
  }

  complete(
    key: string,
    duration: number,
    status: WaterfallEntry["status"],
    httpStatus: number | null,
  ) {
    const idx = this.entries.findIndex(
      (entry) => entry.key === key && entry.status === "pending",
    );

    if (idx !== -1) {
      this.entries[idx] = {
        ...this.entries[idx],
        completedAt: Date.now(),
        duration,
        status,
        httpStatus,
      };
    }
  }

  snapshot(): WaterfallEntry[] {
    return [...this.entries];
  }
}
