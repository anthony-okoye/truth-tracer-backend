export class SonarApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SonarApiException';
  }
}

export class SonarValidationException extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'SonarValidationException';
  }
}

export class SonarTimeoutException extends Error {
  constructor(
    message: string,
    public readonly timeout: number
  ) {
    super(message);
    this.name = 'SonarTimeoutException';
  }
}

export class SonarConfigurationException extends Error {
  constructor(
    message: string,
    public readonly configKey: string
  ) {
    super(message);
    this.name = 'SonarConfigurationException';
  }
} 