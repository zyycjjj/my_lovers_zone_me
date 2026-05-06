import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/guards/user.guard';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { KnowledgeService } from './knowledge.service';
import {
  CreateProductProfileDto,
  ProductProfileIdParamDto,
  UpdateProductProfileDto,
} from './dto/product-profile.dto';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';

@ApiTags('knowledge')
@ApiBearerAuth('UserToken')
@Controller('api/knowledge')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  // ─── 用户偏好 ───

  @Get('preferences')
  @ApiOperation({ summary: '获取我的内容偏好' })
  async getPreferences(@Req() req: Request) {
    return this.knowledge.getPreferences(req.accountId!);
  }

  @Patch('preferences')
  @ApiOperation({ summary: '更新我的内容偏好' })
  async updatePreferences(
    @Req() req: Request,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.knowledge.updatePreferences(req.accountId!, dto);
  }

  // ─── 商品档案 ───

  @Get('products')
  @ApiOperation({ summary: '获取我的商品档案列表' })
  async listProducts(@Req() req: Request) {
    return this.knowledge.listProducts(req.accountId!);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '新增商品档案' })
  async createProduct(
    @Req() req: Request,
    @Body() dto: CreateProductProfileDto,
  ) {
    return this.knowledge.createProduct(req.accountId!, dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: '更新商品档案' })
  async updateProduct(
    @Req() req: Request,
    @Param() param: ProductProfileIdParamDto,
    @Body() dto: UpdateProductProfileDto,
  ) {
    return this.knowledge.updateProduct(req.accountId!, param.id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除商品档案' })
  async deleteProduct(
    @Req() req: Request,
    @Param() param: ProductProfileIdParamDto,
  ) {
    return this.knowledge.deleteProduct(req.accountId!, param.id);
  }
}
