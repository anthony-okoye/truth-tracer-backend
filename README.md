# TruthTracer

TruthTracer is a misinformation detection platform that uses AI to analyze claims, trace their origins, and provide detailed reasoning about their veracity.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Interface Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Controllers │  │    DTOs     │  │ Guards & Decorators│   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Use Cases                          │   │
│  │  • AnalyzeClaimUseCase                             │   │
│  │  • TraceTrustChainUseCase                          │   │
│  │  • GenerateSocraticReasoningUseCase                │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │  Entities   │  │ Interfaces  │  │  Value Objects    │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │   Sonar     │  │ Database    │  │ External Services │   │
│  │   Client    │  │ Repositories │  │                   │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Claim Analysis**: 
  - Analyzes text content using Perplexity's Sonar API
  - Fact checking with detailed reasoning
  - Source verification and citation
  - Chain-of-thought analysis
  - Parallel processing of multiple analysis methods

- **Trust Chain Tracing**: 
  - Tracks claim propagation across platforms using Perplexity's Sonar API
  - Analyzes source credibility
  - Maps information flow
  - Configurable depth of analysis

- **Socratic Reasoning**:
  - Step-by-step logical analysis using Perplexity's Sonar API
  - Interactive questioning
  - Evidence-based conclusions
  - Adaptive reasoning depth

## Perplexity API Integration

The application uses Perplexity's Sonar API for claim analysis through three main methods:

### API Endpoints
- Base URL: `https://api.perplexity.ai`
- Endpoint: `/chat/completions`
- Models: `sonar` and `sonar-reasoning`

### Analysis Types

1. **Fact Check Analysis**
   - Model: `sonar`
   - Returns: Verdict (TRUE/FALSE/MISLEADING/UNVERIFIABLE)
   - Includes sources and explanations
   - Max tokens: 500

2. **Trust Chain Analysis**
   - Model: `sonar-reasoning`
   - Returns: Trust chain verification with confidence scores
   - Includes source reliability analysis
   - Max tokens: 2500

3. **Socratic Reasoning**
   - Model: `sonar-reasoning`
   - Returns: Step-by-step logical analysis
   - Includes evidence and implications
   - Max tokens: 4000

### Request Format
```typescript
{
  model: 'sonar' | 'sonar-reasoning',
  messages: [
    {
      role: 'system',
      content: string // Template content
    },
    {
      role: 'user',
      content: string // Claim to analyze
    }
  ],
  max_tokens: number
}
```

### Response Format
All responses are in JSON format with specific schemas for each analysis type:

1. **Fact Check Response**
```typescript
{
  verdict: "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIABLE",
  explanation: string,
  sources: Array<{
    title: string,
    url: string,
    reliability: "High" | "Medium" | "Low"
  }>
}
```

2. **Trust Chain Response**
```typescript
{
  hasTrustChain: boolean,
  confidence: number,
  sources: Array<{
    name: string,
    url: string,
    reliability: number
  }>,
  explanation: string,
  gaps: string[],
  context: string
}
```

3. **Socratic Response**
```typescript
{
  reasoningSteps: Array<{
    question: string,
    analysis: string,
    evidence: string,
    implications: string
  }>,
  conclusion: {
    logicalValidity: string,
    keyFlaws: string,
    strengths: string,
    recommendations: string
  }
}
```

### Error Handling
- Automatic retries for failed requests (configurable)
- Timeout handling
- JSON parsing validation
- Rate limiting consideration


## API Documentation

The API documentation and testing interface is available through Swagger UI at:
```
http://localhost:3030/api/docs
```

You can use the Swagger UI to:
- View all available endpoints
- Test API endpoints directly from the browser
- View request/response schemas
- Try out different request parameters
- View authentication requirements

## Frontend Application

The TruthTracer frontend application is available at:
```
https://truthtracer.netlify.app/
```

The frontend source code can be found at:
```
https://github.com/anthony-okoye/truth-tracer-front
```

## Testing

### API Testing
You can test the API endpoints using:
1. Swagger UI at `http://localhost:3030/api/docs`
2. cURL commands
3. Postman or similar API testing tools

### Example API Test
```bash
# Test claim verification
curl -X POST http://localhost:3030/claims/analyze \
  -H "Content-Type: application/json" \
  -d '{"claim": "Your claim to verify"}'
```

### Running Tests
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **AI Integration**: Perplexity Sonar API
- **API Documentation**: OpenAPI/Swagger
- **Validation**: class-validator
- **Error Handling**: Custom exception filters

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL - ( Optional )
- Perplexity Sonar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anthony-okoye/truth-tracer-backend.git
cd truth-tracer-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Server Configuration
PORT=3030
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://truthtracer.netlify.app/

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=truth_tracer

# Sonar API Configuration
SONAR_API_KEY=your_sonar_api_key
SONAR_API_URL=https://api.perplexity.ai
SONAR_TIMEOUT=30000
SONAR_MAX_RETRIES=3
SONAR_RETRY_DELAY=1000
```

4. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Claim Analysis
```http
POST /claims/analyze
Content-Type: application/json

{
  "claim": "Claim to analyze"
}
```

### Health Check
```http
GET /health
```

## Response Types

### Fact Check Response
```typescript
{
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE';
  confidence: number;
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
    reliability: 'High' | 'Medium' | 'Low';
  }>;
  notes?: string;
}
```

### Trust Chain Response
```typescript
{
  hasTrustChain: boolean;
  confidence: number;
  sources: Array<{
    name: string;
    url: string;
    reliability: number;
  }>;
  explanation: string;
  gaps?: string[];
  context?: string;
}
```

### Socratic Reasoning Response
```typescript
{
  conclusion: {
    logicalValidity: string;
    keyFlaws: string;
    strengths: string;
    recommendations: string;
  };
  confidence: number;
  questions: string[];
  assumptions: string[];
  fallacies?: string[];
  insights?: string;
}
```

## Error Handling

The API uses custom exception filters to provide consistent error responses:

- `SonarApiException`: For API-related errors
- `SonarTimeoutException`: For request timeout errors
- `SonarConfigurationException`: For configuration errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
