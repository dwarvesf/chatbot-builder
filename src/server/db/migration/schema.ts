import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { type AdapterAccount } from 'next-auth/adapters'
import { BotSourceStatusEnum } from '~/model/bot-source-status'
import { type RetrievalModel } from '~/server/api/core/types/retrieval-model'
import { vector } from '~/server/db/migration/vector'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`)

export const logTypes = createTable(
  'log_type',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }),
  },
  () => ({}),
)

export const subscriptionPlans = createTable(
  'subscription_plan',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    description: text('description'),
    weeklyPrice: integer('weekly_price'),
    monthlyPrice: integer('monthly_price'),
    yearlyPrice: integer('yearly_price'),
    createdAt: timestamp('created_at'),
  },
  () => ({}),
)

export const users = createTable('user', {
  id: uuid('id').notNull().primaryKey(),
  subscriptionPlanId: integer('subscription_plan_id').references(
    () => subscriptionPlans.id,
  ),
  name: text('name'),
  lastName: text('last_name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at'),
  updatedBy: uuid('updated_by'),
})

export const accounts = createTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (self) => ({
    compoundKey: primaryKey({
      columns: [self.provider, self.providerAccountId],
    }),
    // userIdIdx: index('account_userId_idx').on(self.userId),
  }),
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessions = createTable(
  'session',
  {
    sessionToken: varchar('sessionToken', { length: 255 })
      .notNull()
      .primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (session) => ({
    // userIdIdx: index('session_user_id_idx').on(session.userId),
  }),
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const attachments = createTable(
  'attachment',
  {
    id: uuid('id').notNull().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    typeId: integer('type_id').notNull(),
    originalName: text('original_name'),
    cloudPath: text('cloud_path'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (attachment) => ({
    userIdIdx: index('attachment_user_id_idx').on(attachment.userId),
  }),
)

export const botModels = createTable(
  'bot_model',
  {
    id: integer('id').notNull().primaryKey(),
    name: text('name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (model) => ({}),
)

export const bots = createTable(
  'bot',
  {
    id: uuid('id').notNull().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name'),
    description: text('description'),
    companyLogoAttachmentId: uuid('company_logo_attachment_id').references(
      () => attachments.id,
    ),
    botAvatarAttachmentId: uuid('bot_avatar_attachment_id').references(
      () => attachments.id,
    ),
    chatBubbleIconId: integer('chat_bubble_icon_id'),
    accentColour: text('accent_colour'),
    subheading: text('subheading'),
    welcomeMsg: text('welcome_msg'),
    inputBoxPlaceholder: text('input_box_placeholder'),
    showBrandingOnWidget: text('show_branding_on_widget'),
    widgetPosition: integer('widget_position'),
    widgetName: text('widget_name'),
    widgetSubheading: text('widget_subheading'),
    widgetPlaceholder: text('widget_placeholder'),
    widgetWelcomeMsg: text('widget_welcome_message'),
    showSourceWithResponse: text('show_source_with_response'),
    postChatFeedback: text('post_chat_feedback'),
    widgetOpenDefault: text('widget_open_default'),
    showFloatingWelcomeMsg: text('show_floating_welcome_msg'),
    showFloatingStarterQuestions: text('show_floating_starter_questions'),
    uploadedChars: integer('uploaded_chars'),
    maxChars: integer('max_chars'),
    maxMsgCount: integer('max_msg_count'),
    msgCount: integer('msg_count'),
    modelId: integer('model_id')
      .notNull()
      .references(() => botModels.id),
    multiLanguagesSupport: text('multi_languages_support'),
    responseLength: integer('response_length'),
    sendEmailTranscript: text('send_email_transcript'),
    suggestFollowupQuestions: text('suggest_followup_questions'),
    customization: text('customization'),
    noSourceWarningMsg: text('no_source_warning_message'),
    serverErrorMsg: text('server_error_message'),
    noRelevantContextMsg: text('no_relevant_context_message'),
    usageLimitPerUser: integer('usage_limit_per_user'),
    usageLimitPerUserType: integer('usage_limit_per_user_type'),
    userLimitWarningMsg: text('user_limit_warning_msg'),
    whileListIpsOnly: text('while_list_ips_only'),
    status: integer('status').notNull().default(BotSourceStatusEnum.Pending),
    cacheResponseSecs: integer('cache_response_secs').notNull().default(0),
    cacheEmbeddingSecs: integer('cache_embedding_secs').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (bot) => ({
    // userIdIdx: index("bot_user_id_idx").on(bot.userId),
    // modelIdIdx: index("bot_model_id_idx").on(bot.modelId),
  }),
)

export const botSources = createTable(
  'bot_source',
  {
    id: uuid('id').notNull().primaryKey(),
    botId: uuid('bot_id')
      .notNull()
      .references(() => bots.id),
    parentId: uuid('parent_id'),
    typeId: integer('type_id').notNull(),
    statusId: integer('status_id').notNull(),
    url: text('url'),
    name: text('name'),
    retrievalModel: jsonb('retrieval_model').$type<RetrievalModel>(),
    extractedTokenLength: integer('extracted_token_length'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
    visible: boolean('visible').default(true),
  },
  (source) => ({
    parentReference: foreignKey({
      columns: [source.parentId],
      foreignColumns: [source.id],
      name: 'bs_parent_id_fk',
    }),

    botIdIdx: index('bs_bot_id_idx').on(source.botId),
    parentIdIdx: index('bs_parent_id_idx').on(source.parentId),
    typeIdIdx: index('bs_type_id_idx').on(source.typeId),
    statusIdIdx: index('bs_status_id_idx').on(source.statusId),
  }),
)

export const botSourceTypes = createTable(
  'bot_source_type',
  {
    id: integer('id').notNull().primaryKey(),
    name: text('name'),
    visible: boolean('visible'),
    createdAt: timestamp('created_at'),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (type) => ({}),
)

export const botSourceStatuses = createTable(
  'bot_source_status',
  {
    id: integer('id').notNull().primaryKey(),
    name: text('name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (status) => ({}),
)

export const botSourceExtractedData = createTable(
  'bot_source_extracted_data',
  {
    id: uuid('id').notNull().primaryKey(),
    botSourceId: uuid('bot_source_id')
      .notNull()
      .references(() => botSources.id),
    data: jsonb('data'), // TODO: store this in NoSQL
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (data) => ({
    botSourceIdIdx: index('bot_source_extracted_data_bot_source_id_idx').on(
      data.botSourceId,
    ),
  }),
)

export const botSourceExtractedDataVector = createTable(
  'bot_source_extracted_data_vector',
  {
    id: uuid('id').notNull().primaryKey(),
    botSourceExtractedDataId: uuid('bot_source_extracted_data_id')
      .notNull()
      .references(() => botSourceExtractedData.id),
    content: text('content'),
    vector: vector('vector', { dimensions: 1024 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (vector) => ({
    botSourceExtractedDataIdIdx: index(
      'bot_source_extracted_data_vector_bot_source_extracted_data_id_idx',
    ).on(vector.botSourceExtractedDataId),
    contentSearchIndex: index(
      'bot_source_extracted_data_vector_content_search_idx',
    ).using('gin', sql`to_tsvector('english', ${vector.content})`),
    vectorIdx: index('bot_source_extracted_data_vector_vector_idx').using(
      'hnsw',
      vector.vector.op('vector_cosine_ops'),
    ),
  }),
)

export const botIntegrations = createTable(
  'bot_integration',
  {
    id: uuid('id').notNull().primaryKey(),
    botId: uuid('bot_id')
      .notNull()
      .references(() => bots.id),
    embeddedToken: text('embedded_token'),
    apiToken: text('api_token'),
    whiteListIps: text('white_list_ips'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (table) => ({
    botIdIdx: index('bot_integration_bot_id_idx').on(table.botId),
    apiTokenIdx: index('bot_integration_api_token_idx').on(table.apiToken),
  }),
)

export const threads = createTable(
  'thread',
  {
    id: uuid('id').notNull().primaryKey(),
    botId: uuid('bot_id')
      .notNull()
      .references(() => bots.id),
    userId: uuid('user_id').references(() => users.id),
    title: text('title'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (thread) => ({
    botIdIdx: index('thread_bot_id_idx').on(thread.botId),
    userIdIdx: index('thread_user_id_idx').on(thread.userId),
  }),
)

export const chats = createTable(
  'chat',
  {
    id: uuid('id').notNull().primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id),
    roleId: integer('role_id').notNull(),
    msg: text('msg'),
    storageId: text('storage_id'),
    botModelId: integer('bot_model_id')
      .notNull()
      .references(() => botModels.id),
    chatUserId: uuid('chat_user_id').references(() => users.id),
    parentChatId: uuid('parent_chat_id'),
    prompt: text('prompt'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    totalTokens: integer('total_tokens'),
    cachedFromChatId: uuid('cached_from_chat_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (chat) => ({
    threadIdIdx: index('chat_thread_id_idx').on(chat.threadId),
    chatUserIdIdx: index('chat_chat_user_id_idx').on(chat.chatUserId),
    parentReference: foreignKey({
      columns: [chat.parentChatId],
      foreignColumns: [chat.id],
      name: 'chat_parent_chat_id_fk',
    }),
  }),
)

export const chatFeedbacks = createTable(
  'chat_feedback',
  {
    id: uuid('id').notNull().primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id),
    typeId: integer('feedback_type').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at'),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  (chat_feedback) => ({
    threadIdFeedbackIdIdx: index('threadId_feedback_id_idx').on(
      chat_feedback.threadId,
    ),
    chatFeedbackIdIdx: index('chat_feedback_id_idx').on(chat_feedback.chatId),
    typeIdIdx: index('feedback_type_id_idx').on(chat_feedback.typeId),
  }),
)

export const feedbackTypes = createTable(
  'feedback_type',
  {
    id: integer('id').notNull().primaryKey(),
    name: text('name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (feedback_type) => ({}),
)

export const invoices = createTable(
  'invoice',
  {
    id: uuid('id').notNull().primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    amount: text('amount'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (invoice) => ({
    planIdIdx: index('invoice_plan_id_idx').on(invoice.planId),
    userIdIdx: index('invoice_user_id_idx').on(invoice.userId),
  }),
)

export const kvCache = createTable(
  'kv_cache',
  {
    id: uuid('id').notNull().primaryKey(),
    typeId: integer('type_id'),
    botId: uuid('bot_id').references(() => bots.id),
    key: text('key').notNull(),
    value: jsonb('value'),
    vector: vector('vector', { dimensions: 1024 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiredAt: timestamp('expired_at'),
  },
  (self) => ({
    vectorHnswIndex: sql`CREATE INDEX kv_cache_vector_hnsw_idx ON kv_cache USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 64)`,
  }),
)
