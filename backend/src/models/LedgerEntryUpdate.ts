export interface LedgerEntryUpdate {
  userId: string
  ledgerId: string
  entryId: string
  updatedAt: string
  name: string
  description: string
  amount: number
  attachmentUrl?: string
}