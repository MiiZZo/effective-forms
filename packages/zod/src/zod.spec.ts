import { describe, it } from 'vitest';
import { zodSchema } from './';
import { z } from 'zod';
import { FailFieldValidationResult, FailFormValidationResult } from '@effective-forms/core';

describe('zodSchema', () => {
  it('should correctly generate form schema from schema', () => {
    const userSchema = z.object({
      age: z.number().min(20, 'This site is for adults only'),
      email: z.string().email('Must be an email'),
      isAdmin: z.boolean(),
    });

    const initialValues = {
      email: '',
      age: 0,
      isAdmin: false,
    };
    
    const schema = zodSchema({
      schema: userSchema,
      initialValues: initialValues,
    });

    const {
      email,
      age,
      isAdmin
    } = schema.fields;

    expect(email.init).toBe(initialValues.email);
    expect(age.init).toBe(initialValues.age);
    expect(isAdmin.init).toBe(initialValues.isAdmin);

    const emailFailedValidationResult = email.validator('');

    expect(emailFailedValidationResult.result).toBe(false);
    expect((emailFailedValidationResult as FailFieldValidationResult).errors).toEqual(['Must be an email']);

    const emailSuccessValidationResult = email.validator('example@gmail.com');

    expect(emailSuccessValidationResult.result).toBe(true);

    const formFailedValidationResult = schema.validator({
      age: 14,
      email: '',
      isAdmin: true,
    });

    expect(formFailedValidationResult.result).toBe(false);

    const errors = (formFailedValidationResult as FailFormValidationResult<typeof initialValues>).errors;

    expect(errors.age).toEqual(['This site is for adults only']);
    expect(errors.email).toEqual(['Must be an email']);
    expect(errors.isAdmin).toBe(undefined);

    const formSuccessValidationResult = schema.validator({
      age: 20,
      email: 'example@gmail.com',
      isAdmin: true,
    });

    expect(formSuccessValidationResult.result).toBe(true);
  });

  it('should work correctly with zod effects' , () => {
    const schema = z.object({
      string: z.string().refine((string) => string.length > 0, 'Too short'),
      boolean: z.boolean().refine(Boolean, 'Should be true'),
      number: z.number().refine((number) => number > 5, 'Not valid number'),
    });

    const formSchema = zodSchema({
      initialValues: {
        boolean: false,
        number: 0,
        string: '',
      },
      schema,
    });

    const failResult = formSchema.validator({
      boolean: false,
      number: 0,
      string: '',
    }) as FailFormValidationResult<{
      string: string;
      boolean: boolean;
      number: number;
    }>;

    expect(failResult.result).toBe(false);
    expect(failResult.errors.number).toEqual(['Not valid number']);
    expect(failResult.errors.boolean).toEqual(['Should be true']);
    expect(failResult.errors.string).toEqual(['Too short']);

    const successResult = formSchema.validator({
      boolean: true,
      number: 6,
      string: 'string',
    });

    expect(successResult.result).toBe(true);
  });
});

