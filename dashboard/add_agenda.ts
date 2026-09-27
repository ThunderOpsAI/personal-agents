import { createAgendaItem } from './lib/db';

async function main() {
    const items = [
        // Monday (2026-09-28)
        { item_type: 'task', title: 'Check in cops', scheduled_time: '2026-09-28T08:00:00+10:00' },
        { item_type: 'task', title: 'Call Legal Aid - follow up', scheduled_time: '2026-09-28T08:30:00+10:00' },
        { item_type: 'task', title: 'Call Deakin back', scheduled_time: '2026-09-28T09:00:00+10:00' },
        { item_type: 'task', title: 'Call Persistence Pain', scheduled_time: '2026-09-28T09:15:00+10:00' },
        { item_type: 'task', title: 'Call Gateway Health and get another appointment with Reno', scheduled_time: '2026-09-28T09:30:00+10:00' },
        { item_type: 'task', title: 'F-up on mican script - call and see if I can skip the', scheduled_time: '2026-09-28T10:00:00+10:00' },

        // Tuesday (2026-09-29)
        { item_type: 'task', title: 'Follow-up Toddhunter & private health', scheduled_time: '2026-09-29T09:00:00+10:00' },
        { item_type: 'task', title: 'Follow-up Frank Heak Health and get Silver Plus', scheduled_time: '2026-09-29T10:00:00+10:00' },

        // Wednesday (2026-09-30)
        { item_type: 'task', title: 'Check in cops', scheduled_time: '2026-09-30T08:00:00+10:00' },

        // Thursday (2026-10-01)
        { item_type: 'task', title: 'Betmate Project', scheduled_time: '2026-10-01T09:00:00+10:00' },

        // Friday (2026-10-02)
        { item_type: 'task', title: 'Check in cops for next week', scheduled_time: '2026-10-02T08:00:00+10:00' }
    ];

    for (const item of items) {
        await createAgendaItem(item);
        console.log(`Added: ${item.title} on ${item.scheduled_time}`);
    }
}

main().catch(console.error);
