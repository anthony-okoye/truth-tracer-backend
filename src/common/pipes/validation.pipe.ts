import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SonarValidationException } from '../exceptions/sonar.exceptions';

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

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
} 