import 'dotenv/config';
import { sendLiveGmailMessage } from './dashboard/lib/google-auth';
import { updateAgendaItemStatus } from './dashboard/lib/db';

export const emailQueue = [
  {
    agendaTitle: 'Send Outreach Email: Newton Plumbing Services (newtonplumbingservice@gmail.com)',
    to: 'newtonplumbingservice@gmail.com',
    subject: 'Modern emergency dispatch & quote prototype for Newton Plumbing Services',
    body: `Hi Mark,

I was looking at local trade websites in Wangaratta recently and noticed that while your 15+ years of trade experience and 24/7 service are second to none, many emergency plumbing customers bounce when sites load slowly on mobile or make it tricky to book urgently after hours.

We put together a dedicated, high-speed mobile web app prototype tailored specifically for Newton Plumbing Services:
👉 Demo: https://newton-plumbing.vercel.app

What we built into it:
• 1-Tap Emergency Dispatch: High-visibility emergency callout button for burst pipes and blocked drains.
• Automated Quote Request Funnel: Lets homeowners select service types (CCTV drain inspection, jetting, hot water systems) and submit details with zero friction.
• Rapid Mobile SEO & Performance: Built as a lightweight modern app designed to load instantly on any phone.

Would you be open to a quick 2-minute video preview showing how this can help convert more high-value local jobs?

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Cafe The PreVue (cafethevue@gmail.com)',
    to: 'cafethevue@gmail.com',
    subject: 'Quick prototype for Cafe The PreVue: Riverside function bookings & direct menu',
    body: `Hi Ali,

I was admiring Cafe The PreVue’s riverside deck on the Ovens River recently and noticed that while your location is unmatched, a lot of potential high-ticket function leads and table inquiries can slip through the cracks when handled purely over social DMs or busy service calls.

We put together a high-speed interactive website prototype tailored specifically for Cafe The PreVue:
👉 Demo: https://github.com/ThunderOpsAI/cafe-the-prevue

Key features we built into it:
• Dedicated Riverside Event & Function Engine: Let guests configure guest counts, dates, and event styles (weddings, corporate breakfasts, private terrace cocktail parties) with instant lead logging.
• Aesthetic Mobile Menu Catalogue: High Country produce, breakfast/lunch items, and local King Valley wines showcased with zero third-party commissions.
• Tap-to-Call & Local SEO Optimisation for Faithfull Street visitors.

Would you be open to a quick 2-minute video walkthrough showing how this could help streamline private function bookings for the upcoming season?

Warm regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Milawa Bakery Café (info@milawabakery.com.au)',
    to: 'info@milawabakery.com.au',
    subject: 'Prototype for Milawa Bakery: Tourist mobile menu & gourmet hamper pre-orders',
    body: `Hi Team at Milawa Bakery Café,

With the heavy weekend tourist traffic through the Milawa gourmet corridor and cyclists on the Rail Trail, we know how busy the morning and lunchtime rush gets at the counter.

We built a custom mobile ordering and pre-order prototype designed specifically for Milawa Bakery Café:
👉 Demo: https://github.com/ThunderOpsAI/milawa-bakery-cafe

What we built for your venue:
• Click & Collect Hamper System: Allows tourists and campers to pre-order artisan sourdough, King Valley cheese hampers, and gourmet picnic packs before arriving.
• High-Speed Mobile Tourist Menu: Zero-friction browsing for travellers heading down Snow Road to beat counter bottlenecks.
• Coach Tour & Group Catering Coordinator: Direct inquiry engine for bus tours and club visits.

Would you like me to send over a brief 2-minute video demo of how it works? No obligation at all.

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Beechworth Pizza & Takeaway (info@beechworthpizza.com.au)',
    to: 'info@beechworthpizza.com.au',
    subject: 'Built a custom pizza builder for Beechworth Pizza (cut out the 30% delivery app fees)',
    body: `Hi Team,

I was looking at ordering takeaway in Beechworth recently and noticed how many regional venues are forced to give away 25%–30% of every order to third-party delivery apps, or lose orders because phone lines get jammed at 6:30pm on Friday night.

We designed a custom digital storefront and mobile pizza builder specifically for Beechworth Pizza & Takeaway:
👉 Demo: https://github.com/ThunderOpsAI/beechworth-pizza-takeaway

Features included in the prototype:
• Interactive Custom Pizza Builder: Lets customers choose their size, crust (including Gluten-Free and Stuffed Crust), sauces, and custom toppings with live dynamic pricing.
• Family Deal Bundles: Direct click-and-collect ordering for high-margin meal deals.
• Direct Tap-to-Call Pickup: Keeps 100% of the ticket price in your pocket with zero commissions.

Would you be open to seeing a quick 2-minute screen recording of the pizza builder in action?

Cheers,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Positive Charge Electrical (jon@positivecharge.net.au)',
    to: 'jon@positivecharge.net.au',
    subject: 'Heat pump & split-system rebate calculator prototype for Positive Charge Electrical',
    body: `Hi Jon,

With the surge in homeowners looking into Victorian Energy Upgrades (VEU) and Solar Victoria rebates, many locals are searching for split-system and heat pump replacements but hesitate because the rebate maths seems confusing.

We built a dedicated lead-generation prototype tailored for Positive Charge Electrical:
👉 Demo: https://github.com/ThunderOpsAI/positive-charge-electrical

What we built into it:
• Interactive VIC Rebate & Savings Calculator: Homeowners choose their current system (e.g. LPG, old electric), property size, and proposed heat pump to calculate ballpark savings ($1,000–$3,200) and power bill reductions in real time.
• Instant Quote Pre-Fill: Passes their exact system choice directly into your quote inbox.
• 24/7 Emergency Electrical Callout Banner for urgent Wangaratta jobs.

Would you be open to a quick 2-minute video preview showing how this can generate high-margin heat pump installation leads?

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Taylor-Made Plumbing (info@taylormadeplumbing.com.au)',
    to: 'info@taylormadeplumbing.com.au',
    subject: '"Snap your leak" photo quote tool & 24/7 emergency site prototype for Taylor-Made Plumbing',
    body: `Hi Team,

I noticed that when homeowners or businesses experience burst pipes or leaks around Wangaratta after hours, they often bounce off standard plumbing directories because there’s no quick way to communicate the urgency without calling multiple people.

We put together a mobile-first lead-capture prototype built specifically for Taylor-Made Plumbing:
👉 Demo: https://github.com/ThunderOpsAI/taylor-made-plumbing

What’s included in the prototype:
• "Snap Your Leak" Photo Upload Tool: Customers upload a quick photo of the burst pipe or leaking fixture from their phone with a severity indicator, giving you instant job clarity before heading out.
• 24/7 Burst Pipe Emergency Tap-to-Call: High-visibility floating call trigger with emergency water-meter shut-off guidance for panicked clients.
• Clean local quote funnel for hot water replacements and routine maintenance.

Could I send over a quick 2-minute video walkthrough showing how this works on mobile?

Cheers,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Gibbs Pest Control (admin@gibbspc.com)',
    to: 'admin@gibbspc.com',
    subject: 'Seasonal spider spray pricing & termite booking tool for Gibbs Pest Control',
    body: `Hi Ben,

With pest season kicking into gear across Wangaratta and rural properties, a lot of homeowners want upfront package pricing for spider sprays without playing phone tag while you’re out on a job.

We put together a custom lead-generation prototype for Gibbs Pest Control:
👉 Demo: https://github.com/ThunderOpsAI/gibbs-pest-control

Key features we built into the site:
• Spider Spray Package Selector: Clear transparent pricing tiers (Standard Exterior $195, Full Interior/Exterior $285, Premium Spider & Ant Bundle $360) with acreage outbuilding toggles.
• Termite Inspection Booking Funnel: Gathers dwelling structure, foundation type (subfloor vs slab), and property history directly into your booking inbox.
• Direct 1-tap mobile calling (0427 112 267) for urgent infestations.

Would you be open to a quick 2-minute video showing how this could save you administrative time this season?

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Wangaratta Car Cleaning (wangarattacarcleaning@gmail.com)',
    to: 'wangarattacarcleaning@gmail.com',
    subject: 'Online detailing package selector & quote prototype for Wangaratta Car Cleaning',
    body: `Hi Shane,

I noticed customers searching for car detailing and paint protection in Wangaratta often hesitate because pricing varies drastically between small hatchbacks, family SUVs, and work utes.

We built an interactive detailing quote and package selector prototype customized for Wangaratta Car Cleaning:
👉 Demo: https://github.com/ThunderOpsAI/wangaratta-car-cleaning

What we built:
• Detailing Tier Selector: Customers select Interior Deep Clean, Exterior Paint Correction, or Full Signature Ceramic Detail.
• Vehicle Size Multiplier: Live price adjustments for Sedans, SUVs, and 4WDs/Dual-Cab Utes, plus add-on toggles (red dust extraction, engine bay degrease).
• Direct Booking Funnel: Locks in vehicle specs and passes details straight to your quote queue with 1-tap calling (0479 107 101).

Would you like me to send across a quick 2-minute video preview of the selector in action?

Warm regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: ColorOz Painter & Decorator (info@coloroz.com.au)',
    to: 'info@coloroz.com.au',
    subject: 'Heritage restoration gallery & repainting quote funnel prototype for ColorOz',
    body: `Hi Simon,

Knowing your specialized craftsmanship in heritage restoration, older timber weatherboards, and decorative finishes across Wangaratta and Beechworth, standard painter templates just don’t showcase that level of detail.

We built a custom showcase prototype specifically for ColorOz Painter & Decorator:
👉 Demo: https://github.com/ThunderOpsAI/coloroz-painter-decorator

Features built into the prototype:
• Heritage Restoration Portfolio: Highlights Victorian, Edwardian, and Federation homes with detailed focus on period architectural features.
• Interactive Heritage Quote Funnel: Gathers architectural era, timber condition, authentic period color palettes (National Trust Tri-Colour), and AS 4361.2 lead-safe preparation needs.
• Clean, trustworthy mobile layout highlighting European-standard preparation and trade qualifications.

Would you be open to me sending over a short 2-minute video walkthrough of the layout?

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: SP Automotive (info@spautomotive.com.au)',
    to: 'info@spautomotive.com.au',
    subject: 'Fixed-price logbook service scheduler & roadside assist prototype for SP Automotive',
    body: `Hi Sam,

When Wangaratta drivers need logbook servicing or RWC inspections, phone tag often delays bookings—and breakdowns need immediate assistance without hunting for numbers.

We designed an interactive service booking prototype tailored for SP Automotive:
👉 Demo: https://github.com/ThunderOpsAI/sp-automotive

Features we included:
• Fixed-Price Logbook Service Calculator: Customers select their make, fuel type (petrol vs common-rail diesel), and service level (Minor, Major, Manufacturer Logbook, or RWC) with transparent estimates and loan car reservation.
• 24/7 Emergency Roadside Tap-to-Call: Prominent top bar and one-touch dialer (03 5722 4213) for towing and breakdown emergencies.
• Direct Service Booking Funnel that captures mileage and vehicle details upfront.

Could I send over a quick 2-minute video demonstrating how this works on mobile?

Cheers,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Outreach Email: Rock and Road Cycles (rob@rockandroadcycles.com.au)',
    to: 'rob@rockandroadcycles.com.au',
    subject: 'Digital bike catalogue & workshop service booking prototype for Rock and Road Cycles',
    body: `Hi Rob,

With the Rail Trail and local mountain biking scene drawing cyclists to Rowan Street, customers often want to browse current bike categories, parts, and workshop servicing options directly from their phones before heading in.

We put together a modern digital catalogue and workshop booking prototype for Rock and Road Cycles:
👉 Demo: https://github.com/ThunderOpsAI/rock-and-road-cycles

What we created:
• Cycling & Parts Catalogue: Clean mobile inventory showcase for Trek MTBs, gravel bikes, e-bikes, commuter bikes, helmets, and components.
• Workshop Repair Booking Engine: Riders select service tiers (Basic Safety Tune, Major Overhaul, Hydraulic Bleed) and enter bike specs and drop-off dates directly online.
• Floating Order & Reserve Drawer: Customers can reserve bikes or book workshop spots with instant reference numbers.

Would you be open to a quick 2-minute video showing the catalogue and repair scheduler?

Best regards,
James Jones
0402270259
thunderops.ai@gmail.com`
  },
  {
    agendaTitle: 'Send Follow-up Email: Chemist Warehouse (info@chemistwarehouse.com.au) re Missing Call & Targin Script',
    to: 'info@chemistwarehouse.com.au',
    subject: 'Re: HELP!!!!! - Unresolved Missing Targin Script & Phone Call Request',
    threadId: '1a0f6f3b8fafbd3b',
    body: `Hello Customer Service / Management,

I am writing to follow up on my previous urgent emails sent on 1 October 2026 regarding the unresolved issue with my missing Targin prescription at the Wangaratta store.

I explicitly requested a phone call first thing the following morning, and I am extremely disappointed that I have received absolutely no phone call or follow-up from either the Wangaratta store team or head office customer service.

This is a scheduled, critical medication and leaving this completely unaddressed without any communication is unacceptable.

Please have someone from customer service call me first thing monday morning on the number below.

James Jones
Phone: 0402270259
Email: thunderops.ai@gmail.com`
  }
];

