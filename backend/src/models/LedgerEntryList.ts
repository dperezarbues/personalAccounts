import { LedgerEntry } from "./LedgerEntry";

export interface LedgerEntryList {
  items: LedgerEntry[]
  next: string
}
