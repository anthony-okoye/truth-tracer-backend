# TruthTracer API Documentation

## API Documentation

The API documentation is available through Swagger UI at:
```
http://localhost:3000/api/docs
```

---

## Health Check

**GET /health**

_Checks the health of the API and its dependencies._

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-14T12:00:00Z",
  "services": {
    "api": "ok",
    "database": "ok"
  }
}
```

---

## Claim Analysis

**POST /claims/analyze**

_Analyzes a claim or text for veracity and reasoning._

**Request:**
```json
{
  "claim": "COVID-19 vaccines cause infertility."
}
```

**Response:**
```json
{
  "verdict": "FALSE",
  "confidence": 0.95,
  "explanation": "Multiple peer-reviewed studies show no evidence that COVID-19 vaccines cause infertility.",
  "sources": [
    {
      "title": "CDC: Myths and Facts about COVID-19 Vaccines",
      "url": "https://www.cdc.gov/coronavirus/2019-ncov/vaccines/facts.html",
      "reliability": "High"
    },
    {
      "title": "WHO: COVID-19 Vaccines Advice",
      "url": "https://www.who.int/news-room/feature-stories/detail/vaccine-myths",
      "reliability": "High"
    }
  ],
  "notes": "This claim has been widely debunked by multiple health organizations."
}
```

---

## Trust Chain Analysis

**POST /claims/trace**

_Analyzes the trust chain and propagation of a claim._

**Request:**
```json
{
  "claim": "COVID-19 vaccines cause infertility."
}
```

**Response:**
```json
{
  "hasTrustChain": true,
  "confidence": 0.85,
  "sources": [
    {
      "name": "Social Media Post",
      "url": "https://example.com/post",
      "reliability": 0.3
    },
    {
      "name": "News Article",
      "url": "https://example.com/news",
      "reliability": 0.7
    }
  ],
  "explanation": "The claim originated from a social media post and was later picked up by news outlets.",
  "gaps": ["Original source of the claim is unclear"],
  "context": "This claim spread during the early days of COVID-19 vaccination"
}
```

---

## Socratic Reasoning

**POST /claims/socratic**

_Generates Socratic reasoning and questions for a claim._

**Request:**
```json
{
  "claim": "COVID-19 vaccines cause infertility."
}
```

**Response:**
```json
{
  "conclusion": {
    "logicalValidity": "Invalid",
    "keyFlaws": "No scientific evidence, contradicts established research",
    "strengths": "None identified",
    "recommendations": "Consult medical professionals and scientific literature"
  },
  "confidence": 0.9,
  "questions": [
    "What evidence supports this claim?",
    "Have there been any large-scale studies on this topic?",
    "What do medical authorities say about this claim?"
  ],
  "assumptions": [
    "Vaccines can affect reproductive health",
    "Infertility is a common side effect"
  ],
  "fallacies": [
    "Appeal to fear",
    "False cause"
  ],
  "insights": "The claim appears to be based on misinformation rather than scientific evidence"
}
```

---

## Error Responses

- **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": ["claim should not be empty"],
  "error": "Bad Request"
}
```

- **500 Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "An error occurred while processing your request",
  "error": "Internal Server Error"
}
``` 