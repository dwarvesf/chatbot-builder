import datetime
import uuid
from typing import Any, List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import (Boolean, DateTime, ForeignKeyConstraint, Index,
                        Integer, PrimaryKeyConstraint, String, Text, Uuid,
                        text)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class LogType(Base):
    __tablename__ = 'log_type'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='log_type_pkey'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(256))


class SubscriptionPlan(Base):
    __tablename__ = 'subscription_plan'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='subscription_plan_pkey'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    weekly_price: Mapped[Optional[int]] = mapped_column(Integer)
    monthly_price: Mapped[Optional[int]] = mapped_column(Integer)
    yearly_price: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    user: Mapped[List['User']] = relationship('User', back_populates='subscription_plan')
    invoice: Mapped[List['Invoice']] = relationship('Invoice', back_populates='plan')


class User(Base):
    __tablename__ = 'user'
    __table_args__ = (
        ForeignKeyConstraint(['subscription_plan_id'], ['subscription_plan.id'], name='user_subscription_plan_id_subscription_plan_id_fk'),
        PrimaryKeyConstraint('id', name='user_pkey')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True,default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    subscription_plan_id: Mapped[Optional[int]] = mapped_column(Integer)
    name: Mapped[Optional[str]] = mapped_column(Text)
    last_name: Mapped[Optional[str]] = mapped_column(Text)
    emailVerified: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    image: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    subscription_plan: Mapped['SubscriptionPlan'] = relationship('SubscriptionPlan', back_populates='user')
    account: Mapped[List['Account']] = relationship('Account', back_populates='user')
    attachment: Mapped[List['Attachment']] = relationship('Attachment', foreign_keys='[Attachment.created_by]', back_populates='user')
    attachment_: Mapped[List['Attachment']] = relationship('Attachment', foreign_keys='[Attachment.updated_by]', back_populates='user_')
    attachment1: Mapped[List['Attachment']] = relationship('Attachment', foreign_keys='[Attachment.user_id]', back_populates='user1')
    bot_model: Mapped[List['BotModel']] = relationship('BotModel', foreign_keys='[BotModel.created_by]', back_populates='user')
    bot_model_: Mapped[List['BotModel']] = relationship('BotModel', foreign_keys='[BotModel.updated_by]', back_populates='user_')
    bot_source_status: Mapped[List['BotSourceStatus']] = relationship('BotSourceStatus', back_populates='user')
    bot_source_type: Mapped[List['BotSourceType']] = relationship('BotSourceType', back_populates='user')
    feedback_type: Mapped[List['FeedbackType']] = relationship('FeedbackType', back_populates='user')
    invoice: Mapped[List['Invoice']] = relationship('Invoice', foreign_keys='[Invoice.created_by]', back_populates='user')
    invoice_: Mapped[List['Invoice']] = relationship('Invoice', foreign_keys='[Invoice.user_id]', back_populates='user_')
    session: Mapped[List['Session']] = relationship('Session', back_populates='user')
    bot: Mapped[List['Bot']] = relationship('Bot', foreign_keys='[Bot.created_by]', back_populates='user')
    bot_: Mapped[List['Bot']] = relationship('Bot', foreign_keys='[Bot.updated_by]', back_populates='user_')
    bot1: Mapped[List['Bot']] = relationship('Bot', foreign_keys='[Bot.user_id]', back_populates='user1')
    bot_integration: Mapped[List['BotIntegration']] = relationship('BotIntegration', foreign_keys='[BotIntegration.created_by]', back_populates='user')
    bot_integration_: Mapped[List['BotIntegration']] = relationship('BotIntegration', foreign_keys='[BotIntegration.updated_by]', back_populates='user_')
    bot_source: Mapped[List['BotSource']] = relationship('BotSource', foreign_keys='[BotSource.created_by]', back_populates='user')
    bot_source_: Mapped[List['BotSource']] = relationship('BotSource', foreign_keys='[BotSource.updated_by]', back_populates='user_')
    thread: Mapped[List['Thread']] = relationship('Thread', foreign_keys='[Thread.created_by]', back_populates='user')
    thread_: Mapped[List['Thread']] = relationship('Thread', foreign_keys='[Thread.updated_by]', back_populates='user_')
    thread1: Mapped[List['Thread']] = relationship('Thread', foreign_keys='[Thread.user_id]', back_populates='user1')
    bot_source_extracted_data: Mapped[List['BotSourceExtractedData']] = relationship('BotSourceExtractedData', back_populates='user')
    chat: Mapped[List['Chat']] = relationship('Chat', foreign_keys='[Chat.chat_user_id]', back_populates='chat_user')
    chat_: Mapped[List['Chat']] = relationship('Chat', foreign_keys='[Chat.created_by]', back_populates='user')
    chat1: Mapped[List['Chat']] = relationship('Chat', foreign_keys='[Chat.updated_by]', back_populates='user_')
    bot_source_extracted_data_vector: Mapped[List['BotSourceExtractedDataVector']] = relationship('BotSourceExtractedDataVector', back_populates='user')
    chat_feedback: Mapped[List['ChatFeedback']] = relationship('ChatFeedback', foreign_keys='[ChatFeedback.created_by]', back_populates='user')
    chat_feedback_: Mapped[List['ChatFeedback']] = relationship('ChatFeedback', foreign_keys='[ChatFeedback.updated_by]', back_populates='user_')


class Account(Base):
    __tablename__ = 'account'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['user.id'], name='account_userId_user_id_fk'),
        PrimaryKeyConstraint('provider', 'providerAccountId', name='account_provider_providerAccountId_pk'),
        Index('account_userId_idx', 'userId')
    )

    userId: Mapped[uuid.UUID] = mapped_column(Uuid)
    type: Mapped[str] = mapped_column(String(255))
    provider: Mapped[str] = mapped_column(String(255), primary_key=True)
    providerAccountId: Mapped[str] = mapped_column(String(255), primary_key=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    access_token: Mapped[Optional[str]] = mapped_column(Text)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer)
    token_type: Mapped[Optional[str]] = mapped_column(String(255))
    scope: Mapped[Optional[str]] = mapped_column(String(255))
    id_token: Mapped[Optional[str]] = mapped_column(Text)
    session_state: Mapped[Optional[str]] = mapped_column(String(255))

    user: Mapped['User'] = relationship('User', back_populates='account')


