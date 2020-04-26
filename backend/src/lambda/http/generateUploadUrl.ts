import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as AWSXRay from 'aws-xray-sdk'

import { getLedgerEntry, updateLedgerEntryItem } from '../../businessLogic/ledgerEntry';
import { getUserId } from '../utils'
import { UpdateLedgerEntryRequest } from '../../requests/UpdateLedgerEntryRequest'
import { getSimpleLedger } from '../../businessLogic/ledger';

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)
  const ledgerId = event.pathParameters.ledgerId
  const entryId = event.pathParameters.entryId
  const userId = getUserId(event)

  const ledgerItem = await getSimpleLedger(ledgerId, getUserId(event))

  if (!ledgerItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Ledger Item does not exist'
      })
    }
  }

  const ledgerEntryItem = await getLedgerEntry(ledgerId, userId, entryId)

  if (!ledgerEntryItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'LedgerEntry Item does not exist'
      })
    }
  }

  const imageId = uuid.v4()

  const updateLedgerEntryRequest: UpdateLedgerEntryRequest = {
    name: ledgerEntryItem.name,
    description: ledgerEntryItem.description,
    amount: ledgerEntryItem.amount,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }

  await updateLedgerEntryItem (updateLedgerEntryRequest, ledgerId, userId, entryId)

  const url = getUploadUrl(imageId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      attachmentUrl: url
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}
