import { ZodObject, ZodTypeAny, baseObjectInputType, baseObjectOutputType, objectUtil, z } from 'zod';
import { Schema } from '@effective-forms/core';

interface Config<T extends { [_: string]: z.ZodString | z.ZodNumber | z.ZodBoolean }> {
  schema: ZodObject<T, "strip", ZodTypeAny, { [k_1 in keyof objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>]: objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>[k_1]; }, { [k_2 in keyof baseObjectInputType<T>]: baseObjectInputType<T>[k_2]; }>;
  initialValues: {
    [key in keyof T]: T[key]['_type'];
  },
}

export function zodSchema<T extends { [_: string]: z.ZodString | z.ZodNumber | z.ZodBoolean }>({
  schema,
  initialValues,
}: Config<T>) {
  const finalSchema: Schema<{ [key in keyof T]: T[key]['_type'] }> = {} as unknown as Schema<{ [key in keyof T]: T[key]['_type'] }>;
  
  for (const key in schema) {
    const field = schema.shape[key];

    finalSchema.values[key as keyof T] = {
      initialValue: initialValues[key],
      validator: (value: typeof field['_type']) => {
        const result = field.safeParse(value);

        if (result.success) {
          return {
            result: true,
          }
        }

        return {
          result: false,
          errors: result.error.flatten().formErrors,
        }
      },
    };
  }

  return finalSchema;
}
