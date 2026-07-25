<template>
  <q-card v-if="matches.length > 0" class="q-mt-md">
    <q-card-section>
      <h6>{{ $t('tournament.bracket') }}</h6>
    </q-card-section>
    <q-list>
      <q-item v-for="(m, idx) in matches" :key="m.id || idx" class="column items-start q-py-sm">
        <div class="row items-center q-gutter-sm full-width">
          <span :class="{ 'text-weight-bold': m.winner === m.player1 }" class="col-4">{{
            m.player1 || 'TBD'
          }}</span>
          <span class="col-1 text-center">vs</span>
          <span :class="{ 'text-weight-bold': m.winner === m.player2 }" class="col-4">{{
            m.player2 || 'TBD'
          }}</span>
          <StatusBadge :status="m.status || 'pending'" class="col-2" />
        </div>
        <div v-if="m.status === 'pending'" class="row q-gutter-xs q-mt-xs items-center">
          <q-input
            v-model="m.score1"
            type="number"
            label="P1 Score"
            dense
            outlined
            style="width: 80px"
            min="0"
          />
          <q-input
            v-model="m.score2"
            type="number"
            label="P2 Score"
            dense
            outlined
            style="width: 80px"
            min="0"
          />
          <q-btn dense size="sm" color="primary" label="Submit" @click="report(m)" />
          <q-btn
            dense
            size="sm"
            color="negative"
            :label="$t('tournament.walkover')"
            @click="walkover(m)"
          />
        </div>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/atoms/StatusBadge.vue';

export interface BracketRow {
  id: string;
  player1?: string;
  player2?: string;
  winner?: string;
  status?: string;
  score1?: number;
  score2?: number;
}

interface Props {
  matches: BracketRow[];
}

defineProps<Props>();
const emit = defineEmits<{
  (e: 'report', match: BracketRow): void;
  (e: 'walkover', matchId: string, winnerId: string): void;
}>();

function report(m: BracketRow) {
  emit('report', m);
}

function walkover(m: BracketRow) {
  emit('walkover', m.id, m.player1 || m.player2 || '');
}
</script>
