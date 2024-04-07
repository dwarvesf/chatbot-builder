import { ClassConstructor, ClassTransformOptions, plainToInstance } from 'class-transformer';
import {
  ValidateBy,
  ValidationOptions,
  buildMessage,
  isDateString,
  isNumber,
  isNumberString,
  validate,
} from 'class-validator';

export async function validateObj<T, V>(
  clz: ClassConstructor<T>,
  obj: V,
  options?: ClassTransformOptions
): Promise<string> {
  const ins = plainToInstance(clz, obj);
  return await validateInstance(ins);
}

export async function validateInstance(ins: any): Promise<string> {
  const errors = await validate(ins);
  if (errors.length > 0) {
    const errMsgs: string[] = [];
    errors.forEach((e) => {
      errMsgs.push(`${e.property}: ${Object.values(e.constraints).join(', ')}`);
    });

    return errMsgs.join('/n');
  }

  return null;
}

export function notNullOrUndefined(obj: any, val: any) {
  return !(val === null || val === undefined);
}

export function notNullOrEmpty(obj: any, val: any) {
  return !(val === null || val === '' || val === undefined || val.length === 0);
}

// Custom validator for date string
export function IsSerializedDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isSerializedDate',
      validator: {
        validate: (value, args): boolean => {
          if (typeof value === 'string') {
            return isNumberString(value) || isDateString(value);
          }

          return isNumber(value);
        },
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property should be unix or iso string',
          validationOptions
        ),
      },
    },
    validationOptions
  );
}