class Attachment(Base):
    __tablename__ = 'attachment'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='attachment_created_by_user_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='attachment_updated_by_user_id_fk'),
        ForeignKeyConstraint(['user_id'], ['user.id'], name='attachment_user_id_user_id_fk'),
        PrimaryKeyConstraint('id', name='attachment_pkey'),
        Index('attachment_user_id_idx', 'user_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    type_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    original_name: Mapped[Optional[str]] = mapped_column(Text)
    cloud_path: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='attachment')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='attachment_')
    user1: Mapped['User'] = relationship('User', foreign_keys=[user_id], back_populates='attachment1')
    bot: Mapped[List['Bot']] = relationship('Bot', foreign_keys='[Bot.bot_avatar_attachment_id]', back_populates='bot_avatar_attachment')
    bot_: Mapped[List['Bot']] = relationship('Bot', foreign_keys='[Bot.company_logo_attachment_id]', back_populates='company_logo_attachment')


class BotModel(Base):
    __tablename__ = 'bot_model'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_model_created_by_user_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='bot_model_updated_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_model_pkey')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    name: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='bot_model')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='bot_model_')
    bot: Mapped[List['Bot']] = relationship('Bot', back_populates='model')
    chat: Mapped[List['Chat']] = relationship('Chat', back_populates='bot_model')


class BotSourceStatus(Base):
    __tablename__ = 'bot_source_status'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_source_status_created_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_source_status_pkey')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    name: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', back_populates='bot_source_status')


class BotSourceType(Base):
    __tablename__ = 'bot_source_type'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_source_type_created_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_source_type_pkey')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(Text)
    visible: Mapped[Optional[bool]] = mapped_column(Boolean)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', back_populates='bot_source_type')


class FeedbackType(Base):
    __tablename__ = 'feedback_type'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='feedback_type_created_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='feedback_type_pkey')
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    name: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', back_populates='feedback_type')


