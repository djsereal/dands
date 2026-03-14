import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

export function registerTodosRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/todos', {
    schema: {
      description: 'Get all todos for the couple',
      tags: ['todos'],
      response: {
        200: {
          type: 'object',
          properties: {
            todos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  couple_id: { type: 'string' },
                  created_by: { type: 'string' },
                  assigned_to: { type: ['string', 'null'] },
                  title: { type: 'string' },
                  is_completed: { type: 'boolean' },
                  due_date: { type: ['string', 'null'] },
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

    app.logger.info({ userId: session.user.id }, 'Fetching todos');

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

      const todos = await app.db.query.todos.findMany({
        where: eq(schema.todos.couple_id, couple.id),
        orderBy: (todo, { desc }) => desc(todo.created_at),
      });

      app.logger.info({ coupleId: couple.id, count: todos.length }, 'Todos fetched');
      reply.send({ todos });
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch todos');
      throw error;
    }
  });

  app.fastify.post('/api/todos', {
    schema: {
      description: 'Create a new todo',
      tags: ['todos'],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          assigned_to: { type: 'string' },
          due_date: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            created_by: { type: 'string' },
            assigned_to: { type: ['string', 'null'] },
            title: { type: 'string' },
            is_completed: { type: 'boolean' },
            due_date: { type: ['string', 'null'] },
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
        assigned_to?: string;
        due_date?: string;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, assigned_to, due_date } = request.body;

    app.logger.info({ userId: session.user.id, title }, 'Creating todo');

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

      const [todo] = await app.db
        .insert(schema.todos)
        .values({
          couple_id: couple.id,
          created_by: session.user.id,
          title,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
        })
        .returning();

      app.logger.info({ todoId: todo.id, coupleId: couple.id }, 'Todo created');
      reply.status(201).send(todo);
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to create todo');
      throw error;
    }
  });

  app.fastify.patch('/api/todos/:id', {
    schema: {
      description: 'Update a todo',
      tags: ['todos'],
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
          is_completed: { type: 'boolean' },
          assigned_to: { type: ['string', 'null'] },
          due_date: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            couple_id: { type: 'string' },
            created_by: { type: 'string' },
            assigned_to: { type: ['string', 'null'] },
            title: { type: 'string' },
            is_completed: { type: 'boolean' },
            due_date: { type: ['string', 'null'] },
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
        is_completed?: boolean;
        assigned_to?: string | null;
        due_date?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;

    app.logger.info({ userId: session.user.id, todoId: id }, 'Updating todo');

    try {
      const todo = await app.db.query.todos.findFirst({
        where: eq(schema.todos.id, id),
      });

      if (!todo) {
        app.logger.warn({ todoId: id }, 'Todo not found');
        return reply.status(404).send({ error: 'Todo not found' });
      }

      const couple = await app.db.query.couples.findFirst({
        where: eq(schema.couples.id, todo.couple_id),
      });

      if (!couple || (couple.partner1_id !== session.user.id && couple.partner2_id !== session.user.id)) {
        app.logger.warn({ todoId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      const updates: Partial<typeof schema.todos.$inferInsert> = {};
      if (request.body.title !== undefined) updates.title = request.body.title;
      if (request.body.is_completed !== undefined) updates.is_completed = request.body.is_completed;
      if (request.body.assigned_to !== undefined) updates.assigned_to = request.body.assigned_to;
      if (request.body.due_date !== undefined) updates.due_date = request.body.due_date;

      const [updated] = await app.db
        .update(schema.todos)
        .set(updates)
        .where(eq(schema.todos.id, id))
        .returning();

      app.logger.info({ todoId: id, updates }, 'Todo updated');
      reply.send(updated);
    } catch (error) {
      app.logger.error({ err: error, todoId: id, userId: session.user.id }, 'Failed to update todo');
      throw error;
    }
  });

  app.fastify.delete('/api/todos/:id', {
    schema: {
      description: 'Delete a todo',
      tags: ['todos'],
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

    app.logger.info({ userId: session.user.id, todoId: id }, 'Deleting todo');

    try {
      const todo = await app.db.query.todos.findFirst({
        where: eq(schema.todos.id, id),
      });

      if (!todo) {
        app.logger.warn({ todoId: id }, 'Todo not found');
        return reply.status(404).send({ error: 'Todo not found' });
      }

      const couple = await app.db.query.couples.findFirst({
        where: eq(schema.couples.id, todo.couple_id),
      });

      if (!couple || (couple.partner1_id !== session.user.id && couple.partner2_id !== session.user.id)) {
        app.logger.warn({ todoId: id, userId: session.user.id }, 'Unauthorized');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.todos).where(eq(schema.todos.id, id));

      app.logger.info({ todoId: id }, 'Todo deleted');
      reply.send({ success: true });
    } catch (error) {
      app.logger.error({ err: error, todoId: id, userId: session.user.id }, 'Failed to delete todo');
      throw error;
    }
  });
}
