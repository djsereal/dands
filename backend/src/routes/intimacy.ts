import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';

export function registerIntimacyRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/intimacy/logs', {
    schema: {
      description: 'Get all intimacy logs for the couple',
      tags: ['intimacy'],
      response: {
        200: {
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  logged_by: { type: 'string' },
                  satisfaction_rating: { type: 'integer' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching intimacy logs');

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

      const logs = await app.db.query.intimacy_logs.findMany({
        where: eq(schema.intimacy_logs.couple_id, couple.id),
        orderBy: (log, { desc }) => desc(log.logged_at),
      });

      app.logger.info(
        { coupleId: couple.id, count: logs.length },
        'Intimacy logs fetched'
      );
      reply.send({ logs });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch intimacy logs');
      throw error;
    }
  });

  app.fastify.post('/api/intimacy/logs', {
    schema: {
      description: 'Log an intimacy session',
      tags: ['intimacy'],
      body: {
        type: 'object',
        required: ['satisfaction_rating'],
        properties: {
          satisfaction_rating: { type: 'integer', minimum: 1, maximum: 5 },
          note: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            logged_by: { type: 'string' },
            satisfaction_rating: { type: 'integer' },
            note: { type: ['string', 'null'] },
            logged_at: { type: 'string', format: 'date-time' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        satisfaction_rating: number;
        note?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { satisfaction_rating, note } = request.body;

    if (satisfaction_rating < 1 || satisfaction_rating > 5) {
      app.logger.warn(
        { userId: session.user.id, rating: satisfaction_rating },
        'Invalid satisfaction rating'
      );
      return reply.status(400).send({ error: 'Satisfaction rating must be between 1 and 5' });
    }

    app.logger.info(
      { userId: session.user.id, rating: satisfaction_rating },
      'Logging intimacy'
    );

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

      const [log] = await app.db
        .insert(schema.intimacy_logs)
        .values({
          couple_id: couple.id,
          logged_by: session.user.id,
          satisfaction_rating,
          note: note || null,
        })
        .returning();

      app.logger.info(
        { logId: log.id, coupleId: couple.id },
        'Intimacy logged successfully'
      );
      reply.status(201).send(log);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to log intimacy');
      throw error;
    }
  });

  app.fastify.get('/api/intimacy/fantasies', {
    schema: {
      description: 'Get all fantasies for the couple',
      tags: ['intimacy'],
      response: {
        200: {
          type: 'object',
          properties: {
            fantasies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  shared_by: { type: 'string' },
                  content: { type: 'string' },
                  is_anonymous: { type: 'boolean' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching fantasies');

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

      const fantasies = await app.db.query.fantasies.findMany({
        where: eq(schema.fantasies.couple_id, couple.id),
        orderBy: (fantasy, { desc }) => desc(fantasy.created_at),
      });

      app.logger.info(
        { coupleId: couple.id, count: fantasies.length },
        'Fantasies fetched'
      );
      reply.send({ fantasies });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch fantasies');
      throw error;
    }
  });

  app.fastify.post('/api/intimacy/fantasies', {
    schema: {
      description: 'Share a fantasy',
      tags: ['intimacy'],
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string' },
          is_anonymous: { type: 'boolean' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            shared_by: { type: 'string' },
            content: { type: 'string' },
            is_anonymous: { type: 'boolean' },
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
        content: string;
        is_anonymous?: boolean;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { content, is_anonymous } = request.body;

    app.logger.info({ userId: session.user.id }, 'Sharing fantasy');

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

      const [fantasy] = await app.db
        .insert(schema.fantasies)
        .values({
          couple_id: couple.id,
          shared_by: session.user.id,
          content,
          is_anonymous: is_anonymous || false,
        })
        .returning();

      app.logger.info(
        { fantasyId: fantasy.id, coupleId: couple.id },
        'Fantasy shared successfully'
      );
      reply.status(201).send(fantasy);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to share fantasy');
      throw error;
    }
  });

  app.fastify.post('/api/intimacy/ai-suggestions', {
    schema: {
      description: 'Get AI-generated intimacy suggestions',
      tags: ['intimacy'],
      body: {
        type: 'object',
        properties: {
          context: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              minItems: 5,
              maxItems: 5,
            },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        context?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { context } = request.body;

    app.logger.info({ userId: session.user.id }, 'Generating AI intimacy suggestions');

    try {
      const prompt = context
        ? `Generate exactly 5 thoughtful, tasteful, and creative intimacy suggestions for a couple. Consider this context: ${context}. Return only a JSON array of 5 strings, nothing else.`
        : 'Generate exactly 5 thoughtful, tasteful, and creative intimacy suggestions for couples to strengthen their connection. Return only a JSON array of 5 strings, nothing else.';

      const { text } = await generateText({
        model: gateway('openai/gpt-4o'),
        prompt,
      });

      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(text);
      } catch {
        const lines = text.split('\n').filter((line) => line.trim());
        suggestions = lines.slice(0, 5);
      }

      if (!Array.isArray(suggestions)) {
        suggestions = [suggestions];
      }

      suggestions = suggestions.slice(0, 5);
      while (suggestions.length < 5) {
        suggestions.push('Spend quality time together without distractions');
      }

      app.logger.info(
        { userId: session.user.id, count: suggestions.length },
        'Suggestions generated successfully'
      );
      reply.send({ suggestions });
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to generate suggestions'
      );
      throw error;
    }
  });
}
