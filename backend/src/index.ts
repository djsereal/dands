import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerCoupleRoutes } from './routes/couples.js';
import { registerMemoriesRoutes } from './routes/memories.js';
import { registerVentsRoutes } from './routes/vents.js';
import { registerMoodsRoutes } from './routes/moods.js';
import { registerTodosRoutes } from './routes/todos.js';
import { registerActivitiesRoutes } from './routes/activities.js';
import { registerGoalsRoutes } from './routes/goals.js';
import { registerJournalRoutes } from './routes/journal.js';
import { registerTipsRoutes, seedRelationshipTips } from './routes/tips.js';
import { registerIntimacyRoutes } from './routes/intimacy.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

export type App = typeof app;

app.withAuth();

// Register routes
registerCoupleRoutes(app);
registerMemoriesRoutes(app);
registerVentsRoutes(app);
registerMoodsRoutes(app);
registerTodosRoutes(app);
registerActivitiesRoutes(app);
registerGoalsRoutes(app);
registerJournalRoutes(app);
registerTipsRoutes(app);
registerIntimacyRoutes(app);

// Seed relationship tips
await seedRelationshipTips(app);

await app.run();
app.logger.info('Together app running');
