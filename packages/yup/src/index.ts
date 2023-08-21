import { InferType, ObjectSchema, AnyObject, ValidationError } from 'yup';
import { Schema } from '@effective-forms/core';

interface Config<T extends 
ObjectSchema<object, AnyObject, object, "">
> extends Pick<Schema<InferType<T>>, 'validateOn' | 'clearOn'> {
  schema: T;
  initialValues: InferType<T>;
}

export function yupSchema<T extends
  ObjectSchema<object, AnyObject, object, "">
>(config: Config<T>) {
  const finalSchema: Schema<InferType<T>> = {
    fields: {} as Schema<InferType<T>>['fields'],
    validator: (values) => {
      try {
        config.schema.validateSync(values, { abortEarly: false });
      } catch (e) {
        const errors: Partial<{ [key in keyof InferType<T>]: string[]; }> = {};
        const error = e as ValidationError;

        for (const fieldError of error.inner) {
          errors[fieldError.path as keyof InferType<T>] = fieldError.errors;
        }
      
        return { result: false, errors };
      }

      return { result: true };
    },
    clearOn: config.clearOn,
    validateOn: config.validateOn,
  };

  for (const key in config.schema.fields) {
    const fieldKey = key as keyof InferType<T>;
    finalSchema.fields[fieldKey] = {
      init: config.initialValues[fieldKey],
      validator: (value) => {
        try {
          config.schema.validateSyncAt(fieldKey as string, {
            [fieldKey]: value
          });
        } catch (e) {
          const error = e as ValidationError;

          return { result: false, errors: error.errors, };
        }

        return { result: true };
      },
    };
  }

  return finalSchema;
}
