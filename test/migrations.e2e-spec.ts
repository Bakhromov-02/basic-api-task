import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

import { createTestApp } from './helpers';

describe('Database migrations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp(); // runs pending migrations on startup
    dataSource = app.get(DataSource);
  });

  afterAll(() => app.close());

  it('leave the schema exactly in sync with the entities', async () => {
    const pending = await dataSource.driver.createSchemaBuilder().log();
    expect(pending.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('can be reverted and re-applied', async () => {
    await dataSource.undoLastMigration();
    await dataSource.runMigrations();

    const pending = await dataSource.driver.createSchemaBuilder().log();
    expect(pending.upQueries).toHaveLength(0);
  });
});
