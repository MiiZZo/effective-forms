import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { createForm } from '@effective-forms/core';
import { yupSchema } from '@effective-forms/yup';
import { Store, createEffect, sample } from 'effector';
import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import { object, string } from 'yup';

const userSchema = object({
  email: string().email('Email must be an email').required('Required'),
  password: string()
    .min(8, 'Password must contains at least 8 symbols')
    .required('Required'),
});

const simpleForm = createForm(
  yupSchema({
    schema: userSchema,
    initialValues: {
      email: '',
      password: '',
    },
  })
);

const sendDataFx = createEffect(async () => {
  // sending data to server...
  await sleep(1000);
});

sample({
  clock: simpleForm.submitted,
  target: sendDataFx,
});

sample({
  clock: sendDataFx.doneData,
  target: [simpleForm.cleared],
});

interface Props {
  name: string;
  $value: Store<string>;
  $errors: Store<string[]>;
  onChange(value: string): void; 
  isSubmitting: boolean;
}

function Field({
  name,
  $value,
  $errors,
  onChange,
  isSubmitting,
}: Props) {
  const value = useUnit($value);
  const errors = useUnit($errors);
  
  return (
    <FormControl
      isDisabled={isSubmitting}
      isRequired
      isInvalid={errors.length > 0}
    >
      <FormLabel>{name}</FormLabel>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <FormErrorMessage>{errors[0]}</FormErrorMessage>
    </FormControl>
  );
}

export function SimpleFormWithYup() {
  const isFormSubmitting = useUnit(sendDataFx.pending);
  const toast = useToast();

  useEffect(() => {
    if (isFormSubmitting) {
      // eslint-disable-next-line no-inner-declarations
      async function showMessage() {
        await sleep(1000);
        toast({
          title: 'Account created.',
          description: "We've created your account for you.",
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
      }

      showMessage();
    }
  }, [isFormSubmitting, toast]);

  return (
    <Stack
      width="sm"
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        simpleForm.submit();
      }}
    >
      <Field
        name="Email"
        $value={simpleForm.fields.email.$value}
        $errors={simpleForm.fields.email.$errors}
        onChange={simpleForm.fields.email.changed}
        isSubmitting={isFormSubmitting}
      />
      <Field
        name="Password"
        $value={simpleForm.fields.password.$value}
        $errors={simpleForm.fields.password.$errors}
        onChange={simpleForm.fields.password.changed}
        isSubmitting={isFormSubmitting}
      />
      <Button
        isLoading={isFormSubmitting}
        colorScheme="blue"
        type="submit"
        loadingText="Submitting"
      >
        Submit
      </Button>
    </Stack>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
