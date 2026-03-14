import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, or } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerVentsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/vents', {
    schema: {
      description: 'Get all vents for the couple',
      tags: ['vents'],
      response: {
        200: {
          type: 'object',
          properties: {
            vents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  author_id: { type: 'string' },
                  content: { type: 'string' },
                  is_private: { type: 'boolean' },
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

    app.logger.info({ userId: session.user.id }, 'Fetching vents');

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

      const allVents = await app.db.query.vents.findMany({
        where: eq(schema.vents.couple_id, couple.id),
        orderBy: (vent, { desc }) => desc(vent.created_at),
      });

      const filteredVents = allVents.filter((vent) => {
        if (vent.is_private && vent.author_id !== session.user.id) {
          return false;
        }
        return true;
      });

      app.logger.info(
        { coupleId: couple.id, count: filteredVents.length },
        'Vents fetched'
      );
      reply.send({ vents: filteredVents });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch vents');
      throw error;
    }
  });

  app.fastify.post('/api/vents', {
    schema: {
      description: 'Create a new vent',
      tags: ['vents'],
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string' },
          is_private: { type: 'boolean' },
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
            is_private: { type: 'boolean' },
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
        is_private?: boolean;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { content, is_private } = request.body;

    app.logger.info({ userId: session.user.id }, 'Creating vent');

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

      const [vent] = await app.db
        .insert(schema.vents)
        .values({
          couple_id: couple.id,
          author_id: session.user.id,
          content,
          is_private: is_private || false,
        })
        .returning();

      app.logger.info({ ventId: vent.id, coupleId: couple.id }, 'Vent created');
      reply.status(201).send(vent);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to create vent');
      throw error;
    }
  });

  app.fastify.delete('/api/vents/:id', {
    schema: {
      description: 'Delete a vent',
      tags: ['vents'],
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

    app.logger.info({ userId: session.user.id, ventId: id }, 'Deleting vent');

    try {
      const vent = await app.db.query.vents.findFirst({
        where: eq(schema.vents.id, id),
      });

      if (!vent) {
        app.logger.warn({ ventId: id }, 'Vent not found');
        return reply.status(404).send({ error: 'Vent not found' });
      }

      if (vent.author_id !== session.user.id) {
        app.logger.warn({ ventId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.vents).where(eq(schema.vents.id, id));

      app.logger.info({ ventId: id }, 'Vent deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, ventId: id, userId: session.user.id },
        'Failed to delete vent'
      );
      throw error;
    }
  });
}
