import { Global, Module } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';
import { MongoService } from './mongo.service';
import { PostgresService } from './postgres.service';

@Global()
@Module({
  providers: [JsonStorageService, MongoService, PostgresService],
  exports: [JsonStorageService, MongoService, PostgresService],
})
export class DatabaseModule {}
