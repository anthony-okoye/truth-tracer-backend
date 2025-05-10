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
       public readonly metadata: ClaimMetadata,
       public readonly rating: ClaimRating,
       public readonly explanation: string,
       public readonly sources: Citation[],
       public readonly reasoningSteps: string[],
       public readonly trustChain?: TrustChain,
     ) {}
   }
   ```

2. **TrustChain**
   ```typescript
   export class TrustChain {
     constructor(
       public readonly id: string,
       public readonly claimId: string,
       public readonly originalSource: SourceNode,
       public readonly propagationPath: SourceNode[],
       public readonly createdAt: Date,
       public readonly updatedAt: Date,
     ) {}
   }
   ```

3. **SocraticReasoning**
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
   ```

### API Integration

#### Sonar API Client

The Sonar client implements three main functionalities:

1. **Claim Analysis**
   ```typescript
   async analyzeClaim(text: string): Promise<{
     rating: ClaimRating;
     explanation: string;
     sources: Citation[];
     reasoningSteps: string[];
   }>
   ```

2. **Trust Chain Analysis**
   ```typescript
   async traceTrustChain(claim: Claim): Promise<TrustChain>
   ```

3. **Socratic Reasoning**
   ```typescript
   async generateSocraticReasoning(claim: Claim): Promise<SocraticReasoning>
   ```

### Database Schema

```sql
-- Claims Table
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    metadata JSONB NOT NULL,
    rating VARCHAR(20) NOT NULL,
    explanation TEXT NOT NULL,
    sources JSONB NOT NULL,
    reasoning_steps TEXT[] NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Trust Chains Table
CREATE TABLE trust_chains (
    id UUID PRIMARY KEY,
    claim_id UUID REFERENCES claims(id),
    original_source JSONB NOT NULL,
    propagation_path JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Socratic Reasoning Table
CREATE TABLE socratic_reasoning (
    id UUID PRIMARY KEY,
    claim_id UUID REFERENCES claims(id),
    reasoning_tree JSONB NOT NULL,
    questions TEXT[] NOT NULL,
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
   - 401: Unauthorized (authentication)
   - 403: Forbidden (authorization)
   - 404: Not Found
   - 500: Internal Server Error

### Security

1. **Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure password hashing

2. **API Security**
   - Rate limiting
   - Request validation
   - CORS configuration

3. **Data Security**
   - Input sanitization
   - SQL injection prevention
   - XSS protection

### Performance Considerations

1. **Caching Strategy**
   - Redis for caching frequent claims
   - In-memory caching for static data

2. **Database Optimization**
   - Indexed queries
   - Efficient joins
   - Connection pooling

3. **API Optimization**
   - Response compression
   - Pagination
   - Batch processing

### Monitoring and Logging

1. **Application Logging**
   - Request/Response logging
   - Error tracking
   - Performance metrics

2. **Health Checks**
   - API health endpoints
   - Database connectivity
   - External service status

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