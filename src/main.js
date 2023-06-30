import { createEvent, createStore, createEffect, sample, restore, combine } from 'effector';
export function createForm({ schema, initialValues, }) {
    const fields = {};
    const validated = createEvent();
    const $isValid = restore(validated, false);
    const setErrors = createEvent();
    const submitted = createEvent();
    for (const key of Object.keys(schema.shape)) {
        const initialValue = initialValues[key];
        const $value = createStore(initialValue);
        const $errors = createStore([]);
        const changed = createEvent();
        $value
            .on(changed, (_, value) => value);
        sample({
            source: setErrors,
            filter: (errors) => !!errors,
            fn: (errors) => errors[key],
            target: $errors,
        });
        fields[key] = {
            $value,
            changed,
            $errors,
        };
    }
    const values = {};
    Object.keys(fields).map((field) => {
        values[field] = fields[field].$value;
    });
    const $values = combine(values);
    const validateFx = createEffect(({ values, schema, }) => schema.safeParse(values));
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
            let errors = {};
            if (!result.success) {
                errors = result.error.flatten().fieldErrors;
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
    });
    return {
        fields,
        $values,
        $isValid,
        submitted,
    };
}
