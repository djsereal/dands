import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerMoodsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/moods', {
    schema: {
      description: 'Get all moods for the couple',
      tags: ['moods'],
      response: {
        200: {
          type: 'object',
          properties: {
            moods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  user_id: { type: 'string' },
                  mood: { type: 'string' },
                  note: { type: ['string', 'null'] },
                  logged_at: { type: 'string', format: 'date-time' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching moods');

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

      const moods = await app.db.query.moods.findMany({
        where: eq(schema.moods.couple_id, couple.id),
        orderBy: (mood, { desc }) => desc(mood.logged_at),
      });

      app.logger.info({ coupleId: couple.id, count: moods.length }, 'Moods fetched');
      reply.send({ moods });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch moods');
      throw error;
    }
  });

  app.fastify.post('/api/moods', {
    schema: {
      description: 'Log a mood',
      tags: ['moods'],
      body: {
        type: 'object',
        required: ['mood'],
        properties: {
          mood: {
            type: 'string',
            enum: ['happy', 'loved', 'anxious', 'sad', 'angry', 'grateful', 'excited', 'tired'],
          },
          note: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            user_id: { type: 'string' },
            mood: { type: 'string' },
            note: { type: ['string', 'null'] },
            logged_at: { type: 'string', format: 'date-time' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        mood: string;
        note?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { mood, note } = request.body;

    app.logger.info({ userId: session.user.id, mood }, 'Logging mood');

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

      const moodValues: Parameters<typeof app.db.insert<typeof schema.moods>>[0] = schema.moods;
      const [moodEntry] = await app.db
        .insert(moodValues)
        .values({
          couple_id: couple.id,
          user_id: session.user.id,
          mood: mood as "happy" | "loved" | "anxious" | "sad" | "angry" | "grateful" | "excited" | "tired",
          note: note || null,
        })
        .returning();

      app.logger.info({ moodId: moodEntry.id, mood }, 'Mood logged');
      reply.status(201).send(moodEntry);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to log mood');
      throw error;
    }
  });
}
