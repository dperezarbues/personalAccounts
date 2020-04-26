import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getLedgerEntry } from '../../businessLogic/ledgerEntry';
import { getSimpleLedger } from '../../businessLogic/ledger';
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const ledgerId = event.pathParameters.ledgerId
  const entryId = event.pathParameters.entryId

  const ledgerItem = await getSimpleLedger(ledgerId, getUserId(event))

  if (!ledgerItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Ledger Item does not exist'
      })
    }
  }

  const items = await getLedgerEntry(ledgerId, getUserId(event), entryId);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(items)
  }
}
