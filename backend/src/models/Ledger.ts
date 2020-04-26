import { LedgerStatus } from "./LedgerStatus";
import { LedgerEntry } from "./LedgerEntry";

export interface Ledger {
  userId: string
  ledgerId: string
  createdAt: string
  updatedAt: string
  name: string
  description: string
  initialValue: number
  balance: number
  status?: LedgerStatus
  entries?: LedgerEntry[]
}
