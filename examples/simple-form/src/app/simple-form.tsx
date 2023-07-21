import {
  Button,
  FormErrorMessage,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  CreateToastFnReturn,
} from '@chakra-ui/react';
import { createForm } from '@effective-forms/core';
import { useUnit } from 'effector-react';
import {
  attach,
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector';
import { useEffect } from 'react';

const simpleForm = createForm({
  fields: {
    email: {
      init: '' as string,
      validator: (email) => {
        if (email.includes('@')) {
          return { result: true };
        }

        return { result: false, errors: ['Email must contains @'] };
      },
    },
    password: {
      init: '' as string,
      validator: (pass) =>
        pass.length >= 8
          ? { result: true }
          : {
              result: false,
              errors: ['Password must contains at least 8 symbols'],
            },
    },
  },
  validator: (values) => {
    const isPasswordValid = values.password.length >= 8;
    const isEmailValid = values.email.includes('@');
    const errors: Record<string, string[]> = {};

    if (isEmailValid && isPasswordValid) {
      return { result: true };
    }

    if (!isEmailValid) {
      errors.email = ['Email must contains @'];
    }

    if (!isPasswordValid) {
      errors.password = ['Password must contains at least 8 symbols'];
    }

    return { result: false, errors };
  },
});

const sendDataFx = createEffect(
  async (values: { email: string; password: string }) => {
    // send data to server...
    await sleep(1000);
    return { result: true };
  }
);

const toastSetted = createEvent<CreateToastFnReturn>();
const $toastRef = createStore<CreateToastFnReturn | null>(null);

$toastRef.on(toastSetted, (_, toast) => toast);

const toastFx = attach({
  source: $toastRef,
  effect: (toast) => {
    if (toast) {
      toast({
        title: 'Account created.',
        description: "We've created your account for you.",
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    }
  },
});

sample({
  clock: simpleForm.submitted,
  source: simpleForm.$values,
  target: sendDataFx,
});

sample({
  clock: sendDataFx.doneData,
  filter: ({ result }) => {
    return result;
  },
  target: [toastFx, simpleForm.cleared],
});

export function SimpleForm() {
  const emailField = useUnit(simpleForm.fields.email);
  const passwordField = useUnit(simpleForm.fields.password);
  const isFormSubmitting = useUnit(sendDataFx.pending);
  const toast = useToast();

  useEffect(() => {
    toastSetted(toast);
  }, [toast]);

  return (
    <Stack
      width="xl"
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        simpleForm.submit();
      }}
      maxW="sm"
    >
      <FormControl
        isDisabled={isFormSubmitting}
        isInvalid={emailField.$errors.length > 0}
      >
        <FormLabel>Email</FormLabel>
        <Input
          value={emailField.$value}
          onChange={(e) => emailField.changed(e.target.value)}
          placeholder="Email"
        />
        <FormErrorMessage>{emailField.$errors[0]}</FormErrorMessage>
      </FormControl>
      <FormControl
        isDisabled={isFormSubmitting}
        isInvalid={passwordField.$errors.length > 0}
      >
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={passwordField.$value}
          onChange={(e) => passwordField.changed(e.target.value)}
          placeholder="Password"
        />
        <FormErrorMessage>{passwordField.$errors[0]}</FormErrorMessage>
      </FormControl>
      <Button
        isLoading={isFormSubmitting}
        loadingText="Submitting"
        type="submit"
        colorScheme="blue"
      >
        Submit
      </Button>
    </Stack>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
