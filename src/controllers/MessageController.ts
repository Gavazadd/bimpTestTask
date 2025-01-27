import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../ormconfig';
import {Message, MessageType} from '../entity/Message';
import { existsSync, mkdirSync, createWriteStream  } from 'fs';
import { join } from 'path';
import { MultipartFields } from '@fastify/multipart';
import { DeepPartial } from 'typeorm';

async function getMessages(
  request: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>,
  reply: FastifyReply
) {
  const { limit = 10, offset = 0 } = request.query;

  const messageRepository = AppDataSource.getRepository(Message);

  const [messages, total] = await messageRepository.findAndCount({
    take: limit,
    skip: offset,
  });

  reply.send({
    data: messages,
    total,
    limit,
    offset,
  });
}

async function getMessageById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  const messageRepository = AppDataSource.getRepository(Message);
  const message = await messageRepository.findOneBy({ id: parseInt(id) });

  if (!message) {
    return reply.status(404).send({ message: 'Message not found' });
  }

  reply.send(message);
}

async function createTextMessage(
  request: FastifyRequest<{ Body: { content: string } }>,
  reply: FastifyReply
) {
  const { content } = request.body;

  if (!content) {
    return reply.status(400).send({ message: 'Content is required' });
  }

  const messageRepository = AppDataSource.getRepository(Message);
  const message = messageRepository.create({
    type: MessageType.Text,
    content,
  });

  await messageRepository.save(message);

  reply.send({ message: 'Message created successfully', data: message });
}

async function createMessageWithFile(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await request.file();

  if (!data) {
    return reply.status(400).send({ message: 'File is required' });
  }

  const fields: MultipartFields = data.fields;

  const contentField = fields.content;
  let contentValue = '';

  if (contentField && 'value' in contentField) {
    contentValue = String(contentField.value);
  }


  const uploadsDir = join(__dirname, '../../uploads');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = join(uploadsDir, `${Date.now()}_${data.filename}`);

  const writeStream = createWriteStream(filePath);
  data.file.pipe(writeStream);

  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  const messageRepository = AppDataSource.getRepository(Message);

  const messageData: DeepPartial<Message> = {
    type: MessageType.File,
    content: contentValue ?? '',
    filePath: filePath,
  };

  const message = messageRepository.create(messageData);
  await messageRepository.save(message);

  reply.send({ message: 'Message with file created successfully', data: message });
}


export default async function messageController(server: FastifyInstance) {
  server.get('/messages', getMessages); 
  server.get('/message/:id', getMessageById); 
  server.post('/message/text', createTextMessage);
  server.post('/message/file', createMessageWithFile); 
}
