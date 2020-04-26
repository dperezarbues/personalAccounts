import { LedgerStatus } from "./LedgerStatus";

export interface LedgerUpdate {
  userId: string
  ledgerId: string
  updatedAt: string
  name: string
  description: string
  initialValue: number
  balance: number
  status?: LedgerStatus
}
