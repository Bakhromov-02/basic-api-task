import {
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UpdateUserDto, UserQueryDto } from './dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

import { PageDto } from '@common/dtos';
import { ResponseDtoHelper } from '@common/helpers';
import { RequestUser } from '@common/interfaces';
import { ApiBearerAuthConst } from '@common/constants';
import {
  ApiCustomResponse,
  ApiPaginatedResponse,
  GetUser,
} from '@common/decorators';

@ApiBearerAuth(ApiBearerAuthConst)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiPaginatedResponse(User)
  @Get()
  findAll(@Query() query: UserQueryDto): Promise<PageDto<User>> {
    return this.usersService.findAll(query);
  }

  @ApiCustomResponse(User)
  @Get('me')
  me(@GetUser() user: RequestUser): Promise<ResponseDtoHelper<User>> {
    return this.usersService.findOne(user.id);
  }

  @ApiCustomResponse(User)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDtoHelper<User>> {
    return this.usersService.findOne(id);
  }

  @ApiCustomResponse(User)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @GetUser() user: RequestUser,
  ): Promise<ResponseDtoHelper<User>> {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: RequestUser,
  ): Promise<ResponseDtoHelper<null>> {
    return this.usersService.remove(id, user);
  }
}
