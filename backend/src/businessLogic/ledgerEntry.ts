import * as uuid from 'uuid'

import { LedgerEntryAccess } from '../dataLayer/ledgerEntryAccess'
import { CreateLedgerEntryRequest } from '../requests/CreateledgerEntryRequest'
import { LedgerEntry } from '../models/ledgerEntry'
import { LedgerEntryUpdate } from '../models/ledgerEntryUpdate'
import { UpdateLedgerEntryRequest } from '../requests/UpdateledgerEntryRequest'
import { createLogger } from '../utils/logger'
import { LedgerEntryList } from '../models/ledgerEntryList'
import { LedgerAccess } from '../dataLayer/ledgerAccess'
import { LedgerUpdate } from '../models/LedgerUpdate'

const ledgerEntryAccess = new LedgerEntryAccess()
const ledgerAccess = new LedgerAccess()

const logger = createLogger('LedgerEntryBL')

export async function getAllLedgerEntries(ledgerId, userId, limit, next): Promise<LedgerEntryList> {
  logger.info(`User ${userId} requested listing items: limit: ${limit}, next: ${next}`);
  return await ledgerEntryAccess.getAllLedgerEntries(ledgerId, userId, limit, next);
}

export async function getLedgerEntry(ledgerId, userId, entryId): Promise<LedgerEntry> {
  logger.info(`User ${userId} requested getting item: ${entryId}`);
  return await ledgerEntryAccess.getLedgerEntry(ledgerId, userId, entryId);
}

export async function createLedgerEntryItem(
  createLedgerEntryRequest: CreateLedgerEntryRequest,
  ledgerId: string,
  userId: string
): Promise<LedgerEntry> {
  logger.info(`User ${userId} requested create item: ${createLedgerEntryRequest}`);
  const currentDate = new Date().toISOString();
  const ledgerEntry: LedgerEntry = {
    userId: userId,
    ledgerId: ledgerId,
    entryId: uuid.v4(),
    createdAt: currentDate,
    updatedAt: currentDate,
    name: createLedgerEntryRequest.name,
    description: createLedgerEntryRequest.description,
    amount: createLedgerEntryRequest.amount,
    attachmentUrl: createLedgerEntryRequest.attachmentUrl
  }

  const previousLedger = await ledgerAccess.getLedger(ledgerId, userId);

  const ledgerUpdate: LedgerUpdate = {
    userId: userId,
    ledgerId: ledgerId,
    updatedAt: currentDate,
    name: previousLedger.name,
    description: previousLedger.description,
    initialValue: previousLedger.initialValue,
    balance: previousLedger.balance + createLedgerEntryRequest.amount,
    status: previousLedger.status
  }

  const [entry] = await Promise.all([
    ledgerEntryAccess.createLedgerEntry(ledgerEntry),
    ledgerAccess.updateLedger(ledgerUpdate)
  ]);

  return entry;
}

export async function updateLedgerEntryItem(
  updateledgerEntryRequest: UpdateLedgerEntryRequest,
  ledgerId: string, userId: string, entryId: string
): Promise<void> {
  logger.info(`User ${userId} requested update item ${entryId}: ${updateledgerEntryRequest}`);

  const currentDate = new Date().toISOString();

  const ledgerEntryUpdate: LedgerEntryUpdate = {
    userId: userId,
    ledgerId: ledgerId,
    entryId: entryId,
    updatedAt: currentDate,
    name: updateledgerEntryRequest.name,
    description: updateledgerEntryRequest.description,
    amount: updateledgerEntryRequest.amount,
    attachmentUrl: updateledgerEntryRequest.attachmentUrl
  }

  const previousLedgerEntry = await ledgerEntryAccess.getLedgerEntry(ledgerId, userId, entryId);
  const previousLedger = await ledgerAccess.getLedger(ledgerId, userId);

  const ledgerUpdate: LedgerUpdate = {
    userId: userId,
    ledgerId: ledgerId,
    updatedAt: currentDate,
    name: previousLedger.name,
    description: previousLedger.description,
    initialValue: previousLedger.initialValue,
    balance: previousLedger.balance - previousLedgerEntry.amount + updateledgerEntryRequest.amount,
    status: previousLedger.status
  }

  await Promise.all([
    ledgerEntryAccess.updateLedgerEntry(ledgerEntryUpdate),
    ledgerAccess.updateLedger(ledgerUpdate)
  ]);
}

export async function deleteLedgerEntryItem(ledgerId: string, userId: string, entryId: String): Promise<void> {
  logger.info(`User ${userId} requested deletion of item ${entryId}`);
  const currentDate = new Date().toISOString();
  const previousLedgerEntry = await ledgerEntryAccess.getLedgerEntry(ledgerId, userId, entryId);
  const previousLedger = await ledgerAccess.getLedger(ledgerId, userId);

  const ledgerUpdate: LedgerUpdate = {
    userId: userId,
    ledgerId: ledgerId,
    updatedAt: currentDate,
    name: previousLedger.name,
    description: previousLedger.description,
    initialValue: previousLedger.initialValue,
    balance: previousLedger.balance - previousLedgerEntry.amount,
    status: previousLedger.status
  }

  await Promise.all([
    ledgerEntryAccess.deleteLedgerEntry(ledgerId, userId, entryId),
    ledgerAccess.updateLedger(ledgerUpdate)
  ]);
}