class Invoice(Base):
    __tablename__ = 'invoice'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['user.id'], name='invoice_created_by_user_id_fk'),
        ForeignKeyConstraint(['plan_id'], ['subscription_plan.id'], name='invoice_plan_id_subscription_plan_id_fk'),
        ForeignKeyConstraint(['user_id'], ['user.id'], name='invoice_user_id_user_id_fk'),
        PrimaryKeyConstraint('id', name='invoice_pkey'),
        Index('invoice_plan_id_idx', 'plan_id'),
        Index('invoice_user_id_idx', 'user_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[int] = mapped_column(Integer)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    amount: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='invoice')
    plan: Mapped['SubscriptionPlan'] = relationship('SubscriptionPlan', back_populates='invoice')
    user_: Mapped['User'] = relationship('User', foreign_keys=[user_id], back_populates='invoice_')


class Session(Base):
    __tablename__ = 'session'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['user.id'], name='session_userId_user_id_fk'),
        PrimaryKeyConstraint('sessionToken', name='session_pkey'),
        Index('session_user_id_idx', 'userId')
    )

    sessionToken: Mapped[str] = mapped_column(String(255), primary_key=True)
    userId: Mapped[uuid.UUID] = mapped_column(Uuid)
    expires: Mapped[datetime.datetime] = mapped_column(DateTime)

    user: Mapped['User'] = relationship('User', back_populates='session')


