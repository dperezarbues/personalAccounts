import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getAllLedgerEntries } from '../../businessLogic/ledgerEntry';
import { getSimpleLedger } from '../../businessLogic/ledger';
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const ledgerId = event.pathParameters.ledgerId

  let limit = null;
  let next = null;
  if (event.queryStringParameters) {
    limit = event.queryStringParameters.limit;
    next = event.queryStringParameters.next;
  }

  const ledgerItem = await getSimpleLedger(ledgerId, getUserId(event))

  if (!ledgerItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Ledger Item does not exist'
      })
    }
  }

  const items = await getAllLedgerEntries(ledgerId, getUserId(event), limit, next);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(items)
  }
}
