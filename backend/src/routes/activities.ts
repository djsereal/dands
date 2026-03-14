import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerActivitiesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/activities', {
    schema: {
      description: 'Get all activities for the couple',
      tags: ['activities'],
      response: {
        200: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  logged_by: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  activity_date: { type: 'string' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching activities');

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

      const activities = await app.db.query.activities.findMany({
        where: eq(schema.activities.couple_id, couple.id),
        orderBy: (activity, { desc }) => desc(activity.activity_date),
      });

      app.logger.info(
        { coupleId: couple.id, count: activities.length },
        'Activities fetched'
      );
      reply.send({ activities });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch activities');
      throw error;
    }
  });

  app.fastify.post('/api/activities', {
    schema: {
      description: 'Create a new activity',
      tags: ['activities'],
      body: {
        type: 'object',
        required: ['title', 'activity_date'],
        properties: {
          title: { type: 'string' },
          activity_date: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            logged_by: { type: 'string' },
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            activity_date: { type: 'string' },
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
        activity_date: string;
        description?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, activity_date, description } = request.body;

    app.logger.info({ userId: session.user.id, title }, 'Creating activity');

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

      const [activity] = await app.db
        .insert(schema.activities)
        .values({
          couple_id: couple.id,
          logged_by: session.user.id,
          title,
          activity_date,
          description: description || null,
        })
        .returning();

      app.logger.info({ activityId: activity.id, coupleId: couple.id }, 'Activity created');
      reply.status(201).send(activity);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to create activity');
      throw error;
    }
  });

  app.fastify.delete('/api/activities/:id', {
    schema: {
      description: 'Delete an activity',
      tags: ['activities'],
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

    app.logger.info({ userId: session.user.id, activityId: id }, 'Deleting activity');

    try {
      const activity = await app.db.query.activities.findFirst({
        where: eq(schema.activities.id, id),
      });

      if (!activity) {
        app.logger.warn({ activityId: id }, 'Activity not found');
        return reply.status(404).send({ error: 'Activity not found' });
      }

      if (activity.logged_by !== session.user.id) {
        app.logger.warn({ activityId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.activities).where(eq(schema.activities.id, id));

      app.logger.info({ activityId: id }, 'Activity deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, activityId: id, userId: session.user.id },
        'Failed to delete activity'
      );
      throw error;
    }
  });
}
