import { ZodObject, ZodTypeAny, baseObjectInputType, baseObjectOutputType, objectUtil, z } from 'zod';
import { Store, Event, createEvent, createStore, createEffect, sample, restore, combine } from 'effector';

interface Config<T extends { [_: string]: z.ZodString | z.ZodNumber }> {
  schema: ZodObject<T, "strip", ZodTypeAny, { [k_1 in keyof objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>]: objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>[k_1]; }, { [k_2 in keyof baseObjectInputType<T>]: baseObjectInputType<T>[k_2]; }>;
  initialValues: { [key in keyof Config<T>["schema"]["shape"]]: Config<T>["schema"]["shape"][key]["_type"] };
}

export function createForm<T extends { [_: string]: z.ZodString | z.ZodNumber }>({
  schema,
  initialValues,
}: Config<T>) {
  const fields: {
    [key in keyof T]: {
      $value: Store<typeof initialValues[key]>,
      $errors: Store<string[]>,
      changed: Event<typeof initialValues[key]>,
    }
  } = {} as any;

  const validated = createEvent<boolean>();
  const $isValid = restore(validated, false);
  const setErrors = createEvent<Record<keyof T, string[]>>();

  const submitted = createEvent();

  for (const key of Object.keys(schema.shape)) {
    const initialValue = initialValues[key as keyof T];

    const $value = createStore(initialValue);
    const $errors = createStore<string[]>([]);
    const changed = createEvent<typeof initialValue>();

    $value
      .on(changed, (_, value) => value)

    sample({
      source: setErrors,
      filter: (errors) => !!errors,
      fn: (errors) => errors[key],
      target: $errors,
    });

    fields[key as keyof T] = {
      $value,
      changed,
      $errors,
    };
  }

  const values: {
    [key in keyof T]: typeof fields[key]["$value"]
  } = {} as {
    [key in keyof T]: typeof fields[key]["$value"]
  };

  Object.keys(fields).map((field: keyof typeof initialValues) => {
    values[field] = fields[field].$value;
  });

  const $values = combine(values);

  interface Validate {
    values: typeof values;
    schema: Config<T>["schema"];
  }

  const validateFx = createEffect(({
    values,
    schema,
  }: Validate) => schema.safeParse(values));

  //@ts-ignore
  sample({
    clock: submitted,
    source: $values,
    fn: (x) => {

      return {
        values: x,
        schema,
      };
    },
    target: validateFx,
  });

  sample({
    clock: validateFx.doneData,
    fn: (result) => {
      let errors: Record<keyof typeof initialValues, string[]> = {} as Record<keyof typeof initialValues, string[]>;

      if (!result.success) {
        errors = result.error.flatten().fieldErrors as Record<keyof typeof initialValues, string[]>;

        return errors;
      }

      return errors;
    },
    target: setErrors,
  });

  sample({
    clock: validateFx.doneData,
    fn: (result) => result.success,
    target: validated,
  })

  return {
    fields,
    $values,
    $isValid,
    submitted,
  };
}
