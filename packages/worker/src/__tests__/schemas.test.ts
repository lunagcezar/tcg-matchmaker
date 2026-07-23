import { describe, it, expect } from 'vitest';
import {
  EventSchema,
  EventParticipantSchema,
  StoreSchema,
  StoreMembershipSchema,
  TcgSchema,
  FormatSchema,
  NotificationSchema,
  PushSubscriptionSchema,
  ReportSchema,
  UserResponseSchema,
  BracketRoundSchema,
  BracketMatchSchema,
} from '@tcg/shared';

const supabaseTimestamp = '2026-07-23T16:35:29.203528+00:00';

describe('EventSchema', () => {
  it('parses a full event with Supabase-style timestamps', () => {
    const event = {
      id: '00000000-0000-0000-0000-000000000001',
      type: 'match' as const,
      created_by_user_id: '00000000-0000-0000-0000-000000000002',
      organizer_user_id: '00000000-0000-0000-0000-000000000002',
      organizer_store_id: null,
      country: 'Brasil',
      state: 'Ceará',
      city: 'Fortaleza',
      custom_location_name: null,
      lat: -3.7278,
      lng: -38.5274,
      name: 'Test Match',
      description: 'A test',
      details: null,
      scheduled_at: supabaseTimestamp,
      end_at: null,
      status: 'open' as const,
      tcg_id: null,
      tcg_name: null,
      format_id: null,
      format_name: null,
      max_participants: 4,
      bracket_type: null,
      best_of: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
      deleted_at: null,
    };
    expect(() => EventSchema.parse(event)).not.toThrow();
  });
});

describe('EventParticipantSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const participant = {
      id: '00000000-0000-0000-0000-000000000001',
      event_id: '00000000-0000-0000-0000-000000000040',
      user_id: '00000000-0000-0000-0000-000000000002',
      role: 'participant' as const,
      status: 'confirmed' as const,
      confirmed_at: supabaseTimestamp,
      score: null,
      placement: null,
      seed: null,
      created_at: supabaseTimestamp,
    };
    expect(() => EventParticipantSchema.parse(participant)).not.toThrow();
  });
});

describe('StoreSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const store = {
      id: '00000000-0000-0000-0000-000000000030',
      name: 'Test Store',
      slug: 'test-store',
      description: null,
      country: 'Brasil',
      state: 'Ceará',
      city: 'Fortaleza',
      address: 'Rua Teste, 123',
      lat: -3.7278,
      lng: -38.5274,
      phone: null,
      website: null,
      logo_path: null,
      created_by_user_id: '00000000-0000-0000-0000-000000000001',
      is_verified: true,
      status: 'active' as const,
      suspended_at: null,
      suspension_reason: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
      deleted_at: null,
    };
    expect(() => StoreSchema.parse(store)).not.toThrow();
  });
});

describe('StoreMembershipSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const membership = {
      id: '00000000-0000-0000-0000-000000000001',
      store_id: '00000000-0000-0000-0000-000000000030',
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'owner' as const,
      created_at: supabaseTimestamp,
    };
    expect(() => StoreMembershipSchema.parse(membership)).not.toThrow();
  });
});

describe('TcgSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const tcg = {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Test TCG',
      slug: 'test-tcg',
      description: null,
      logo_path: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
      deleted_at: null,
    };
    expect(() => TcgSchema.parse(tcg)).not.toThrow();
  });
});

describe('FormatSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const format = {
      id: '00000000-0000-0000-0000-000000000020',
      tcg_id: '00000000-0000-0000-0000-000000000010',
      name: 'Test Format',
      slug: 'test-format',
      description: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
      deleted_at: null,
    };
    expect(() => FormatSchema.parse(format)).not.toThrow();
  });
});

describe('NotificationSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const notification = {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      type: 'match_join',
      title: 'Test',
      body: 'Test body',
      data: null,
      read_at: null,
      created_at: supabaseTimestamp,
    };
    expect(() => NotificationSchema.parse(notification)).not.toThrow();
  });
});

describe('PushSubscriptionSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const sub = {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      endpoint: 'https://example.com/push',
      p256dh: 'key',
      auth: 'auth',
      user_agent: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
    };
    expect(() => PushSubscriptionSchema.parse(sub)).not.toThrow();
  });
});

describe('ReportSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const report = {
      id: '00000000-0000-0000-0000-000000000050',
      reporter_id: '00000000-0000-0000-0000-000000000002',
      target_type: 'user' as const,
      target_id: '00000000-0000-0000-0000-000000000003',
      reason: 'Test report',
      status: 'pending' as const,
      admin_notes: null,
      created_at: supabaseTimestamp,
      resolved_at: null,
    };
    expect(() => ReportSchema.parse(report)).not.toThrow();
  });
});

describe('UserResponseSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      role: 'admin' as const,
      avatar_path: null,
      banned_at: null,
      suspended_at: null,
      created_at: supabaseTimestamp,
    };
    expect(() => UserResponseSchema.parse(user)).not.toThrow();
  });
});

describe('BracketRoundSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const round = {
      id: '00000000-0000-0000-0000-000000000100',
      event_id: '00000000-0000-0000-0000-000000000040',
      round_number: 1,
      name: 'Finals',
      created_at: supabaseTimestamp,
    };
    expect(() => BracketRoundSchema.parse(round)).not.toThrow();
  });
});

describe('BracketMatchSchema', () => {
  it('parses with Supabase-style timestamps', () => {
    const match = {
      id: '00000000-0000-0000-0000-000000000200',
      round_id: '00000000-0000-0000-0000-000000000100',
      player1_id: null,
      player2_id: null,
      winner_id: null,
      score_player1: null,
      score_player2: null,
      status: 'pending' as const,
      next_match_id: null,
      next_match_player_slot: null,
      scheduled_at: null,
      created_at: supabaseTimestamp,
      updated_at: supabaseTimestamp,
    };
    expect(() => BracketMatchSchema.parse(match)).not.toThrow();
  });
});
