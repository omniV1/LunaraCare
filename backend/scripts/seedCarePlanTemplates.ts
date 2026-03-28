/**
 * Seed postpartum-focused care plan templates.
 * Run: npx ts-node scripts/seedCarePlanTemplates.ts
 * Or: MONGODB_URI=... npx ts-node scripts/seedCarePlanTemplates.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CarePlanTemplate from '../src/models/CarePlanTemplate';
import User from '../src/models/User';

dotenv.config();

const POSTPARTUM_TEMPLATES = [
  {
    name: 'Fourth Trimester Postpartum Care',
    description: '12-week plan covering physical recovery, feeding, sleep, and emotional wellness for the fourth trimester.',
    targetCondition: 'postpartum',
    sections: [
      {
        title: 'Physical Recovery',
        description: 'Track healing and return to activity safely.',
        milestones: [
          { title: 'Rest and prioritize healing', description: 'Limit stairs, heavy lifting; accept help with household tasks.', weekOffset: 0, category: 'physical' as const },
          { title: 'Pelvic floor awareness', description: 'Start gentle pelvic floor checks when cleared; note any pain or leakage.', weekOffset: 2, category: 'physical' as const },
          { title: '6-week checkup scheduled or completed', description: 'Ob/gyn or midwife visit to clear for exercise and discuss contraception.', weekOffset: 6, category: 'physical' as const },
          { title: 'Gradual return to exercise', description: 'Begin low-impact activity (walking, stretching) as cleared by provider.', weekOffset: 8, category: 'physical' as const },
          { title: 'Core and strength check-in', description: 'Assess how body feels with light core work; adjust as needed.', weekOffset: 10, category: 'physical' as const },
        ],
      },
      {
        title: 'Feeding & Nutrition',
        description: 'Support feeding goals and your own nutrition.',
        milestones: [
          { title: 'Feeding plan in place', description: 'Breastfeeding, formula, or combination; know who to call for support (LC, provider).', weekOffset: 0, category: 'feeding' as const },
          { title: 'Address feeding challenges', description: 'Log any latch, supply, or bottle-feeding issues; share with provider if needed.', weekOffset: 2, category: 'feeding' as const },
          { title: 'Hydration and meals', description: 'Set up support for drinking enough and regular meals (partner, family, delivery).', weekOffset: 1, category: 'feeding' as const },
          { title: 'Feeding milestone check-in', description: 'Review how feeding is going; adjust goals or get extra support.', weekOffset: 6, category: 'feeding' as const },
        ],
      },
      {
        title: 'Sleep & Rest',
        description: 'Maximize rest and safe sleep for baby.',
        milestones: [
          { title: 'Sleep strategy with partner', description: 'Split nights or shifts so both can get blocks of sleep when possible.', weekOffset: 0, category: 'self_care' as const },
          { title: 'Safe sleep environment', description: 'Confirm baby sleep space meets safe sleep guidelines.', weekOffset: 0, category: 'general' as const },
          { title: 'Rest when baby sleeps (when possible)', description: 'Prioritize napping or resting instead of chores in early weeks.', weekOffset: 1, category: 'self_care' as const },
          { title: 'Sleep check-in', description: 'Note how sleep is affecting mood and functioning; discuss with provider if needed.', weekOffset: 4, category: 'self_care' as const },
        ],
      },
      {
        title: 'Emotional Wellness & Mood',
        description: 'Monitor mood and get support early.',
        milestones: [
          { title: 'Mood baseline', description: 'Notice your emotional state; know signs of baby blues vs. something more.', weekOffset: 1, category: 'emotional' as const },
          { title: 'PPD/PPA screening or conversation', description: 'Discuss mood, anxiety, or intrusive thoughts with provider or doula.', weekOffset: 2, category: 'emotional' as const },
          { title: 'Support system check', description: 'Identify 1–2 people you can be honest with about how you\'re feeling.', weekOffset: 2, category: 'emotional' as const },
          { title: 'Mid-trimester mood check', description: 'Reassess mood and coping; reach out for help if things feel harder.', weekOffset: 6, category: 'emotional' as const },
          { title: 'Fourth trimester closure', description: 'Reflect on the 12-week journey; plan ongoing support if needed.', weekOffset: 12, category: 'emotional' as const },
        ],
      },
    ],
  },
  {
    name: 'Postpartum Recovery & Feeding Focus',
    description: 'Shorter plan emphasizing recovery and feeding in the first 6–8 weeks.',
    targetCondition: 'postpartum',
    sections: [
      {
        title: 'First 2 Weeks',
        description: 'Immediate postpartum priorities.',
        milestones: [
          { title: 'Bleeding and healing', description: 'Monitor bleeding; report heavy flow, fever, or worsening pain.', weekOffset: 0, category: 'physical' as const },
          { title: 'Establish feeding', description: 'Get lactation or feeding support if needed; track output for baby.', weekOffset: 0, category: 'feeding' as const },
          { title: 'Rest and accept help', description: 'Say yes to meals and help; protect sleep when possible.', weekOffset: 0, category: 'self_care' as const },
        ],
      },
      {
        title: 'Weeks 3–6',
        description: 'Building routine and addressing challenges.',
        milestones: [
          { title: 'Feeding rhythm', description: 'Note feeding pattern; address supply, latch, or formula questions.', weekOffset: 3, category: 'feeding' as const },
          { title: 'Mood check', description: 'Share how you\'re feeling with provider or doula; don\'t wait if you\'re struggling.', weekOffset: 4, category: 'emotional' as const },
          { title: '6-week visit prep', description: 'List questions for your 6-week checkup (healing, exercise, contraception).', weekOffset: 5, category: 'physical' as const },
        ],
      },
    ],
  },
  {
    name: 'Postpartum Mental Health & Wellness',
    description: 'Mood, anxiety, and self-care through the fourth trimester.',
    targetCondition: 'postpartum',
    sections: [
      {
        title: 'Emotional Check-Ins',
        description: 'Regular touchpoints for mood and anxiety.',
        milestones: [
          { title: 'Week 1–2: How are you really?', description: 'Beyond "fine" — name one hard thing and one support you have.', weekOffset: 1, category: 'emotional' as const },
          { title: 'Week 3–4: Sleep and mood', description: 'Note how sleep deprivation is affecting you; plan one small relief.', weekOffset: 3, category: 'emotional' as const },
          { title: 'Week 6: PPD/PPA screening', description: 'Complete a screening with your provider; discuss results openly.', weekOffset: 6, category: 'emotional' as const },
          { title: 'Week 8–12: Ongoing support', description: 'If in treatment or on medication, check in on what\'s working.', weekOffset: 10, category: 'emotional' as const },
        ],
      },
      {
        title: 'Self-Care & Boundaries',
        description: 'Small, sustainable ways to care for yourself.',
        milestones: [
          { title: 'One non-negotiable rest block', description: 'Identify one time of day you can rest or be off duty (even 15 minutes).', weekOffset: 0, category: 'self_care' as const },
          { title: 'Visitor plan', description: 'Set boundaries on who visits and when; protect your recovery.', weekOffset: 0, category: 'self_care' as const },
          { title: 'Ask for one concrete help', description: 'Name one thing someone can do for you this week (meals, errands, baby hold).', weekOffset: 2, category: 'self_care' as const },
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/lunara';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  const createdByUser = await User.findOne({ role: 'admin' }).select('_id');
  const createdBy = createdByUser?._id ?? (await User.findOne().select('_id'))?._id;
  if (!createdBy) {
    console.error('No user found in DB. Create an admin or user first (e.g. npm run create:admin).');
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const t of POSTPARTUM_TEMPLATES) {
    const existing = await CarePlanTemplate.findOne({ name: t.name });
    if (existing) {
      console.log(`Template "${t.name}" already exists, skipping.`);
      continue;
    }
    await CarePlanTemplate.create({
      name: t.name,
      description: t.description,
      targetCondition: t.targetCondition,
      isActive: true,
      createdBy,
      sections: t.sections.map(s => ({
        title: s.title,
        description: s.description,
        milestones: s.milestones.map(m => ({
          title: m.title,
          description: m.description,
          weekOffset: m.weekOffset,
          category: m.category,
        })),
      })),
    });
    console.log(`Created template: ${t.name}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err);
  void mongoose.disconnect();
  process.exit(1);
});
