FTCampaignExpense

GET     /api/ftcampaignexpense/{id}

PUT     /api/ftcampaignexpense/{id}
{
  "amount": 0,
  "description": "string",
  "category": "Education",
  "receiptImages": "string"
}

DELETE  /api/ftcampaignexpense/{id}

GET     /api/ftcampaignexpense/campaign/{campaignId}

GET     /api/ftcampaignexpense/pending/manager/{managerId}

GET     /api/ftcampaignexpense/campaign/{campaignId}/statistics

POST    /api/ftcampaignexpense
{
  "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "description": "string",
  "category": "Education",
  "receiptImages": "string",
  "authorizedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}

PUT     /api/ftcampaignexpense/{id}/approve
{
  "approverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvalNotes": "string"
}

PUT     /api/ftcampaignexpense/{id}/reject
{
  "approverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rejectionReason": "string"
}
