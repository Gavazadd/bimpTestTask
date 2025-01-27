import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../ormconfig';
import { User } from '../entity/User';
import bcrypt from 'bcrypt';

export async function userController(server: FastifyInstance) {
  
  server.post('/account/register', async (request, reply) => {
    const { login, password } = request.body as { login: string; password: string };

    
    if (!login || !password) {
      return reply.status(400).send({ message: 'Login and password are required.' });
    }

    
    const existingUser = await AppDataSource.getRepository(User).findOneBy({ login });
    if (existingUser) {
      return reply.status(400).send({ message: 'User already exists.' });
    }

   
    const passwordHash = await bcrypt.hash(password, 10);

   
    const user = new User();
    user.login = login;
    user.password = passwordHash;

    await AppDataSource.getRepository(User).save(user);
    return reply.status(201).send({ message: 'User registered successfully.' });
  });
}
