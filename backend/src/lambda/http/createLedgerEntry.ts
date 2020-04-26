import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateLedgerEntryRequest } from '../../requests/CreateLedgerEntryRequest'
import { createLedgerEntryItem } from '../../businessLogic/ledgerEntry';
import { getSimpleLedger } from '../../businessLogic/ledger';
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newLedgerEntry: CreateLedgerEntryRequest = JSON.parse(event.body)
  const ledgerId = event.pathParameters.ledgerId

  const ledgerItem = await getSimpleLedger(ledgerId, getUserId(event))

  if (!ledgerItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Ledger Item does not exist'
      })
    }
  }

  try {
    const ledgerEntryItem = await createLedgerEntryItem(newLedgerEntry, ledgerId, getUserId(event));
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        item: ledgerEntryItem
      })
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: e
      })
    }
  }


}
