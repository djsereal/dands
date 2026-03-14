import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerJournalRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/journal', {
    schema: {
      description: 'Get all journal entries for the couple',
      tags: ['journal'],
      response: {
        200: {
          type: 'object',
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  author_id: { type: 'string' },
                  content: { type: 'string' },
                  entry_type: { type: 'string' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching journal entries');

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

      const entries = await app.db.query.journal_entries.findMany({
        where: eq(schema.journal_entries.couple_id, couple.id),
        orderBy: (entry, { desc }) => desc(entry.created_at),
      });

      app.logger.info(
        { coupleId: couple.id, count: entries.length },
        'Journal entries fetched'
      );
      reply.send({ entries });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch journal entries');
      throw error;
    }
  });

  app.fastify.post('/api/journal', {
    schema: {
      description: 'Create a new journal entry',
      tags: ['journal'],
      body: {
        type: 'object',
        required: ['content', 'entry_type'],
        properties: {
          content: { type: 'string' },
          entry_type: {
            type: 'string',
            enum: ['reflection', 'gratitude', 'hard_time', 'good_time'],
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            author_id: { type: 'string' },
            content: { type: 'string' },
            entry_type: { type: 'string' },
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
        entry_type: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { content, entry_type } = request.body;

    app.logger.info({ userId: session.user.id, entryType: entry_type }, 'Creating journal entry');

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

      const [entry] = await app.db
        .insert(schema.journal_entries)
        .values({
          couple_id: couple.id,
          author_id: session.user.id,
          content,
          entry_type: entry_type as 'reflection' | 'gratitude' | 'hard_time' | 'good_time',
        })
        .returning();

      app.logger.info({ entryId: entry.id, coupleId: couple.id }, 'Journal entry created');
      reply.status(201).send(entry);
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to create journal entry'
      );
      throw error;
    }
  });

  app.fastify.delete('/api/journal/:id', {
    schema: {
      description: 'Delete a journal entry',
      tags: ['journal'],
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

    app.logger.info({ userId: session.user.id, entryId: id }, 'Deleting journal entry');

    try {
      const entry = await app.db.query.journal_entries.findFirst({
        where: eq(schema.journal_entries.id, id),
      });

      if (!entry) {
        app.logger.warn({ entryId: id }, 'Journal entry not found');
        return reply.status(404).send({ error: 'Journal entry not found' });
      }

      if (entry.author_id !== session.user.id) {
        app.logger.warn({ entryId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.journal_entries).where(eq(schema.journal_entries.id, id));

      app.logger.info({ entryId: id }, 'Journal entry deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, entryId: id, userId: session.user.id },
        'Failed to delete journal entry'
      );
      throw error;
    }
  });
}
