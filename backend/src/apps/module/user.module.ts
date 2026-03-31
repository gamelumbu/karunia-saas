import { User } from '@/apps/entities/master/user.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [User],
})
export class UserModule {}