class Bot(Base):
    __tablename__ = 'bot'
    __table_args__ = (
        ForeignKeyConstraint(['bot_avatar_attachment_id'], ['attachment.id'], name='bot_bot_avatar_attachment_id_attachment_id_fk'),
        ForeignKeyConstraint(['company_logo_attachment_id'], ['attachment.id'], name='bot_company_logo_attachment_id_attachment_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_created_by_user_id_fk'),
        ForeignKeyConstraint(['model_id'], ['bot_model.id'], name='bot_model_id_bot_model_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='bot_updated_by_user_id_fk'),
        ForeignKeyConstraint(['user_id'], ['user.id'], name='bot_user_id_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_pkey')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    model_id: Mapped[int] = mapped_column(Integer)
    status: Mapped[int] = mapped_column(Integer, server_default=text('1'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    name: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    company_logo_attachment_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    bot_avatar_attachment_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    chat_bubble_icon_id: Mapped[Optional[int]] = mapped_column(Integer)
    accent_colour: Mapped[Optional[str]] = mapped_column(Text)
    subheading: Mapped[Optional[str]] = mapped_column(Text)
    welcome_msg: Mapped[Optional[str]] = mapped_column(Text)
    input_box_placeholder: Mapped[Optional[str]] = mapped_column(Text)
    show_branding_on_widget: Mapped[Optional[str]] = mapped_column(Text)
    widget_position: Mapped[Optional[int]] = mapped_column(Integer)
    widget_name: Mapped[Optional[str]] = mapped_column(Text)
    widget_subheading: Mapped[Optional[str]] = mapped_column(Text)
    widget_placeholder: Mapped[Optional[str]] = mapped_column(Text)
    widget_welcome_message: Mapped[Optional[str]] = mapped_column(Text)
    show_source_with_response: Mapped[Optional[str]] = mapped_column(Text)
    post_chat_feedback: Mapped[Optional[str]] = mapped_column(Text)
    widget_open_default: Mapped[Optional[str]] = mapped_column(Text)
    show_floating_welcome_msg: Mapped[Optional[str]] = mapped_column(Text)
    show_floating_starter_questions: Mapped[Optional[str]] = mapped_column(Text)
    uploaded_chars: Mapped[Optional[int]] = mapped_column(Integer)
    max_chars: Mapped[Optional[int]] = mapped_column(Integer)
    max_msg_count: Mapped[Optional[int]] = mapped_column(Integer)
    msg_count: Mapped[Optional[int]] = mapped_column(Integer)
    multi_languages_support: Mapped[Optional[str]] = mapped_column(Text)
    response_length: Mapped[Optional[int]] = mapped_column(Integer)
    send_email_transcript: Mapped[Optional[str]] = mapped_column(Text)
    suggest_followup_questions: Mapped[Optional[str]] = mapped_column(Text)
    customization: Mapped[Optional[str]] = mapped_column(Text)
    no_source_warning_message: Mapped[Optional[str]] = mapped_column(Text)
    server_error_message: Mapped[Optional[str]] = mapped_column(Text)
    no_relevant_context_message: Mapped[Optional[str]] = mapped_column(Text)
    usage_limit_per_user: Mapped[Optional[int]] = mapped_column(Integer)
    usage_limit_per_user_type: Mapped[Optional[int]] = mapped_column(Integer)
    user_limit_warning_msg: Mapped[Optional[str]] = mapped_column(Text)
    while_list_ips_only: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot_avatar_attachment: Mapped['Attachment'] = relationship('Attachment', foreign_keys=[bot_avatar_attachment_id], back_populates='bot')
    company_logo_attachment: Mapped['Attachment'] = relationship('Attachment', foreign_keys=[company_logo_attachment_id], back_populates='bot_')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='bot')
    model: Mapped['BotModel'] = relationship('BotModel', back_populates='bot')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='bot_')
    user1: Mapped['User'] = relationship('User', foreign_keys=[user_id], back_populates='bot1')
    bot_integration: Mapped[List['BotIntegration']] = relationship('BotIntegration', back_populates='bot')
    bot_source: Mapped[List['BotSource']] = relationship('BotSource', back_populates='bot')
    thread: Mapped[List['Thread']] = relationship('Thread', back_populates='bot')


class BotIntegration(Base):
    __tablename__ = 'bot_integration'
    __table_args__ = (
        ForeignKeyConstraint(['bot_id'], ['bot.id'], name='bot_integration_bot_id_bot_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_integration_created_by_user_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='bot_integration_updated_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_integration_pkey'),
        Index('bot_integration_api_token_idx', 'api_token'),
        Index('bot_integration_bot_id_idx', 'bot_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    embeded_token: Mapped[Optional[str]] = mapped_column(Text)
    api_token: Mapped[Optional[str]] = mapped_column(Text)
    white_list_ips: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot: Mapped['Bot'] = relationship('Bot', back_populates='bot_integration')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='bot_integration')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='bot_integration_')


class BotSource(Base):
    __tablename__ = 'bot_source'
    __table_args__ = (
        ForeignKeyConstraint(['bot_id'], ['bot.id'], name='bot_source_bot_id_bot_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_source_created_by_user_id_fk'),
        ForeignKeyConstraint(['parent_id'], ['bot_source.id'], name='bot_sources_parent_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='bot_source_updated_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_source_pkey'),
        Index('bot_source_bot_id_idx', 'bot_id'),
        Index('bot_source_parent_id_idx', 'parent_id'),
        Index('bot_source_status_id_idx', 'status_id'),
        Index('bot_source_type_id_idx', 'type_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    type_id: Mapped[int] = mapped_column(Integer)
    status_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    url: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)
    extracted_token_length: Mapped[Optional[int]] = mapped_column(Integer)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    visible: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    bot: Mapped['Bot'] = relationship('Bot', back_populates='bot_source')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='bot_source')
    parent: Mapped['BotSource'] = relationship('BotSource', remote_side=[id], back_populates='parent_reverse')
    parent_reverse: Mapped[List['BotSource']] = relationship('BotSource', remote_side=[parent_id], back_populates='parent')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='bot_source_')
    bot_source_extracted_data: Mapped[List['BotSourceExtractedData']] = relationship('BotSourceExtractedData', back_populates='bot_source')


class Thread(Base):
    __tablename__ = 'thread'
    __table_args__ = (
        ForeignKeyConstraint(['bot_id'], ['bot.id'], name='thread_bot_id_bot_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='thread_created_by_user_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='thread_updated_by_user_id_fk'),
        ForeignKeyConstraint(['user_id'], ['user.id'], name='thread_user_id_user_id_fk'),
        PrimaryKeyConstraint('id', name='thread_pkey'),
        Index('thread_bot_id_idx', 'bot_id'),
        Index('thread_user_id_idx', 'user_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    title: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot: Mapped['Bot'] = relationship('Bot', back_populates='thread')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='thread')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='thread_')
    user1: Mapped['User'] = relationship('User', foreign_keys=[user_id], back_populates='thread1')
    chat: Mapped[List['Chat']] = relationship('Chat', back_populates='thread')
    chat_feedback: Mapped[List['ChatFeedback']] = relationship('ChatFeedback', back_populates='thread')


class BotSourceExtractedData(Base):
    __tablename__ = 'bot_source_extracted_data'
    __table_args__ = (
        ForeignKeyConstraint(['bot_source_id'], ['bot_source.id'], name='bot_source_extracted_data_bot_source_id_bot_source_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_source_extracted_data_created_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_source_extracted_data_pkey'),
        Index('bot_source_extracted_data_bot_source_id_idx', 'bot_source_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_source_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    data: Mapped[Optional[dict]] = mapped_column(JSONB)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot_source: Mapped['BotSource'] = relationship('BotSource', back_populates='bot_source_extracted_data')
    user: Mapped['User'] = relationship('User', back_populates='bot_source_extracted_data')
    bot_source_extracted_data_vector: Mapped[List['BotSourceExtractedDataVector']] = relationship('BotSourceExtractedDataVector', back_populates='bot_source_extracted_data')


class Chat(Base):
    __tablename__ = 'chat'
    __table_args__ = (
        ForeignKeyConstraint(['bot_model_id'], ['bot_model.id'], name='chat_bot_model_id_bot_model_id_fk'),
        ForeignKeyConstraint(['chat_user_id'], ['user.id'], name='chat_chat_user_id_user_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='chat_created_by_user_id_fk'),
        ForeignKeyConstraint(['parent_chat_id'], ['chat.id'], name='chat_parent_chat_id_fk'),
        ForeignKeyConstraint(['thread_id'], ['thread.id'], name='chat_thread_id_thread_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='chat_updated_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='chat_pkey'),
        Index('chat_chat_user_id_idx', 'chat_user_id'),
        Index('chat_thread_id_idx', 'thread_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    role_id: Mapped[int] = mapped_column(Integer)
    bot_model_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    msg: Mapped[Optional[str]] = mapped_column(Text)
    storage_id: Mapped[Optional[str]] = mapped_column(Text)
    chat_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    parent_chat_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    prompt: Mapped[Optional[str]] = mapped_column(Text)
    promt_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot_model: Mapped['BotModel'] = relationship('BotModel', back_populates='chat')
    chat_user: Mapped['User'] = relationship('User', foreign_keys=[chat_user_id], back_populates='chat')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='chat_')
    parent_chat: Mapped['Chat'] = relationship('Chat', remote_side=[id], back_populates='parent_chat_reverse')
    parent_chat_reverse: Mapped[List['Chat']] = relationship('Chat', remote_side=[parent_chat_id], back_populates='parent_chat')
    thread: Mapped['Thread'] = relationship('Thread', back_populates='chat')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='chat1')
    chat_feedback: Mapped[List['ChatFeedback']] = relationship('ChatFeedback', back_populates='chat')


class BotSourceExtractedDataVector(Base):
    __tablename__ = 'bot_source_extracted_data_vector'
    __table_args__ = (
        ForeignKeyConstraint(['bot_source_extracted_data_id'], ['bot_source_extracted_data.id'], name='bot_source_extracted_data_vector_bot_source_extracted_data_id_b'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='bot_source_extracted_data_vector_created_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='bot_source_extracted_data_vector_pkey'),
        Index('bot_source_extracted_data_vector_bot_source_extracted_data_id_i', 'bot_source_extracted_data_id'),
        Index('bot_source_extracted_data_vector_vector_idx', 'vector')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_source_extracted_data_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    content: Mapped[Optional[str]] = mapped_column(Text)
    vector: Mapped[Optional[Any]] = mapped_column(Vector(1024))
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    bot_source_extracted_data: Mapped['BotSourceExtractedData'] = relationship('BotSourceExtractedData', back_populates='bot_source_extracted_data_vector')
    user: Mapped['User'] = relationship('User', back_populates='bot_source_extracted_data_vector')


class ChatFeedback(Base):
    __tablename__ = 'chat_feedback'
    __table_args__ = (
        ForeignKeyConstraint(['chat_id'], ['chat.id'], name='chat_feedback_chat_id_chat_id_fk'),
        ForeignKeyConstraint(['created_by'], ['user.id'], name='chat_feedback_created_by_user_id_fk'),
        ForeignKeyConstraint(['thread_id'], ['thread.id'], name='chat_feedback_thread_id_thread_id_fk'),
        ForeignKeyConstraint(['updated_by'], ['user.id'], name='chat_feedback_updated_by_user_id_fk'),
        PrimaryKeyConstraint('id', name='chat_feedback_pkey'),
        Index('chat_feedback_id_idx', 'chat_id'),
        Index('feedback_type_id_idx', 'feedback_type'),
        Index('threadId_feedback_id_idx', 'thread_id')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    chat_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    feedback_type: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('now()'))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    chat: Mapped['Chat'] = relationship('Chat', back_populates='chat_feedback')
    user: Mapped['User'] = relationship('User', foreign_keys=[created_by], back_populates='chat_feedback')
    thread: Mapped['Thread'] = relationship('Thread', back_populates='chat_feedback')
    user_: Mapped['User'] = relationship('User', foreign_keys=[updated_by], back_populates='chat_feedback_')