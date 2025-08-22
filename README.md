# TruthTracer

TruthTracer is a misinformation detection platform that uses AI to analyze claims, trace their origins, and provide detailed reasoning about their veracity through Perplexity's Sonar API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Interface Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Controllers │  │    DTOs     │  │ Guards & Filters  │   │
│  │ • Claims    │  │ • FactCheck │  │ • JWT Auth        │   │
│  │ • Health    │  │ • TrustChain│  │ • Exception Filter│   │
│  │ • Verification│ │ • Socratic  │  │ • Validation Pipe │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Use Cases                          │   │
│  │  • AnalyzeClaimUseCase                             │   │
│  │  • VerificationService                              │   │
│  │  • ClaimVerificationService                         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │  Entities   │  │ Interfaces  │  │  Services         │   │
│  │ • Claim    │  │ • AI Services│  │ • Token Monitor   │   │
│  │ • TrustChain│ │ • Verification│ │ • Claim Verification│   │
│  │ • Socratic │  │ • Response   │  │                   │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │   Sonar     │  │ Response    │  │ Configuration     │   │
│  │   Client    │  │ Sanitizer   │  │ • AI Services     │   │
│  │   (Perplexity)│ │ • JSON Parse│ │ • Verification    │   │
│  │             │  │ • Error Handle│ │ • Domain Lists    │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## ✨ **Implemented Features**

### **✅ Claim Analysis** 
- Analyzes text content using Perplexity's Sonar API
- Fact checking with detailed reasoning and confidence scores
- Source verification with reliability ratings
- Structured response format with validation

### **✅ Trust Chain Analysis** 
- Tracks claim propagation and source credibility
- Analyzes source reliability scores (0-1 scale)
- Identifies gaps and weaknesses in information flow
- Provides detailed context and explanations

### **✅ Socratic Reasoning**
- Step-by-step logical analysis using structured questioning
- Evidence-based conclusions with confidence scoring
- Identifies logical flaws, strengths, and recommendations
- Comprehensive reasoning tree structure

### **✅ Response Processing**
- Intelligent JSON response sanitization
- Error handling and retry mechanisms
- Token usage monitoring and optimization
- Configurable confidence thresholds and weights


## 🔌 **Perplexity Sonar API Integration**

The application uses Perplexity's Sonar API for claim analysis through a unified client:

### **API Configuration**
- **Base URL**: `https://api.perplexity.ai`
- **Endpoint**: `/chat/completions`
- **Models**: `sonar`, `sonar-reasoning`, `sonar-deep-research`
- **Authentication**: Bearer token via `SONAR_API_KEY`

### **Analysis Types & Templates**

1. **Fact Check Analysis**
   - **Model**: `sonar`
   - **Max Tokens**: 500
   - **Returns**: Verdict (TRUE/FALSE/MISLEADING/UNVERIFIABLE), explanation, sources
   - **Template**: Structured JSON response with source reliability ratings

2. **Trust Chain Analysis**
   - **Model**: `sonar-deep-research`
   - **Max Tokens**: 2500
   - **Returns**: Trust chain verification, confidence scores, source analysis
   - **Template**: Detailed trust chain with gaps identification

3. **Socratic Reasoning**
   - **Model**: `sonar-reasoning`
   - **Max Tokens**: 4000
   - **Returns**: Step-by-step logical analysis, conclusions, recommendations
   - **Template**: Structured reasoning with questions and evidence

### **Response Processing**
- **JSON Sanitization**: Intelligent parsing of API responses
- **Error Handling**: Automatic retries with configurable delays
- **Token Monitoring**: Usage tracking and optimization
- **Validation**: Structured response validation using DTOs

## 📚 **API Documentation**

The API documentation and testing interface is available through Swagger UI at:
```
http://localhost:3030/api/docs
```

### **Available Endpoints**

#### **Claims Analysis**
```http
POST /claims/analyze
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "claim": "Claim to analyze",
  "modelType": "sonar" | "sonar-pro",
  "analysisType": "fact-check" | "trust-chain" | "socratic"
}
```

#### **Health Check**
```http
GET /health
```

#### **Verification Management**
```http
POST /verification
GET /verification/:id
DELETE /verification/:id
GET /verification?startDate=&endDate=&status=&confidenceLevel=
```

## 🏠 **Frontend Application**

The TruthTracer frontend application is available at:
```
https://truthtracer.netlify.app/
```

