-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ENRICHING', 'ENRICHED', 'ENRICHMENT_FAILED', 'READY', 'IN_CAMPAIGN', 'REPLIED', 'OPTED_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'API_IMPORT', 'ENRICHED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignLeadStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'OPTED_OUT', 'BOUNCED');

-- CreateEnum
CREATE TYPE "EmailDraftStatus" AS ENUM ('PENDING_GENERATION', 'GENERATED', 'APPROVED', 'EDITED', 'REJECTED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailMessageStatus" AS ENUM ('SCHEDULED', 'SENT', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LEAD_CREATED', 'LEAD_ENRICHED', 'LEAD_ADDED_TO_CAMPAIGN', 'DRAFT_GENERATED', 'DRAFT_APPROVED', 'DRAFT_REJECTED', 'EMAIL_SENT', 'EMAIL_FAILED', 'REPLY_DETECTED', 'FOLLOWUP_SCHEDULED', 'FOLLOWUP_SENT', 'LEAD_OPTED_OUT', 'NOTE_ADDED', 'LEAD_IMPORTED', 'CAMPAIGN_CREATED', 'CAMPAIGN_ACTIVATED', 'CAMPAIGN_PAUSED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GMAIL', 'SENDGRID', 'MAILGUN', 'POSTMARK', 'SES');

-- CreateEnum
CREATE TYPE "EnrichmentProvider" AS ENUM ('WEBSITE_SCRAPE', 'CLEARBIT', 'APOLLO', 'ZOOMINFO', 'GOOGLE_PLACES');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "IntegrationAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "accountEmail" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "domain" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "logoUrl" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
    "confidenceScore" DOUBLE PRECISION,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "importBatchId" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "autoSend" BOOLEAN NOT NULL DEFAULT false,
    "fromName" TEXT,
    "replyTo" TEXT,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 50,
    "createdByUserId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSequence" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "templateId" TEXT,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" "CampaignLeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextFollowUpAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "variables" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "campaignLeadId" TEXT,
    "sequenceId" TEXT,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "EmailDraftStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPromptSnapshot" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "integrationAccountId" TEXT,
    "provider" "IntegrationProvider",
    "providerMessageId" TEXT,
    "providerThreadId" TEXT,
    "toEmail" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpSchedule" (
    "id" TEXT NOT NULL,
    "campaignLeadId" TEXT NOT NULL,
    "parentMessageId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "EnrichmentProvider" NOT NULL,
    "rawData" JSONB,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "enrichedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizationRecord" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "companySummary" TEXT,
    "painPoints" TEXT[],
    "outreachAngle" TEXT,
    "icebreaker" TEXT,
    "fitSummary" TEXT,
    "subjectSuggestions" TEXT[],
    "dataQualityNotes" TEXT,
    "aiModel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "campaignId" TEXT,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "TrackingEventType" NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT,
    "source" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationAccount_userId_provider_key" ON "IntegrationAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSequence_campaignId_stepNumber_key" ON "CampaignSequence"("campaignId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignLead_campaignId_leadId_key" ON "CampaignLead"("campaignId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_draftId_key" ON "EmailMessage"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizationRecord_leadId_key" ON "PersonalizationRecord"("leadId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSequence" ADD CONSTRAINT "CampaignSequence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSequence" ADD CONSTRAINT "CampaignSequence_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_campaignLeadId_fkey" FOREIGN KEY ("campaignLeadId") REFERENCES "CampaignLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "CampaignSequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "EmailDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_integrationAccountId_fkey" FOREIGN KEY ("integrationAccountId") REFERENCES "IntegrationAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSchedule" ADD CONSTRAINT "FollowUpSchedule_campaignLeadId_fkey" FOREIGN KEY ("campaignLeadId") REFERENCES "CampaignLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSchedule" ADD CONSTRAINT "FollowUpSchedule_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentRecord" ADD CONSTRAINT "EnrichmentRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizationRecord" ADD CONSTRAINT "PersonalizationRecord_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

