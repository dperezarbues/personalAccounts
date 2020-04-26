import { LedgerStatus } from "../models/LedgerStatus";

export interface UpdateLedgerRequest {
  name: string
  description: string
  initialValue: number
  status?: LedgerStatus
}
