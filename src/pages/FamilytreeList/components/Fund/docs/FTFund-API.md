FTFund

GET     /api/funds/tree/{treeId}

response:
{
    "statusCode": 200,
    "message": "Funds retrieved successfully",
    "status": true,
    "data": [
        {
            "id": "ea03e054-4458-4bea-9b4d-6d5e3726d48a",
            "fundName": "Quỹ Dòng Tộc Nguyễn 2025",
            "description": "Quỹ chung cho các hoạt động dòng tộc",
            "currentMoney": 5999700.00,
            "donationCount": 0,
            "expenseCount": 0
        },
        {
            "id": "c62fb141-90f4-46ba-a159-49f8b205ab5f",
            "fundName": "Quỹ Dòng Tộc Nguyễn 2025",
            "description": "Quỹ chung cho các hoạt động dòng tộc",
            "currentMoney": 0.00,
            "donationCount": 0,
            "expenseCount": 0
        },
        {
            "id": "f8255a24-2002-48e2-b3d6-061bceb9db55",
            "fundName": "Quỹ Phúc lợi gia đình",
            "description": "Quỹ tương trợ giúp đỡ thành viên trong gia đình",
            "currentMoney": 0.00,
            "donationCount": 0,
            "expenseCount": 0
        },
        {
            "id": "5d8b6626-a1e7-45d2-98bf-677159d32d1f",
            "fundName": "Quỹ Phúc lợi gia đình",
            "description": "Quỹ tương trợ giúp đỡ thành viên trong gia đình",
            "currentMoney": 0.00,
            "donationCount": 0,
            "expenseCount": 0
        }
    ],
    "errors": null,
    "hasError": false
}


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
