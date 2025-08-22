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

**Response**: Returns a `SonarResponseDto` containing analysis results from all three methods (fact-check, trust-chain, socratic).

#### **Health Check**
```http
GET /health
```

**Response**: Returns system health status including Sonar service availability.

#### **Verification Management**
```http
POST /verification
Content-Type: application/json

{
  "claim": "Claim to verify",
  "context": "Additional context (optional)",
  "language": "en",
  "verificationLevel": "quick" | "standard" | "comprehensive",
  "additionalContext": {}
}
```

```http
GET /verification/:id
```

```http
DELETE /verification/:id
```

```http
GET /verification?startDate=&endDate=&status=&confidenceLevel=
```

**Query Parameters**:
- `startDate`: ISO date string for filtering start date
- `endDate`: ISO date string for filtering end date  
- `status`: Filter by verification status (pending, in_progress, completed, failed)
- `confidenceLevel`: Filter by confidence level (very_low, low, medium, high, very_high)

## 🔧 **Service Implementations**

### **SonarClient Service**
The core service that handles all Perplexity Sonar API interactions:

```typescript
@Injectable()
export class SonarClient implements ISonarService {
  async analyzeClaim(claim: string): Promise<SonarResponseDto> {
    // Performs parallel analysis using all three methods
    // Returns combined results with status tracking
  }
}
```

**Features**:
- **Parallel Processing**: Executes fact-check, trust-chain, and socratic analysis simultaneously
- **Response Sanitization**: Intelligent JSON parsing and error handling
- **Token Monitoring**: Tracks API usage and optimizes token consumption
- **Retry Logic**: Automatic retries with exponential backoff
- **Error Handling**: Comprehensive exception handling with detailed error codes

### **Response Sanitizer**
Intelligent JSON response processing:

```typescript
@Injectable()
export class SonarResponseSanitizer implements IResponseSanitizer {
  sanitizeResponse<T>(response: string): SanitizationResult<T> {
    // 1. Validates if response is already valid JSON
    // 2. Removes <think> blocks and markdown formatting
    // 3. Extracts JSON from code blocks
    // 4. Attempts to parse largest JSON object
    // 5. Provides detailed sanitization steps for debugging
  }
}
```

**Sanitization Steps**:
1. **Direct JSON Validation** - Checks if response is already valid JSON
2. **Markdown Cleanup** - Removes `<think>` blocks and formatting
3. **Code Block Extraction** - Finds and validates JSON in markdown blocks
4. **Object Detection** - Identifies largest valid JSON object in text
5. **Final Validation** - Ensures clean, parseable JSON output

### **Token Monitor Service**
API usage tracking and optimization:

```typescript
@Injectable()
export class TokenMonitorService {
  recordTokenUsage(metrics: TokenUsageMetrics): void {
    // Tracks prompt, completion, and total token usage
    // Monitors usage patterns and provides warnings
    // Calculates average usage for optimization
  }
}
```

**Monitoring Features**:
- **Usage Tracking**: Records token consumption per endpoint
- **Performance Alerts**: Warns when usage exceeds 90% of limits
- **Analytics**: Provides average usage statistics
- **Optimization**: Identifies high-consumption patterns

### **Claim Verification Service**
Confidence scoring and result aggregation:

```typescript
@Injectable()
export class ClaimVerificationService {
  calculateConfidenceScore(result: SonarResponseDto): number {
    // Applies weighted scoring based on verification method
    // FACT_CHECK: 40%, TRUST_CHAIN: 30%, SOCRATIC: 30%
    // Normalizes scores and applies confidence thresholds
  }
}
```

**Scoring Algorithm**:
- **Fact Check Weight**: 40% - Based on verdict and source reliability
- **Trust Chain Weight**: 30% - Based on source credibility and chain completeness
- **Socratic Weight**: 30% - Based on reasoning depth and conclusion quality

## 📊 **Detailed Response Types**

### **Fact Check Response**
```typescript
{
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE';
  confidence: number; // 0-1 scale
  explanation: string; // Detailed reasoning
  sources: Array<{
    title: string;      // Source title
    url: string;        // Source URL
    reliability: 'High' | 'Medium' | 'Low'; // Credibility rating
  }>;
  notes?: string; // Additional context
}
```

