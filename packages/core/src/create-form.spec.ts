import { describe, it, expect, vi } from 'vitest';
import { fork, is, allSettled, createEvent } from 'effector';
import { faker } from '@faker-js/faker';
import { createForm } from './create-form';

describe('create-form', () => {
  let scope = fork();
  const userName = faker.internet.userName();
  const email = faker.internet.email();
  const age = faker.number.int();
  const text = faker.lorem.text();

  const initialValues = {
    userName: '',
    age: 20,
    email: 'example@gmail.com',
    isConfirmed: false,
    isAdmin: true,
  } as const;

  const form = createForm({
      fields: {
        userName: {
          init: initialValues.userName,
          validator: (value) => {
            if (value === userName) {
              return {
                result: true
              };
            }

            return {
              result: false,
              errors: [text],
            }
          },
        },
        age: {
          init: initialValues.age,
          validator: (value) => {
            if (value === age) {
              return {
                result: true
              };
            }

            return {
              result: false,
              errors: [text],
            }
          },
        },
        email: {
          init: initialValues.email,
          validator: (value) => {
            if (value === email) {
              return {
                result: true
              };
            }

            return {
              result: false,
              errors: [text],
            }
          },
        },
        isConfirmed: {
          init: initialValues.isConfirmed,
          validator: (value) => {
            if (value) {
              return {
                result: true
              };
            }

            return {
              result: false,
              errors: [text],
            }
          },
        },
        isAdmin: {
          init: initialValues.isAdmin,
          validator: (value) => {
            if (!value) {
              return {
                result: true
              };
            }

            return {
              result: false,
              errors: [text],
            }
          },
        },
      },
      validator: (values) => {
        let result = true;
        const errors: Partial<{ [key in keyof typeof values]: string[] }> = {};

        if (values.email !== email) {
          result = false;
          errors.email = [text];
        }

        if (values.age !== age) {
          result = false;
          errors.age = [text];
        }

        if (values.isAdmin) {
          result = false;
          errors.isAdmin = [text];
        }

        if (!values.isConfirmed) {
          result = false;
          errors.isConfirmed = [text];
        }

        if (values.userName !== userName) {
          result = false;
          errors.userName = [text];
        }

        if (!result) {
          return {
            result,
            errors
          };
        }


        return {
          result,
        };
      },
  });

  afterEach(() => {
    scope = fork();
  });

  it('All returned values must be correct', () => {
    expect(scope.getState(form.$isFormValid)).toBe(false);
    expect(scope.getState(form.$values)).toEqual(initialValues);

    const { fields: { email, age, isAdmin, isConfirmed, userName } } = form;

    expect(scope.getState(email.$value)).toBe(initialValues.email);
    expect(scope.getState(age.$value)).toBe(initialValues.age);
    expect(scope.getState(isAdmin.$value)).toBe(initialValues.isAdmin);
    expect(scope.getState(isConfirmed.$value)).toBe(initialValues.isConfirmed);
    expect(scope.getState(userName.$value)).toBe(initialValues.userName);

    expect(is.event(form.submit)).toBe(true);
    expect(is.event(form.submitted)).toBe(true);
    expect(is.effect(form.validateFormFx)).toBe(true);

    for (const fieldName in form.fields) {
      const field = form.fields[fieldName as keyof typeof form.fields];

      expect(scope.getState(field.$isValid)).toBe(false);
      expect(scope.getState(field.$errors)).toEqual([]);
      expect(is.event(field.changed)).toBe(true);
      expect(is.event(field.cleared)).toBe(true);
      expect(is.event(field.validated)).toBe(true);
      expect(is.effect(field.validateFx)).toBe(true);
    }
  });

  it('should correctly change fields values', async () => {
    const changeEmail = vi.fn();
    const changeAge = vi.fn();
    const changeIsConfirmed = vi.fn();

    form.fields.email.changed.watch(changeEmail);
    form.fields.age.changed.watch(changeAge);
    form.fields.isConfirmed.changed.watch(changeIsConfirmed);

    await allSettled(form.fields.email.changed, {
      scope,
      params: email,
    });
    
    await allSettled(form.fields.age.changed, {
      scope,
      params: age,
    });
    
    await allSettled(form.fields.isConfirmed.changed, {
      scope,
      params: true,
    });

    expect(changeAge).toBeCalledTimes(1);
    expect(changeEmail).toBeCalledTimes(1);
    expect(changeIsConfirmed).toBeCalledTimes(1);
    expect(scope.getState(form.fields.email.$value)).toBe(email);
    expect(scope.getState(form.fields.age.$value)).toBe(age);
    expect(scope.getState(form.fields.isConfirmed.$value)).toBe(true);
  });

  it('should correctly validate fields', async () => {    
    const validateEmailSpy = vi.fn();
    const validateAgeSpy = vi.fn();
    const validateIsConfirmedSpy = vi.fn();
    const validateIsAdminSpy = vi.fn();
    const validateUserNameSpy = vi.fn();

    form.fields.email.validateFx.watch(validateEmailSpy);
    form.fields.age.validateFx.watch(validateAgeSpy);
    form.fields.isConfirmed.validateFx.watch(validateIsConfirmedSpy);
    form.fields.isAdmin.validateFx.watch(validateIsAdminSpy);
    form.fields.userName.validateFx.watch(validateUserNameSpy);

    await allSettled(form.fields.email.validateFx, {
      scope,
    });

    await allSettled(form.fields.age.validateFx, {
      scope,
    });

    await allSettled(form.fields.isConfirmed.validateFx, {
      scope,
    });

    await allSettled(form.fields.isAdmin.validateFx, {
      scope,
    });

    await allSettled(form.fields.userName.validateFx, {
      scope,
    });

    expect(validateAgeSpy).toBeCalledTimes(1);
    expect(validateEmailSpy).toBeCalledTimes(1);
    expect(validateIsConfirmedSpy).toBeCalledTimes(1);
    expect(validateIsAdminSpy).toBeCalledTimes(1);
    expect(validateUserNameSpy).toBeCalledTimes(1);

    expect(scope.getState(form.fields.email.$isValid)).toBe(false);
    expect(scope.getState(form.fields.age.$isValid)).toBe(false);
    expect(scope.getState(form.fields.isConfirmed.$isValid)).toBe(false);
    expect(scope.getState(form.fields.isAdmin.$isValid)).toBe(false);
    expect(scope.getState(form.fields.userName.$isValid)).toBe(false);
    expect(scope.getState(form.$isFormValid)).toBe(false);

    await allSettled(form.fields.email.changed, {
      scope,
      params: email,
    });

    await allSettled(form.fields.age.changed, {
      scope,
      params: age,
    });

    await allSettled(form.fields.isAdmin.changed, {
      scope,
      params: false,
    });

    await allSettled(form.fields.isConfirmed.changed, {
      scope,
      params: true,
    });

    await allSettled(form.fields.userName.changed, {
      scope,
      params: userName,
    });

    
    await allSettled(form.fields.email.validateFx, {
      scope,
    });

    await allSettled(form.fields.age.validateFx, {
      scope,
    });

    await allSettled(form.fields.isConfirmed.validateFx, {
      scope,
    });

    await allSettled(form.fields.isAdmin.validateFx, {
      scope,
    });

    await allSettled(form.fields.userName.validateFx, {
      scope,
    });

    expect(validateAgeSpy).toBeCalledTimes(2);
    expect(validateEmailSpy).toBeCalledTimes(2);
    expect(validateIsConfirmedSpy).toBeCalledTimes(2);
    expect(validateIsAdminSpy).toBeCalledTimes(2);
    expect(validateUserNameSpy).toBeCalledTimes(2);

    expect(scope.getState(form.fields.email.$isValid)).toBe(true);
    expect(scope.getState(form.fields.age.$isValid)).toBe(true);
    expect(scope.getState(form.fields.isConfirmed.$isValid)).toBe(true);
    expect(scope.getState(form.fields.isAdmin.$isValid)).toBe(true);
    expect(scope.getState(form.fields.userName.$isValid)).toBe(true);
    expect(scope.getState(form.$isFormValid)).toBe(true);
  });

  it('must validate form', async () => {
    await allSettled(form.validateFormFx, {
      scope,
    });
    
    expect(scope.getState(form.$isFormValid)).toBe(false);
    
    for (const field of Object.values(form.fields)) {
      expect(scope.getState(field.$isValid)).toBe(false);
      expect(scope.getState(field.$errors)).toEqual([text]);
    }

    await allSettled(form.fields.email.changed, {
      scope,
      params: email,
    });

    await allSettled(form.fields.age.changed, {
      scope,
      params: age,
    });

    await allSettled(form.fields.isAdmin.changed, {
      scope,
      params: false,
    });

    await allSettled(form.fields.isConfirmed.changed, {
      scope,
      params: true,
    });

    await allSettled(form.fields.userName.changed, {
      scope,
      params: userName,
    });

    await allSettled(form.validateFormFx, {
      scope,
    });
    
    expect(scope.getState(form.$isFormValid)).toBe(true);

    for (const field of Object.values(form.fields)) {
      expect(scope.getState(field.$isValid)).toBe(true);
      expect(scope.getState(field.$errors)).toEqual([]);
    }
  });

  it('By default, does not trigger validating field on change', async () => {    
    const validateFieldSpy = vi.fn();
    
    form.fields.email.validateFx.watch(validateFieldSpy);

    expect(validateFieldSpy).toBeCalledTimes(0);

    await allSettled(form.fields.email.changed, {
      scope,
      params: 'example@gmail.com',
    });

    expect(validateFieldSpy).toBeCalledTimes(0);
  });

  it('must trigger field validating on change', async () => {
    const validateFieldSpy = vi.fn();

    const simpleForm = createForm({
      fields: {
        email: {
          init: '' as string,
          validator: () => ({ result: true }),
        }
      },
      validator: () => ({ result: true }),
      validateOn: {
        change: true,
      },
    });

    simpleForm.fields.email.validateFx.watch(validateFieldSpy);

    expect(validateFieldSpy).toBeCalledTimes(0);

    simpleForm.fields.email.changed('email');
    
    expect(validateFieldSpy).toBeCalledTimes(1);
  });

  it('must trigger `submitted` event after successful validation', async () => {    
    const submittedSpy = vi.fn();
    const emptyForm = createForm({
      fields: {},
      validator: () => ({ result: true }),
    });

    emptyForm.submitted.watch(submittedSpy);
    
    await allSettled(emptyForm.submit, {
      scope,
    });

    expect(submittedSpy).toBeCalledTimes(1);
  });

  it('field should be dirty when changed its value', async () => {
    expect(scope.getState(form.fields.email.$isDirty)).toBe(false);

    await allSettled(form.fields.email.changed, {
      scope,
      params: 'email',
    });

    expect(scope.getState(form.fields.email.$isDirty)).toBe(true);
  });

  it('should clear fields', async () => {
    await allSettled(form.fields.email.changed, {
      params: email,
      scope,
    });

    await allSettled(form.fields.email.validateFx, {
      scope,
    });

    expect(scope.getState(form.fields.email.$value)).toBe(email);
    expect(scope.getState(form.fields.email.$isDirty)).toBe(true);
    expect(scope.getState(form.fields.email.$isValid)).toBe(true);

    await allSettled(form.fields.email.cleared, {
      scope,
    });

    expect(scope.getState(form.fields.email.$value)).toBe(initialValues.email);
    expect(scope.getState(form.fields.email.$isDirty)).toBe(false);
    expect(scope.getState(form.fields.email.$isValid)).toBe(false);
  });

  it('should clear form', async () => {
    await allSettled(form.fields.email.changed, {
      params: email,
      scope,
    });

    await allSettled(form.fields.email.validateFx, {
      scope,
    });

    expect(scope.getState(form.fields.email.$value)).toBe(email);
    expect(scope.getState(form.fields.email.$isDirty)).toBe(true);
    expect(scope.getState(form.fields.email.$isValid)).toBe(true);

    await allSettled(form.cleared, {
      scope,
    });

    expect(scope.getState(form.fields.email.$value)).toBe(initialValues.email);
    expect(scope.getState(form.fields.email.$isDirty)).toBe(false);
    expect(scope.getState(form.fields.email.$isValid)).toBe(false);
  });

  it ('must trigger form.cleared on clearOn', async () => {
    const someEvent = createEvent();
    const clearedFormSpy = vi.fn();

    const simpleForm = createForm({
      fields: {},
      validator: () => ({ result: true }),
      clearOn: [someEvent],
    });

    simpleForm.cleared.watch(clearedFormSpy);

    await allSettled(someEvent, {
      scope,
    });

    expect(clearedFormSpy).toBeCalledTimes(1);
  });
});
