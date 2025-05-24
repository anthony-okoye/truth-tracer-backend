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
  - Dual-model support (sonar and sonar-pro) for quick and detailed analysis

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

## Sonar Client Implementation

The Sonar client provides a flexible and modular approach to claim analysis using Perplexity's Sonar API:

### Model Selection
- **sonar**: Quick analysis for basic fact-checking
  - Lower token usage
  - Faster response times
  - Basic verification

- **sonar-pro**: Detailed analysis for complex claims
  - Comprehensive fact-checking
  - Detailed source verification
  - In-depth reasoning

### Template System
The client uses a modular template system for different types of analysis:

1. **Fact Check Templates**
   - Quick verification format
   - Detailed analysis format
   - Source citation structure

2. **Trust Chain Templates**
   - Basic origin tracing
   - Comprehensive propagation analysis
   - Credibility scoring

3. **Socratic Templates**
   - Basic critical questioning
   - Comprehensive reasoning tree
   - Evidence-based conclusions

### Usage Example
```typescript
// Quick analysis
const quickResult = await sonarClient.analyzeClaim(claimText, ModelType.QUICK);

// Detailed analysis
const detailedResult = await sonarClient.analyzeClaim(claimText, ModelType.DETAILED);
```

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **AI Integration**: Perplexity Sonar API
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger

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
cp .env.example .env
# Edit .env with your configuration
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
  "input": "Claim to analyze",
  "modelType": "sonar" | "sonar-pro"  // Optional, defaults to "sonar-pro"
}
```

### Trust Chain Analysis
```http
POST /claims/trace
Content-Type: application/json

{
  "claimId": "claim-uuid",
  "modelType": "sonar" | "sonar-pro"  // Optional, defaults to "sonar-pro"
}
```

### Socratic Reasoning
```http
GET /claims/socratic/:claimId
Query Parameters:
  modelType: "sonar" | "sonar-pro"  // Optional, defaults to "sonar-pro"
```

### User History
```http
GET /claims/history
```

### Admin Endpoints
```http
GET /claims/admin/all
```

## Clean Architecture

The application follows Clean Architecture principles:

1. **Domain Layer**: Core business logic and entities
   - Entities: Claim, TrustChain, SocraticReasoning
   - Interfaces: Repository and Service contracts

2. **Application Layer**: Use cases and business rules
   - Use Cases: Claim analysis, trust tracing, reasoning generation
   - Services: Business logic implementation

3. **Infrastructure Layer**: External services and implementations
   - Sonar API client
   - Database repositories
   - External service integrations

4. **Interface Layer**: API endpoints and data transfer
   - Controllers
   - DTOs
   - Guards and decorators

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
