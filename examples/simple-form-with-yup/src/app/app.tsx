import { Center, ChakraProvider, Container, Flex, Text } from '@chakra-ui/react';
import { SimpleFormWithYup } from './simple-form-with-yup';

export function App() {
  return (
    <ChakraProvider>
      <Container background="blue.500" maxW="100vw" height={10} px={60}>
        <Flex height={10} alignItems="center">
          <Text fontSize="lg" color="white">Simple Form with yup examle</Text>
        </Flex>
      </Container>
      <Container maxW="container.xl" mt={10}>
        <Center>
          <SimpleFormWithYup />
        </Center>
      </Container>
    </ChakraProvider>
  );
}

export default App;
