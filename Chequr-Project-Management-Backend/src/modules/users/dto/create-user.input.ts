import { InputType, Field } from '@nestjs/graphql';
import { UserStatus } from 'src/common/enums/user-status.enum';


@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  password: string;

  @Field(() => [String])
  roles: string[]; // ['ADMIN', 'USER']

  @Field(() => UserStatus, { defaultValue: UserStatus.ACTIVE })
  status: UserStatus;
}
