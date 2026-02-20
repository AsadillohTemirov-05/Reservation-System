import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        return {
          uri,
          retryWrites: true,
          w: 'majority',
          maxPoolSize: configService.get<number>('database.options.maxPoolSize'),
          minPoolSize: configService.get<number>('database.options.minPoolSize'),
          serverSelectionTimeoutMS: configService.get<number>(
            'database.options.serverSelectionTimeoutMS',
          ),
          socketTimeoutMS: configService.get<number>('database.options.socketTimeoutMS'),
          family: configService.get<number>('database.options.family'),
          autoIndex: configService.get<boolean>('database.autoIndex'),

          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });

            connection.on('disconnected', () => {
              console.log('❌ MongoDB disconnected');
            });

            connection.on('error', (error) => {
              console.error('❌ MongoDB connection error:', error);
            });

            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}