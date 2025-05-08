import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UpdateUserDto, UserQueryDto } from './dto';
import { User } from './entities/user.entity';

import { UserAuthDto } from '../auth/dto';

import { PageDto } from '@common/dtos';
import { RequestUser } from '@common/interfaces';
import { CalculateTotalPages } from '@common/functions';
import { HashHelper, ResponseDtoHelper } from '@common/helpers';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: UserAuthDto) {
    const { email, password } = dto;

    const passwordHash = await HashHelper.hash(password);
    try {
      const createdUser = await this.usersRepository
        .createQueryBuilder()
        .insert()
        .values({ email, password: passwordHash })
        .returning('*')
        .execute()
        .then((result) => result.generatedMaps[0]);

      return createdUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    user: RequestUser,
  ): Promise<ResponseDtoHelper<any>> {
    const { password: plainPass, name } = updateUserDto;
    const { id: userId } = user;

    if (id !== userId) {
      throw new BadRequestException();
    }

    await this.findOne(id);
    const password = plainPass ? await HashHelper.hash(plainPass) : undefined;

    try {
      await this.usersRepository
        .createQueryBuilder()
        .update({ name, password })
        .where({ id })
        .execute();

      return ResponseDtoHelper.success(undefined);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number, user: RequestUser): Promise<ResponseDtoHelper<any>> {
    const { id: userId } = user;
    if (id !== userId) {
      throw new BadRequestException();
    }
    await this.findOne(id);

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .createQueryBuilder(User, 'user')
          .update({ email: null })
          .where({ id })
          .execute();

        await manager
          .createQueryBuilder()
          .softDelete()
          .from(User)
          .where({ id })
          .execute();
      });
    

      return ResponseDtoHelper.success(undefined);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: UserQueryDto): Promise<PageDto<User>> {
    const { email, name, page = 1, limit = 10 } = query;
    try {
      const usersQuery = this.usersRepository.createQueryBuilder('user');

      if (name) {
        usersQuery.andWhere('user.name ILIKE :name', { name: `%${name}%` });
      }
      if (email) {
        usersQuery.andWhere('user.email ILIKE :email', { email: `%${email}%` });
      }

      const [users, count] = await usersQuery
        .orderBy('user.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = CalculateTotalPages(count, limit);

      return { data: users, totalPages, currentPage: page };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number): Promise<ResponseDtoHelper<User>> {
    try {
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return ResponseDtoHelper.success(user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getOneByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .addSelect('user.password')
        .getOne();

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
