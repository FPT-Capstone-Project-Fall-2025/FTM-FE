GET     /api/ftcampaigndonation/{id}

GET     /api/ftcampaigndonation/campaign/{campaignId}

GET     /api/ftcampaigndonation/user/{userId}

GET     /api/ftcampaigndonation/campaign/{campaignId}/top-donors

GET     /api/ftcampaigndonation/campaign/{campaignId}/statistics

POST    /api/ftcampaigndonation/campaign/{campaignId}/donate
{
  "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "donorName": "string",
  "amount": 0,
  "paymentMethod": "Cash",
  "paymentNotes": "string",
  "isAnonymous": true
}

POST    /api/ftcampaigndonation/online
{
  "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "donorName": "string",
  "amount": 0,
  "message": "string",
  "isAnonymous": true,
  "returnUrl": "string",
  "cancelUrl": "string"
}

POST    /api/ftcampaigndonation/cash
{
  "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "donorName": "string",
  "amount": 0,
  "notes": "string",
  "isAnonymous": true
}

POST    /api/ftcampaigndonation/payos-callback
{
  "orderCode": "string",
  "status": "string",
  "amount": 0,
  "transactionId": "string",
  "transactionDateTime": "2025-11-09T14:27:40.970Z"
}

GET     /api/ftcampaigndonation/payment-status/{orderCode}
