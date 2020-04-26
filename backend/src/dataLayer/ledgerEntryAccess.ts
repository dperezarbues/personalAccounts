import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { createLogger } from '../utils/logger'
import { LedgerEntryList } from '../models/LedgerEntryList'
import { LedgerEntry } from '../models/LedgerEntry'
import { LedgerEntryUpdate } from '../models/LedgerEntryUpdate'

const logger = createLogger('LedgerEntryDataLayer')

export class LedgerEntryAccess {

  constructor(
    private readonly dynamoDBClient: DocumentClient = createDynamoDBClient(),
    private readonly ledgerEntryTable = process.env.LEDGER_ENTRY_TABLE,
    private readonly ledgerEntryIndex = process.env.LEDGER_ENTRY_INDEX) {
  }

  async getAllLedgerEntries(ledgerId: string, userId: string, limit, next): Promise<LedgerEntryList> {
    logger.info(`Getting all LedgerEntries for ledgerId: ${ledgerId}`)
    const nextParam = next ? JSON.parse(decodeURIComponent(next)) : null;

    const result = await this.dynamoDBClient
    .query({
      TableName: this.ledgerEntryTable,
      IndexName: this.ledgerEntryIndex,
      KeyConditionExpression: 'ledgerId = :ledgerId',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':ledgerId': ledgerId,
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: nextParam
    })
    .promise()

    const items = result.Items as LedgerEntry[];
    const itemsList: LedgerEntryList = {
      items: items,
      next: encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
    }
    logger.info(`Found the following info for ledgerId ${ledgerId}: ${JSON.stringify(items)}`)
    return itemsList;
  }

  async getLedgerEntry(ledgerId: string, userId: string, entryId: String): Promise<LedgerEntry> {
    logger.info(`Getting ledgerEntry ${entryId} for ledgerId: ${ledgerId}`)

    const result = await this.dynamoDBClient
    .query({
      TableName: this.ledgerEntryTable,
      KeyConditionExpression: 'ledgerId = :ledgerId AND entryId = :entryId',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':ledgerId': ledgerId,
        ':entryId': entryId,
        ':userId': userId
      }
    })
    .promise()

    const items = result.Items;
    logger.info(`Found the following info for ledgerId ${ledgerId}: ${JSON.stringify(items)}`)
    
    return items[0] as LedgerEntry;
  }

  async createLedgerEntry(ledgerEntry: LedgerEntry): Promise<LedgerEntry> {
    logger.info(`Storing the following info: ${JSON.stringify(ledgerEntry)}`)
    const result = await this.dynamoDBClient.put({
      TableName: this.ledgerEntryTable,
      Item: ledgerEntry
    }).promise()

    logger.info(`Stored information result: ${JSON.stringify(result.$response.data)}`)
    return ledgerEntry
  }

  async updateLedgerEntry(ledgerEntryUpdate: LedgerEntryUpdate): Promise<void> {
    logger.info(`Updating with the following info: ${JSON.stringify(ledgerEntryUpdate)}`)
    const result = await this.dynamoDBClient.update({
      TableName: this.ledgerEntryTable,
      Key:{
        ledgerId: ledgerEntryUpdate.ledgerId,
        entryId: ledgerEntryUpdate.entryId
      },
      UpdateExpression: "set #n = :name, description=:description, updatedAt=:updatedAt, amount=:amount, attachmentUrl=:attachmentUrl",
      ExpressionAttributeValues:{
        ":name": ledgerEntryUpdate.name,
        ":description": ledgerEntryUpdate.description,
        ":updatedAt": ledgerEntryUpdate.updatedAt,
        ":amount": ledgerEntryUpdate.amount,
        ":attachmentUrl": ledgerEntryUpdate.attachmentUrl || '',
        ':userId': ledgerEntryUpdate.userId
      },
      ExpressionAttributeNames: {
        "#n":"name"
      },
      ConditionExpression: 'userId = :userId'
    }).promise() 
    logger.info(`Updated information result: ${JSON.stringify(result.$response.data)}`)
  }

  async deleteLedgerEntry(ledgerId: string, userId: string, entryId: String): Promise<void> {
    logger.info(`Deleting with the following info: ledgerId: ${ledgerId}, entryId: ${entryId}`)
    const result = await this.dynamoDBClient.delete({
      TableName: this.ledgerEntryTable,
      Key:{
        entryId: entryId,
        ledgerId: ledgerId
      },
      ConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
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
