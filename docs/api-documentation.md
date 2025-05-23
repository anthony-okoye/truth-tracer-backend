# TruthTracer API Documentation

## Authentication

All endpoints (except `/health`) require a valid JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Health Check

**GET /health**

_Checks the health of the API, database, and Sonar integration._

**Response:**
```json
{
  "status": "ok",
  "database": "ok",
  "sonar": "ok"
}
```

---

## Claim Analysis

**POST /claims/analyze**

_Analyzes a claim or text for veracity and reasoning._

**Request:**
```json
{
  "input": "COVID-19 vaccines cause infertility."
}
```

**Response:**
```json
{
  "rating": "FALSE",
  "explanation": "Multiple peer-reviewed studies show no evidence that COVID-19 vaccines cause infertility.",
  "reasoningSteps": [
    "Reviewed scientific literature.",
    "Consulted CDC and WHO sources.",
    "No credible evidence found linking vaccines to infertility."
  ],
  "sources": [
    {
      "title": "CDC: Myths and Facts about COVID-19 Vaccines",
      "url": "https://www.cdc.gov/coronavirus/2019-ncov/vaccines/facts.html",
      "source": "CDC"
    },
    {
      "title": "WHO: COVID-19 Vaccines Advice",
      "url": "https://www.who.int/news-room/feature-stories/detail/vaccine-myths",
      "source": "WHO"
    }
  ]
}
```

---

## Socratic Reasoning

**GET /claims/socratic/:claimId**

_Returns a logical reasoning tree and Socratic questions for a claim._

**Response:**
```json
{
  "claimId": "b1a2c3d4-5678-1234-9abc-1234567890ab",
  "reasoningTree": [
    {
      "id": "1",
      "type": "PREMISE",
      "content": "COVID-19 vaccines are widely used.",
      "children": ["2"]
    },
    {
      "id": "2",
      "type": "EVIDENCE",
      "content": "No evidence of infertility in large studies.",
      "children": ["3"]
    },
    {
      "id": "3",
      "type": "CONCLUSION",
      "content": "Vaccines do not cause infertility.",
      "children": []
    }
  ],
  "questions": [
    "What evidence would support the claim?",
    "Are there large-scale studies on this topic?",
    "What do health authorities say?"
  ]
}
```

---

## User Claim History

**GET /claims/history**

_Returns all claims submitted by the authenticated user._

**Response:**
```json
[
  {
    "id": "b1a2c3d4-5678-1234-9abc-1234567890ab",
    "text": "COVID-19 vaccines cause infertility.",
    "rating": "FALSE",
    "createdAt": "2024-06-01T12:00:00Z"
  },
  {
    "id": "c2b3a4d5-6789-2345-0bcd-2345678901bc",
    "text": "The earth is flat.",
    "rating": "FALSE",
    "createdAt": "2024-06-02T15:30:00Z"
  }
]
```

---

## Admin: All Claims

**GET /claims/admin/all**

_Returns all claims in the system (admin only)._ 

**Response:**
```json
[
  {
    "id": "b1a2c3d4-5678-1234-9abc-1234567890ab",
    "text": "COVID-19 vaccines cause infertility.",
    "userId": "user-123",
    "rating": "FALSE",
    "createdAt": "2024-06-01T12:00:00Z"
  },
  {
    "id": "c2b3a4d5-6789-2345-0bcd-2345678901bc",
    "text": "The earth is flat.",
    "userId": "user-456",
    "rating": "FALSE",
    "createdAt": "2024-06-02T15:30:00Z"
  }
]
```

---

## Error Responses

- **401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

- **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": ["input should not be empty"],
  "error": "Bad Request"
}
``` 