FTFundExpense API Endpoints
GET Requests
/api/fund-expenses/fund/{fundId} — Retrieve expenses for a specific fund

/api/fund-expenses/pending — Retrieve all pending fund expenses

/api/fund-expenses/{id} — Retrieve a specific fund expense by ID

/api/fund-expenses/fund/{fundId}/statistics — Get statistics for a specific fund

PUT Request
/api/fund-expenses/{id} — Update a specific fund expense
{
  "amount": 0,
  "description": "string",
  "plannedDate": "2025-11-09T14:33:47.553Z",
  "expenseEvent": "string",
  "recipient": "string"
}

DELETE Request
/api/fund-expenses/{id} — Delete a specific fund expense

POST Requests
/api/fund-expenses — Create a new fund expense
{
  "fundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "description": "string",
  "plannedDate": "2025-11-09T14:33:57.685Z",
  "expenseEvent": "string",
  "recipient": "string"
}

/api/fund-expenses/{id}/approve — Approve a specific fund expense
{
  "approverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "notes": "string"
}

/api/fund-expenses/{id}/reject — Reject a specific fund expense
{
  "rejectedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "string"
}