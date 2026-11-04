// src/common/decorators/api-custom-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { ResponseDtoHelper } from '@common/helpers';

export const ApiCustomResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(ResponseDtoHelper, model),
    ApiOkResponse({
      description: 'Custom response with data',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDtoHelper) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};