The frontend source code can be found at:
```
https://github.com/anthony-okoye/truth-tracer-front
```

## 🧪 **Testing**

### **API Testing**
You can test the API endpoints using:
1. **Swagger UI**: `http://localhost:3030/api/docs`
2. **Test Script**: `npm run test:claim` (runs comprehensive claim analysis test)
3. **cURL commands** or **Postman**

### **Example API Test**
```bash
# Test claim verification
curl -X POST http://localhost:3030/claims/analyze \
  -H "Content-Type: application/json" \
  -d '{"claim": "Your claim to verify"}'
```

### **Running Tests**
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov

# Run claim analysis test
npm run test:claim
```

## 🛠️ **Tech Stack**

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7+
- **AI Integration**: Perplexity Sonar API
- **API Documentation**: OpenAPI/Swagger
- **Validation**: class-validator, class-transformer
- **Error Handling**: Custom exception filters and pipes
- **Testing**: Jest with ts-jest
- **Build Tools**: @nestjs/cli, SWC

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js (v18+)
- Perplexity Sonar API key
- Docker (for containerized deployment)

### **Installation**

1. **Clone the repository**:
```bash
git clone https://github.com/anthony-okoye/truth-tracer-backend.git
cd truth-tracer-backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
# Server Configuration
PORT=3030
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://truthtracer.netlify.app/

# Sonar API Configuration (Required)
SONAR_API_KEY=your_sonar_api_key
SONAR_API_URL=https://api.perplexity.ai
SONAR_TIMEOUT=30000
SONAR_MAX_RETRIES=3
SONAR_RETRY_DELAY=1000

# Verification Configuration (Optional)
CONFIDENCE_WEIGHT_FACT_CHECK=0.35
CONFIDENCE_WEIGHT_TRUST_CHAIN=0.25
CONFIDENCE_WEIGHT_SOCRATIC=0.20
CONFIDENCE_WEIGHT_SOURCE=0.15
CONFIDENCE_WEIGHT_CONSISTENCY=0.05

# Reputable Domains (Optional)
REPUTABLE_DOMAINS=reuters.com,apnews.com,bbc.com,nytimes.com,washingtonpost.com
```

4. **Start the application**:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🐳 **Docker Deployment**

### **Build and Run**
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Using Docker Compose
npm run docker:compose
```

### **Docker Compose**
```bash
# Start services
docker-compose up --build

# Start in background
docker-compose up --build -d

# Stop services
docker-compose down
```

## 📊 **Response Types**

### **Fact Check Response**
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

### **Trust Chain Response**
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
  originalSource: {
    url: string;
    type: 'social media' | 'news' | 'academic' | 'government' | 'reference';
    credibility: 'High' | 'Medium' | 'Low';
    timestamp: string;
    context: string;
  };
  propagationPath?: Array<{
    url: string;
    type: string;
    credibility: number;
    timestamp: string;
    modifications: string;
    reach: string;
  }>;
}
```

### **Socratic Reasoning Response**
```typescript
{
  reasoningSteps: Array<{
    question: string;
    analysis: string;
    evidence: string;
    implications: string;
  }>;
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

## ⚠️ **Error Handling**

The API uses custom exception filters to provide consistent error responses:

- **SonarApiException**: For API-related errors
- **SonarTimeoutException**: For request timeout errors
- **SonarConfigurationException**: For configuration errors
- **SonarValidationException**: For validation errors

### **Error Response Format**
```typescript
{
  statusCode: number;
  timestamp: string;
  path: string;
  correlationId: string;
  message: string;
  errorCode?: string;
  details?: any;
  field?: string;
  value?: any;
  timeout?: number;
  configKey?: string;
}
```

## 🔧 **Configuration**

### **Verification Weights**
```typescript
{
  FACT_CHECK: 0.4,
  TRUST_CHAIN: 0.3,
  SOCRATIC: 0.3
}
```

### **Confidence Thresholds**
```typescript
{
  VERIFIED: 0.7,
  MINIMUM: 0.0,
  MAXIMUM: 1.0,
  DEFAULT: 0.5
}
```

### **Socratic Scoring**
```typescript
{
  BASE_SCORE: 0.5,
  STEP_INCREMENT: 0.1,
  CONCLUSION_BONUS: 0.1,
  FLAWS_BONUS: 0.1,
  STRENGTHS_BONUS: 0.1
}
```

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