**Verdict Meanings**:
- **TRUE**: Claim is factually accurate with supporting evidence
- **FALSE**: Claim is factually incorrect with contradicting evidence
- **MISLEADING**: Claim contains partial truth but is misleading
- **UNVERIFIABLE**: Insufficient evidence to determine truth

### **Trust Chain Response**
```typescript
{
  hasTrustChain: boolean; // Whether verifiable chain exists
  confidence: number;     // 0-1 confidence score
  sources: Array<{
    name: string;         // Source name
    url: string;          // Source URL
    reliability: number;  // 0-1 reliability score
  }>;
  explanation: string;    // Detailed analysis
  gaps?: string[];        // Identified weaknesses
  context?: string;       // Additional context
  
  // Original source information
  originalSource: {
    url: string;
    type: 'social media' | 'news' | 'academic' | 'government' | 'reference';
    credibility: 'High' | 'Medium' | 'Low';
    timestamp: string;
    context: string;
  };
  
  // Propagation path through different sources
  propagationPath?: Array<{
    url: string;
    type: string;
    credibility: number;
    timestamp: string;
    modifications: string; // How claim changed
    reach: string;         // Audience size/impact
  }>;
}
```

**Source Types**:
- **social media**: Twitter, Facebook, Reddit, etc.
- **news**: Traditional media outlets
- **academic**: Research papers, studies
- **government**: Official government sources
- **reference**: Encyclopedias, fact-checking sites

### **Socratic Reasoning Response**
```typescript
{
  reasoningSteps: Array<{
    question: string;     // Critical question about the claim
    analysis: string;     // Logical analysis of this aspect
    evidence: string;     // Supporting or contradicting evidence
    implications: string; // What this reveals about the claim
  }>;
  
  conclusion: {
    logicalValidity: string; // Assessment of logical structure
    keyFlaws: string;        // Major logical flaws or gaps
    strengths: string;        // Strong aspects of the claim
    recommendations: string; // How to strengthen the claim
  };
  
  confidence: number;        // 0-1 confidence score
  questions: string[];       // List of questions raised
  assumptions: string[];     // Key assumptions identified
  fallacies?: string[];      // Logical fallacies detected
  insights?: string;         // Additional insights
}
```

**Reasoning Process**:
1. **Question Generation**: Identifies critical aspects to examine
2. **Evidence Analysis**: Evaluates supporting and contradicting evidence
3. **Logical Assessment**: Analyzes reasoning structure and validity
4. **Conclusion Formation**: Synthesizes findings into actionable insights

## 🔐 **Authentication & Security**

### **JWT Authentication**
The API uses JWT tokens for authentication:

```typescript
@UseGuards(JwtAuthGuard)
@Post('analyze')
async analyzeClaim(@Body() claimDto: ClaimAnalysisDto): Promise<SonarResponseDto>
```

**Required Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### **CORS Configuration**
Configured for cross-origin requests:

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

## ⚠️ **Error Handling & Exceptions**

### **Custom Exception Classes**
```typescript
// API-related errors
export class SonarApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly details?: any
  )
}

// Configuration errors
export class SonarConfigurationException extends Error {
  constructor(
    message: string,
    public readonly configKey: string
  )
}

// Timeout errors
export class SonarTimeoutException extends Error {
  constructor(
    message: string,
    public readonly timeout: number
  )
}

// Validation errors
export class SonarValidationException extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  )
}
```

### **Error Response Format**
All errors return consistent JSON responses:

```typescript
{
  statusCode: number;        // HTTP status code
  timestamp: string;         // ISO timestamp
  path: string;              // Request path
  correlationId: string;     // Request correlation ID
  message: string;           // Human-readable error message
  errorCode?: string;        // Application error code
  details?: any;             // Additional error details
  field?: string;            // Field causing validation error
  value?: any;               // Invalid value
  timeout?: number;          // Timeout duration (if applicable)
  configKey?: string;        // Configuration key (if applicable)
}
```

### **HTTP Status Codes**
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid JWT)
- **408**: Request Timeout (Sonar API timeout)
- **500**: Internal Server Error (API or configuration errors)

