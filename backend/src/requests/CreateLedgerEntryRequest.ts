export interface CreateLedgerEntryRequest {
  name: string
  description: string
  amount: number
  attachmentUrl?: string
}
