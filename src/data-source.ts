import 'dotenv/config';
import { DataSource } from 'typeorm';

import { buildDataSourceOptions } from './database/database.options';

// Used by the TypeORM CLI: npm run migration:generate / migration:run / migration:revert
export default new DataSource(buildDataSourceOptions());
