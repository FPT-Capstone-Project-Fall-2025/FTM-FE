FTFundDonation API Endpoints
GET Requests
/api/donations/fund/{fundId} — Retrieve donations for a specific fund

/api/donations/pending — Retrieve all pending donations

/api/donations/{id} — Retrieve a specific donation by ID

/api/donations/fund/{fundId}/stats — Get donation statistics for a specific fund

PUT Request
/api/donations/{id} — Update a specific donation
{
  "amount": 0,
  "donorName": "string",
  "paymentNotes": "string"
}

DELETE Request
/api/donations/{id} — Delete a specific donation

POST Requests
/api/donations/{id}/confirm — Confirm a specific donation
{
  "confirmerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "notes": "string"
}

/api/donations/{id}/reject — Reject a specific donation
{
  "rejectedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "string"
}