## 🔧 **Configuration & Environment**

### **Required Environment Variables**
```bash
# Sonar API Configuration
SONAR_API_KEY=your_perplexity_api_key
SONAR_API_URL=https://api.perplexity.ai

# Server Configuration
PORT=3030
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://truthtracer.netlify.app/
```

### **Optional Configuration**
```bash
# API Behavior
SONAR_TIMEOUT=30000          # Request timeout in ms
SONAR_MAX_RETRIES=3          # Maximum retry attempts
SONAR_RETRY_DELAY=1000       # Delay between retries in ms

# Verification Weights
CONFIDENCE_WEIGHT_FACT_CHECK=0.35
CONFIDENCE_WEIGHT_TRUST_CHAIN=0.25
CONFIDENCE_WEIGHT_SOCRATIC=0.20
CONFIDENCE_WEIGHT_SOURCE=0.15
CONFIDENCE_WEIGHT_CONSISTENCY=0.05

# Domain Configuration
REPUTABLE_DOMAINS=reuters.com,apnews.com,bbc.com,nytimes.com
```

### **Configuration Service**
```typescript
@Injectable()
export class VerificationConfig {
  get confidenceWeights() {
    return {
      FACT_CHECK: this.configService.get<number>('CONFIDENCE_WEIGHT_FACT_CHECK', 0.35),
      TRUST_CHAIN: this.configService.get<number>('CONFIDENCE_WEIGHT_TRUST_CHAIN', 0.25),
      SOCRATIC_REASONING: this.configService.get<number>('CONFIDENCE_WEIGHT_SOCRATIC', 0.20),
      SOURCE_RELIABILITY: this.configService.get<number>('CONFIDENCE_WEIGHT_SOURCE', 0.15),
      EVIDENCE_CONSISTENCY: this.configService.get<number>('CONFIDENCE_WEIGHT_CONSISTENCY', 0.05)
    };
  }
}
```

## 🧪 **Testing & Development**

### **Test Scripts**
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e

# Claim analysis test (comprehensive)
npm run test:claim
```

### **Test Claim Script**
The `test-claim.ts` script provides comprehensive testing:

```typescript
// Runs full analysis pipeline
const result = await sonarService.analyzeClaim(testClaim);

// Tests all three analysis methods
// Provides detailed output for debugging
// Validates response formats and data integrity
```

**Test Output Includes**:
- Fact check results with sources
- Trust chain analysis with confidence scores
- Socratic reasoning with step-by-step breakdown
- Overall analysis status and timestamps

### **API Testing with Swagger**
1. **Access**: `http://localhost:3030/api/docs`
2. **Authentication**: Click "Authorize" and enter JWT token
3. **Testing**: Use "Try it out" button for each endpoint
4. **Validation**: View request/response schemas
5. **Examples**: See sample requests and responses

## 🏠 **Frontend Application**

The TruthTracer frontend application is available at:
```
https://truthtracer.netlify.app/
```

