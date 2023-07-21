# Motivation
### 1. Boilerplate.
When you want to manage your forms in web applications with Effector, there is a lot of boilerplate:
```ts
const formSubmitted = createEvent();

const usernameChanged = createEvent();
const $username = createStore('');
const setIsUsernameValid = createEvent();
const $isUsernameValid = createStore(false);

$username.on(usernameChanged, (_, username) => username);
$isUsernameValid.on(setIsUsernameValid, (_, isValid) => isValid);

const emailChanged = createEvent();
const $email = createStore('');
const setIsEmailValid = createEvent();
const $isEmailValid = createStore(false);

$isEmailValid.on(setIsEmailValid, (_, isValid) => isValid);

const validateFormFx = createEffect(({
  email,
  username,
}) => ...);

sample({
  clock: formSubmitted,
  source: {
    email: $email,
    username: $username,
  },
  target: validateFormFx,
});

sample({
  clock: validateFormFx.doneData,
  filter: (result) => result.result,
  target: [
    setIsEmailValid.prepend(() => true),
    setIsUsernameValid.prepend(() => true),
  ],
});

// And more code...
```
### 2. Validation with external packages (zod, yup, etc).
Also, most likely, you want to validate your forms using external validation libraries. This library provides separate packages for easy integration of your validation package with core code. Below, you can see examples of using validation libraries with this library.
# Installation
NPM
```
npm i effector @effective-forms/core
```
Yarn
```
yarn add effector @effective-forms/core
```
# Basic usage example
```ts
const form = createForm({
  fields: {
    email: {
      init: '',
      validator: (email) => {
        if (email.includes('@') {
          return {
            result: true,
          }
        }
  
        return {
          result: false,
          errors: ['Email is not valid'],
        }
      },
    },
    password: {
      init: '',
      validator: (password) => {
        if (password.length >= 8) {
          return {
            result: true,
          }
        }
  
        return {
          result: false,
          errors: ['Password must contains at least 8 symbols'],
        }
      },
    },
  },
});

form.submit();

form.fields.email.$isValid // false
forms.fields.email.$errors // ['Email is not valid']

form.fields.changed('example@gmail.com')

form.submit();

form.fields.email.$isValid // true
form.fields.email.$errors // []
```
# Recommended way to use
This package is designed to easily use external packages for validation.

### Usage with zod
```
npm i add zod @effective-forms/zod
```

```ts
import { createForm } from '@effective-forms/core';
import { zodSchema } from '@effective-forms/zod';
import { z } from 'zod';

const userSchema = z.object({
  password: z.string().min(8, 'Password must contains at least 8 symbols'),
  email: z.string().email('Email is not valid'),
});

const form = createForm(
  zodSchema({
    schema: userSchema,
    initialValues: {
      username: '',
      password: '',
    }, 
  }),
);

// Now you can just work with your form.
```

### Usage with yup
```
npm i add yup @effective-forms/yup
```

```ts
import { createForm } from '@effective-forms/core';
import { yupSchema } from '@effective-forms/yup';
import { object, string } from 'yup';

const userSchema = object({
  password: string().min(8, 'Password must contains at least 8 symbols').required(),
  email: string().email('Email is not valid').required(),
});

const form = createForm(
  yupSchema({
    schema: userSchema,
    initialValues: {
      username: '',
      password: '',
    }, 
  })
);

// Now you can just work with your form.
```
### Real code examples
You can see real code examples in the [examples folder.](https://github.com/MiiZZo/effective-forms/tree/master/examples)
### API

TODO