export async function sendAll() {
  console.log(`[${new Date().toISOString()}] Starting dispatch of ${emailQueue.length} emails...`);
  for (const item of emailQueue) {
    console.log(`Sending to: ${item.to} [${item.subject}]...`);
    try {
      const res = await sendLiveGmailMessage({
        to: item.to,
        subject: item.subject,
        body: item.body,
        threadId: (item as any).threadId
      });
      console.log(`Result for ${item.to}:`, res.status, res.messageId || res.message);
    } catch (err: any) {
      console.error(`Error sending to ${item.to}:`, err.message);
    }
  }
}

async function runScheduled() {
  const targetTime = new Date('2026-10-11T09:00:00+11:00');
  const now = new Date();
  const delayMs = targetTime.getTime() - now.getTime();

  if (delayMs <= 0) {
    console.log(`Target time ${targetTime.toISOString()} has already passed. Executing immediately.`);
    await sendAll();
    return;
  }

  console.log(`Current time: ${now.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`);
  console.log(`Scheduled target: ${targetTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} (9:00 AM AEDT)`);
  console.log(`Waiting ${(delayMs / 3600000).toFixed(2)} hours (${delayMs} ms) in background...`);

  setTimeout(async () => {
    console.log(`[${new Date().toISOString()}] Reached 9:00 AM AEDT! Firing email queue...`);
    await sendAll();
    console.log('Automated email dispatch complete.');
    process.exit(0);
  }, delayMs);
}

if (process.argv.includes('--send')) {
  sendAll().catch(console.error);
} else if (process.argv.includes('--schedule')) {
  runScheduled().catch(console.error);
}
