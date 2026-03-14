import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerMemoriesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/memories', {
    schema: {
      description: 'Get all memories for the couple',
      tags: ['memories'],
      response: {
        200: {
          type: 'object',
          properties: {
            memories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  uploaded_by: { type: 'string' },
                  image_url: { type: 'string' },
                  prompt: { type: 'string' },
                  caption: { type: ['string', 'null'] },
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

    app.logger.info({ userId: session.user.id }, 'Fetching memories');

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

      const memories = await app.db.query.memories.findMany({
        where: eq(schema.memories.couple_id, couple.id),
        orderBy: (memory, { desc }) => desc(memory.created_at),
      });

      app.logger.info({ coupleId: couple.id, count: memories.length }, 'Memories fetched');
      reply.send({ memories });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch memories');
      throw error;
    }
  });

  app.fastify.post('/api/memories', {
    schema: {
      description: 'Create a new memory',
      tags: ['memories'],
      body: {
        type: 'object',
        required: ['image_url', 'prompt'],
        properties: {
          image_url: { type: 'string' },
          prompt: { type: 'string' },
          caption: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            uploaded_by: { type: 'string' },
            image_url: { type: 'string' },
            prompt: { type: 'string' },
            caption: { type: ['string', 'null'] },
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
        image_url: string;
        prompt: string;
        caption?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { image_url, prompt, caption } = request.body;

    app.logger.info({ userId: session.user.id }, 'Creating memory');

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

      const [memory] = await app.db
        .insert(schema.memories)
        .values({
          couple_id: couple.id,
          uploaded_by: session.user.id,
          image_url,
          prompt,
          caption: caption || null,
        })
        .returning();

      app.logger.info({ memoryId: memory.id, coupleId: couple.id }, 'Memory created');
      reply.status(201).send(memory);
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to create memory'
      );
      throw error;
    }
  });

  app.fastify.delete('/api/memories/:id', {
    schema: {
      description: 'Delete a memory',
      tags: ['memories'],
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

    app.logger.info({ userId: session.user.id, memoryId: id }, 'Deleting memory');

    try {
      const memory = await app.db.query.memories.findFirst({
        where: eq(schema.memories.id, id),
      });

      if (!memory) {
        app.logger.warn({ memoryId: id }, 'Memory not found');
        return reply.status(404).send({ error: 'Memory not found' });
      }

      if (memory.uploaded_by !== session.user.id) {
        app.logger.warn({ memoryId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.memories).where(eq(schema.memories.id, id));

      app.logger.info({ memoryId: id }, 'Memory deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, memoryId: id, userId: session.user.id },
        'Failed to delete memory'
      );
      throw error;
    }
  });
}
