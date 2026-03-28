import mongoose from 'mongoose';
import logger from '../utils/logger';
import BlogPost from '../models/BlogPost';
import Resource from '../models/Resources';
import Category from '../models/Category';
import User from '../models/User';

interface SeedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  readTime: number;
}

interface SeedResource {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  targetWeeks: number[];
  targetPregnancyWeeks: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const blogPosts: SeedBlogPost[] = [
  {
    title: 'Navigating the Postpartum Period: Understanding What Comes After Pregnancy',
    slug: 'navigating-the-postpartum-period',
    excerpt: 'The weeks and months after pregnancy bring profound physical and emotional changes. Whether your journey has unfolded as expected or taken unexpected turns, understanding what your body and mind are going through is the first step toward healing.',
    category: 'Postpartum',
    tags: ['postpartum', 'recovery', 'physical health', 'emotional wellness', 'healing'],
    readTime: 10,
    content: `<p>The postpartum period — often defined as the first six weeks after pregnancy ends, though many aspects of recovery stretch far beyond that window — is one of the most significant transitions a person can experience. Regardless of how your pregnancy concluded, your body has undergone remarkable changes, and it deserves time, patience, and compassionate care as it heals.</p>

<h2>Your Body After Pregnancy</h2>

<p>After carrying a pregnancy, your body begins a complex process of recovery. The uterus gradually returns to its pre-pregnancy size — a process called involution — which can take six to eight weeks. You may experience lochia (postpartum bleeding), cramping, breast changes, and shifts in your energy levels. These are normal parts of the body's healing process.</p>

<p>Some physical changes you may notice include:</p>

<ul>
<li><strong>Hormonal shifts:</strong> Estrogen and progesterone drop rapidly after pregnancy ends, which can affect mood, energy, sleep, and even hair and skin. These fluctuations are among the most dramatic hormonal changes the human body experiences.</li>
<li><strong>Core and pelvic floor changes:</strong> The muscles that supported your pregnancy need time and often intentional rehabilitation to regain strength. This is true regardless of whether you delivered vaginally or by cesarean.</li>
<li><strong>Fatigue:</strong> Your body has done extraordinary work. Deep fatigue during recovery is expected and valid — not a sign of weakness.</li>
<li><strong>Breast changes:</strong> Whether or not you plan to breastfeed, your breasts may become engorged or tender as your body responds to hormonal shifts.</li>
</ul>

<h2>Emotional Landscapes</h2>

<p>The emotional experience after pregnancy is deeply personal. For some, there is joy alongside exhaustion. For others, there may be grief, anxiety, numbness, or a complicated mixture of feelings that resist simple labels. All of these responses are valid.</p>

<p>It's important to distinguish between common emotional fluctuations and conditions that benefit from professional support:</p>

<ul>
<li><strong>Postpartum mood changes</strong> (sometimes called "baby blues") affect up to 80% of people after pregnancy. Tearfulness, irritability, and mood swings typically peak around day 3–5 and resolve within two weeks.</li>
<li><strong>Postpartum depression (PPD)</strong> involves persistent sadness, loss of interest, changes in sleep or appetite beyond what's expected, and difficulty functioning. PPD affects roughly 1 in 7 people and can develop anytime in the first year.</li>
<li><strong>Postpartum anxiety</strong> may manifest as racing thoughts, constant worry, difficulty relaxing, or physical symptoms like a racing heart or tightness in the chest.</li>
<li><strong>Grief and loss:</strong> If your pregnancy did not end as you hoped — whether through miscarriage, stillbirth, or other circumstances — the postpartum period includes grieving. This grief is legitimate and deserves space and support.</li>
</ul>

<h2>When to Reach Out</h2>

<p>There is no threshold of suffering you need to cross before you "earn" the right to ask for help. If you are struggling — physically, emotionally, or both — reaching out is an act of strength. Contact your healthcare provider if you experience:</p>

<ul>
<li>Heavy bleeding (soaking through more than one pad per hour)</li>
<li>Fever above 100.4°F (38°C)</li>
<li>Persistent sadness or hopelessness lasting more than two weeks</li>
<li>Thoughts of harming yourself</li>
<li>Difficulty caring for yourself or completing basic daily tasks</li>
<li>Signs of infection at an incision or tear site</li>
</ul>

<p>If you are in crisis, the <strong>988 Suicide and Crisis Lifeline</strong> (call or text 988) and the <strong>Postpartum Support International helpline</strong> (1-800-944-4773) are available around the clock.</p>

<h2>Building Your Recovery</h2>

<p>Recovery is not a straight line, and it doesn't follow a universal timeline. Some days will feel better than others, and setbacks don't erase progress. Here are a few principles that can help:</p>

<ul>
<li><strong>Rest is productive.</strong> Sleep and rest are not luxuries — they are critical components of healing.</li>
<li><strong>Nourishment matters.</strong> Your body needs fuel to recover. Prioritize nutrient-dense foods and adequate hydration.</li>
<li><strong>Movement should be gradual.</strong> When you feel ready, gentle movement like short walks can support both physical and emotional recovery. Listen to your body and avoid pushing through pain.</li>
<li><strong>Connection is medicine.</strong> Whether through a partner, family, friends, a support group, or a doula, having people who understand and respect your experience makes a difference.</li>
</ul>

<p>Your postpartum journey is yours. However it looks, you deserve care, compassion, and the support you need to heal.</p>`,
  },
  {
    title: 'Holding Space for Every Outcome: Grief, Healing, and Hope After Pregnancy',
    slug: 'holding-space-for-every-outcome',
    excerpt: 'Not every pregnancy ends the way we imagine. Whether you are navigating loss, a complicated delivery, or an outcome that feels different from what you planned, your feelings are valid and your healing matters.',
    category: 'Mental Health',
    tags: ['grief', 'pregnancy loss', 'healing', 'mental health', 'support', 'hope'],
    readTime: 12,
    content: `<p>When we talk about the postpartum period, the conversation often centers on a single narrative: a healthy parent bringing home a healthy baby. But the reality is far more varied. Pregnancies can end in miscarriage, stillbirth, medical termination, premature birth with NICU stays, or deliveries complicated by trauma. Each of these experiences carries its own form of loss — and each deserves acknowledgment, tenderness, and support.</p>

<h2>The Grief That Isn't Always Named</h2>

<p>If your pregnancy did not result in bringing a baby home, you may find yourself in a painful space where your grief feels invisible. Well-meaning people may not know what to say, or they may say things that inadvertently minimize your pain: "At least it was early." "You can try again." "Everything happens for a reason."</p>

<p>These words, however well-intended, can leave you feeling more alone. The truth is that your loss is real, your grief is proportional to your love and your hopes, and there is no "right" timeline for healing.</p>

<p>Grief after pregnancy loss can include:</p>

<ul>
<li>Deep sadness and longing for what might have been</li>
<li>Anger — at the situation, at your body, at the unfairness of it</li>
<li>Guilt or self-blame, even when you logically know it was not your fault</li>
<li>Numbness or difficulty believing what has happened</li>
<li>Physical aching — grief is not only emotional; it lives in the body</li>
<li>Difficulty being around pregnant people or babies without being overwhelmed</li>
</ul>

<p>All of these responses are normal. There is no wrong way to grieve.</p>

<h2>When Birth Doesn't Go as Planned</h2>

<p>Even when a pregnancy results in a living baby, the experience can carry loss. Birth trauma — whether from emergency interventions, feeling unheard during labor, physical injury, or fear for your own life or your baby's — can leave lasting emotional marks.</p>

<p>You may feel grateful to have your baby while simultaneously processing something painful about how they arrived. These feelings can coexist, and holding both does not make you ungrateful. It makes you human.</p>

<p>Signs that your birth experience may be affecting your wellbeing include:</p>

<ul>
<li>Flashbacks or intrusive memories of the delivery</li>
<li>Avoiding conversations or reminders related to birth</li>
<li>Difficulty sleeping even when you have the opportunity</li>
<li>Feeling disconnected from your body or your baby</li>
<li>Heightened startle response or persistent anxiety</li>
</ul>

<p>These may be signs of postpartum PTSD, and they are treatable. You do not have to simply push through.</p>

<h2>The Postpartum Body After Loss</h2>

<p>One of the cruelest aspects of pregnancy loss is that your body may not immediately "know" the pregnancy has ended. You may still experience postpartum bleeding, breast engorgement, hormonal crashes, and other physical recovery symptoms — all without the outcome you were hoping for. This physical dimension of grief deserves medical attention and compassionate self-care.</p>

<p>Be gentle with yourself about:</p>

<ul>
<li><strong>Physical recovery:</strong> Your body needs the same rest and nourishment after a loss as it would after any pregnancy. Don't push yourself to "bounce back."</li>
<li><strong>Hormonal changes:</strong> The rapid drop in pregnancy hormones can intensify emotional distress. This is biology, not weakness.</li>
<li><strong>Follow-up care:</strong> Keep any scheduled postpartum appointments. Your physical health still matters, and these visits are also an opportunity to discuss your emotional wellbeing.</li>
</ul>

<h2>Finding Support</h2>

<p>You don't have to navigate this alone, but finding the right support matters. Consider:</p>

<ul>
<li><strong>Therapy:</strong> A therapist specializing in perinatal loss or trauma can provide a safe space to process your experience. Look for providers trained in EMDR, grief counseling, or perinatal mental health.</li>
<li><strong>Support groups:</strong> Connecting with others who have had similar experiences can ease the isolation. Organizations like Share Pregnancy &amp; Infant Loss Support and the Compassionate Friends offer both in-person and online groups.</li>
<li><strong>Your partner or close people:</strong> If you have a partner, remember that they may be grieving too, possibly in different ways. Open communication — or couples counseling — can help you support each other.</li>
<li><strong>Remembrance:</strong> Many families find comfort in creating rituals of remembrance — planting a tree, writing a letter, holding a small ceremony, or keeping a memento. There is no wrong way to honor what you've lost.</li>
</ul>

<h2>Hope Is Not a Betrayal of Grief</h2>

<p>At some point — and the timing is yours alone — you may notice moments of lightness returning. A genuine laugh, a plan for the future, a day where the weight feels a little less heavy. This is not a betrayal of your loss. Healing does not mean forgetting. It means learning to carry your experience as part of your story while still allowing yourself to move forward.</p>

<p>If you are considering a future pregnancy, working with your healthcare provider to address both the physical and emotional aspects of that decision is important. There is no rush, and choosing not to try again is equally valid.</p>

<p>Wherever you are in your journey, please know: you are not alone, your experience matters, and you deserve every ounce of support and compassion that exists.</p>

<p><em>Crisis resources: 988 Suicide and Crisis Lifeline (call or text 988) | Postpartum Support International (1-800-944-4773) | Share Pregnancy &amp; Infant Loss Support (nationalshare.org)</em></p>`,
  },
];

const resources: SeedResource[] = [
  {
    title: 'Understanding Postpartum Mood Disorders',
    description: 'A comprehensive overview of postpartum depression, anxiety, OCD, psychosis, and PTSD — what they look like, who is at risk, and how to get help.',
    category: 'Mental Health',
    tags: ['postpartum depression', 'anxiety', 'mood disorders', 'mental health', 'ppd', 'screening'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Overview</h2>
<p>Postpartum mood disorders encompass a spectrum of conditions that can develop after pregnancy. While "baby blues" affect up to 80% of people postpartum and typically resolve within two weeks, more persistent conditions require attention and treatment.</p>

<h2>Types of Postpartum Mood Disorders</h2>

<h3>Postpartum Depression (PPD)</h3>
<p>Affects approximately 1 in 7 people after pregnancy. Symptoms include persistent sadness, loss of interest, changes in appetite or sleep, difficulty concentrating, feelings of worthlessness, and withdrawal from loved ones. PPD can develop anytime during the first year postpartum.</p>

<h3>Postpartum Anxiety (PPA)</h3>
<p>Characterized by excessive worry, racing thoughts, restlessness, physical symptoms like rapid heartbeat, and difficulty sleeping even when tired. PPA can occur alongside or independent of depression.</p>

<h3>Postpartum OCD</h3>
<p>Involves intrusive, unwanted thoughts (often about harm coming to yourself or others) and compulsive behaviors aimed at reducing the distress caused by those thoughts. Having intrusive thoughts does not mean you will act on them.</p>

<h3>Postpartum PTSD</h3>
<p>Can develop after a traumatic birth experience, pregnancy loss, or NICU stay. Symptoms include flashbacks, nightmares, hypervigilance, and emotional numbing.</p>

<h3>Postpartum Psychosis</h3>
<p>A rare but serious emergency (affecting roughly 1–2 per 1,000 births) involving hallucinations, delusions, confusion, and rapid mood shifts. This requires immediate medical attention.</p>

<h2>Risk Factors</h2>
<ul>
<li>Personal or family history of depression, anxiety, or bipolar disorder</li>
<li>Previous postpartum mood disorder</li>
<li>History of pregnancy loss or traumatic birth</li>
<li>Lack of social support</li>
<li>Major life stressors (financial, relational, housing)</li>
<li>Sleep deprivation</li>
<li>History of trauma</li>
</ul>

<h2>Screening</h2>
<p>The Edinburgh Postnatal Depression Scale (EPDS) is a widely used screening tool. A score of 10 or higher suggests possible depression and warrants follow-up with a healthcare provider. Screening should occur at multiple points during the first year.</p>

<h2>Treatment Options</h2>
<ul>
<li><strong>Psychotherapy:</strong> Cognitive-behavioral therapy (CBT) and interpersonal therapy (IPT) have strong evidence for postpartum mood disorders.</li>
<li><strong>Medication:</strong> SSRIs and other antidepressants are effective and many are compatible with breastfeeding. Your provider can help weigh risks and benefits.</li>
<li><strong>Support groups:</strong> Peer support reduces isolation and normalizes the experience.</li>
<li><strong>Lifestyle support:</strong> Sleep, nutrition, gentle movement, and social connection all play supporting roles in recovery.</li>
</ul>

<h2>When to Seek Help Immediately</h2>
<p>Call 988 (Suicide and Crisis Lifeline), go to your nearest emergency room, or call 911 if you experience thoughts of harming yourself or others, symptoms of psychosis (hallucinations, delusions), or feel unable to keep yourself safe.</p>`,
  },
  {
    title: 'Postpartum Body Recovery: A Week-by-Week Guide',
    description: 'What to expect from your body in the weeks following pregnancy, including healing timelines, warning signs, and when to contact your provider.',
    category: 'Physical Recovery',
    tags: ['physical recovery', 'healing', 'postpartum body', 'c-section', 'vaginal delivery'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8],
    targetPregnancyWeeks: [37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Understanding Your Recovery</h2>
<p>Your body has completed something extraordinary. Whether your pregnancy ended through vaginal delivery, cesarean section, or another path, the recovery process involves significant physiological changes that take time.</p>

<h3>Weeks 1–2</h3>
<ul>
<li><strong>Bleeding (lochia):</strong> Expect heavy, bright red bleeding that gradually lightens. Use pads rather than tampons.</li>
<li><strong>Uterine cramping:</strong> The uterus contracts to return to its pre-pregnancy size. These "afterpains" may intensify during breastfeeding.</li>
<li><strong>Perineal soreness:</strong> If you delivered vaginally, ice packs, sitz baths, and peri bottles can provide relief.</li>
<li><strong>C-section incision care:</strong> Keep the incision clean and dry. Watch for increasing redness, swelling, drainage, or fever.</li>
<li><strong>Breast changes:</strong> Engorgement may occur around day 3–5 whether or not you are breastfeeding.</li>
</ul>

<h3>Weeks 3–4</h3>
<ul>
<li>Bleeding typically transitions from red to pink to brownish.</li>
<li>Energy levels may slowly improve, though fatigue remains common.</li>
<li>Hormone levels continue to shift, which can affect mood, skin, and hair.</li>
<li>Gentle walking can begin if it feels comfortable — listen to your body.</li>
</ul>

<h3>Weeks 5–6</h3>
<ul>
<li>Most people have a postpartum checkup around this time.</li>
<li>The uterus has typically returned to near its pre-pregnancy size.</li>
<li>Bleeding should have stopped or be minimal.</li>
<li>Discussion of activity restrictions, return to exercise, and contraception typically happens at this visit.</li>
</ul>

<h3>Beyond 6 Weeks</h3>
<p>Many aspects of recovery extend well past the traditional six-week mark. Core strength, pelvic floor function, hormonal stabilization, and scar tissue remodeling all continue for months. Be patient with the process.</p>

<h2>Warning Signs — Contact Your Provider</h2>
<ul>
<li>Soaking more than one pad per hour with blood</li>
<li>Passing blood clots larger than a golf ball</li>
<li>Fever above 100.4°F (38°C)</li>
<li>Increasing pain, redness, or foul-smelling discharge from an incision or tear</li>
<li>Calf pain or swelling (possible blood clot)</li>
<li>Chest pain or difficulty breathing</li>
<li>Severe headache that doesn't respond to treatment</li>
</ul>`,
  },
  {
    title: 'Building a Self-Care Routine After Pregnancy',
    description: 'Practical, realistic approaches to caring for yourself during the postpartum period when time, energy, and bandwidth are limited.',
    category: 'Self-Care',
    tags: ['self-care', 'wellness', 'routines', 'mental health', 'postpartum'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Redefining Self-Care</h2>
<p>Self-care after pregnancy doesn't require spa days or elaborate routines. It means attending to your basic needs with intentionality and giving yourself permission to prioritize your wellbeing — even in small ways.</p>

<h2>The Basics Come First</h2>
<p>Before anything else, focus on the foundational needs that sustain you:</p>
<ul>
<li><strong>Hydration:</strong> Keep water within arm's reach. Dehydration worsens fatigue, headaches, and mood.</li>
<li><strong>Nutrition:</strong> Eating regularly maintains energy and supports healing. Prepared snacks, batch-cooked meals, and accepting food from others are strategies, not shortcuts.</li>
<li><strong>Sleep:</strong> Sleep deprivation is one of the biggest challenges of the postpartum period. When possible, sleep when you can, not only "when the baby sleeps" (which may not apply to every situation). Ask for help with nighttime responsibilities if available.</li>
</ul>

<h2>Five-Minute Self-Care Practices</h2>
<p>On the hardest days, even five minutes can make a difference:</p>
<ul>
<li>Step outside and breathe fresh air</li>
<li>Splash warm water on your face or take a short shower</li>
<li>Do a brief body scan: notice where you're holding tension and consciously release it</li>
<li>Listen to a song that brings comfort</li>
<li>Write three sentences about how you're feeling — no judgment, just acknowledgment</li>
</ul>

<h2>Boundaries Are Self-Care</h2>
<p>Saying no to visitors when you need rest, declining calls you don't have energy for, and limiting exposure to social media comparison are all forms of self-care. You do not owe anyone access to your recovery.</p>

<h2>Emotional Self-Care</h2>
<ul>
<li><strong>Name your feelings:</strong> Putting words to emotions reduces their intensity. "I feel overwhelmed" is more manageable than a vague sense of drowning.</li>
<li><strong>Lower the bar:</strong> The goal is not to be the version of yourself you were before pregnancy. The goal is to get through today with enough kindness toward yourself.</li>
<li><strong>Seek connection:</strong> Isolation intensifies difficult emotions. Even a short text exchange with someone who understands can help.</li>
</ul>

<h2>When Self-Care Isn't Enough</h2>
<p>If you find that no amount of rest, nutrition, or support is lifting the heaviness, that may be a sign that you need professional help — and seeking that help is the most important self-care choice you can make.</p>`,
  },
  {
    title: 'Nourishing Your Body After Pregnancy',
    description: 'Evidence-based guidance on postpartum nutrition, including key nutrients for healing, hydration needs, and realistic meal strategies.',
    category: 'Nutrition',
    tags: ['nutrition', 'postpartum diet', 'healing foods', 'hydration', 'recovery'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    targetPregnancyWeeks: [34, 35, 36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Why Postpartum Nutrition Matters</h2>
<p>After pregnancy, your body needs additional nutritional support to heal tissues, regulate hormones, replenish depleted stores, and sustain your energy through a demanding period. Good nutrition is not about dieting or "getting your body back" — it's about fueling recovery.</p>

<h2>Key Nutrients for Recovery</h2>
<ul>
<li><strong>Iron:</strong> Blood loss during and after delivery can deplete iron stores. Include iron-rich foods like red meat, lentils, spinach, and fortified cereals. Pair with vitamin C sources to enhance absorption.</li>
<li><strong>Protein:</strong> Essential for tissue repair. Aim to include protein at every meal — eggs, poultry, fish, beans, nuts, dairy, or tofu.</li>
<li><strong>Omega-3 fatty acids:</strong> Support brain health and may help stabilize mood. Found in fatty fish (salmon, sardines), walnuts, chia seeds, and flaxseed.</li>
<li><strong>Calcium and Vitamin D:</strong> Support bone health, especially important if breastfeeding. Dairy products, fortified plant milks, and sunlight exposure help maintain levels.</li>
<li><strong>Fiber:</strong> Constipation is common postpartum. Whole grains, fruits, vegetables, and adequate hydration support digestive comfort.</li>
<li><strong>B vitamins and folate:</strong> Continue supporting your nervous system and energy production with whole grains, leafy greens, and legumes.</li>
</ul>

<h2>Hydration</h2>
<p>Aim for at least 8–10 cups of fluid daily, more if breastfeeding. Water is ideal, but herbal teas, broths, and water-rich fruits also contribute. Signs of dehydration include dark urine, dry mouth, headaches, and increased fatigue.</p>

<h2>Practical Strategies</h2>
<ul>
<li><strong>Batch cooking and freezer meals:</strong> Prepare double portions before or early after pregnancy ends. Soups, stews, casseroles, and grain bowls freeze well.</li>
<li><strong>Accept meal trains:</strong> If friends or family offer to bring food, say yes. Specify helpful items if asked — nourishing, easy-to-eat meals are ideal.</li>
<li><strong>Stock easy snacks:</strong> Trail mix, cut fruit, cheese sticks, hummus with crackers, hard-boiled eggs, and granola bars require minimal preparation.</li>
<li><strong>One-handed eating:</strong> If you are caring for a baby, having snacks you can eat with one hand is practical.</li>
</ul>

<h2>A Note on Body Image</h2>
<p>Your body has been through something significant. Postpartum is not the time for restrictive dieting. Focus on nourishment and healing, and give yourself grace about how your body looks. It performed an extraordinary act, and it deserves care, not punishment.</p>`,
  },
  {
    title: 'Coping with Pregnancy Loss and Grief',
    description: 'Compassionate guidance for those navigating the aftermath of miscarriage, stillbirth, or other pregnancy loss — including physical recovery, emotional support, and honoring your experience.',
    category: 'Mental Health',
    tags: ['pregnancy loss', 'grief', 'miscarriage', 'stillbirth', 'healing', 'coping', 'bereavement'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [],
    difficulty: 'beginner',
    content: `<h2>Your Loss Is Real</h2>
<p>If you have experienced miscarriage, stillbirth, ectopic pregnancy, or any form of pregnancy loss, we want you to know: your loss is real, your grief is valid, and you are not alone. Pregnancy loss is far more common than most people realize — approximately 1 in 4 known pregnancies end in loss — yet it remains one of the most isolating experiences a person can endure.</p>

<h2>The Physical Aftermath</h2>
<p>After a pregnancy loss, your body undergoes many of the same postpartum changes as it would after any pregnancy. This can feel especially cruel when you don't have the outcome you hoped for.</p>
<ul>
<li><strong>Bleeding and cramping</strong> are expected and can last several days to weeks, depending on the gestational age and type of loss.</li>
<li><strong>Hormonal shifts</strong> can trigger mood swings, night sweats, breast tenderness, and engorgement.</li>
<li><strong>Fatigue</strong> is common and compounded by emotional exhaustion.</li>
<li>Follow up with your healthcare provider to ensure your physical recovery is on track. Don't hesitate to ask questions or voice concerns.</li>
</ul>

<h2>Understanding Your Grief</h2>
<p>Grief after pregnancy loss doesn't follow a predictable path. You may experience:</p>
<ul>
<li>Waves of intense sadness interspersed with periods of numbness</li>
<li>Anger — at the situation, at others who are pregnant, at a world that seems to be moving on</li>
<li>Guilt or "what if" thinking, even when the loss was completely outside your control</li>
<li>Difficulty with triggers — due dates, pregnancy announcements, baby-related events</li>
<li>Physical manifestations of grief: aching arms, heaviness in the chest, fatigue that sleep doesn't fix</li>
</ul>
<p>There is no timeline for grief and no "right" way to move through it. Your loss was significant regardless of gestational age or circumstances.</p>

<h2>Supporting Yourself</h2>
<ul>
<li><strong>Give yourself permission to grieve.</strong> You do not need to "get over it" or "stay strong." Allowing yourself to feel is part of healing.</li>
<li><strong>Limit exposure to triggers</strong> when needed. It's okay to mute social media accounts, skip baby showers, or ask loved ones to be mindful of what they share with you.</li>
<li><strong>Find safe people.</strong> Not everyone will understand your experience. Seek out those who can hold space without trying to fix or minimize.</li>
<li><strong>Consider professional support.</strong> Therapists specializing in perinatal loss can help you process the unique dimensions of this grief.</li>
<li><strong>Honor your loss in a way that feels meaningful.</strong> Some people name their baby, plant something, write letters, create art, or observe the due date. Others grieve privately. Both are valid.</li>
</ul>

<h2>For Partners and Loved Ones</h2>
<p>If you are supporting someone through pregnancy loss:</p>
<ul>
<li>Say "I'm sorry" and mean it. Avoid platitudes like "it wasn't meant to be" or "at least you know you can get pregnant."</li>
<li>Follow the bereaved person's lead on what they need — space, presence, practical help, or just someone to sit with them.</li>
<li>Remember that grief resurfaces. Check in not just in the first days, but weeks and months later — especially around milestones.</li>
<li>Acknowledge your own grief if you are also affected. Partners grieve too.</li>
</ul>

<h2>Resources</h2>
<ul>
<li><strong>Share Pregnancy & Infant Loss Support:</strong> nationalshare.org</li>
<li><strong>The Compassionate Friends:</strong> compassionatefriends.org</li>
<li><strong>Postpartum Support International:</strong> 1-800-944-4773 (call or text)</li>
<li><strong>988 Suicide and Crisis Lifeline:</strong> Call or text 988</li>
</ul>`,
  },
  {
    title: 'Breastfeeding Basics and Common Challenges',
    description: 'An introductory guide to breastfeeding covering latching, supply, common difficulties, and when to seek lactation support. Includes guidance for those who choose not to or cannot breastfeed.',
    category: 'Breastfeeding',
    tags: ['breastfeeding', 'lactation', 'feeding', 'latch', 'supply', 'formula'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    targetPregnancyWeeks: [34, 35, 36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Getting Started</h2>
<p>Breastfeeding is a learned skill — for both you and your baby. While it is often described as "natural," that doesn't mean it comes easily to everyone, and difficulty with breastfeeding is not a reflection of your ability as a parent.</p>

<h2>The First Days</h2>
<ul>
<li><strong>Colostrum</strong> is the thick, yellowish first milk your body produces. Though small in volume, it's rich in antibodies and nutrients.</li>
<li><strong>Milk "coming in"</strong> typically happens around days 2–5 postpartum. You may notice breast fullness, warmth, and increased volume.</li>
<li><strong>Frequent feeding</strong> (8–12 times per 24 hours) in the early days is normal and helps establish supply.</li>
</ul>

<h2>Latching</h2>
<p>A good latch is the foundation of comfortable, effective breastfeeding. Signs of a good latch include:</p>
<ul>
<li>Baby's mouth opens wide and covers more of the areola, not just the nipple</li>
<li>You hear rhythmic sucking and swallowing</li>
<li>Feeding is comfortable after the initial latch (some tenderness in the first week is common, but sharp or persistent pain is not normal)</li>
</ul>

<h2>Common Challenges</h2>
<ul>
<li><strong>Sore or cracked nipples:</strong> Often caused by a shallow latch. A lactation consultant can help assess and correct positioning.</li>
<li><strong>Engorgement:</strong> Firm, swollen, tender breasts. Hand expression, cold compresses between feedings, and frequent feeding or pumping can help.</li>
<li><strong>Low supply concerns:</strong> Frequent feeding and adequate hydration/nutrition support supply. True low supply is less common than perceived low supply — look for adequate wet/dirty diapers as reassurance.</li>
<li><strong>Mastitis:</strong> An infection causing flu-like symptoms, redness, and breast pain. Contact your provider — treatment typically includes continued breastfeeding from the affected side and sometimes antibiotics.</li>
<li><strong>Tongue or lip ties:</strong> Can interfere with latch. A pediatric dentist or ENT can evaluate and treat if necessary.</li>
</ul>

<h2>When Breastfeeding Isn't the Path</h2>
<p>Not everyone can or chooses to breastfeed, and that is completely valid. Reasons may include medical conditions, medication, personal preference, adoption, surrogacy, or the emotional toll of breastfeeding after loss. Fed is fed, and what matters most is that both you and your baby are nourished and cared for.</p>
<p>If you need to suppress lactation, speak with your healthcare provider about safe approaches. Tight-fitting sports bras, cold compresses, and avoiding stimulation can help.</p>

<h2>Getting Support</h2>
<p>If breastfeeding is important to you and you're struggling, don't wait to seek help. Lactation consultants (IBCLCs) are trained to assess and troubleshoot feeding challenges. Many offer virtual visits, and your hospital or birth center may provide follow-up support.</p>`,
  },
  {
    title: 'Pelvic Floor Recovery After Pregnancy',
    description: 'Understanding your pelvic floor after pregnancy, recognizing dysfunction, and learning when and how to begin rehabilitation.',
    category: 'Physical Recovery',
    tags: ['pelvic floor', 'physical therapy', 'kegels', 'incontinence', 'recovery', 'core'],
    targetWeeks: [2, 3, 4, 5, 6, 8, 10, 12, 16, 20],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'intermediate',
    content: `<h2>What Is the Pelvic Floor?</h2>
<p>The pelvic floor is a group of muscles that span the base of the pelvis, supporting the bladder, uterus, and rectum. During pregnancy, these muscles bear increasing weight, and during vaginal delivery, they stretch significantly. Even with a cesarean delivery, the weight of pregnancy affects the pelvic floor.</p>

<h2>Common Pelvic Floor Issues After Pregnancy</h2>
<ul>
<li><strong>Urinary incontinence:</strong> Leaking urine when coughing, sneezing, laughing, or exercising. Common but not something you need to accept as permanent.</li>
<li><strong>Pelvic organ prolapse:</strong> A feeling of heaviness or pressure in the pelvis, or a sensation that something is "falling out." This occurs when weakened muscles allow organs to shift downward.</li>
<li><strong>Pain during intercourse:</strong> Pelvic floor tension or scar tissue can cause discomfort. This is treatable.</li>
<li><strong>Difficulty with bowel movements:</strong> Constipation or fecal incontinence can be related to pelvic floor dysfunction.</li>
<li><strong>Diastasis recti:</strong> Separation of the abdominal muscles, which works in tandem with the pelvic floor. Both should be assessed together.</li>
</ul>

<h2>When to Start Rehabilitation</h2>
<p>Gentle pelvic floor engagement (such as Kegels) can often begin within the first few days postpartum if comfortable. However, a formal pelvic floor assessment by a specialized physiotherapist is recommended around 6 weeks postpartum or whenever cleared by your provider.</p>

<h2>Pelvic Floor Exercises</h2>
<p><strong>Kegels:</strong> Contract the muscles you would use to stop the flow of urine. Hold for 5 seconds, then release for 5 seconds. Repeat 10 times, 3 sets per day. Focus on full relaxation between contractions — an overly tight pelvic floor can also cause problems.</p>
<p><strong>Diaphragmatic breathing:</strong> The pelvic floor and diaphragm work together. Practice deep belly breathing where the pelvic floor gently descends on inhale and lifts on exhale.</p>
<p><strong>Bridges:</strong> Lying on your back with knees bent, lift your hips while engaging your pelvic floor. Lower slowly.</p>

<h2>Pelvic Floor Physical Therapy</h2>
<p>A pelvic floor physiotherapist can provide internal assessment, manual therapy, biofeedback, and a personalized exercise program. This is the gold standard for addressing pelvic floor dysfunction and is far more effective than generic advice. Ask your provider for a referral, or search the APTA or Herman & Wallace directory.</p>

<h2>What to Avoid</h2>
<ul>
<li>Returning to high-impact exercise too soon</li>
<li>Heavy lifting before adequate core and pelvic floor recovery</li>
<li>Straining during bowel movements (use a stool under your feet and stay hydrated)</li>
<li>Ignoring symptoms — early intervention leads to better outcomes</li>
</ul>`,
  },
  {
    title: 'When to Seek Professional Help for Postpartum Mental Health',
    description: 'How to recognize when what you are experiencing goes beyond normal adjustment, and practical guidance on finding the right mental health provider.',
    category: 'Mental Health',
    tags: ['mental health', 'therapy', 'professional help', 'postpartum depression', 'warning signs'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>The Line Between Adjustment and Disorder</h2>
<p>The postpartum period naturally involves emotional upheaval. Hormonal shifts, sleep disruption, identity changes, and the weight of a new reality (whatever that reality looks like for you) all contribute to a difficult emotional landscape. But there is a difference between struggling and suffering, and knowing when to seek professional help can change the trajectory of your recovery.</p>

<h2>Signs That Professional Support Would Help</h2>
<p>Consider reaching out to a therapist or your healthcare provider if you experience:</p>
<ul>
<li>Sadness, emptiness, or hopelessness that persists beyond two weeks</li>
<li>Anxiety that feels constant or disproportionate to the situation</li>
<li>Intrusive, repetitive thoughts that distress you</li>
<li>Difficulty sleeping even when you have the opportunity</li>
<li>Anger or rage that feels out of character or difficult to control</li>
<li>Withdrawal from relationships and activities</li>
<li>Difficulty feeling connected to your baby, yourself, or your life</li>
<li>Thoughts of self-harm or harming others</li>
<li>Feeling like your family would be better off without you</li>
<li>Flashbacks or nightmares related to your pregnancy or delivery</li>
</ul>

<h2>Emergency Situations</h2>
<p>Seek immediate help (call 988, 911, or go to your nearest emergency room) if you are having thoughts of suicide, if you are hearing or seeing things that others don't, or if you feel unable to keep yourself or others safe.</p>

<h2>Finding the Right Provider</h2>
<ul>
<li><strong>Perinatal mental health specialists</strong> have specific training in the unique aspects of pregnancy-related mood disorders. Postpartum Support International maintains a provider directory at postpartum.net.</li>
<li><strong>Types of therapy:</strong> Cognitive-behavioral therapy (CBT), interpersonal therapy (IPT), EMDR (for trauma), and somatic experiencing are all evidence-based approaches used in perinatal mental health.</li>
<li><strong>Medication:</strong> If therapy alone isn't sufficient, medication may be recommended. Many options are well-studied for safety during breastfeeding. A psychiatrist or your OB can help guide this decision.</li>
<li><strong>Telehealth:</strong> Virtual therapy is widely available and can remove barriers like transportation and childcare.</li>
</ul>

<h2>Barriers to Seeking Help</h2>
<p>Many people delay seeking help because of shame ("I should be able to handle this"), guilt ("Others have it worse"), or fear ("What if they take my baby away?"). Mental health treatment is about supporting you, not judging you. Providers are there to help, and seeking treatment is a sign of awareness and courage.</p>

<h2>You Deserve Support</h2>
<p>You do not need to reach a crisis point to warrant help. If something feels off, trust that feeling. Early intervention leads to faster recovery and better outcomes for everyone involved.</p>`,
  },
  {
    title: 'Sleep Strategies for Postpartum Recovery',
    description: 'Evidence-based approaches to improving sleep quality during the postpartum period, including sleep hygiene, shift systems, and managing sleep deprivation.',
    category: 'Self-Care',
    tags: ['sleep', 'rest', 'recovery', 'fatigue', 'self-care', 'sleep deprivation'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Why Sleep Matters So Much</h2>
<p>Sleep deprivation is one of the most challenging aspects of the postpartum period. Beyond making daily life harder, inadequate sleep directly impacts physical healing, immune function, emotional regulation, and mental health. Chronic sleep loss is a significant risk factor for postpartum depression and anxiety.</p>

<h2>Realistic Sleep Strategies</h2>
<p>Perfect sleep may not be achievable right now, but there are ways to maximize the rest you do get:</p>

<h3>Protect Your Sleep Windows</h3>
<ul>
<li><strong>Prioritize your longest stretch.</strong> If there is a time when you can get 3–4 uninterrupted hours, protect that window fiercely. Even one longer sleep block per night significantly improves cognitive function and mood.</li>
<li><strong>Shift system:</strong> If you have a partner or support person, take turns being "on duty." The off-duty person sleeps in a separate room with earplugs if needed.</li>
<li><strong>Accept daytime sleep.</strong> Napping during the day is not laziness — it's a recovery strategy.</li>
</ul>

<h3>Sleep Environment</h3>
<ul>
<li>Keep your room cool, dark, and quiet</li>
<li>Use white noise to mask disruptions</li>
<li>Limit screen exposure 30–60 minutes before sleep</li>
<li>Keep a water bottle and snacks nearby so you don't fully wake up if you need to eat or drink</li>
</ul>

<h3>Managing Middle-of-the-Night Wakefulness</h3>
<ul>
<li>Use the dimmest light possible for nighttime tasks</li>
<li>Avoid checking the clock — it often increases anxiety about lost sleep</li>
<li>If you can't fall back asleep after 20 minutes, get up, do something calming (reading, gentle stretching), and return when drowsy</li>
</ul>

<h2>When Sleep Problems Signal Something More</h2>
<p>If you are unable to sleep even when you have the opportunity — meaning the room is quiet, the environment is right, and you're exhausted but your mind won't stop — this may be a symptom of postpartum anxiety or depression. Mention this to your healthcare provider.</p>

<h2>Self-Compassion About Sleep</h2>
<p>You may hear advice like "sleep when the baby sleeps," which can feel dismissive of the many reasons that isn't always possible — including if you don't have a baby at home, if you have other children, or if your mind simply won't quiet. Do the best you can, and know that this intense phase will not last forever.</p>`,
  },
  {
    title: 'Navigating Relationships After Pregnancy',
    description: 'How pregnancy and its aftermath affect your relationships with partners, family, and friends — and practical approaches to communication, boundaries, and reconnection.',
    category: 'Postpartum',
    tags: ['relationships', 'communication', 'partnership', 'family', 'boundaries', 'intimacy'],
    targetWeeks: [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'intermediate',
    content: `<h2>Relationships Shift After Pregnancy</h2>
<p>The postpartum period changes the landscape of nearly every relationship in your life. Partners may struggle to understand your experience. Family members may overstep boundaries. Friends without similar experiences may drift away. These shifts are common — and navigable.</p>

<h2>With Your Partner</h2>
<p>If you have a partner, the postpartum period can strain your relationship in ways neither of you anticipated.</p>
<ul>
<li><strong>Communication becomes essential.</strong> Neither person can read the other's mind, especially when both are sleep-deprived and stressed. Use clear, specific requests: "I need you to handle bedtime tonight so I can rest" is more effective than hoping they'll notice you're exhausted.</li>
<li><strong>Resentment can build quietly.</strong> If one partner feels they are carrying more of the load — or if the division of labor feels unequal — address it early before it calcifies into bitterness.</li>
<li><strong>Intimacy changes.</strong> Physical intimacy often takes a back seat during postpartum recovery. This is normal. When you do feel ready, go slowly and communicate about what feels good and what doesn't. There is no required timeline.</li>
<li><strong>Shared grief:</strong> If you experienced loss, your partner may grieve differently. One person may want to talk; the other may need silence. Both responses are valid, and couples counseling can help bridge the gap.</li>
</ul>

<h2>With Family and In-Laws</h2>
<ul>
<li><strong>Boundaries are not unkind.</strong> Setting limits on visiting hours, unsolicited advice, and involvement in your recovery decisions is healthy. "Thank you for caring about us. Here's what we need right now" is a complete sentence.</li>
<li><strong>Accept help you actually want.</strong> Differentiate between help that serves you (cooked meals, laundry, running errands) and "help" that creates more work (visits that require hosting, advice that undermines your confidence).</li>
</ul>

<h2>With Friends</h2>
<p>Some friendships deepen during this period; others become strained. Friends who haven't experienced pregnancy or loss may struggle to relate. That doesn't necessarily mean the friendship is over — it may just mean you need to look elsewhere for certain types of support right now.</p>

<h2>Building New Connections</h2>
<p>Postpartum support groups — whether for new parents, for those who've experienced loss, or for specific challenges like breastfeeding or mental health — can provide relationships built on shared experience. These connections often become some of the most meaningful in your life.</p>

<h2>Asking for Help</h2>
<p>Many people struggle to ask for help, but the postpartum period is a time when communities historically rallied around recovering families. Saying "I need help" is not a failure — it is the design of how human beings were meant to navigate this transition.</p>`,
  },
  {
    title: 'Creating Your Postpartum Support Network',
    description: 'A practical guide to building a circle of support for the postpartum period, including who to include, how to ask, and community resources.',
    category: 'General',
    tags: ['support', 'community', 'postpartum', 'help', 'resources', 'planning'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8],
    targetPregnancyWeeks: [30, 32, 34, 36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Why a Support Network Matters</h2>
<p>Research consistently shows that social support is one of the strongest protective factors against postpartum depression, anxiety, and prolonged grief. Yet many people enter the postpartum period without a clear plan for who will help them and how. Building your network ideally starts before the pregnancy ends, but it's never too late.</p>

<h2>Types of Support You May Need</h2>
<ul>
<li><strong>Practical support:</strong> Meals, groceries, laundry, cleaning, errands, transportation to appointments</li>
<li><strong>Emotional support:</strong> Someone who listens without judging, validates your feelings, and checks in regularly</li>
<li><strong>Informational support:</strong> Trusted sources for questions about recovery, feeding, mental health, and medical concerns</li>
<li><strong>Professional support:</strong> Healthcare providers, therapists, lactation consultants, pelvic floor physiotherapists, doulas</li>
</ul>

<h2>Building Your Circle</h2>
<ol>
<li><strong>Identify your people.</strong> List the individuals in your life who are reliable, non-judgmental, and willing to help. This might include your partner, family members, friends, neighbors, or faith community members.</li>
<li><strong>Be specific about needs.</strong> People want to help but often don't know how. Instead of "Let me know if you need anything" (which rarely leads to action), provide specifics: "Could you bring dinner on Tuesday?" or "Could you sit with me for an hour on Thursday so I can shower and rest?"</li>
<li><strong>Use coordination tools.</strong> Meal trains (mealtrain.com) and shared calendars can organize help without the emotional labor falling on you.</li>
<li><strong>Plan for the long haul.</strong> Most help tapers off after the first two weeks, but support is needed for months. Don't be afraid to ask for continued help.</li>
</ol>

<h2>Professional Resources</h2>
<ul>
<li><strong>Postpartum doulas</strong> provide in-home support with feeding, recovery, emotional processing, and household tasks. They can be especially valuable if your personal support network is limited.</li>
<li><strong>Support groups:</strong> Postpartum Support International (postpartum.net) maintains a directory of local and virtual support groups for various needs, including loss support.</li>
<li><strong>Crisis lines:</strong> 988 Suicide and Crisis Lifeline, PSI Helpline (1-800-944-4773), Crisis Text Line (text HOME to 741741)</li>
</ul>

<h2>When Your Support Network Is Small</h2>
<p>Not everyone has a large circle of family and friends. If your network is limited, consider connecting with online communities, local postpartum support groups, religious or community organizations, or professional services. You deserve support regardless of the size of your personal network.</p>`,
  },
  {
    title: 'Healing Foods and Meal Planning for Postpartum Recovery',
    description: 'Specific meal ideas, batch-cooking strategies, and nutrient-focused recipes designed for the demands of postpartum recovery.',
    category: 'Nutrition',
    tags: ['meal planning', 'recipes', 'batch cooking', 'healing foods', 'nutrition', 'postpartum'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12],
    targetPregnancyWeeks: [34, 35, 36, 37, 38, 39, 40],
    difficulty: 'intermediate',
    content: `<h2>Eating for Healing</h2>
<p>Across cultures, the postpartum period has traditionally been supported by warm, nutrient-dense, easily digestible foods prepared by community members. While modern life often lacks this communal structure, the wisdom of prioritizing nourishing food during recovery remains sound.</p>

<h2>Healing Food Principles</h2>
<ul>
<li><strong>Warm over cold:</strong> Warm soups, stews, and porridges are easier to digest and provide comfort. Many traditions emphasize warm foods for postpartum healing.</li>
<li><strong>Nutrient-dense over calorie-dense:</strong> Focus on foods that deliver vitamins, minerals, protein, and healthy fats — not just energy.</li>
<li><strong>Anti-inflammatory:</strong> Turmeric, ginger, fatty fish, berries, leafy greens, and olive oil can support the body's healing processes.</li>
<li><strong>Iron-rich:</strong> Replenishing iron stores is critical. Combine iron-rich foods (red meat, lentils, dark leafy greens, fortified cereals) with vitamin C sources for better absorption.</li>
</ul>

<h2>Batch-Cooking Ideas</h2>
<p>Prepare these before your due date or ask loved ones to help:</p>
<ul>
<li><strong>Bone broth or vegetable broth:</strong> Rich in minerals, soothing, and versatile. Freeze in portions.</li>
<li><strong>Lentil or bean soup:</strong> High in protein, iron, and fiber. Freezes beautifully.</li>
<li><strong>Grain bowls:</strong> Cook large batches of quinoa, rice, or farro. Top with roasted vegetables, protein, and a flavorful dressing.</li>
<li><strong>Overnight oats:</strong> Prepare jars with oats, chia seeds, milk (or plant milk), and toppings. Ready to eat each morning.</li>
<li><strong>Muffins or energy bites:</strong> Oat-based muffins with nuts, seeds, and dried fruit provide grab-and-go nourishment.</li>
<li><strong>Casseroles and baked dishes:</strong> Lasagna, enchiladas, baked oatmeal, and egg casseroles all freeze and reheat well.</li>
</ul>

<h2>Simple Daily Meals</h2>
<p><strong>Breakfast:</strong> Oatmeal with nut butter and banana, scrambled eggs with whole grain toast, yogurt with granola and berries.</p>
<p><strong>Lunch:</strong> Leftover soup with bread, avocado toast with a fried egg, a grain bowl with whatever is available.</p>
<p><strong>Dinner:</strong> Thawed freezer meal, slow cooker stew, simple pasta with vegetables and protein.</p>
<p><strong>Snacks:</strong> Apple with almond butter, hummus and vegetables, cheese and whole grain crackers, trail mix, smoothies.</p>

<h2>When Cooking Feels Impossible</h2>
<p>There will be days when even reheating food feels like too much. Stock your pantry with items that require zero preparation: canned soup, nut butter packets, protein bars, dried fruit, crackers, and pre-made smoothies. Eating something is always better than eating nothing.</p>`,
  },
  {
    title: 'Mindfulness and Meditation for Postpartum Healing',
    description: 'Gentle, accessible mindfulness practices designed for the postpartum period — no experience required, adaptable to any amount of time or energy.',
    category: 'Mental Health',
    tags: ['mindfulness', 'meditation', 'stress relief', 'anxiety', 'mental health', 'coping'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [30, 32, 34, 36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Mindfulness in the Postpartum Period</h2>
<p>Mindfulness — paying attention to the present moment without judgment — may sound simple, but it can be a powerful tool during one of life's most overwhelming transitions. Research shows that mindfulness practices can reduce symptoms of postpartum depression and anxiety, improve sleep quality, and increase emotional resilience.</p>

<p>You don't need to sit in silence for 30 minutes. The practices below are designed for real life — messy, exhausted, overwhelmed real life.</p>

<h2>One-Minute Practices</h2>
<ul>
<li><strong>Three conscious breaths:</strong> Pause what you're doing. Take three slow, deep breaths, noticing the sensation of air entering and leaving your body. That's it. That counts.</li>
<li><strong>Body scan check-in:</strong> Starting from the top of your head, quickly scan down through your body. Where are you holding tension? Acknowledge it without trying to change it.</li>
<li><strong>Grounding with senses:</strong> Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, and 1 you can taste. This brings your attention out of anxious thoughts and into the present moment.</li>
</ul>

<h2>Five-Minute Practices</h2>
<ul>
<li><strong>Guided breathing:</strong> Breathe in for 4 counts, hold for 4, exhale for 6. The extended exhale activates your parasympathetic nervous system and reduces the stress response.</li>
<li><strong>Self-compassion pause:</strong> Place a hand on your heart. Say (silently or aloud): "This is a moment of suffering. Suffering is part of being human. May I be kind to myself in this moment."</li>
<li><strong>Mindful feeding or holding:</strong> If you are feeding or holding a baby, bring full attention to the experience — the warmth, the weight, the sounds. If you are not, you can apply this to any nurturing act, including feeding yourself.</li>
</ul>

<h2>Longer Practices (When You Have Time)</h2>
<ul>
<li><strong>Body scan meditation (10–15 min):</strong> Lie down comfortably. Slowly bring attention to each part of your body, from toes to head, noticing sensations without judgment. Free guided versions are available on apps like Insight Timer, Calm, and Headspace.</li>
<li><strong>Walking meditation:</strong> Walk slowly, paying attention to each step — the lift, the movement forward, the placement. This can be done indoors or outside, at whatever pace feels right.</li>
<li><strong>Journaling:</strong> Write for 10 minutes without stopping or editing. Let whatever emerges come to the page. This practice externalizes thoughts and emotions, reducing their intensity.</li>
</ul>

<h2>Common Obstacles</h2>
<p><strong>"I can't quiet my mind."</strong> Mindfulness is not about having an empty mind. It's about noticing that your mind has wandered and gently returning attention. Every time you notice, you are practicing.</p>
<p><strong>"I don't have time."</strong> Three breaths take less than 30 seconds. Start there.</p>
<p><strong>"It doesn't help."</strong> If traditional mindfulness feels activating or distressing (which can happen, especially after trauma), try movement-based practices or work with a therapist who integrates somatic approaches.</p>`,
  },
  {
    title: 'Gentle Movement and Exercise After Pregnancy',
    description: 'A progressive guide to returning to physical activity after pregnancy, from the earliest days through the first months, with attention to safety and individual readiness.',
    category: 'Physical Recovery',
    tags: ['exercise', 'movement', 'fitness', 'recovery', 'walking', 'yoga', 'physical activity'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>Movement Is Medicine — At the Right Pace</h2>
<p>Returning to physical activity after pregnancy supports cardiovascular health, mood regulation, energy levels, and overall recovery. But the key word is "returning" — not "rushing back." Your body has undergone a significant physical event, and it needs a gradual, respectful re-introduction to exercise.</p>

<h2>Phase 1: The First Two Weeks</h2>
<p>Focus on rest and the gentlest forms of movement:</p>
<ul>
<li><strong>Breathing exercises:</strong> Diaphragmatic breathing reconnects you with your core and pelvic floor.</li>
<li><strong>Gentle pelvic floor engagement:</strong> Light Kegel exercises if comfortable (not if you have stitches causing pain).</li>
<li><strong>Short walks:</strong> Start with 5–10 minutes around your home or block, only if it feels comfortable. Stop if you experience increased bleeding, pain, or dizziness.</li>
<li><strong>Posture awareness:</strong> Gentle attention to alignment while sitting, feeding, or resting.</li>
</ul>

<h2>Phase 2: Weeks 3–6</h2>
<ul>
<li>Gradually increase walking duration and pace</li>
<li>Continue pelvic floor exercises</li>
<li>Gentle stretching — focus on areas that feel tight from feeding or holding positions</li>
<li>Core reconnection exercises (not crunches): pelvic tilts, heel slides, gentle marching while lying down</li>
<li>If you had a cesarean, follow your surgeon's specific guidance about activity restrictions</li>
</ul>

<h2>Phase 3: After Your Postpartum Checkup (6+ Weeks)</h2>
<p>Once cleared by your provider — and ideally after a pelvic floor assessment — you can begin to progress:</p>
<ul>
<li><strong>Postnatal yoga or Pilates:</strong> Classes specifically designed for postpartum bodies address core and pelvic floor rehabilitation.</li>
<li><strong>Swimming:</strong> Low-impact and soothing, once bleeding has stopped and any wounds have healed.</li>
<li><strong>Strength training:</strong> Start with body weight or light resistance. Focus on form and gradual progression.</li>
<li><strong>Running and high-impact activities:</strong> Generally recommended to wait until 12 weeks postpartum at minimum, and only after confirming pelvic floor readiness.</li>
</ul>

<h2>Warning Signs to Stop</h2>
<ul>
<li>Increased bleeding or return of bright red bleeding</li>
<li>Pain (beyond normal muscle fatigue)</li>
<li>Heaviness or pressure in the pelvis</li>
<li>Leaking urine during exercise</li>
<li>Dizziness or feeling faint</li>
</ul>

<h2>Movement for Emotional Wellbeing</h2>
<p>Exercise is one of the most evidence-based interventions for improving mood. Even a 15-minute walk outside has measurable effects on anxiety and depression. But be kind to yourself about what "exercise" looks like right now. Some days, getting dressed and stepping outside is the victory.</p>

<h2>For Those Recovering from Loss</h2>
<p>If you are postpartum after a loss, returning to movement can feel complicated — your body may be healing, but the emotional landscape is different from what exercise culture typically acknowledges. Move gently, without pressure to "push through," and know that movement can be part of grieving and healing when it's done on your terms.</p>`,
  },
  {
    title: 'Understanding Your Hormonal Changes After Pregnancy',
    description: 'A clear explanation of the major hormonal shifts that occur after pregnancy, how they affect your body and mind, and what to expect as your system recalibrates.',
    category: 'Postpartum',
    tags: ['hormones', 'estrogen', 'progesterone', 'thyroid', 'mood', 'postpartum changes'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>The Hormonal Landscape After Pregnancy</h2>
<p>During pregnancy, your body produces dramatically elevated levels of several hormones. When the pregnancy ends — whether through delivery, miscarriage, or other circumstances — these hormone levels drop rapidly, triggering a cascade of physical and emotional effects. Understanding these changes can help you make sense of what you're experiencing.</p>

<h2>Key Hormonal Shifts</h2>

<h3>Estrogen and Progesterone</h3>
<p>These hormones increase by 100–1,000 times their normal levels during pregnancy. After pregnancy ends, they plummet within 24–48 hours — one of the most dramatic hormonal shifts the human body experiences. This rapid drop is a major contributor to postpartum mood changes, tearfulness, and irritability.</p>

<h3>Oxytocin</h3>
<p>Known as the "bonding hormone," oxytocin surges during labor, breastfeeding, and skin-to-skin contact. It promotes bonding and can produce feelings of calm and connection. If breastfeeding is not part of your postpartum experience, you can still boost oxytocin through physical affection, warm baths, and positive social interactions.</p>

<h3>Prolactin</h3>
<p>This hormone drives milk production and remains elevated during breastfeeding. It can also contribute to lower libido, mood changes, and altered sleep patterns. If you are not breastfeeding, prolactin levels return to baseline within a few weeks.</p>

<h3>Cortisol</h3>
<p>Your stress hormone may remain elevated postpartum, particularly if you're dealing with sleep deprivation, anxiety, or a difficult experience. Chronic cortisol elevation contributes to fatigue, weight retention, difficulty sleeping, and immune suppression.</p>

<h3>Thyroid Hormones</h3>
<p>About 5–10% of people develop postpartum thyroiditis — inflammation of the thyroid that can cause a phase of overactivity (hyperthyroidism) followed by underactivity (hypothyroidism). Symptoms of hypothyroidism overlap significantly with depression: fatigue, weight gain, brain fog, and low mood. If your symptoms persist despite treatment for depression, ask your provider to check your thyroid.</p>

<h2>Physical Effects of Hormonal Changes</h2>
<ul>
<li><strong>Hair loss:</strong> Many people experience increased hair shedding around 3–6 months postpartum as estrogen levels normalize. This is temporary.</li>
<li><strong>Skin changes:</strong> Acne, dryness, or pigmentation changes can occur as hormones recalibrate.</li>
<li><strong>Night sweats:</strong> Especially common in the first few weeks as your body adjusts to lower estrogen.</li>
<li><strong>Libido changes:</strong> Decreased sex drive is normal and multifactorial — hormones, fatigue, body image, and relationship dynamics all play a role.</li>
<li><strong>Menstrual cycle return:</strong> If not breastfeeding, periods may return within 6–8 weeks. If breastfeeding, the timeline varies widely — from a few months to over a year.</li>
</ul>

<h2>Supporting Your Hormonal Recovery</h2>
<ul>
<li><strong>Sleep:</strong> Adequate rest supports hormonal regulation (a challenge, but worth prioritizing).</li>
<li><strong>Nutrition:</strong> Healthy fats, protein, and micronutrients support hormone production and balance.</li>
<li><strong>Stress management:</strong> Mindfulness, social support, and setting boundaries help manage cortisol.</li>
<li><strong>Medical follow-up:</strong> If symptoms seem disproportionate or aren't improving, ask for blood work including thyroid panel, iron, and vitamin D.</li>
</ul>`,
  },
  {
    title: 'Postpartum Anxiety: Recognizing and Managing the Worry That Won\'t Quit',
    description: 'Postpartum anxiety is as common as postpartum depression but less widely discussed. Learn to recognize it, understand it, and find strategies to manage it.',
    category: 'Mental Health',
    tags: ['anxiety', 'postpartum anxiety', 'worry', 'mental health', 'panic', 'coping strategies'],
    targetWeeks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    targetPregnancyWeeks: [36, 37, 38, 39, 40],
    difficulty: 'beginner',
    content: `<h2>More Than Just "New Parent Worry"</h2>
<p>Some worry after pregnancy is expected — your life has changed profoundly, and concern about what comes next is natural. But postpartum anxiety (PPA) goes beyond typical concern. It involves persistent, overwhelming worry that interferes with your ability to function, rest, or find any peace.</p>

<p>PPA affects an estimated 11–21% of postpartum people, making it at least as common as postpartum depression. Yet it receives far less attention.</p>

<h2>What Postpartum Anxiety Looks Like</h2>
<ul>
<li>Racing, repetitive thoughts that are difficult to control</li>
<li>Constant worry about worst-case scenarios</li>
<li>Physical symptoms: rapid heartbeat, chest tightness, shortness of breath, nausea, muscle tension, dizziness</li>
<li>Difficulty sleeping even when exhausted and given the opportunity</li>
<li>Irritability or a feeling of being "on edge" at all times</li>
<li>Checking behaviors — repeatedly confirming safety, health, or status of yourself or others</li>
<li>Avoidance of situations that trigger worry (leaving the house, being alone, handing the baby to someone else)</li>
<li>Panic attacks: sudden, intense episodes of fear with physical symptoms</li>
</ul>

<h2>Risk Factors</h2>
<ul>
<li>Personal or family history of anxiety or OCD</li>
<li>Pregnancy loss or fertility struggles</li>
<li>Traumatic birth experience or NICU stay</li>
<li>History of trauma or abuse</li>
<li>Perfectionist tendencies</li>
<li>Lack of support or major life stressors</li>
</ul>

<h2>Coping Strategies</h2>

<h3>In the Moment</h3>
<ul>
<li><strong>Grounding:</strong> Engage your senses. Hold an ice cube, smell something strong (peppermint, coffee), press your feet firmly into the floor.</li>
<li><strong>Box breathing:</strong> Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times.</li>
<li><strong>Name it:</strong> "This is anxiety. It feels real, but it is not an accurate prediction of reality."</li>
<li><strong>Movement:</strong> A short walk, shaking out your hands, or gentle stretching can interrupt the anxiety spiral.</li>
</ul>

<h3>Ongoing Management</h3>
<ul>
<li><strong>Limit information intake:</strong> Endlessly researching symptoms or risks online can fuel anxiety. Set boundaries around screen time and health searches.</li>
<li><strong>Routine:</strong> Predictability can reduce anxiety. Even a loose daily structure provides anchor points.</li>
<li><strong>Talk about it:</strong> Naming your anxiety to a trusted person reduces its power. You are not burdening people by being honest.</li>
<li><strong>Professional help:</strong> CBT is the gold standard for anxiety treatment. Medication (SSRIs) can also be effective and is often compatible with breastfeeding.</li>
</ul>

<h2>PPA After Loss</h2>
<p>If you have experienced pregnancy loss, subsequent pregnancies or the postpartum period may carry heightened anxiety. Worrying about another loss, hypervigilance about physical symptoms, and difficulty believing positive outcomes are common. This anxiety is understandable — and treatable. A therapist experienced in perinatal loss can help.</p>`,
  },
];

async function buildCategoryMap(): Promise<Map<string, string>> {
  const categories = await Category.find({});
  const map = new Map<string, string>();
  for (const cat of categories) {
    map.set(cat.name, (cat._id as mongoose.Types.ObjectId).toString());
  }
  return map;
}

function resolveCategoryId(categoryName: string, categoryMap: Map<string, string>): string {
  const id = categoryMap.get(categoryName);
  if (!id) {
    logger.warn(`Category "${categoryName}" not found in database, storing name as-is`);
    return categoryName;
  }
  return id;
}

export async function seedContent(): Promise<void> {
  try {
    // Fix provider display name: Sarah Johnson -> Sarah L (legacy)
    const nameUpdate = await User.updateMany(
      { role: 'provider', firstName: 'Sarah', lastName: 'Johnson' },
      { $set: { lastName: 'L' } }
    );
    if (nameUpdate.modifiedCount > 0) {
      logger.info(`Updated ${nameUpdate.modifiedCount} provider(s) from Sarah Johnson to Sarah L`);
    }

    const categoryMap = await buildCategoryMap();

    // Fix resources that were seeded with category names instead of ObjectIds
    await fixResourceCategoryIds(categoryMap);

    const existingBlogCount = await BlogPost.countDocuments();
    const existingResourceCount = await Resource.countDocuments();

    if (existingBlogCount > 0 && existingResourceCount > 0) {
      logger.info(
        `Content already seeded (${existingBlogCount} blog posts, ${existingResourceCount} resources). Skipping.`
      );
      return;
    }

    let provider = await User.findOne({ role: 'provider', firstName: 'Sarah', lastName: 'L' });
    if (!provider) {
      provider = await User.findOne({ role: 'provider' });
    }
    if (!provider) {
      logger.warn('No provider user found — skipping content seeding. Create a provider account to trigger seeding on next restart.');
      return;
    }

    const authorId = provider._id as mongoose.Types.ObjectId;

    if (existingBlogCount === 0) {
      const blogDocs = blogPosts.map((post) => ({
        ...post,
        author: authorId,
        isPublished: true,
        publishDate: new Date(),
        viewCount: 0,
      }));

      await BlogPost.insertMany(blogDocs);
      logger.info(`Seeded ${blogDocs.length} blog posts`);
    } else {
      logger.info(`Blog posts already exist (${existingBlogCount}). Skipping blog seed.`);
    }

    if (existingResourceCount === 0) {
      const resourceDocs = resources.map((resource) => ({
        ...resource,
        category: resolveCategoryId(resource.category, categoryMap),
        author: authorId,
        isPublished: true,
        publishDate: new Date(),
      }));

      await Resource.insertMany(resourceDocs);
      logger.info(`Seeded ${resourceDocs.length} resources`);
    } else {
      logger.info(`Resources already exist (${existingResourceCount}). Skipping resource seed.`);
    }
  } catch (error) {
    logger.error('Error seeding content:', error);
  }
}

async function fixResourceCategoryIds(categoryMap: Map<string, string>): Promise<void> {
  const categoryNames = [...categoryMap.keys()];
  const resourcesWithNames = await Resource.find({ category: { $in: categoryNames } });

  if (resourcesWithNames.length === 0) return;

  logger.info(`Fixing ${resourcesWithNames.length} resources with category names instead of IDs...`);

  const bulkOps = resourcesWithNames.map((resource) => ({
    updateOne: {
      filter: { _id: resource._id },
      update: { $set: { category: resolveCategoryId(resource.category, categoryMap) } },
    },
  }));

  await Resource.bulkWrite(bulkOps);
  logger.info(`Fixed ${bulkOps.length} resource category IDs`);
}
