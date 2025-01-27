import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true }) 
  login!: string;

  @Column({ type: 'varchar' }) 
  password!: string;
}
