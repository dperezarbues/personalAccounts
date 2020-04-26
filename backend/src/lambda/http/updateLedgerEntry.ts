import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateLedgerEntryRequest } from '../../requests/UpdateLedgerEntryRequest'

import { updateLedgerEntryItem, getLedgerEntry } from '../../businessLogic/ledgerEntry';
import { getSimpleLedger } from '../../businessLogic/ledger';
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const ledgerId = event.pathParameters.ledgerId
  const entryId = event.pathParameters.entryId

  const updatedLedgerEntry: UpdateLedgerEntryRequest = JSON.parse(event.body)

  const ledgerItem = await getSimpleLedger(ledgerId, getUserId(event))

  if (!ledgerItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Ledger Item does not exist'
      })
    }
  }

  const ledgerEntryItem = await getLedgerEntry(ledgerId, getUserId(event), entryId)

  if (!ledgerEntryItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'LedgerEntry Item does not exist'
      })
    }
  }

  await updateLedgerEntryItem(updatedLedgerEntry,ledgerId,getUserId(event), entryId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }
}
