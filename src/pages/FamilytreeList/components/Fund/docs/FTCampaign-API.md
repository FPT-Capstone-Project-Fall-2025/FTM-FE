Create new campain

https://be.dev.familytree.io.vn/api/ftcampaign

curl -X 'POST' \
  'https://be.dev.familytree.io.vn/api/ftcampaign' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDQyMDhiYS1iYWJkLTRmOTUtODlhMS05MDRhYWE3MWQyYjYiLCJqdGkiOiJlNDIwN2JjNC00NmZmLTQwYjktYjRhOC05M2JmMmNkODhlNTEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjQwNDIwOGJhLWJhYmQtNGY5NS04OWExLTkwNGFhYTcxZDJiNiIsImVtYWlsIjoiZGFuaG52ZGUxODA2NjhAZnB0LmVkdS52biIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJkYW5obnZkZTE4MDY2OEBmcHQuZWR1LnZuIiwibmFtZSI6ImRhbmhudmRlMTgwNjY4QGZwdC5lZHUudm4iLCJlbWFpbENvbmZpcm1lZCI6IlRydWUiLCJpc2dvb2dsZWxvZ2luIjoiZmFsc2UiLCJwaG9uZU51bWJlckNvbmZpcm1lZCI6IkZhbHNlIiwiZnVsbE5hbWUiOiJOZ3V54buFbiBEYW5oIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiR1BPd25lciIsIm5iZiI6MTc2MjY5NzQyMiwiZXhwIjoxNzYyNzgzODIyLCJpc3MiOiJodHRwczovL2JlLmRldi5mYW1pbHl0cmVlLmlvLnZuIiwiYXVkIjoiaHR0cHM6Ly9iZS5kZXYuZmFtaWx5dHJlZS5pby52biJ9.tZ8uVB6-M0j2tQdr79Wofan0JgUDirglQdnPjNrtkuU' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
  "familyTreeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "campaignName": "string",
  "campaignDescription": "string",
  "organizerName": "string",
  "organizerContact": "string",
  "campaignManagerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startDate": "2025-11-09T14:12:15.554Z",
  "endDate": "2025-11-09T14:12:15.554Z",
  "fundGoal": 0,
  "mediaAttachments": "string",
  "bankAccountNumber": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountHolderName": "string"
}'


