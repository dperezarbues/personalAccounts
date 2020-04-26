import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { createLogger } from '../utils/logger'
import { LedgerList } from '../models/LedgerList'
import { Ledger } from '../models/Ledger'
import { LedgerUpdate } from '../models/LedgerUpdate'
import { LedgerStatus } from '../models/LedgerStatus'

const logger = createLogger('LedgerDataLayer')

export class LedgerAccess {

  constructor(
    private readonly dynamoDBClient: DocumentClient = createDynamoDBClient(),
    private readonly ledgerTable = process.env.LEDGER_TABLE,
    private readonly ledgerIndex = process.env.LEDGER_INDEX) {
  }

  async getAllLedgers(userId: string, limit, next): Promise<LedgerList> {
    logger.info(`Getting all Ledgers for userId: ${userId}`)

    const nextParam = next ? JSON.parse(decodeURIComponent(next)) : null;

    const result = await this.dynamoDBClient
    .query({
      TableName: this.ledgerTable,
      IndexName: this.ledgerIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: nextParam
    })
    .promise()

    const items = result.Items as Ledger[];
    const itemsList: LedgerList = {
      items: items,
      next: encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
    }
    logger.info(`Found the following info for userId ${userId}: ${JSON.stringify(items)}`)
    return itemsList;
  }

  async getLedger(ledgerId: String, userId: string): Promise<Ledger> {
    logger.info(`Getting ledger ${ledgerId} for userId: ${userId}`)

    const result = await this.dynamoDBClient
    .query({
      TableName: this.ledgerTable,
      KeyConditionExpression: 'userId = :userId AND ledgerId = :ledgerId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':ledgerId': ledgerId
      }
    })
    .promise()

    const items = result.Items;
    logger.info(`Found the following info for userId ${userId}: ${JSON.stringify(items)}`)
    
    return items[0] as Ledger;
  }

  async createLedger(ledger: Ledger): Promise<Ledger> {
    logger.info(`Storing the following info: ${JSON.stringify(ledger)}`)
    const result = await this.dynamoDBClient.put({
      TableName: this.ledgerTable,
      Item: ledger
    }).promise()

    logger.info(`Stored information result: ${JSON.stringify(result.$response.data)}`)
    return ledger
  }

  async updateLedger(ledgerUpdate: LedgerUpdate): Promise<void> {
    logger.info(`Updating with the following info: ${JSON.stringify(ledgerUpdate)}`)
    const result = await this.dynamoDBClient.update({
      TableName: this.ledgerTable,
      Key:{
        userId: ledgerUpdate.userId,
        ledgerId: ledgerUpdate.ledgerId
      },
      UpdateExpression: "set #n = :name, description=:description, updatedAt=:updatedAt, initialValue=:initialValue, balance=:balance, #s=:status",
      ExpressionAttributeValues:{
          ":name": ledgerUpdate.name,
          ":description": ledgerUpdate.description,
          ":updatedAt": ledgerUpdate.updatedAt,
          ":initialValue": ledgerUpdate.initialValue,
          ":balance": ledgerUpdate.balance,
          ":status": ledgerUpdate.status || LedgerStatus.Open,
      },
      ExpressionAttributeNames: {
        "#n":"name",
        "#s":"status",
      }
    }).promise() 
    logger.info(`Updated information result: ${JSON.stringify(result.$response.data)}`)
  }

  async deleteLedger(ledgerId: String, userId: string): Promise<void> {
    logger.info(`Deleting with the following info: userId: ${userId}, ledgerId: ${ledgerId}`)
    const result = await this.dynamoDBClient.delete({
      TableName: this.ledgerTable,
      Key:{
        ledgerId: ledgerId,
        userId: userId
      },
    }).promise() 
    logger.info(`Deleted information result: ${JSON.stringify(result)}`);
  }

}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient({convertEmptyValues: true})
}
