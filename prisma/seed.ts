import { PrismaClient, LeadStatus, CampaignStatus, ActivityType, ContactSource } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const admin = await db.user.upsert({
    where: { email: 'admin@salesfunnel.local' },
    update: {},
    create: {
      email: 'admin@salesfunnel.local',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const companies = await Promise.all([
    db.company.create({
      data: {
        name: 'Acme Dental Group',
        website: 'https://acmedental.com',
        domain: 'acmedental.com',
        industry: 'Healthcare / Dental',
        city: 'Austin',
        state: 'TX',
        description: 'Multi-location dental practice serving the Austin metro area.',
      },
    }),
    db.company.create({
      data: {
        name: 'Sunridge Physical Therapy',
        website: 'https://sunridgept.com',
        domain: 'sunridgept.com',
        industry: 'Healthcare / Physical Therapy',
        city: 'Denver',
        state: 'CO',
        description: 'Outpatient physical therapy clinic focused on sports rehabilitation.',
      },
    }),
    db.company.create({
      data: {
        name: 'Pinnacle Chiropractic',
        website: 'https://pinnaclechiro.com',
        domain: 'pinnaclechiro.com',
        industry: 'Healthcare / Chiropractic',
        city: 'Nashville',
        state: 'TN',
        description: 'Family chiropractic practice with three locations.',
      },
    }),
    db.company.create({
      data: {
        name: 'Harbor View Optometry',
        website: 'https://harborvieweye.com',
        domain: 'harborvieweye.com',
        industry: 'Healthcare / Optometry',
        city: 'San Diego',
        state: 'CA',
        description: 'Independent optometry practice specializing in family eye care.',
      },
    }),
    db.company.create({
      data: {
        name: 'Westside Veterinary Clinic',
        website: 'https://westsidevet.com',
        domain: 'westsidevet.com',
        industry: 'Veterinary',
        city: 'Portland',
        state: 'OR',
        description: 'Full-service veterinary clinic serving small and large animals.',
      },
    }),
  ]);

  const contacts = await Promise.all(
    companies.map((company, i) => {
      const contactData = [
        { firstName: 'Dr. Sarah', lastName: 'Chen', title: 'Owner / Lead Dentist', email: 'sarah.chen@acmedental.com' },
        { firstName: 'Mike', lastName: 'Torres', title: 'Practice Manager', email: 'mike.torres@sunridgept.com' },
        { firstName: 'Dr. James', lastName: 'Whitfield', title: 'Founder & Chiropractor', email: 'james@pinnaclechiro.com' },
        { firstName: 'Lisa', lastName: 'Park', title: 'Office Manager', email: 'lisa.park@harborvieweye.com' },
        { firstName: 'Dr. Emma', lastName: 'Walsh', title: 'Owner / Veterinarian', email: 'emma@westsidevet.com' },
      ][i]!;
      return db.contact.create({
        data: {
          companyId: company.id,
          ...contactData,
          fullName: `${contactData.firstName} ${contactData.lastName}`,
          source: ContactSource.MANUAL,
        },
      });
    })
  );

  const statuses: LeadStatus[] = [
    LeadStatus.NEW,
    LeadStatus.ENRICHING,
    LeadStatus.ENRICHED,
    LeadStatus.READY,
    LeadStatus.IN_CAMPAIGN,
    LeadStatus.REPLIED,
    LeadStatus.NEW,
    LeadStatus.ENRICHED,
    LeadStatus.READY,
    LeadStatus.ARCHIVED,
  ];

  const leads = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const company = companies[i % companies.length]!;
      const contact = contacts[i % contacts.length]!;
      return db.lead.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          status: statuses[i]!,
          source: i < 5 ? 'manual' : 'csv',
        },
      });
    })
  );

  const templates = await Promise.all([
    db.emailTemplate.create({
      data: {
        name: 'Initial Outreach — Healthcare Practices',
        description: 'First-touch email for healthcare practice owners and managers.',
        subject: 'Quick question about {{company_name}}',
        bodyText: `Hi {{first_name}},

I came across {{company_name}} and wanted to reach out directly.

{{personalization_hook}}

We work with practices like yours to {{value_prop}}. Most see results within the first 30 days.

Would it make sense to have a quick 15-minute call this week to see if there's a fit?

Best,
{{sender_name}}`,
        variables: ['first_name', 'company_name', 'personalization_hook', 'value_prop', 'sender_name'],
      },
    }),
    db.emailTemplate.create({
      data: {
        name: 'Follow-Up #1 — Bump',
        description: 'Short follow-up referencing prior email.',
        subject: 'Re: Quick question about {{company_name}}',
        bodyText: `Hi {{first_name}},

Just wanted to bump this up in case it got buried.

{{follow_up_hook}}

Happy to keep it to 15 minutes. Does any time this week work?

{{sender_name}}`,
        variables: ['first_name', 'company_name', 'follow_up_hook', 'sender_name'],
      },
    }),
  ]);

  const campaign = await db.campaign.create({
    data: {
      name: 'Q3 Healthcare Outreach',
      description: 'Targeting independent healthcare practices in TX, CO, TN, CA, OR.',
      status: CampaignStatus.ACTIVE,
      autoSend: false,
      dailySendLimit: 30,
      createdByUserId: admin.id,
      sequences: {
        create: [
          { stepNumber: 1, name: 'Initial Email', delayDays: 0, templateId: templates[0]!.id },
          { stepNumber: 2, name: 'Follow-Up 1',  delayDays: 3, templateId: templates[1]!.id },
          { stepNumber: 3, name: 'Follow-Up 2',  delayDays: 7 },
          { stepNumber: 4, name: 'Follow-Up 3',  delayDays: 12 },
        ],
      },
    },
  });

  await db.campaign.create({
    data: {
      name: 'Veterinary Clinics — West Coast',
      description: 'Draft campaign targeting vet clinics in Pacific Northwest.',
      status: CampaignStatus.DRAFT,
      autoSend: false,
      dailySendLimit: 20,
      createdByUserId: admin.id,
    },
  });

  // Add some leads to the active campaign
  const activeLeads = leads.filter((l) =>
    l.status === LeadStatus.IN_CAMPAIGN || l.status === LeadStatus.REPLIED || l.status === LeadStatus.READY
  );
  await Promise.all(
    activeLeads.map((lead) =>
      db.campaignLead.create({
        data: { campaignId: campaign.id, leadId: lead.id, currentStep: 1 },
      })
    )
  );

  // Activity log entries
  await Promise.all([
    db.activityLog.create({
      data: {
        userId: admin.id,
        type: ActivityType.CAMPAIGN_CREATED,
        description: 'Created campaign "Q3 Healthcare Outreach"',
        metadata: { campaignId: campaign.id },
      },
    }),
    db.activityLog.create({
      data: {
        leadId: leads[0]!.id,
        userId: admin.id,
        type: ActivityType.LEAD_CREATED,
        description: `Lead created for ${companies[0]!.name}`,
      },
    }),
    db.activityLog.create({
      data: {
        leadId: leads[4]!.id,
        userId: admin.id,
        type: ActivityType.LEAD_ADDED_TO_CAMPAIGN,
        description: `Lead added to campaign "Q3 Healthcare Outreach"`,
        metadata: { campaignId: campaign.id },
      },
    }),
  ]);

  console.log('Seed complete.');
  console.log(`  Users: 1`);
  console.log(`  Companies: ${companies.length}`);
  console.log(`  Contacts: ${contacts.length}`);
  console.log(`  Leads: ${leads.length}`);
  console.log(`  Campaigns: 2`);
  console.log(`  Templates: ${templates.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
