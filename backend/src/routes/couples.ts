import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import { resend } from '@specific-dev/framework';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateInviteEmail(senderName: string, inviteCode: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to Together</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #e11d48 0%, #f472b6 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 24px 0;
        }
        .message {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }
        .sender-highlight {
          font-weight: 600;
          color: #e11d48;
        }
        .description {
          font-size: 14px;
          color: #6b7280;
          background-color: #fff1f2;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
          border-left: 4px solid #fda4af;
        }
        .invite-code-container {
          text-align: center;
          margin: 32px 0;
        }
        .invite-code {
          background-color: #fff1f2;
          border: 2px solid #fda4af;
          border-radius: 12px;
          padding: 24px;
          font-size: 40px;
          font-weight: 700;
          color: #e11d48;
          letter-spacing: 6px;
          font-family: 'Courier New', monospace;
          margin: 16px 0;
        }
        .code-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .instructions {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
          margin: 24px 0 0 0;
        }
        .instructions strong {
          color: #1f2937;
        }
        .footer {
          background-color: #faf5f5;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #f3e8e8;
        }
        .footer-text {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
        .footer-heart {
          color: #e11d48;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Together 💕</h1>
        </div>
        <div class="content">
          <h2 class="greeting">You've been invited!</h2>
          <p class="message">
            <span class="sender-highlight">${senderName}</span> has invited you to join them on Together — a private app for couples to connect, share memories, and grow together.
          </p>
          <div class="description">
            Together is a private app for couples to connect, share memories, and grow together.
          </div>
          <div class="invite-code-container">
            <div class="code-label">Your Invite Code</div>
            <div class="invite-code">${inviteCode}</div>
            <p class="instructions">
              <strong>Download the Together app</strong> and enter this invite code to connect with ${senderName}.
            </p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">Made with <span class="footer-heart">💕</span> by Together</p>
        </div>
      </div>
    </body>
    </html>
  `;
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

  app.fastify.post('/api/couples/invite', {
    schema: {
      description: 'Send an invite email to join the couple',
      tags: ['couples'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        500: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { email } = request.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      app.logger.warn({ userId: session.user.id, email }, 'Invalid email provided');
      return reply.status(400).send({ error: 'Invalid email address' });
    }

    app.logger.info(
      { userId: session.user.id, recipientEmail: email },
      'Sending invite email'
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
        app.logger.warn({ userId: session.user.id }, 'No couple found');
        return reply.status(404).send({ error: 'No couple found' });
      }

      const inviteCode = couple.invite_code;
      const htmlContent = generateInviteEmail(session.user.name, inviteCode);

      const { error } = await resend.emails.send({
        from: 'Together 💕 <onboarding@resend.dev>',
        to: email,
        subject: `${session.user.name} invited you to Together 💕`,
        html: htmlContent,
      });

      if (error) {
        app.logger.error(
          { err: error, userId: session.user.id, recipientEmail: email },
          'Failed to send invite email'
        );
        return reply.status(500).send({ error: 'Failed to send email' });
      }

      app.logger.info(
        { userId: session.user.id, recipientEmail: email, coupleId: couple.id },
        'Invite email sent successfully'
      );

      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, recipientEmail: email },
        'Error sending invite email'
      );
      throw error;
    }
  });
}
