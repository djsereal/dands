import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function registerCoupleRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.post('/api/couples/create', {
    schema: {
      description: 'Create a new couple',
      tags: ['couples'],
      body: {
        type: 'object',
        required: ['anniversary_date'],
        properties: {
          anniversary_date: { type: 'string', description: 'ISO 8601 anniversary date' },
          theme_color: { type: 'string', description: 'Hex color code' },
          theme_font: { type: 'string', description: 'Font name' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            partner1_id: { type: 'string' },
            partner2_id: { type: ['string', 'null'] },
            invite_code: { type: 'string' },
            anniversary_date: { type: 'string' },
            theme_color: { type: 'string' },
            theme_font: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        anniversary_date: string;
        theme_color?: string;
        theme_font?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { anniversary_date, theme_color, theme_font } = request.body;
    const inviteCode = generateInviteCode();

    app.logger.info(
      { userId: session.user.id, anniversary_date },
      'Creating couple'
    );

    try {
      const [couple] = await app.db
        .insert(schema.couples)
        .values({
          partner1_id: session.user.id,
          invite_code: inviteCode,
          anniversary_date,
          theme_color: theme_color || '#FF6B9D',
          theme_font: theme_font || 'Nunito',
        })
        .returning();

      app.logger.info({ coupleId: couple.id }, 'Couple created successfully');
      reply.status(201).send(couple);
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to create couple'
      );
      throw error;
    }
  });

  app.fastify.post('/api/couples/join', {
    schema: {
      description: 'Join a couple using invite code',
      tags: ['couples'],
      body: {
        type: 'object',
        required: ['invite_code'],
        properties: {
          invite_code: { type: 'string', description: '6-character invite code' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            partner1_id: { type: 'string' },
            partner2_id: { type: ['string', 'null'] },
            invite_code: { type: 'string' },
            anniversary_date: { type: 'string' },
            theme_color: { type: 'string' },
            theme_font: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { invite_code: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { invite_code } = request.body;

    app.logger.info(
      { userId: session.user.id, inviteCode: invite_code },
      'Attempting to join couple'
    );

    try {
      const couple = await app.db.query.couples.findFirst({
        where: eq(schema.couples.invite_code, invite_code),
      });

      if (!couple) {
        app.logger.warn({ inviteCode: invite_code }, 'Couple not found');
        return reply.status(404).send({ error: 'Couple not found' });
      }

      if (couple.partner2_id) {
        app.logger.warn({ coupleId: couple.id }, 'Couple is already full');
        return reply.status(400).send({ error: 'Couple is already full' });
      }

      if (couple.partner1_id === session.user.id) {
        app.logger.warn({ userId: session.user.id }, 'Cannot join own couple');
        return reply.status(400).send({ error: 'Cannot join your own couple' });
      }

      const [updated] = await app.db
        .update(schema.couples)
        .set({ partner2_id: session.user.id })
        .where(eq(schema.couples.id, couple.id))
        .returning();

      app.logger.info(
        { coupleId: couple.id, partner2Id: session.user.id },
        'Partner joined couple successfully'
      );

      reply.send(updated);
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, inviteCode: invite_code },
        'Failed to join couple'
      );
      throw error;
    }
  });

  app.fastify.get('/api/couples/me', {
    schema: {
      description: 'Get current user\'s couple',
      tags: ['couples'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            partner1_id: { type: 'string' },
            partner2_id: { type: ['string', 'null'] },
            invite_code: { type: 'string' },
            anniversary_date: { type: 'string' },
            theme_color: { type: 'string' },
            theme_font: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching couple');

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

      app.logger.info({ coupleId: couple.id }, 'Couple fetched successfully');
      reply.send(couple);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch couple');
      throw error;
    }
  });

  app.fastify.patch('/api/couples/me', {
    schema: {
      description: 'Update current couple settings',
      tags: ['couples'],
      body: {
        type: 'object',
        properties: {
          anniversary_date: { type: 'string', description: 'ISO 8601 anniversary date' },
          theme_color: { type: 'string', description: 'Hex color code' },
          theme_font: { type: 'string', description: 'Font name' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            partner1_id: { type: 'string' },
            partner2_id: { type: ['string', 'null'] },
            invite_code: { type: 'string' },
            anniversary_date: { type: 'string' },
            theme_color: { type: 'string' },
            theme_font: { type: 'string' },
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
        anniversary_date?: string;
        theme_color?: string;
        theme_font?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Updating couple settings');

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

      const updates: Partial<typeof schema.couples.$inferInsert> = {};
      if (request.body.anniversary_date !== undefined) {
        updates.anniversary_date = request.body.anniversary_date;
      }
      if (request.body.theme_color !== undefined) {
        updates.theme_color = request.body.theme_color;
      }
      if (request.body.theme_font !== undefined) {
        updates.theme_font = request.body.theme_font;
      }

      const [updated] = await app.db
        .update(schema.couples)
        .set(updates)
        .where(eq(schema.couples.id, couple.id))
        .returning();

      app.logger.info(
        { coupleId: couple.id, updates },
        'Couple settings updated successfully'
      );

      reply.send(updated);
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to update couple settings'
      );
      throw error;
    }
  });
}
