# TruthTracer Technical Documentation

## System Architecture

### Clean Architecture Implementation

The application follows Clean Architecture principles with four distinct layers:

1. **Domain Layer** (`/src/domain`)
   - Core business logic
   - Entities and value objects
   - Repository and service interfaces
   - No dependencies on other layers

2. **Application Layer** (`/src/application`)
   - Use cases implementation
   - Business rules
   - Orchestrates domain objects
   - Depends only on domain layer

3. **Infrastructure Layer** (`/src/infrastructure`)
   - External service implementations
   - Database repositories
   - Framework-specific code
   - Implements domain interfaces

4. **Interface Layer** (`/src/interfaces`)
   - Controllers
   - DTOs
   - Request/Response handling
   - Depends on application layer

### Key Components

#### Domain Entities

1. **Claim**
   ```typescript
   export class Claim {
     constructor(
       public readonly id: string,
       public readonly text: string,
       public readonly verdict: FactCheckVerdict,
       public readonly confidence: number,
       public readonly explanation: string,
       public readonly sources: Source[],
       public readonly notes?: string
     ) {}
   }
   ```

2. **TrustChain**
   ```typescript
   export class TrustChain {
     constructor(
       public readonly hasTrustChain: boolean,
       public readonly confidence: number,
       public readonly sources: Source[],
       public readonly explanation: string,
       public readonly gaps?: string[],
       public readonly context?: string
     ) {}
   }
   ```

3. **SocraticReasoning**
   ```typescript
   export class SocraticReasoning {
     constructor(
       public readonly conclusion: {
         logicalValidity: string;
         keyFlaws: string;
         strengths: string;
         recommendations: string;
       },
       public readonly confidence: number,
       public readonly questions: string[],
       public readonly assumptions: string[],
       public readonly fallacies?: string[],
       public readonly insights?: string
     ) {}
   }
   ```

### API Integration

#### Sonar API Client

The Sonar client implements three main functionalities:

1. **Claim Analysis**
   ```typescript
   async analyzeClaim(text: string): Promise<{
     verdict: FactCheckVerdict;
     confidence: number;
     explanation: string;
     sources: Source[];
     notes?: string;
   }>
   ```

2. **Trust Chain Analysis**
   ```typescript
   async traceTrustChain(claim: string): Promise<TrustChain>
   ```

3. **Socratic Reasoning**
   ```typescript
   async generateSocraticReasoning(claim: string): Promise<SocraticReasoning>
   ```

### Database Schema

```sql
-- Claims Table
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    verdict VARCHAR(20) NOT NULL,
    confidence DECIMAL NOT NULL,
    explanation TEXT NOT NULL,
    sources JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Trust Chains Table
CREATE TABLE trust_chains (
    id UUID PRIMARY KEY,
    claim_id UUID REFERENCES claims(id),
    has_trust_chain BOOLEAN NOT NULL,
    confidence DECIMAL NOT NULL,
    sources JSONB NOT NULL,
    explanation TEXT NOT NULL,
    gaps TEXT[],
    context TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Socratic Reasoning Table
CREATE TABLE socratic_reasoning (
    id UUID PRIMARY KEY,
    claim_id UUID REFERENCES claims(id),
    conclusion JSONB NOT NULL,
    confidence DECIMAL NOT NULL,
    questions TEXT[] NOT NULL,
    assumptions TEXT[] NOT NULL,
    fallacies TEXT[],
    insights TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### Error Handling

The application implements a consistent error handling strategy:

1. **Domain Errors**
   - Custom error classes for domain-specific errors
   - Validation errors for business rules

2. **Infrastructure Errors**
   - API communication errors
   - Database operation errors
   - External service failures

3. **HTTP Error Responses**
   - 400: Bad Request (validation errors)
   - 500: Internal Server Error

### API Security

1. **Request Validation**
   - Input validation using class-validator
   - Type checking with TypeScript
   - Sanitization of user input

2. **CORS Configuration**
   - Configurable allowed origins
   - Secure headers
   - Rate limiting

### Performance Considerations

1. **Database Optimization**
   - Indexed queries
   - Efficient joins
   - Connection pooling

2. **API Optimization**
   - Response compression
   - Request timing middleware
   - Error handling middleware

### Monitoring and Logging

1. **Application Logging**
   - Request/Response logging
   - Error tracking
   - Performance metrics

2. **Health Checks**
   - API health endpoint
   - Database connectivity
   - Service status monitoring

### Environment Configuration

```env
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

### Deployment

1. **Environment Configuration**
   - Development
   - Staging
   - Production

2. **CI/CD Pipeline**
   - Automated testing
   - Code quality checks
   - Deployment automation

3. **Scaling Strategy**
   - Horizontal scaling
   - Load balancing
   - Database replication 