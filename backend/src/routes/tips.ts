import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

const RELATIONSHIP_TIPS = [
  {
    title: "The 5:1 Ratio Rule",
    content: "Research by Dr. John Gottman shows that stable relationships maintain a ratio of five positive interactions for every negative one. Make a conscious effort to express appreciation, give compliments, and show affection far more often than you criticize or complain. This simple ratio can predict relationship success with remarkable accuracy.",
    source_url: "https://www.gottman.com/blog/the-magic-relationship-ratio-according-science/",
    category: "communication" as const,
  },
  {
    title: "Use 'I' Statements",
    content: "When discussing problems, frame your feelings using 'I' statements rather than 'you' accusations. Instead of 'You never listen to me,' try 'I feel unheard when I'm interrupted.' This approach reduces defensiveness and opens the door to genuine understanding and resolution.",
    source_url: "https://www.psychologytoday.com/us/blog/in-it-together/202001/how-use-i-statements",
    category: "communication" as const,
  },
  {
    title: "Schedule a Weekly Check-In",
    content: "Set aside 30 minutes each week for a structured relationship check-in. Share what went well, what was challenging, and what you're looking forward to. This dedicated time prevents small issues from festering and keeps both partners feeling connected and heard.",
    source_url: "https://www.gottman.com/blog/the-weekly-marriage-meeting/",
    category: "communication" as const,
  },
  {
    title: "The 6-Second Kiss",
    content: "Dr. John Gottman recommends a 6-second kiss as a way to maintain physical connection. A kiss that lasts at least 6 seconds is long enough to be meaningful and break through the routine of daily life. Make it a daily ritual — morning, evening, or both — to keep the spark alive.",
    source_url: "https://www.gottman.com/blog/6-small-things-you-can-do-every-day-to-show-your-partner-you-love-them/",
    category: "intimacy" as const,
  },
  {
    title: "Prioritize Non-Sexual Touch",
    content: "Holding hands, hugging, cuddling, and gentle touch release oxytocin — the bonding hormone. Couples who maintain regular non-sexual physical affection report higher relationship satisfaction and feel more emotionally connected. Make touch a daily habit, not just a prelude to sex.",
    source_url: "https://www.psychologytoday.com/us/blog/the-attraction-doctor/201307/the-importance-touch-in-relationships",
    category: "intimacy" as const,
  },
  {
    title: "Create Rituals of Connection",
    content: "Intimacy thrives on predictability and safety. Create small rituals — a morning coffee together, a goodnight routine, a special phrase only you two share — that signal 'we are a team.' These micro-moments of connection build the emotional safety that makes deeper intimacy possible.",
    source_url: "https://www.gottman.com/blog/rituals-of-connection-in-relationships/",
    category: "intimacy" as const,
  },
  {
    title: "Keep Your Promises, Big and Small",
    content: "Trust is built in the smallest moments. When you say you'll call, call. When you say you'll be home by 7, be home by 7. Consistently following through on minor commitments signals to your partner that you are reliable and that your word means something — the foundation of deep trust.",
    source_url: "https://www.psychologytoday.com/us/blog/trust-the-new-workplace-currency/201910/how-build-trust-in-your-relationship",
    category: "trust" as const,
  },
  {
    title: "Be Transparent About Your Feelings",
    content: "Vulnerability is the birthplace of trust. When you share your fears, insecurities, and struggles with your partner instead of hiding them, you invite them into your inner world. This emotional transparency creates a bond that is far stronger than any surface-level connection.",
    source_url: "https://brenebrown.com/articles/2010/01/01/vulnerability-and-trust/",
    category: "trust" as const,
  },
  {
    title: "Repair After Conflict",
    content: "Every couple fights. What separates strong couples from struggling ones is the ability to repair after conflict. Offer a genuine apology, acknowledge your partner's perspective, and take responsibility for your part. Successful repair attempts — even imperfect ones — rebuild trust faster than avoiding conflict altogether.",
    source_url: "https://www.gottman.com/blog/r-is-for-repair/",
    category: "trust" as const,
  },
  {
    title: "Try Something New Together",
    content: "Novelty is a powerful relationship booster. Couples who regularly try new activities together — a cooking class, a hiking trail, a new board game — experience a surge in dopamine that mimics the excitement of early romance. Aim for one new shared experience per month to keep your relationship feeling fresh.",
    source_url: "https://www.psychologytoday.com/us/blog/the-science-behind-behavior/201609/why-novelty-is-good-your-relationship",
    category: "fun" as const,
  },
  {
    title: "Bring Back Date Night",
    content: "Regular date nights are one of the most evidence-backed ways to maintain relationship satisfaction. They don't need to be expensive — a walk, a picnic, or a movie at home counts. What matters is the intentional, undistracted time together. Couples who date regularly report feeling more in love and more committed.",
    source_url: "https://www.gottman.com/blog/the-importance-of-date-night/",
    category: "fun" as const,
  },
  {
    title: "Play Together Like Kids",
    content: "Playfulness is a serious relationship asset. Couples who laugh together, tease each other affectionately, and engage in lighthearted play have stronger bonds and handle stress better. Don't let adulthood squeeze the fun out of your relationship — be silly, play games, and don't take yourselves too seriously.",
    source_url: "https://www.psychologytoday.com/us/blog/the-play-deficit/201411/the-importance-play-in-relationships",
    category: "fun" as const,
  },
  {
    title: "Support Each Other's Individual Goals",
    content: "The healthiest couples are made up of two whole individuals who support each other's personal growth. Encourage your partner's career ambitions, hobbies, and friendships outside the relationship. When both partners feel supported in becoming their best selves, the relationship itself grows stronger.",
    source_url: "https://www.psychologytoday.com/us/blog/lifetime-connections/201904/how-support-your-partners-personal-growth",
    category: "growth" as const,
  },
  {
    title: "Read and Grow Together",
    content: "Couples who learn together stay together. Consider reading the same relationship book, listening to a podcast about communication, or attending a couples workshop. Shared intellectual growth creates new conversation topics, shared vocabulary, and a sense of being on the same team in life.",
    source_url: "https://www.gottman.com/blog/couples-who-learn-together-stay-together/",
    category: "growth" as const,
  },
  {
    title: "Revisit Your Relationship Vision",
    content: "Every year, sit down together and discuss your shared vision for the future — where you want to live, how you want to spend your time, what kind of couple you want to be. Couples with a shared sense of meaning and purpose report higher satisfaction and are more resilient during hard times.",
    source_url: "https://www.gottman.com/blog/shared-meaning-in-relationships/",
    category: "growth" as const,
  },
];

