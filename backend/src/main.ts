import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
  });
    
  app.useGlobalPipes(
  new ValidationPipe({ 
  whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    validationError: { target: false, value: false },
    
   }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
