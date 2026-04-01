import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto, ApiSuccessEnvelopeDto } from './api-envelope.dto';

export const ApiSuccessResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, ApiErrorEnvelopeDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
    ApiBadRequestResponse({ type: ApiErrorEnvelopeDto }),
    ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorEnvelopeDto }),
  );
