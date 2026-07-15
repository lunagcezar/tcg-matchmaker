import type { SupabaseClient } from '@supabase/supabase-js';

export async function generateRoundRobin(
  supabase: SupabaseClient,
  tournamentId: string,
  playerIds: string[],
) {
  const N = playerIds.length;
  const roundRecords: Array<{ id: string; round_number: number; name: string }> = [];

  const totalRounds = N % 2 === 0 ? N - 1 : N;
  const padded = N % 2 === 0 ? playerIds : [...playerIds, 'BYE'];
  const half = padded.length / 2;

  for (let r = 0; r < totalRounds; r++) {
    const { data: round } = await supabase
      .from('bracket_rounds')
      .insert({
        event_id: tournamentId,
        round_number: r + 1,
        name: `Round ${r + 1}`,
      })
      .select()
      .single();
    if (round) roundRecords.push(round);

    for (let m = 0; m < half; m++) {
      const p1 = padded[m];
      const p2 = padded[padded.length - 1 - m];
      if (p1 !== 'BYE' && p2 !== 'BYE') {
        await supabase.from('bracket_matches').insert({
          round_id: round!.id,
          player1_id: p1,
          player2_id: p2,
          status: 'pending',
        });
      }
    }
    const last = padded.pop()!;
    padded.splice(1, 0, last);
  }
}

export async function generateSwiss(
  supabase: SupabaseClient,
  tournamentId: string,
  playerIds: string[],
) {
  const numRounds = Math.min(7, Math.ceil(Math.log2(playerIds.length)) + 1);
  const roundRecords: Array<{ id: string; round_number: number; name: string }> = [];

  for (let r = 0; r < numRounds; r++) {
    const { data: round } = await supabase
      .from('bracket_rounds')
      .insert({
        event_id: tournamentId,
        round_number: r + 1,
        name: `Round ${r + 1}`,
      })
      .select()
      .single();
    if (round) roundRecords.push(round);

    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    for (let m = 0; m < Math.floor(shuffled.length / 2); m++) {
      await supabase.from('bracket_matches').insert({
        round_id: round!.id,
        player1_id: shuffled[m * 2],
        player2_id: shuffled[m * 2 + 1],
        status: 'pending',
      });
    }
  }
}

export async function generatePoolPlay(
  supabase: SupabaseClient,
  tournamentId: string,
  playerIds: string[],
) {
  const poolSize = 4;
  const pools: string[][] = [];
  for (let i = 0; i < playerIds.length; i += poolSize) {
    pools.push(playerIds.slice(i, i + poolSize));
  }

  for (let pi = 0; pi < pools.length; pi++) {
    const pool = pools[pi].filter((id) => id !== 'BYE');
    const { data: round } = await supabase
      .from('bracket_rounds')
      .insert({
        event_id: tournamentId,
        round_number: pi + 1,
        name: `Pool ${pi + 1}`,
      })
      .select()
      .single();

    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        await supabase.from('bracket_matches').insert({
          round_id: round!.id,
          player1_id: pool[i],
          player2_id: pool[j],
          status: 'pending',
        });
      }
    }
  }

  // Generate knockout round for pool winners
  const topN = Math.min(4, pools.length);
  const { data: koRound } = await supabase
    .from('bracket_rounds')
    .insert({
      event_id: tournamentId,
      round_number: pools.length + 1,
      name: 'Knockout',
    })
    .select()
    .single();

  if (koRound) {
    for (let k = 0; k < Math.floor(topN / 2); k++) {
      await supabase.from('bracket_matches').insert({
        round_id: koRound.id,
        player1_id: null,
        player2_id: null,
        status: 'pending',
      });
    }
  }
}

export async function generateDoubleElimination(
  supabase: SupabaseClient,
  tournamentId: string,
  playerIds: string[],
) {
  const totalRounds = Math.ceil(Math.log2(playerIds.length));
  const roundRecords: Array<{ id: string; round_number: number; name: string }> = [];

  // Winners bracket
  for (let r = 0; r < totalRounds; r++) {
    const name = r === totalRounds - 1 ? 'Winners Final' : `Winners Round ${r + 1}`;
    const { data: round } = await supabase
      .from('bracket_rounds')
      .insert({
        event_id: tournamentId,
        round_number: r + 1,
        name,
      })
      .select()
      .single();
    if (round) roundRecords.push(round);

    const matchCount = Math.pow(2, totalRounds - r - 1);
    for (let m = 0; m < matchCount; m++) {
      const p1 = r === 0 ? (playerIds[m * 2] ?? null) : null;
      const p2 = r === 0 ? (playerIds[m * 2 + 1] ?? null) : null;
      await supabase.from('bracket_matches').insert({
        round_id: round!.id,
        player1_id: p1,
        player2_id: p2,
        status: 'pending',
      });
    }
  }

  // Losers bracket (simplified: single round)
  const { data: losersRound } = await supabase
    .from('bracket_rounds')
    .insert({
      event_id: tournamentId,
      round_number: totalRounds + 1,
      name: 'Losers Bracket',
    })
    .select()
    .single();

  if (losersRound && playerIds.length > 2) {
    const losers = playerIds.slice(2);
    for (let i = 0; i < Math.floor(losers.length / 2); i++) {
      await supabase.from('bracket_matches').insert({
        round_id: losersRound.id,
        player1_id: losers[i * 2],
        player2_id: losers[i * 2 + 1],
        status: 'pending',
      });
    }
  }

  // Grand Final
  const { data: finalRound } = await supabase
    .from('bracket_rounds')
    .insert({
      event_id: tournamentId,
      round_number: totalRounds + 2,
      name: 'Grand Final',
    })
    .select()
    .single();
  if (finalRound) {
    await supabase.from('bracket_matches').insert({
      round_id: finalRound.id,
      player1_id: null,
      player2_id: null,
      status: 'pending',
    });
  }
}
