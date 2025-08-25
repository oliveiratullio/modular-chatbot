import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequestDTO {
  @IsString() @IsNotEmpty() message!: string;
  @IsString() @IsNotEmpty() user_id!: string;
  @IsString() @IsNotEmpty() conversation_id!: string;
}
