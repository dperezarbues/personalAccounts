export interface LedgerEntry {
  userId: string
  ledgerId: string
  entryId: string
  createdAt: string
  updatedAt: string
  name: string
  description: string
  amount: number
  attachmentUrl?: string
}
