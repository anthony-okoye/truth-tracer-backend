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

- **Claim Analysis**: Analyzes text content using Perplexity's Sonar API
  - Fact checking with detailed reasoning
  - Source verification and citation
  - Chain-of-thought analysis
  - Parallel processing of multiple analysis methods

- **Trust Chain Tracing**: 
  - Tracks claim propagation across platforms
  - Analyzes source credibility
  - Maps information flow
  - Configurable depth of analysis

- **Socratic Reasoning**:
  - Step-by-step logical analysis
  - Interactive questioning
  - Evidence-based conclusions
  - Adaptive reasoning depth

## API Documentation

The API documentation is available through Swagger UI at:
```
http://localhost:3000/api/docs
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
- PostgreSQL
- Perplexity Sonar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/truth-tracer.git
cd truth-tracer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

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
