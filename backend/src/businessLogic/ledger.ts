import * as uuid from 'uuid'

import { LedgerAccess } from '../dataLayer/ledgerAccess'
import { CreateLedgerRequest } from '../requests/CreateledgerRequest'
import { Ledger } from '../models/ledger'
import { LedgerUpdate } from '../models/ledgerUpdate'
import { UpdateLedgerRequest } from '../requests/UpdateledgerRequest'
import { createLogger } from '../utils/logger'
import { LedgerList } from '../models/ledgerList'
import { LedgerStatus } from '../models/LedgerStatus'
import { LedgerEntryAccess } from '../dataLayer/ledgerEntryAccess'

const ledgerAccess = new LedgerAccess()
const ledgerEntryAccess = new LedgerEntryAccess()

const logger = createLogger('LedgerBL')

export async function getAllLedgers(userId, limit, next): Promise<LedgerList> {
  logger.info(`User ${userId} requested listing items: limit: ${limit}, next: ${next}`);
  return await ledgerAccess.getAllLedgers(userId, limit, next);
}

export async function getLedger(ledgerId, userId): Promise<Ledger> {
  logger.info(`User ${userId} requested getting item: ${ledgerId}`);
  const [ledger, entries] = await Promise.all([
    ledgerAccess.getLedger(ledgerId, userId),
    ledgerEntryAccess.getAllLedgerEntries(ledgerId, userId,null,null)
  ])
  ledger.entries = entries.items;
  return ledger as Ledger
}

export async function getSimpleLedger(ledgerId, userId): Promise<Ledger> {
  logger.info(`User ${userId} requested getting item: ${ledgerId}`);

  return await ledgerAccess.getLedger(ledgerId, userId) as Ledger
}

export async function createLedgerItem(
  createledgerRequest: CreateLedgerRequest,
  userId: string
): Promise<Ledger> {
  logger.info(`User ${userId} requested create item: ${createledgerRequest}`);
  const currentDate = new Date().toISOString();
  const ledger: Ledger = {
    userId: userId,
    ledgerId: uuid.v4(),
    createdAt: currentDate,
    updatedAt: currentDate,
    name: createledgerRequest.name,
    description: createledgerRequest.description,
    initialValue: createledgerRequest.initialValue,
    balance: createledgerRequest.initialValue,
    status: LedgerStatus.Open
  }

  return await ledgerAccess.createLedger(ledger);
}

export async function updateLedgerItem(
  updateledgerRequest: UpdateLedgerRequest,
  ledgerId: string,
  userId: string
): Promise<void> {
  logger.info(`User ${userId} requested update item ${ledgerId}: ${updateledgerRequest}`);

  const currentDate = new Date().toISOString();
  const previousLedger = await ledgerAccess.getLedger(ledgerId, userId);

  const ledgerUpdate: LedgerUpdate = {
    userId: userId,
    ledgerId: ledgerId,
    updatedAt: currentDate,
    name: updateledgerRequest.name,
    description: updateledgerRequest.description,
    initialValue: updateledgerRequest.initialValue,
    balance: previousLedger.balance - previousLedger.initialValue + updateledgerRequest.initialValue,
    status: updateledgerRequest.status || previousLedger.status
  }

  return await ledgerAccess.updateLedger(ledgerUpdate);
}

export async function deleteLedgerItem(
  ledgerId: string,
  userId: string
): Promise<void> {
  logger.info(`User ${userId} requested deletion of item ${ledgerId}`);
  
  await ledgerAccess.deleteLedger(ledgerId, userId)
}
