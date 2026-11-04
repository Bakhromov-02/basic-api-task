import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ApiHideProperty()
  @DeleteDateColumn({ select: false })
  deletedAt: Date;

  // Nullable so a deleted account's email can be released for re-registration.
  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @ApiHideProperty()
  @Column({ select: false })
  password: string;

  /** SHA-256 of the current refresh token; null when logged out. */
  @ApiHideProperty()
  @Column({ nullable: true, select: false })
  rtHash: string;
}