export function registerTipsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/tips', {
    schema: {
      description: 'Get relationship tips',
      tags: ['tips'],
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tips: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  source_url: { type: ['string', 'null'] },
                  category: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (
    request: FastifyRequest<{ Querystring: { category?: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { category } = request.query;

    app.logger.info({ category }, 'Fetching tips');

    try {
      const allTips = await app.db
        .select()
        .from(schema.relationship_tips)
        .orderBy(asc(schema.relationship_tips.created_at));

      let tips = allTips;
      if (category) {
        tips = allTips.filter((tip) => tip.category === category);
      }

      app.logger.info({ count: tips.length, category }, 'Tips fetched');
      reply.send({ tips });
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch tips');
      throw error;
    }
  });
}

export async function seedRelationshipTips(app: App): Promise<void> {
  app.logger.info('Seeding relationship tips');

  try {
    const existingTips = await app.db.query.relationship_tips.findMany();

    if (existingTips.length > 0) {
      app.logger.info({ count: existingTips.length }, 'Tips already seeded, skipping');
      return;
    }

    await app.db.insert(schema.relationship_tips).values(RELATIONSHIP_TIPS);

    app.logger.info({ count: RELATIONSHIP_TIPS.length }, 'Tips seeded successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed tips');
    throw error;
  }
}
