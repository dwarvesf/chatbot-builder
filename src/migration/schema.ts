import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const logTypes = createTable(
  "log_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
  },
  () => ({})
);

export const subscriptionPlans = createTable(
  "subscription_plans",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    weeklyPrice: integer("weekly_price"),
    monthlyPrice: integer("monthly_price"),
    yearlyPrice: integer("yearly_price"),
    createdAt: timestamp("created_at")
  },
  () => ({})
);

export const users = createTable("users", {
  id: uuid("id").notNull().primaryKey(),
  subscriptionPlanId: integer("subscription_plan_id").notNull().references(() => subscriptionPlans.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  updatedBy: uuid("updated_by"),
});

export const sessions = createTable(
  "sessions",
  {
    sessionToken: varchar("token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const attachments = createTable(
  "attachments",
  {
    id: uuid("id").notNull().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    typeId: integer("type_id").notNull(),
    originalName: text("original_name"),
    cloudPath: text("cloud_path"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (attachment) => ({
    userIdIdx: index("attachment_user_id_idx").on(attachment.userId),
  })
);

export const federatedCredentials = createTable(
  "federated_credentials",
  {
    id: uuid("id").notNull().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    providerId: integer("provider_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (credential) => ({
    userIdIdx: index("federated_credentials_user_id_idx").on(credential.userId),
  })
);

export const botModels = createTable(
  "bot_models",
  {
    id: integer("id").notNull().primaryKey(),
    name: text("name"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (model) => ({
  })
);

export const bots = createTable(
  "bots",
  {
    id: uuid("id").notNull().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    name: text("name"),
    description: text("description"),
    companyLogoAttachmentId: uuid("company_logo_attachment_id").references(() => attachments.id),
    botAvatarAttachmentId: uuid("bot_avatar_attachment_id").references(() => attachments.id),
    chatBubbleIconId: integer("chat_bubble_icon_id"),
    accentColour: text("accent_colour"),
    subheading: text("subheading"),
    welcomeMsg: text("welcome_msg"),
    inputBoxPlaceholder: text("input_box_placeholder"),
    showBrandingOnWidget: text("show_branding_on_widget"),
    widgetPosition: integer("widget_position"),
    showSourceWithResponse: text("show_source_with_response"),
    postChatFeedback: text("post_chat_feedback"),
    widgetOpenDefault: text("widget_open_default"),
    showFloatingWelcomeMsg: text("show_floating_welcome_msg"),
    showFloatingStarterQuestions: text("show_floating_starter_questions"),
    uploadedChars: integer("uploaded_chars"),
    maxChars: integer("max_chars"),
    maxMsgCount: integer("max_msg_count"),
    msgCount: integer("msg_count"),
    modelId: integer("model_id").notNull().references(() => botModels.id),
    multiLanguagesSupport: text("multi_languages_support"),
    responseLength: integer("response_length"),
    sendEmailTranscript: text("send_email_transcript"),
    suggestFollowupQuestions: text("suggest_followup_questions"),
    customization: text("customization"),
    usageLimitPerUser: integer("usage_limit_per_user"),
    usageLimitPerUserType: integer("usage_limit_per_user_type"),
    userLimitWarningMsg: text("user_limit_warning_msg"),
    whileListIpsOnly: text("while_list_ips_only"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (bot) => ({
    // userIdIdx: index("bot_user_id_idx").on(bot.userId),
    // modelIdIdx: index("bot_model_id_idx").on(bot.modelId),
  })
);

export const botSources = createTable(
  "bot_sources",
  {
    id: uuid("id").notNull().primaryKey(),
    botId: uuid("bot_id").notNull().references(() => bots.id),
    parentId: uuid("parent_id"),
    typeId: integer("type_id").notNull(),
    statusId: integer("status_id").notNull(),
    url: text("url"),
    extractedTokenLength: integer("extracted_token_length"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (source) => ({
    parentReference: foreignKey({
      columns: [source.parentId],
      foreignColumns: [source.id],
      name: "bot_sources_parent_id_fk",
    }),

    botIdIdx: index("bot_source_bot_id_idx").on(source.botId),
    parentIdIdx: index("bot_source_parent_id_idx").on(source.parentId),
    typeIdIdx: index("bot_source_type_id_idx").on(source.typeId),
    statusIdIdx: index("bot_source_status_id_idx").on(source.statusId),
  })
);

export const botSourceTypes = createTable(
  "bot_source_types",
  {
    id: integer("id").notNull().primaryKey(),
    name: text("name"),
    createdAt: timestamp("created_at"),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (type) => ({
  })
);

export const botSourceStatuses = createTable(
  "bot_source_statuses",
  {
    id: integer("id").notNull().primaryKey(),
    name: text("name"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (status) => ({
  })
);

export const botSourceExtractedDatas = createTable(
  "bot_source_extracted_datas",
  {
    id: uuid("id").notNull().primaryKey(),
    botSourceId: uuid("bot_source_id").notNull().references(() => botSources.id),
    data: text("data"), // TODO: store this in NoSQL
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (data) => ({
    botSourceIdIdx: index("bot_source_extracted_data_bot_source_id_idx").on(data.botSourceId),
  })
);

export const botConnects = createTable(
  "bot_connects",
  {
    id: uuid("id").notNull().primaryKey(),
    botId: uuid("bot_id").notNull().references(() => bots.id),
    embededToken: text("embeded_token"),
    apiToken: text("api_token"),
    whiteListIps: text("white_list_ips"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (connect) => ({
    botIdIdx: index("bot_connect_bot_id_idx").on(connect.botId),
  })
);

export const threads = createTable(
  "threads",
  {
    id: uuid("id").notNull().primaryKey(),
    botId: uuid("bot_id").notNull().references(() => bots.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    title: text("title"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (thread) => ({
    botIdIdx: index("thread_bot_id_idx").on(thread.botId),
    userIdIdx: index("thread_user_id_idx").on(thread.userId),
  })
);

export const chats = createTable(
  "chats",
  {
    id: uuid("id").notNull().primaryKey(),
    threadId: uuid("thread_id").notNull().references(() => threads.id),
    roleId: integer("role_id").notNull(),
    msg: text("msg"),
    storageId: text("storage_id"),
    chatUserId: uuid("chat_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at"),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (chat) => ({
    threadIdIdx: index("chat_thread_id_idx").on(chat.threadId),
    chatUserIdIdx: index("chat_chat_user_id_idx").on(chat.chatUserId),
  })
);

export const chatUsers = createTable(
  "chat_users",
  {
    id: uuid("id").notNull().primaryKey(),
    ip: text("ip"),
    city: text("city"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (user) => ({
  })
);

export const invoices = createTable(
  "invoices",
  {
    id: uuid("id").notNull().primaryKey(),
    planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    amount: text("amount"),
    createdAt: timestamp("created_at").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (invoice) => ({
    planIdIdx: index("invoice_plan_id_idx").on(invoice.planId),
    userIdIdx: index("invoice_user_id_idx").on(invoice.userId),
  })
);
