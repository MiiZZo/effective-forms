import { describe, it } from 'vitest';
import { yupSchema } from './';
import { object, string, number, boolean } from 'yup';
import { FailFieldValidationResult, FailFormValidationResult } from '@effective-forms/core';

describe('yupSchema', () => {
  it('should correctly generate form schema from schema', () => {
    const userSchema = object({
      age: number().min(20, 'This site is for adults only').required(),
      email: string().email('Must be an email').required('email is required'),
      isAdmin: boolean().required(),
    });

    const initialValues = {
      email: '',
      age: 0,
      isAdmin: false,
    };
    
    const schema = yupSchema({
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
    expect((emailFailedValidationResult as FailFieldValidationResult).errors).toEqual(['email is required']);

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
    expect(errors.email).toEqual(['email is required']);
    expect(errors.isAdmin).toBe(undefined);

    const formSuccessValidationResult = schema.validator({
      age: 20,
      email: 'example@gmail.com',
      isAdmin: true,
    });

    expect(formSuccessValidationResult.result).toBe(true);
  });
});
