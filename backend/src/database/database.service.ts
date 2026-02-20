import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {
   
    if (!this.connection) {
      throw new Error('Database connection is not available');
    }
  }


  async onModuleInit() {
    try {
      if (this.connection?.readyState === 1) {
        this.logger.log('✅ Database connection established');
        await this.checkReplicaSet();
      } else {
        this.logger.warn(' Database connection not ready');
      }
    } catch (error) {
      this.logger.error(' Database initialization failed', error);
      throw error;
    }
  }


  async onModuleDestroy() {
    try {
      if (this.connection) {
        await this.connection.close();
        this.logger.log('🔌 Database connection closed');
      }
    } catch (error) {
      this.logger.error('❌ Error closing database connection', error);
    }
  }


  private async checkReplicaSet(): Promise<void> {
    try {
      if (!this.connection?.db) {
        this.logger.warn('⚠️ Database instance not available');
        return;
      }

      const admin = this.connection.db.admin();
      const result = await admin.command({ replSetGetStatus: 1 });

      if (result.ok) {
        this.logger.log(`✅ Replica Set: ${result.set}`);
        this.logger.log(`✅ Members: ${result.members.length}`);
      }
    } catch (error) {
      this.logger.warn(
        '⚠️ MongoDB is not running in Replica Set mode. Transactions will not work!',
      );
      this.logger.warn('💡 Run: rs.initiate() in mongo shell to enable replica set');
    }
  }


  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Database connection is not available');
    }
    return this.connection;
  }


  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }


  getConnectionState(): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    if (!this.connection) {
      return 'unavailable';
    }
    
    return states[this.connection.readyState] || 'unknown';
  }


  async startSession(): Promise<ClientSession> {
    if (!this.connection) {
      throw new Error('Database connection is not available');
    }

    if (!this.isConnected()) {
      throw new Error('Database is not connected');
    }

    return await this.connection.startSession();
  }

 
  async withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.startSession();

    try {
      session.startTransaction();

      const result = await work(session);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }


  async ping(): Promise<boolean> {
    try {
      if (!this.connection?.db) {
        return false;
      }

      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('❌ Database ping failed', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      if (!this.connection?.db) {
        return null;
      }

      return await this.connection.db.stats();
    } catch (error) {
      this.logger.error('❌ Failed to get database stats', error);
      return null;
    }
  }

  
  async dropDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production!');
    }

    if (!this.connection) {
      throw new Error('Database connection is not available');
    }

    this.logger.warn('🗑️ Dropping database...');
    await this.connection.dropDatabase();
    this.logger.warn('✅ Database dropped');
  }

  /**
   * Create collection with validation schema
   */
  async createCollection(name: string, options?: any): Promise<void> {
    try {
      if (!this.connection?.db) {
        throw new Error('Database instance is not available');
      }

      await this.connection.db.createCollection(name, options);
      this.logger.log(`✅ Collection created: ${name}`);
    } catch (error: any) {
      if (error.code === 48) {
        // Collection already exists
        this.logger.debug(`Collection already exists: ${name}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    if (!this.connection?.db) {
      return [];
    }

    const collections = await this.connection.db.listCollections().toArray();
    return collections.map((col) => col.name);
  }

  /**
   * Get collection by name
   */
  getCollection(name: string) {
    if (!this.connection?.db) {
      throw new Error('Database instance is not available');
    }

    return this.connection.db.collection(name);
  }
}