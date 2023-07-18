## @effective-forms/zod
See full [documentaion](https://github.com/MiiZZo/effective-forms)
### About library
Integrate `zod` with [core package](http://www.npmjs.com/package/@effective-forms/core)
## Installation

NPM
```
npm install zod @effective-forms/zod
```
Yarn
```
yarn add zod @effective-forms/zod
```
## Usage example
```ts
import { createForm } from '@effective-forms/core';
import { zodSchema } from '@effective-forms/zod';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const form = createForm(
  zodSchema({
    schema: userSchema,
    initialValues: {
      email: '',
      password: '',
    },
  })
);

```