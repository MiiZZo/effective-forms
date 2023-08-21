import { Store, Event, createEvent, createStore, sample, Effect, attach, combine, createEffect, Unit } from 'effector';
import { AtLeastOne, NonEmptyArray } from './types';
export interface SuccessValidationResult {
  result: true;
}

export interface FailFieldValidationResult {
  result: false;
  errors: string[];
}

export interface FailFormValidationResult<T extends { [key: string]: string | number | boolean }> {
  result: false;
  errors: Partial<{
    [key in keyof T]: string[];
  }>;
}

export type FormValidationResult<R extends boolean, T extends { [key: string]: string | number | boolean }> = (
  R extends true ? SuccessValidationResult : FailFormValidationResult<T>
);

export type FieldValidationResult<R extends boolean> = R extends true ? SuccessValidationResult : FailFieldValidationResult;

export interface FieldConfig<T extends string | number | boolean> {
  init: T;
  validator: (value: T) => FieldValidationResult<boolean>;
}

export type Fields<T extends { [key: string]: string | number | boolean }>  = {
  [key in keyof T]: FieldConfig<T[key]>;
}

export interface Schema<T extends { [key: string]: string | number | boolean }>  {
  fields: Fields<T>;
  validateOn?: AtLeastOne<{
    change: boolean;
  }>;
  clearOn?: NonEmptyArray<Unit<unknown>>;
  validator: (values: { [key in keyof T]: T[key] }) => FormValidationResult<boolean, T>;
}

type Field<T extends string | number | boolean> = {
  $value: Store<T>;
  $errors: Store<string[]>;
  $isValid: Store<boolean>;
  $isDirty: Store<boolean>;
  changed: Event<T>;
  cleared: Event<void>;
  validateFx: Effect<void, FieldValidationResult<boolean>, Error>;
  validated: Event<boolean>;
}

interface Form<T extends { [key: string]: string | number | boolean }> {
  fields: {
    [key in keyof T]: Field<T[key]>;
  };
  $isFormValid: Store<boolean>;
  $values: Store<{ [key in keyof T]: T[key] }>;
  cleared: Event<void>;
  submit: Event<void>;
  submitted: Event<void>;
  validateFormFx: Effect<void, FormValidationResult<boolean, T>, Error>;
}

export type CreateFormConfig<T extends { [key: string]: string | number | boolean }> = Schema<T>;

export function createForm<T extends { [key: string]: string | number | boolean }> ({
  fields,
  validator: formValidator,
  validateOn,
  clearOn,
}: CreateFormConfig<T>): Form<T> {
  const fieldsMap: {
    [key in keyof T]: Field<any>
  } = {} as any;
  const baseValidateFormFx = createEffect((fieldsValues: { [key in keyof T]: T[key] }) => formValidator(fieldsValues));
  const submit = createEvent();
  const submitted = createEvent();
  const formCleared = createEvent();
  const fieldsIsValidAsArray: Store<boolean>[] = [];
  const keyValue: Record<keyof T,  Store<T[Extract<keyof T, string>]>> = {} as any;
  const isFormValidatedOnChange = validateOn?.change || false;

  for (const valueKey in fields) {
    const field = fields[valueKey];
    const initialValue = field.init;

    const changed = createEvent<typeof initialValue>();
    const cleared = createEvent();
    const validated = createEvent<boolean>();
    const setIsDirty = createEvent();
    const setErrors = createEvent<string[]>();

    const $value = createStore(initialValue);
    const $errors = createStore<string[]>([]);
    const $isValid = createStore<boolean>(false);
    const $isDirty = createStore(false);

    fieldsIsValidAsArray.push($isValid);
    keyValue[valueKey] = $value;

    const validateFx = attach({
      source: $value,
      effect: (value) => field.validator(value),
    });

    $isDirty
      .on(setIsDirty, () => true)
      .reset([cleared, formCleared]);

    $value
      .on(changed, (_, value) => value)
      .reset([cleared, formCleared]);

    $isValid
      .on(validated, (_, isValid) => isValid)
      .reset([cleared, formCleared]);

    $errors
      .on(setErrors, (_, errors) => errors)
      .reset([cleared, formCleared]);

    sample({
      clock: changed,
      filter: $isDirty.map((x) => !x),
      target: setIsDirty,
    });

    if (isFormValidatedOnChange) {
      sample({
        clock: changed,
        target: validateFx,
      });
    }

    sample({
      clock: validateFx.doneData,
      filter: (result) => result.result,
      fn: (result) => {
        return result.result;
      },
      target: [
        validated,
        setErrors.prepend(() => []),
      ],
    });

    sample({
      clock: validateFx.doneData,
      filter: (result) => !result.result,
      fn: (result) => {
        const errors = (result as FailFieldValidationResult).errors;
        return errors;
      },
      target: setErrors,
    });

    sample({
      clock: baseValidateFormFx.doneData,
      filter: (result) => result.result,
      fn: (result) => result.result,
      target: [
        validated,
        setErrors.prepend(() => [])
      ],
    });

    sample({
      clock: baseValidateFormFx.doneData,
      filter: (result) => (
        !result.result 
      ),
      fn: (result) => {
        const errors = (result as FailFormValidationResult<T>).errors[valueKey];

        return errors ? errors : [];
      },
      target: [
        validated.prepend(() => false),
        setErrors,
      ],
    });

    fieldsMap[valueKey] = {
      $value,
      $errors,
      $isValid,
      $isDirty,
      changed,
      cleared,
      validated,
      validateFx,
    };
  }

  const $isFormValid = combine(fieldsIsValidAsArray)
  .map((booleans) => !booleans.includes(false));
  const $values = combine(keyValue) as unknown as Store<{ [key in keyof T]: T[key] }>;

  const validateFormFx = attach({ effect: baseValidateFormFx, source: $values });

  if (clearOn) {
    sample({
      // @ts-ignore
      clock: clearOn,
      target: formCleared,
    });
  }

  sample({
    clock: submit,
    filter: $isFormValid,
    target: submitted,
  });

  sample({
    clock: submit,
    filter: $isFormValid.map((x) => !x),
    target: validateFormFx,
  });

  sample({
    clock: validateFormFx.doneData,
    filter: $isFormValid,
    target: submitted,
  });

  return {
    fields: fieldsMap,
    $isFormValid,
    $values,
    cleared: formCleared,
    submit,
    submitted,
    validateFormFx,
  };
}
