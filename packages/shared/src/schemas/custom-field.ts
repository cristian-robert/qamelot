import { z } from 'zod';

const CustomFieldTypeEnum = z.enum(['STRING', 'NUMBER', 'DROPDOWN', 'CHECKBOX', 'DATE']);
const CustomFieldEntityTypeEnum = z.enum(['TEST_CASE', 'TEST_RESULT']);

export const CreateCustomFieldDefinitionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less'),
    fieldType: CustomFieldTypeEnum,
    options: z
      .array(z.string().min(1, 'Option cannot be empty'))
      .min(1, 'At least one option is required for dropdown fields')
      .max(50, 'Maximum 50 options allowed')
      .nullable()
      .optional(),
    required: z.boolean().optional(),
    entityType: CustomFieldEntityTypeEnum,
    position: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.fieldType === 'DROPDOWN') {
        return data.options && data.options.length > 0;
      }
      return true;
    },
    { message: 'Options are required for dropdown fields', path: ['options'] },
  );

export const UpdateCustomFieldDefinitionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .optional(),
    fieldType: CustomFieldTypeEnum.optional(),
    options: z
      .array(z.string().min(1, 'Option cannot be empty'))
      .min(1, 'At least one option is required')
      .max(50, 'Maximum 50 options allowed')
      .nullable()
      .optional(),
    required: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.fieldType === 'DROPDOWN') {
        return data.options && data.options.length > 0;
      }
      return true;
    },
    { message: 'Options are required for dropdown fields', path: ['options'] },
  );

export const SetCustomFieldValueSchema = z.object({
  definitionId: z.string().min(1, 'Definition ID is required'),
  value: z.string().max(5000, 'Value must be 5000 characters or less'),
});

export const SetCustomFieldValuesSchema = z.object({
  values: z
    .array(SetCustomFieldValueSchema)
    .max(100, 'Cannot set more than 100 field values at once'),
});

export type CreateCustomFieldDefinitionInput = z.infer<typeof CreateCustomFieldDefinitionSchema>;
export type UpdateCustomFieldDefinitionInput = z.infer<typeof UpdateCustomFieldDefinitionSchema>;
export type SetCustomFieldValueInput = z.infer<typeof SetCustomFieldValueSchema>;
export type SetCustomFieldValuesInput = z.infer<typeof SetCustomFieldValuesSchema>;
