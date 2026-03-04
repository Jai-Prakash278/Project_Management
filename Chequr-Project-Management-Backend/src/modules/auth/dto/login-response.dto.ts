import { ObjectType, Field, ID } from '@nestjs/graphql';
import { LoginUser } from './login-user.dto';

@ObjectType()
export class LoginResponse {
  @Field()
  message: string;

  @Field(() => LoginUser)
  user: LoginUser;
}
