FTFund

GET     /api/funds/tree/{treeId}

POST    /api/funds
{
  "familyTreeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fundName": "string",
  "description": "string",
  "bankAccountNumber": "string",
  "bankCode": "string",
  "bankName": "string",
  "accountHolderName": "string"
}

POST    /api/funds/{fundId}/donate
{
  "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "donorName": "string",
  "amount": 0,
  "paymentMethod": "Cash",
  "paymentNotes": "string",
  "returnUrl": "string",
  "cancelUrl": "string"
}
