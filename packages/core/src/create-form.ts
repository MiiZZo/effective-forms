import { Store, Event, createEvent, createStore, sample, Effect, attach, combine, createEffect } from 'effector';

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
  initialValue: T;
  validator: (value: T) => FieldValidationResult<boolean>;
}

export type Fields<T extends { [key: string]: string | number | boolean }>  = {
  [key in keyof T]: FieldConfig<T[key]>;
}

export interface Schema<T extends { [key: string]: string | number | boolean }>  {
  values: Fields<T>;
  validator: (values: { [key in keyof T]: T[key] }) => FormValidationResult<boolean, T>;
}

type Field<T extends string | number | boolean> = {
  $value: Store<T>;
  $errors: Store<string[]>;
  $isValid: Store<boolean>;
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
  $values: Store<{ [key in keyof T]: T[key] }>
  submit: Event<void>;
  submitted: Event<void>;
  validateFormFx: Effect<void, FormValidationResult<boolean, T>, Error>
}

interface CreateFormConfig<T extends { [key: string]: string | number | boolean }> {
  schema: Schema<T>;
}

export function createForm<T extends { [key: string]: string | number | boolean }> ({
  schema,
}: CreateFormConfig<T>): Form<T> {
  const { values } = schema;

  const fields: {
    [key in keyof T]: Field<any>
  } = {} as any;
  const baseValidateFormFx = createEffect((fieldsValues: { [key in keyof T]: T[key] }) => schema.validator(fieldsValues));
  const submit = createEvent();
  const submitted = createEvent();
  const fieldsIsValidAsArray: Store<boolean>[] = [];
  const keyValue: Record<keyof T,  Store<T[Extract<keyof T, string>]>> = {} as any;

  for (const valueKey in values) {
    const field = values[valueKey];
    const initialValue = field.initialValue;

    const changed = createEvent<typeof initialValue>();
    const cleared = createEvent();
    const validated = createEvent<boolean>();
    const setErrors = createEvent<string[]>();

    const $value = createStore(initialValue);
    const $errors = createStore<string[]>([]);
    const $isValid = createStore<boolean>(false);

    fieldsIsValidAsArray.push($isValid);
    keyValue[valueKey] = $value;

    const validateFx = attach({
      source: $value,
      effect: (value) => field.validator(value),
    });

    $value
      .on(changed, (_, value) => value)
      .reset(cleared);

    $isValid
      .on(validated, (_, isValid) => isValid)
      .reset(cleared);

    $errors
      .on(setErrors, (_, errors) => errors)
      .reset(cleared);

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

    fields[valueKey] = {
      $value,
      $errors,
      $isValid,
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

  sample({
    clock: submit,
    source: $values,
    target: validateFormFx,
  });

  sample({
    clock: validateFormFx.doneData,
    filter: $isFormValid,
    target: submitted,
  });
  
  return {
    fields,
    $isFormValid,
    $values,
    submit,
    submitted,
    validateFormFx,
  };
}
