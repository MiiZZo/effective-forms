## @effective-forms/zod
See full [documentaion](https://github.com/MiiZZo/effective-forms)
## Installation

NPM
```
npm install effector @effective-forms/core
```
Yarn
```
yarn add effector @effective-forms/core
```
## Usage example
```ts
import { createForm } from '@effective-forms/core';

const form = createForm(
  fields: {
    email: {
      init: '',
      validator: (email) => {
        if (email.length > 2) {
          return { result: true };
        }

        return { result: false, errors: ['is not valid'] };
      },
    }
  },
  validator: (fields) => ...
);
```