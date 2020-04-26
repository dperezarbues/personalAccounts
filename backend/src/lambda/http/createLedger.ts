import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateLedgerRequest } from '../../requests/CreateLedgerRequest'
import { createLedgerItem } from '../../businessLogic/ledger';
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newLedger: CreateLedgerRequest = JSON.parse(event.body)

  try {
    const ledgerItem = await createLedgerItem(newLedger, getUserId(event));
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        item: ledgerItem
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
