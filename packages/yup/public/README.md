## @effective-forms/zod
See full [documentaion](https://github.com/MiiZZo/effective-forms)
### About library
Integrate `yup` with [core package](http://www.npmjs.com/package/@effective-forms/core)
## Installation

NPM
```
npm install yup @effective-forms/yup
```
Yarn
```
yarn add yup @effective-forms/yup
```
## Usage example
```ts
import { createForm } from '@effective-forms/core';
import { yupSchema } from '@effective-forms/yup';
import { object, string } from 'yup';

const userSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const form = createForm(
  yupSchema({
    schema: userSchema,
    initialValues: {
      email: '',
      password: '',
    },
  })
);
```
