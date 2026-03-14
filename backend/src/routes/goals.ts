import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerGoalsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/goals', {
    schema: {
      description: 'Get all goals for the couple',
      tags: ['goals'],
      response: {
        200: {
          type: 'object',
          properties: {
            goals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  created_by: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  target_date: { type: ['string', 'null'] },
                  is_completed: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching goals');

    try {
      const couple = await app.db.query.couples.findFirst({
        where: (couple, { or, eq }) =>
          or(
            eq(couple.partner1_id, session.user.id),
            eq(couple.partner2_id, session.user.id)
          ),
      });

      if (!couple) {
        app.logger.warn({ userId: session.user.id }, 'Couple not found');
        return reply.status(404).send({ error: 'Couple not found' });
      }

      const goals = await app.db.query.goals.findMany({
        where: eq(schema.goals.couple_id, couple.id),
        orderBy: (goal, { desc }) => desc(goal.created_at),
      });

      app.logger.info({ coupleId: couple.id, count: goals.length }, 'Goals fetched');
      reply.send({ goals });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch goals');
      throw error;
    }
  });

  app.fastify.post('/api/goals', {
    schema: {
      description: 'Create a new goal',
      tags: ['goals'],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          target_date: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            created_by: { type: 'string' },
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            target_date: { type: ['string', 'null'] },
            is_completed: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        title: string;
        description?: string;
        target_date?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, description, target_date } = request.body;

    app.logger.info({ userId: session.user.id, title }, 'Creating goal');

    try {
      const couple = await app.db.query.couples.findFirst({
        where: (couple, { or, eq }) =>
          or(
            eq(couple.partner1_id, session.user.id),
            eq(couple.partner2_id, session.user.id)
          ),
      });

      if (!couple) {
        app.logger.warn({ userId: session.user.id }, 'Couple not found');
        return reply.status(404).send({ error: 'Couple not found' });
      }

      const [goal] = await app.db
        .insert(schema.goals)
        .values({
          couple_id: couple.id,
          created_by: session.user.id,
          title,
          description: description || null,
          target_date: target_date || null,
        })
        .returning();

      app.logger.info({ goalId: goal.id, coupleId: couple.id }, 'Goal created');
      reply.status(201).send(goal);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to create goal');
      throw error;
    }
  });

  app.fastify.patch('/api/goals/:id', {
    schema: {
      description: 'Update a goal',
      tags: ['goals'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          target_date: { type: ['string', 'null'] },
          is_completed: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            created_by: { type: 'string' },
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            target_date: { type: ['string', 'null'] },
            is_completed: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        title?: string;
        description?: string | null;
        target_date?: string | null;
        is_completed?: boolean;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;

    app.logger.info({ userId: session.user.id, goalId: id }, 'Updating goal');

    try {
      const goal = await app.db.query.goals.findFirst({
        where: eq(schema.goals.id, id),
      });

      if (!goal) {
        app.logger.warn({ goalId: id }, 'Goal not found');
        return reply.status(404).send({ error: 'Goal not found' });
      }

      const couple = await app.db.query.couples.findFirst({
        where: eq(schema.couples.id, goal.couple_id),
      });

      if (!couple || (couple.partner1_id !== session.user.id && couple.partner2_id !== session.user.id)) {
        app.logger.warn({ goalId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      const updates: Partial<typeof schema.goals.$inferInsert> = {};
      if (request.body.title !== undefined) updates.title = request.body.title;
      if (request.body.description !== undefined) updates.description = request.body.description;
      if (request.body.target_date !== undefined) updates.target_date = request.body.target_date;
      if (request.body.is_completed !== undefined) updates.is_completed = request.body.is_completed;

      const [updated] = await app.db
        .update(schema.goals)
        .set(updates)
        .where(eq(schema.goals.id, id))
        .returning();

      app.logger.info({ goalId: id, updates }, 'Goal updated');
      reply.send(updated);
    } catch (error) {
      app.logger.error({ err: error, goalId: id, userId: session.user.id }, 'Failed to update goal');
      throw error;
    }
  });

  app.fastify.delete('/api/goals/:id', {
    schema: {
      description: 'Delete a goal',
      tags: ['goals'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;

    app.logger.info({ userId: session.user.id, goalId: id }, 'Deleting goal');

    try {
      const goal = await app.db.query.goals.findFirst({
        where: eq(schema.goals.id, id),
      });

      if (!goal) {
        app.logger.warn({ goalId: id }, 'Goal not found');
        return reply.status(404).send({ error: 'Goal not found' });
      }

      const couple = await app.db.query.couples.findFirst({
        where: eq(schema.couples.id, goal.couple_id),
      });

      if (!couple || (couple.partner1_id !== session.user.id && couple.partner2_id !== session.user.id)) {
        app.logger.warn({ goalId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.goals).where(eq(schema.goals.id, id));

      app.logger.info({ goalId: id }, 'Goal deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error({ err: error, goalId: id, userId: session.user.id }, 'Failed to delete goal');
      throw error;
    }
  });
}
