import { Center, ChakraProvider, Container } from '@chakra-ui/react';
import { SimpleForm } from './simple-form';

export function App() {
  return (
    <ChakraProvider>
      <Container maxWidth="container.xl">
        <Center>
          <SimpleForm />
        </Center>
      </Container>
    </ChakraProvider>
  );
}

export default App;
