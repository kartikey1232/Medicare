import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers using Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // Allow displaying uploaded images
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true, // In development, trust requesting origin
    credentials: true,
  });

  // Cookier Parser for JWT HttpOnly storage
  app.use(cookieParser());

  // Serve uploads statically (Mock S3 storage serving)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('MediDesk API')
    .setDescription('MediDesk Healthcare Query & Issue Management Platform Backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend service is running on http://localhost:${port}`);
  console.log(`API documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
