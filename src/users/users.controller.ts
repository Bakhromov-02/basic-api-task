import {
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Controller,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UpdateUserDto, UserQueryDto } from './dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

import { PageDto } from '@common/dtos';
import { ResponseDtoHelper } from '@common/helpers';
import { ApiBearerAuthConst } from '@common/constants';
import { ApiCustomResponse, ApiPaginatedResponse, GetUser } from '@common/decorators';
import { RequestUser } from '@common/interfaces';

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
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResponseDtoHelper<User>> {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: RequestUser,
  ) {
    return this.usersService.update(+id, updateUserDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.usersService.remove(+id, user);
  }
}
