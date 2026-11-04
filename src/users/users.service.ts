import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UpdateUserDto, UserQueryDto } from './dto';
import { User } from './entities/user.entity';

import { SignupDto } from '../auth/dto';

import { PageDto } from '@common/dtos';
import { RequestUser } from '@common/interfaces';
import { CalculateTotalPages } from '@common/functions';
import { HashHelper, ResponseDtoHelper } from '@common/helpers';

/** Escape LIKE wildcards so user input is matched literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create({ email, password }: SignupDto): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password: await HashHelper.hash(password),
    });
    // A unique-email race is caught by the DB constraint and mapped to 409 by the exception filter.
    return this.usersRepository.save(user);
  }

  async findAll(query: UserQueryDto): Promise<PageDto<User>> {
    const { email, name, page = 1, limit = 10 } = query;
    const usersQuery = this.usersRepository.createQueryBuilder('user');

    if (name) {
      usersQuery.andWhere('user.name ILIKE :name', {
        name: `%${escapeLike(name)}%`,
      });
    }
    if (email) {
      usersQuery.andWhere('user.email ILIKE :email', {
        email: `%${escapeLike(email)}%`,
      });
    }

    const [users, total] = await usersQuery
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      currentPage: page,
      limit,
      total,
      totalPages: CalculateTotalPages(total, limit),
    };
  }

  async findOne(id: number): Promise<ResponseDtoHelper<User>> {
    return ResponseDtoHelper.success(await this.getByIdOrFail(id));
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    user: RequestUser,
  ): Promise<ResponseDtoHelper<User>> {
    this.assertSelf(id, user, 'update');

    if (dto.name === undefined && dto.password === undefined) {
      throw new BadRequestException('Provide at least one field to update');
    }

    await this.getByIdOrFail(id);

    const changes: Partial<User> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.password !== undefined) {
      changes.password = await HashHelper.hash(dto.password);
      // Changing the password signs out every other session.
      changes.rtHash = null;
    }

    await this.usersRepository.update({ id }, changes);
    return ResponseDtoHelper.success(await this.getByIdOrFail(id));
  }

  async remove(
    id: number,
    user: RequestUser,
  ): Promise<ResponseDtoHelper<null>> {
    this.assertSelf(id, user, 'delete');
    await this.getByIdOrFail(id);

    await this.dataSource.transaction(async (manager) => {
      // Release the email so it can be registered again, and end all sessions.
      await manager.update(User, { id }, { email: null, rtHash: null });
      await manager.softDelete(User, { id });
    });

    return ResponseDtoHelper.success(null, 'Account deleted');
  }

  /** Active (not soft-deleted) user, used by the access-token strategy. */
  findActiveById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findWithRefreshTokenHash(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.rtHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async setRefreshTokenHash(id: number, rtHash: string | null): Promise<void> {
    await this.usersRepository.update({ id }, { rtHash });
  }

  getOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  private async getByIdOrFail(id: number): Promise<User> {
    const user = await this.findActiveById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private assertSelf(id: number, user: RequestUser, action: string) {
    if (id !== user.id) {
      throw new ForbiddenException(`You can only ${action} your own account`);
    }
  }
}
