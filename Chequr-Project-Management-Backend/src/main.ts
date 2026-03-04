import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL?.replace(/\/+$/, ''),
    ].filter(Boolean) as string[],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight'],
    exposedHeaders: ['Authorization'],  // Allow frontend to read the JWT from response
  });

  app.use(cookieParser());

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { graphqlUploadExpress } = require('graphql-upload');
  app.use(graphqlUploadExpress({ maxFileSize: 3 * 1024 * 1024, maxFiles: 5 })); // 3MB limit

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();