import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import { user } from '../db/schema/auth-schema.js';
import pkg from 'twilio';
const { Twilio } = pkg;

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

export function registerTwoFARoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.post('/api/2fa/send', {
    schema: {
      description: 'Send a verification code via SMS',
      tags: ['2fa'],
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', description: 'Phone number in E.164 format' },
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
        500: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { phone: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { phone } = request.body;

    if (!phone || typeof phone !== 'string') {
      app.logger.warn({ userId: session.user.id, phone }, 'Invalid phone provided');
      return reply.status(400).send({ error: 'Invalid phone number' });
    }

    app.logger.info({ userId: session.user.id, phone }, 'Sending verification code');

    try {
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await app.db.insert(schema.sms_codes).values({
        user_id: session.user.id,
        phone,
        code,
        expires_at: expiresAt,
        verified: false,
      });

      // Attempt to send SMS via Twilio if credentials are configured
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: `Your Together 💕 verification code is: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
          });
        } catch (twilioError) {
          app.logger.warn(
            { err: twilioError, userId: session.user.id, phone },
            'Failed to send SMS via Twilio, but code was created for verification'
          );
          // Don't fail the request - the code is still valid for verification
        }
      } else {
        app.logger.warn(
          { userId: session.user.id, phone },
          'Twilio credentials not configured, SMS not sent but code created for verification'
        );
      }

      app.logger.info(
        { userId: session.user.id, phone },
        'Verification code created successfully'
      );

      reply.send({ success: true });
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, phone },
        'Failed to create verification code'
      );
      return reply.status(500).send({ error: 'Failed to create verification code' });
    }
  });

  app.fastify.post('/api/2fa/verify', {
    schema: {
      description: 'Verify a phone number with a code',
      tags: ['2fa'],
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string' },
          code: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            verified: { type: 'boolean' },
          },
        },
        400: { type: 'object', properties: { success: { type: 'boolean' }, error: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { phone: string; code: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { phone, code } = request.body;

    app.logger.info(
      { userId: session.user.id, phone },
      'Verifying phone number'
    );

    try {
      const now = new Date();
      const smsCode = await app.db.query.sms_codes.findFirst({
        where: and(
          eq(schema.sms_codes.user_id, session.user.id),
          eq(schema.sms_codes.phone, phone),
          eq(schema.sms_codes.code, code),
          eq(schema.sms_codes.verified, false),
          gt(schema.sms_codes.expires_at, now)
        ),
        orderBy: (smsCode, { desc }) => desc(smsCode.created_at),
      });

      if (!smsCode) {
        app.logger.warn(
          { userId: session.user.id, phone, code },
          'Invalid or expired verification code'
        );
        return reply.status(400).send({
          success: false,
          error: 'Invalid or expired code',
        });
      }

      await app.db
        .update(schema.sms_codes)
        .set({ verified: true })
        .where(eq(schema.sms_codes.id, smsCode.id));

      await app.db
        .update(user)
        .set({ phone, phone_verified: true })
        .where(eq(user.id, session.user.id));

      app.logger.info(
        { userId: session.user.id, phone },
        'Phone number verified successfully'
      );

      reply.send({ success: true, verified: true });
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, phone },
        'Failed to verify code'
      );
      throw error;
    }
  });

  app.fastify.get('/api/2fa/status', {
    schema: {
      description: 'Get 2FA status for current user',
      tags: ['2fa'],
      response: {
        200: {
          type: 'object',
          properties: {
            phone: { type: ['string', 'null'] },
            phone_verified: { type: 'boolean' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching 2FA status');

    try {
      const userRecord = await app.db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });

      if (!userRecord) {
        app.logger.warn({ userId: session.user.id }, 'User not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      app.logger.info(
        { userId: session.user.id, phoneVerified: userRecord.phone_verified },
        '2FA status fetched'
      );

      reply.send({
        phone: userRecord.phone || null,
        phone_verified: userRecord.phone_verified,
      });
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to fetch 2FA status'
      );
      throw error;
    }
  });
}