The frontend source code can be found at:
```
https://github.com/anthony-okoye/truth-tracer-front
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

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏗️ **Domain Layer Architecture**

### **Core Entities**

#### **Claim Entity**
```typescript
export class Claim {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly metadata: ClaimMetadata,
    public readonly rating: ClaimRating,
    public readonly explanation: string,
    public readonly sources: Citation[],
    public readonly reasoningSteps: string[],
    public readonly trustChain?: TrustChain,
    public readonly verificationStatus: VerificationStatus = VerificationStatus.PENDING,
    public readonly confidenceLevel?: ConfidenceLevel,
    public readonly confidenceScore?: number,
    public readonly verificationEvidence?: VerificationEvidence,
    public readonly verificationMetadata?: VerificationMetadata,
  ) {}
}
```

**Entity Properties**:
- **id**: Unique identifier (UUID)
- **text**: The claim text to be analyzed
- **metadata**: Source, timestamp, user, and verification level
- **rating**: Verdict (TRUE/FALSE/MISLEADING/UNVERIFIABLE)
- **explanation**: Detailed reasoning for the verdict
- **sources**: Array of supporting citations
- **reasoningSteps**: Step-by-step analysis process
- **trustChain**: Optional trust chain analysis
- **verificationStatus**: Current processing status
- **confidenceLevel**: Qualitative confidence assessment
- **confidenceScore**: Quantitative confidence (0-1)
- **verificationEvidence**: Supporting and contradicting evidence
- **verificationMetadata**: Processing details and model information

#### **Trust Chain Entity**
```typescript
export class TrustChain {
  constructor(
    public id: string,
    public claimId: string,
    public originalSource: string,
    public propagationPath: SourceNode[],
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

export class SourceNode {
  constructor(
    public url: string,
    public title: string,
    public credibility: number, // 0-1 scale
    public timestamp: Date
  ) {}
}
```

**Trust Chain Features**:
- **Source Tracking**: Maps information flow from origin to current state
- **Credibility Scoring**: Numerical reliability assessment (0-1)
- **Temporal Analysis**: Tracks when information was published/modified
- **Propagation Mapping**: Shows how claims spread across sources

#### **Socratic Reasoning Entity**
```typescript
export class SocraticReasoning {
  constructor(
    public readonly id: string,
    public readonly claimId: string,
    public readonly reasoningTree: ReasoningNode[],
    public readonly questions: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export interface ReasoningNode {
  id: string;
  type: 'PREMISE' | 'EVIDENCE' | 'CONCLUSION' | 'QUESTION';
  content: string;
  children: string[]; // IDs of child nodes
}
```

**Reasoning Structure**:
- **Tree-based Logic**: Hierarchical reasoning with parent-child relationships
- **Node Types**: Premises, evidence, conclusions, and questions
- **Content Tracking**: Detailed content for each reasoning step
- **Relationship Mapping**: Links between different reasoning elements

### **Domain Interfaces**

#### **AI Services Interface**
```typescript
export interface IFactCheckAI {
  analyzeClaim(text: string): Promise<FactCheckResult>;
}

export interface ITrustTraceAI {
  traceClaim(claim: Claim): Promise<TrustChainResult>;
}

export interface ISocraticAI {
  generateReasoning(claim: Claim): Promise<SocraticReasoningResult>;
}
```

**Interface Design Principles**:
- **Separation of Concerns**: Each AI service handles one analysis type
- **Dependency Inversion**: High-level modules depend on abstractions
- **Testability**: Easy to mock and test individual components
- **Extensibility**: New AI providers can implement these interfaces

#### **Verification Service Interface**
```typescript
export interface IVerificationService {
  verifyClaim(prompt: VerificationPrompt): Promise<Verification>;
  getVerificationStatus(id: string): Promise<Verification>;
  cancelVerification(id: string): Promise<void>;
  getVerificationHistory(filters?: VerificationFilters): Promise<Verification[]>;
}
```

**Service Capabilities**:
- **Claim Verification**: Full verification pipeline execution
- **Status Tracking**: Real-time verification progress monitoring
- **Cancellation**: Ability to stop ongoing verifications
- **History Management**: Filtered verification result retrieval

#### **Response Sanitizer Interface**
```typescript
export interface IResponseSanitizer {
  sanitizeResponse<T>(response: string): SanitizationResult<T>;
  isValidJSON(str: string): boolean;
}

export interface SanitizationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  originalResponse: string;
  sanitizationSteps: string[];
}
```

**Sanitization Features**:
- **JSON Validation**: Ensures response is valid JSON
- **Error Recovery**: Attempts to extract valid data from malformed responses
- **Step Tracking**: Records each sanitization attempt for debugging
- **Type Safety**: Generic type support for different response types

## 🔧 **Middleware & Guards Implementation**

### **Request Timing Middleware**
```typescript
@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${duration}ms`
      );
    });

    next();
  }
}
```

**Performance Monitoring**:
- **Request Duration**: Tracks time from start to completion
- **Status Code Logging**: Records HTTP response status
- **Method Tracking**: Logs HTTP method and endpoint
- **Performance Insights**: Identifies slow endpoints and bottlenecks

### **JWT Authentication Guard**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

**Security Features**:
- **Token Validation**: Verifies JWT token authenticity
- **User Authentication**: Ensures valid user session
- **Error Handling**: Proper unauthorized access handling
- **Context Integration**: Seamless NestJS integration

### **Validation Pipe**
```typescript
@Injectable()
export class SonarValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const validationErrors = errors.map(error => ({
        field: error.property,
        constraints: error.constraints,
        value: error.value
      }));

      throw new SonarValidationException(
        'Validation failed',
        validationErrors[0].field,
        validationErrors[0].value
      );
    }

    return object;
  }
}
```

**Validation Features**:
- **Class Validation**: Uses class-validator decorators
- **Type Transformation**: Converts plain objects to class instances
- **Error Mapping**: Provides detailed validation error information
- **Exception Handling**: Custom validation exception types

## 🏗️ **Infrastructure Layer Components**

### **Sonar Module Configuration**
```typescript
@Module({
  imports: [ConfigModule],
  providers: [
    SonarClient,
    SonarResponseSanitizer,
    TokenMonitorService,
    {
      provide: SONAR_SERVICE,
      useExisting: SonarClient
    }
  ],
  exports: [SonarClient, SONAR_SERVICE, TokenMonitorService]
})
export class SonarModule {}
```

**Module Architecture**:
- **Dependency Injection**: Proper service registration and injection
- **Service Export**: Makes services available to other modules
- **Configuration Integration**: Integrates with NestJS config system
- **Token-based Service**: Uses injection tokens for service identification

### **AI Services Module**
```typescript
@Module({
  imports: [ConfigModule, SonarModule],
  providers: [
    {
      provide: 'IFactCheckAI',
      useExisting: SonarClient
    },
    {
      provide: 'ITrustTraceAI',
      useExisting: SonarClient
    },
    {
      provide: 'ISocraticAI',
      useExisting: SonarClient
    },
    ClaimVerificationService
  ],
  exports: ['IFactCheckAI', 'ITrustTraceAI', 'ISocraticAI', ClaimVerificationService]
})
export class AIServicesModule {}
```

**Service Registration**:
- **Interface Mapping**: Maps interfaces to concrete implementations
- **Service Aliasing**: Multiple interfaces can use the same service
- **Dependency Management**: Centralized service dependency management
- **Export Strategy**: Makes services available to consuming modules

### **Configuration Management**
```typescript
@Injectable()
export class VerificationConfig {
  get confidenceWeights() {
    return {
      FACT_CHECK: this.configService.get<number>('CONFIDENCE_WEIGHT_FACT_CHECK', 0.35),
      TRUST_CHAIN: this.configService.get<number>('CONFIDENCE_WEIGHT_TRUST_CHAIN', 0.25),
      SOCRATIC_REASONING: this.configService.get<number>('CONFIDENCE_WEIGHT_SOCRATIC', 0.20),
      SOURCE_RELIABILITY: this.configService.get<number>('CONFIDENCE_WEIGHT_SOURCE', 0.15),
      EVIDENCE_CONSISTENCY: this.configService.get<number>('CONFIDENCE_WEIGHT_CONSISTENCY', 0.05)
    };
  }

  get reputableDomains(): string[] {
    const domains = this.configService.get<string>('REPUTABLE_DOMAINS', 
      'reuters.com,apnews.com,bbc.com,nytimes.com,washingtonpost.com,theguardian.com,nature.com,science.org,academic.edu,gov,edu,linkedin.com,twitter.com,facebook.com,instagram.com,reddit.com'
    );
    return domains.split(',').map(d => d.trim());
  }
}
```

**Configuration Features**:
- **Environment Integration**: Reads from environment variables
- **Default Values**: Provides sensible defaults for optional configs
- **Type Safety**: Ensures configuration values are properly typed
- **Domain Management**: Configurable reputable domain lists

## ⚡ **Performance & Optimization**

### **Parallel Processing Strategy**
```typescript
// The SonarClient executes all three analysis methods simultaneously
async analyzeClaim(claim: string): Promise<SonarResponseDto> {
  // Parallel execution of fact-check, trust-chain, and socratic analysis
  const [factCheckResult, trustChainResult, socraticResult] = await Promise.all([
    this.performFactCheck(claim),
    this.performTrustChainAnalysis(claim),
    this.performSocraticReasoning(claim)
  ]);

  return this.combineResults(factCheckResult, trustChainResult, socraticResult);
}
```

**Performance Benefits**:
- **Reduced Latency**: All analyses run concurrently instead of sequentially
- **Resource Utilization**: Maximizes API endpoint usage
- **User Experience**: Faster response times for comprehensive analysis
- **Scalability**: Easy to add more analysis methods without performance impact

### **Token Usage Optimization**
```typescript
@Injectable()
export class TokenMonitorService {
  public recordTokenUsage(metrics: TokenUsageMetrics): void {
    this.metrics.push(metrics);
    this.logTokenUsage(metrics);
    
    // Warn when usage exceeds 90% of limits
    const usagePercentage = (metrics.usage.completionTokens / metrics.maxTokens) * 100;
    if (usagePercentage > 90) {
      this.logger.warn(`High token usage detected: ${usagePercentage.toFixed(2)}%`);
    }
  }
}
```

**Optimization Features**:
- **Usage Monitoring**: Tracks token consumption patterns
- **Performance Alerts**: Warns about high token usage
- **Cost Management**: Helps optimize API usage costs
- **Trend Analysis**: Identifies usage patterns for optimization

### **Response Caching Strategy**
```typescript
// Future enhancement: Implement response caching
interface CachedResponse {
  claim: string;
  result: SonarResponseDto;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

// Cache frequently analyzed claims to reduce API calls
private async getCachedResponse(claim: string): Promise<SonarResponseDto | null> {
  const cached = this.cache.get(claim);
  if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
    return cached.result;
  }
  return null;
}
```

**Caching Benefits**:
- **Reduced API Calls**: Caches identical claim analyses
- **Faster Responses**: Returns cached results for repeated claims
- **Cost Savings**: Minimizes Perplexity API usage
- **Scalability**: Improves performance under high load

### **Error Handling & Retry Logic**
```typescript
private async makeApiRequest<T>(
  endpoint: string, 
  data: any, 
  retryCount = 0
): Promise<T> {
  try {
    const response = await axios.post<PerplexityResponse>(
      `${this.config.baseUrl}${endpoint}`,
      data,
      {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        timeout: this.config.timeout,
      }
    );
    return response.data;
  } catch (error) {
    if (retryCount < this.config.maxRetries) {
      await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
      return this.makeApiRequest(endpoint, data, retryCount + 1);
    }
    throw error;
  }
}
```

**Resilience Features**:
- **Exponential Backoff**: Intelligent retry timing
- **Configurable Retries**: Adjustable retry attempts
- **Timeout Handling**: Prevents hanging requests
- **Error Propagation**: Proper error handling and logging

## 🔍 **Monitoring & Observability**

### **Request Correlation**
```typescript
// Each request gets a unique correlation ID for tracing
const correlationId = request.headers['x-correlation-id'] || crypto.randomUUID();

// Log all operations with correlation ID for easy debugging
this.logger.log(`Processing claim analysis`, { correlationId, claimId });
```

**Tracing Benefits**:
- **Request Tracking**: Follow requests through the entire system
- **Debugging**: Easy to trace issues across multiple services
- **Performance Analysis**: Identify bottlenecks in request flow
- **Error Correlation**: Link errors to specific requests

### **Structured Logging**
```typescript
// Consistent logging format across all services
this.logger.log('Claim analysis completed', {
  claimId: claim.id,
  duration: Date.now() - startTime,
  confidence: result.confidence,
  sources: result.sources.length,
  correlationId
});
```

**Logging Features**:
- **Structured Data**: Machine-readable log format
- **Performance Metrics**: Request duration and resource usage
- **Business Context**: Relevant business data in logs
- **Searchability**: Easy to search and filter logs

### **Health Check Monitoring**
```typescript
@Get()
async check() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      sonar: 'ok', // Check Sonar API connectivity
      // Future: Add more service health checks
    }
  };
}
```

**Health Monitoring**:
- **Service Status**: Real-time service health information
- **API Connectivity**: Monitor external API availability
- **System Metrics**: Track system performance and availability
- **Alerting**: Trigger alerts when services are unhealthy