PUT /api/ftcampaign/{id}
{
  "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "campaignName": "string",
  "campaignDescription": "string",
  "campaignManagerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startDate": "2025-11-09T14:15:28.283Z",
  "endDate": "2025-11-09T14:15:28.283Z",
  "fundGoal": 0,
  "currentBalance": 0,
  "status": "Upcoming",
  "isPublic": true,
  "imageUrl": "string",
  "notes": "string",
  "bankAccountNumber": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountHolderName": "string",
  "familyTree": {
    "name": "string",
    "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "owner": "string",
    "description": "string",
    "filePath": "string",
    "fileType": 0,
    "isActive": true,
    "gpModeCode": 0,
    "ftInvitations": [
      {
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftName": "string",
        "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftMemberName": "string",
        "email": "string",
        "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inviterName": "string",
        "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invitedName": "string",
        "token": "string",
        "expirationDate": "2025-11-09T14:15:28.283Z",
        "status": "PENDING",
        "ft": "string",
        "ftMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.283Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.283Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftUsers": [
      {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "username": "string",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "ft": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.283Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.283Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftMembers": [
      {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "fullname": "string",
        "gender": 0,
        "birthday": "2025-11-09T14:15:28.283Z",
        "statusCode": 0,
        "address": "string",
        "email": "string",
        "phoneNumber": "string",
        "picture": "string",
        "content": "string",
        "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "storyDescription": "string",
        "identificationNumber": "string",
        "identificationType": "string",
        "isDeath": true,
        "deathDescription": "string",
        "deathDate": "2025-11-09T14:15:28.283Z",
        "burialAddress": "string",
        "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "privacyData": "string",
        "isRoot": true,
        "isDivorced": true,
        "ethnic": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "religion": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ward": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "province": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialWard": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialProvince": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.283Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.283Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ft": "string",
        "ftInvitations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftName": "string",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberName": "string",
            "email": "string",
            "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inviterName": "string",
            "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invitedName": "string",
            "token": "string",
            "expirationDate": "2025-11-09T14:15:28.283Z",
            "status": "PENDING",
            "ft": "string",
            "ftMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.283Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.283Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftMemberFiles": [
          {
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMember": "string",
            "title": "string",
            "content": "string",
            "filePath": "string",
            "fileType": "string",
            "description": "string",
            "thumbnail": "string",
            "isActive": true,
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.283Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.283Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFrom": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.283Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.283Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFromPartner": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipTo": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftAuthorizations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "methodCode": "VIEW",
            "featureCode": "MEMBER",
            "familyTree": "string",
            "authorizedMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftAuthorizations": [
      {
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "methodCode": "VIEW",
        "featureCode": "MEMBER",
        "familyTree": "string",
        "authorizedMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "lastModifiedOn": "2025-11-09T14:15:28.284Z",
    "lastModifiedBy": "string",
    "createdOn": "2025-11-09T14:15:28.284Z",
    "createdBy": "string",
    "isDeleted": true,
    "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "campaignManager": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ftRole": "FTMember",
    "fullname": "string",
    "gender": 0,
    "birthday": "2025-11-09T14:15:28.284Z",
    "statusCode": 0,
    "address": "string",
    "email": "string",
    "phoneNumber": "string",
    "picture": "string",
    "content": "string",
    "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "storyDescription": "string",
    "identificationNumber": "string",
    "identificationType": "string",
    "isDeath": true,
    "deathDescription": "string",
    "deathDate": "2025-11-09T14:15:28.284Z",
    "burialAddress": "string",
    "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "privacyData": "string",
    "isRoot": true,
    "isDivorced": true,
    "ethnic": {
      "code": "string",
      "name": "string",
      "isActive": true,
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "religion": {
      "code": "string",
      "name": "string",
      "isActive": true,
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "ward": {
      "code": "string",
      "name": "string",
      "type": "string",
      "slug": "string",
      "nameWithType": "string",
      "path": "string",
      "pathWithType": "string",
      "burialFTMembers": [
        "string"
      ],
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "province": {
      "code": "string",
      "name": "string",
      "type": "string",
      "slug": "string",
      "nameWithType": "string",
      "burialFTMembers": [
        "string"
      ],
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "burialWard": {
      "code": "string",
      "name": "string",
      "type": "string",
      "slug": "string",
      "nameWithType": "string",
      "path": "string",
      "pathWithType": "string",
      "burialFTMembers": [
        "string"
      ],
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "burialProvince": {
      "code": "string",
      "name": "string",
      "type": "string",
      "slug": "string",
      "nameWithType": "string",
      "burialFTMembers": [
        "string"
      ],
      "ftMembers": [
        "string"
      ],
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "ft": "string",
    "ftInvitations": [
      {
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftName": "string",
        "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftMemberName": "string",
        "email": "string",
        "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inviterName": "string",
        "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invitedName": "string",
        "token": "string",
        "expirationDate": "2025-11-09T14:15:28.284Z",
        "status": "PENDING",
        "ft": "string",
        "ftMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftMemberFiles": [
      {
        "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftMember": "string",
        "title": "string",
        "content": "string",
        "filePath": "string",
        "fileType": "string",
        "description": "string",
        "thumbnail": "string",
        "isActive": true,
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftRelationshipFrom": [
      {
        "isActive": true,
        "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryCode": 0,
        "fromFTMember": "string",
        "fromFTMemberPartner": "string",
        "toFTMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftRelationshipFromPartner": [
      {
        "isActive": true,
        "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryCode": 0,
        "fromFTMember": "string",
        "fromFTMemberPartner": "string",
        "toFTMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftRelationshipTo": [
      {
        "isActive": true,
        "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryCode": 0,
        "fromFTMember": "string",
        "fromFTMemberPartner": "string",
        "toFTMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ftAuthorizations": [
      {
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "methodCode": "VIEW",
        "featureCode": "MEMBER",
        "familyTree": "string",
        "authorizedMember": "string",
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "lastModifiedOn": "2025-11-09T14:15:28.284Z",
    "lastModifiedBy": "string",
    "createdOn": "2025-11-09T14:15:28.284Z",
    "createdBy": "string",
    "isDeleted": true,
    "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "donations": [
    {
      "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "donorName": "string",
      "donationAmount": 0,
      "paymentMethod": "Cash",
      "donorNotes": "string",
      "paymentTransactionId": "string",
      "payOSOrderCode": 0,
      "status": "Pending",
      "confirmedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "confirmedOn": "2025-11-09T14:15:28.284Z",
      "confirmationNotes": "string",
      "isAnonymous": true,
      "campaign": "string",
      "member": {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "fullname": "string",
        "gender": 0,
        "birthday": "2025-11-09T14:15:28.284Z",
        "statusCode": 0,
        "address": "string",
        "email": "string",
        "phoneNumber": "string",
        "picture": "string",
        "content": "string",
        "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "storyDescription": "string",
        "identificationNumber": "string",
        "identificationType": "string",
        "isDeath": true,
        "deathDescription": "string",
        "deathDate": "2025-11-09T14:15:28.284Z",
        "burialAddress": "string",
        "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "privacyData": "string",
        "isRoot": true,
        "isDivorced": true,
        "ethnic": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "religion": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ward": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "province": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialWard": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialProvince": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ft": "string",
        "ftInvitations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftName": "string",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberName": "string",
            "email": "string",
            "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inviterName": "string",
            "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invitedName": "string",
            "token": "string",
            "expirationDate": "2025-11-09T14:15:28.284Z",
            "status": "PENDING",
            "ft": "string",
            "ftMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftMemberFiles": [
          {
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMember": "string",
            "title": "string",
            "content": "string",
            "filePath": "string",
            "fileType": "string",
            "description": "string",
            "thumbnail": "string",
            "isActive": true,
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFrom": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFromPartner": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipTo": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftAuthorizations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "methodCode": "VIEW",
            "featureCode": "MEMBER",
            "familyTree": "string",
            "authorizedMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      "confirmer": {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "fullname": "string",
        "gender": 0,
        "birthday": "2025-11-09T14:15:28.284Z",
        "statusCode": 0,
        "address": "string",
        "email": "string",
        "phoneNumber": "string",
        "picture": "string",
        "content": "string",
        "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "storyDescription": "string",
        "identificationNumber": "string",
        "identificationType": "string",
        "isDeath": true,
        "deathDescription": "string",
        "deathDate": "2025-11-09T14:15:28.284Z",
        "burialAddress": "string",
        "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "privacyData": "string",
        "isRoot": true,
        "isDivorced": true,
        "ethnic": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "religion": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ward": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "province": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialWard": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialProvince": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ft": "string",
        "ftInvitations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftName": "string",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberName": "string",
            "email": "string",
            "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inviterName": "string",
            "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invitedName": "string",
            "token": "string",
            "expirationDate": "2025-11-09T14:15:28.284Z",
            "status": "PENDING",
            "ft": "string",
            "ftMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftMemberFiles": [
          {
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMember": "string",
            "title": "string",
            "content": "string",
            "filePath": "string",
            "fileType": "string",
            "description": "string",
            "thumbnail": "string",
            "isActive": true,
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFrom": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFromPartner": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipTo": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftAuthorizations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "methodCode": "VIEW",
            "featureCode": "MEMBER",
            "familyTree": "string",
            "authorizedMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.284Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.284Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "expenses": [
    {
      "campaignId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "authorizedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "expenseTitle": "string",
      "expenseDescription": "string",
      "expenseAmount": 0,
      "category": "Education",
      "expenseDate": "2025-11-09T14:15:28.284Z",
      "recipient": "string",
      "paymentMethod": "Cash",
      "receiptImages": "string",
      "notes": "string",
      "approvalStatus": "Pending",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedOn": "2025-11-09T14:15:28.284Z",
      "approvalNotes": "string",
      "campaign": "string",
      "authorizer": {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "fullname": "string",
        "gender": 0,
        "birthday": "2025-11-09T14:15:28.284Z",
        "statusCode": 0,
        "address": "string",
        "email": "string",
        "phoneNumber": "string",
        "picture": "string",
        "content": "string",
        "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "storyDescription": "string",
        "identificationNumber": "string",
        "identificationType": "string",
        "isDeath": true,
        "deathDescription": "string",
        "deathDate": "2025-11-09T14:15:28.284Z",
        "burialAddress": "string",
        "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "privacyData": "string",
        "isRoot": true,
        "isDivorced": true,
        "ethnic": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "religion": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ward": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "province": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialWard": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialProvince": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ft": "string",
        "ftInvitations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftName": "string",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberName": "string",
            "email": "string",
            "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inviterName": "string",
            "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invitedName": "string",
            "token": "string",
            "expirationDate": "2025-11-09T14:15:28.284Z",
            "status": "PENDING",
            "ft": "string",
            "ftMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftMemberFiles": [
          {
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMember": "string",
            "title": "string",
            "content": "string",
            "filePath": "string",
            "fileType": "string",
            "description": "string",
            "thumbnail": "string",
            "isActive": true,
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFrom": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFromPartner": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipTo": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftAuthorizations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "methodCode": "VIEW",
            "featureCode": "MEMBER",
            "familyTree": "string",
            "authorizedMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.284Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.284Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      "approver": {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ftRole": "FTMember",
        "fullname": "string",
        "gender": 0,
        "birthday": "2025-11-09T14:15:28.284Z",
        "statusCode": 0,
        "address": "string",
        "email": "string",
        "phoneNumber": "string",
        "picture": "string",
        "content": "string",
        "ethnicId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "religionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "provinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "storyDescription": "string",
        "identificationNumber": "string",
        "identificationType": "string",
        "isDeath": true,
        "deathDescription": "string",
        "deathDate": "2025-11-09T14:15:28.284Z",
        "burialAddress": "string",
        "burialWardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "burialProvinceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "privacyData": "string",
        "isRoot": true,
        "isDivorced": true,
        "ethnic": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "religion": {
          "code": "string",
          "name": "string",
          "isActive": true,
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ward": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "province": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialWard": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "path": "string",
          "pathWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "burialProvince": {
          "code": "string",
          "name": "string",
          "type": "string",
          "slug": "string",
          "nameWithType": "string",
          "burialFTMembers": [
            "string"
          ],
          "ftMembers": [
            "string"
          ],
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "lastModifiedOn": "2025-11-09T14:15:28.284Z",
          "lastModifiedBy": "string",
          "createdOn": "2025-11-09T14:15:28.284Z",
          "createdBy": "string",
          "isDeleted": true,
          "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "ft": "string",
        "ftInvitations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftName": "string",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberName": "string",
            "email": "string",
            "inviterUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inviterName": "string",
            "invitedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invitedName": "string",
            "token": "string",
            "expirationDate": "2025-11-09T14:15:28.284Z",
            "status": "PENDING",
            "ft": "string",
            "ftMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.284Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.284Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftMemberFiles": [
          {
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMember": "string",
            "title": "string",
            "content": "string",
            "filePath": "string",
            "fileType": "string",
            "description": "string",
            "thumbnail": "string",
            "isActive": true,
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.285Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.285Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFrom": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.285Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.285Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipFromPartner": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.285Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.285Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftRelationshipTo": [
          {
            "isActive": true,
            "fromFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "fromFTMemberPartnerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "toFTMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "categoryCode": 0,
            "fromFTMember": "string",
            "fromFTMemberPartner": "string",
            "toFTMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.285Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.285Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "ftAuthorizations": [
          {
            "ftId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "ftMemberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "methodCode": "VIEW",
            "featureCode": "MEMBER",
            "familyTree": "string",
            "authorizedMember": "string",
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "lastModifiedOn": "2025-11-09T14:15:28.285Z",
            "lastModifiedBy": "string",
            "createdOn": "2025-11-09T14:15:28.285Z",
            "createdBy": "string",
            "isDeleted": true,
            "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "lastModifiedOn": "2025-11-09T14:15:28.285Z",
        "lastModifiedBy": "string",
        "createdOn": "2025-11-09T14:15:28.285Z",
        "createdBy": "string",
        "isDeleted": true,
        "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lastModifiedOn": "2025-11-09T14:15:28.285Z",
      "lastModifiedBy": "string",
      "createdOn": "2025-11-09T14:15:28.285Z",
      "createdBy": "string",
      "isDeleted": true,
      "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "lastModifiedOn": "2025-11-09T14:15:28.285Z",
  "lastModifiedBy": "string",
  "createdOn": "2025-11-09T14:15:28.285Z",
  "createdBy": "string",
  "isDeleted": true,
  "createdByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}


GET /api/ftcampaign/{id}
GET /api/ftcampaign/family-tree/{familyTreeId}
GET /api/ftcampaign/manager/{managerId}
GET /api/ftcampaign/active
GET /api/ftcampaign/{campaignId}/financial-summary
GET /api/ftcampaign/{campaignId}/donations
GET /api/ftcampaign/{campaignId}/expenses

