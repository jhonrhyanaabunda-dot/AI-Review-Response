-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'AGENCY_ADMIN', 'GENERAL_MANAGER', 'MARKETING_DIRECTOR', 'RESPONSE_AGENT');

-- CreateEnum
CREATE TYPE "ReviewPlatform" AS ENUM ('GOOGLE', 'YELP', 'DEALERRATER', 'CARS_DOT_COM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'ANGRY', 'LEGAL_RISK');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FAILED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESPONDED', 'IGNORED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TonePreset" AS ENUM ('LUXURY', 'FRIENDLY', 'CORPORATE', 'OEM_COMPLIANT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EscalationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('REVIEW_INGESTED', 'RESPONSE_GENERATED', 'RESPONSE_APPROVED', 'RESPONSE_REJECTED', 'RESPONSE_EDITED', 'RESPONSE_PUBLISHED', 'RESPONSE_FAILED', 'ESCALATED', 'MEMBER_INVITED', 'MEMBER_REMOVED', 'DEALERSHIP_CREATED', 'DEALERSHIP_UPDATED', 'LOCATION_CREATED', 'TOKEN_ROTATED', 'SETTINGS_UPDATED', 'LOGIN');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "billingEmail" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "featureFlags" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dealershipId" TEXT,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dealershipId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT,
    "websiteUrl" TEXT,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "tonePreset" "TonePreset" NOT NULL DEFAULT 'FRIENDLY',
    "customTone" TEXT,
    "aiInstructions" TEXT,
    "signOff" TEXT,
    "escalationKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autoPublishThreshold" INTEGER NOT NULL DEFAULT 4,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSource" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "platform" "ReviewPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "displayName" TEXT,
    "apiTokenId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncCursor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "locationId" TEXT,
    "sourceId" TEXT NOT NULL,
    "platform" "ReviewPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalUrl" TEXT,
    "authorName" TEXT,
    "authorAvatarUrl" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "language" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "raw" JSONB NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'NEW',
    "assigneeId" TEXT,
    "sentiment" "Sentiment",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewNote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResponse" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "draftBody" TEXT NOT NULL,
    "finalBody" TEXT,
    "sentiment" "Sentiment",
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "legalRisk" BOOLEAN NOT NULL DEFAULT false,
    "containsPii" BOOLEAN NOT NULL DEFAULT false,
    "flaggedReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "model" TEXT NOT NULL,
    "promptVersion" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "generationCostUsd" DECIMAL(10,6),
    "editedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishError" TEXT,
    "publishAttempts" INTEGER NOT NULL DEFAULT 0,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "decision" "ResponseStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "severity" "EscalationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "matchedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealershipId" TEXT,
    "platform" "ReviewPlatform" NOT NULL,
    "label" TEXT,
    "cipherText" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealershipId" TEXT,
    "sourceId" TEXT,
    "platform" "ReviewPlatform" NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "itemsFetched" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "reviewId" TEXT,
    "kind" "ActivityKind" NOT NULL,
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

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
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_dealershipId_key" ON "Membership"("organizationId", "userId", "dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_organizationId_email_key" ON "Invitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Dealership_organizationId_idx" ON "Dealership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Dealership_organizationId_slug_key" ON "Dealership"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Location_dealershipId_idx" ON "Location"("dealershipId");

-- CreateIndex
CREATE INDEX "ReviewSource_platform_idx" ON "ReviewSource"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSource_locationId_platform_externalId_key" ON "ReviewSource"("locationId", "platform", "externalId");

-- CreateIndex
CREATE INDEX "Review_organizationId_status_idx" ON "Review"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Review_dealershipId_postedAt_idx" ON "Review"("dealershipId", "postedAt");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_sentiment_idx" ON "Review"("sentiment");

-- CreateIndex
CREATE UNIQUE INDEX "Review_platform_externalId_key" ON "Review"("platform", "externalId");

-- CreateIndex
CREATE INDEX "ReviewNote_reviewId_idx" ON "ReviewNote"("reviewId");

-- CreateIndex
CREATE INDEX "AiResponse_reviewId_idx" ON "AiResponse"("reviewId");

-- CreateIndex
CREATE INDEX "AiResponse_organizationId_status_idx" ON "AiResponse"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AiResponse_status_createdAt_idx" ON "AiResponse"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Approval_responseId_idx" ON "Approval"("responseId");

-- CreateIndex
CREATE INDEX "Approval_organizationId_idx" ON "Approval"("organizationId");

-- CreateIndex
CREATE INDEX "Escalation_organizationId_resolvedAt_idx" ON "Escalation"("organizationId", "resolvedAt");

-- CreateIndex
CREATE INDEX "Escalation_reviewId_idx" ON "Escalation"("reviewId");

-- CreateIndex
CREATE INDEX "ApiToken_organizationId_platform_idx" ON "ApiToken"("organizationId", "platform");

-- CreateIndex
CREATE INDEX "SyncJob_organizationId_status_idx" ON "SyncJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SyncJob_platform_createdAt_idx" ON "SyncJob"("platform", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_reviewId_idx" ON "ActivityLog"("reviewId");

-- CreateIndex
CREATE INDEX "ActivityLog_kind_idx" ON "ActivityLog"("kind");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dealership" ADD CONSTRAINT "Dealership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSource" ADD CONSTRAINT "ReviewSource_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSource" ADD CONSTRAINT "ReviewSource_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ReviewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponse" ADD CONSTRAINT "AiResponse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponse" ADD CONSTRAINT "AiResponse_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponse" ADD CONSTRAINT "AiResponse_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AiResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ReviewSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;
