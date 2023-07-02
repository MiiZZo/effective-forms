import { Store, Event, createEvent, createStore, sample, Effect, attach } from 'effector';

export interface SuccessValidationResult {
  result: true;
}

export interface FailValidationResult {
  result: false;
  errors: string[];
}

export type ValidationResult<R extends true | false> = R extends true ? SuccessValidationResult : FailValidationResult;

export interface FieldConfig<T extends string | number | boolean> {
  initialValue: T;
  validator: (value: T) => ValidationResult<true | false>;
}

export type Fields<T extends { [key: string]: string | number | boolean }>  = {
  [key in keyof T]: FieldConfig<T[key]>;
}

export interface Schema<T extends { [key: string]: string | number | boolean }>  {
  values: Fields<T>;
  validator: (values: {
    [key in keyof T]: T[key];
  }) => boolean;
}

type Field<T extends string | number | boolean> = {
  $value: Store<T>;
  $errors: Store<string[]>;
  $isValid: Store<boolean>;
  changed: Event<T>;
  cleared: Event<void>;
  validateFx: Effect<void, ValidationResult<true | false>, Error>;
  validated: Event<boolean>;
}

interface Form<T extends { [key: string]: string | number | boolean }> {
  fields: {
    [key in keyof T]: Field<T[key]>;
  };
  submit: Event<void>;
}

interface CreateFormConfig<T extends { [key: string]: string | number | boolean }> {
  schema: Schema<T>;
}

export function createForm<T extends { [key: string]: string | number | boolean }> ({
  schema,
}: CreateFormConfig<T>) {
  const { values } = schema;
  const fields: {
    [key in keyof T]: Field<any>
  } = {} as any;

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
        return (result as FailValidationResult).errors;
      },
      target: setErrors,
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

  return {
    fields,
  } as unknown as Form<T>;
}
