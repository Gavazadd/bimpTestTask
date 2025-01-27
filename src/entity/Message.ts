import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum MessageType {
  Text = 'TEXT',
  File = 'FILE',
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  type!: MessageType; // Тип повідомлення (text, file тощо)К

  @Column({ type: 'text' })
  content!: string; // Вміст повідомлення

  @Column({ type: 'varchar', nullable: true })
  filePath!: string;
}
