<template>
  <q-card :class="cardClass">
    <q-card-section v-if="title || $slots.title">
      <slot name="title">
        <h5 v-if="titleTag === 'h5'" class="q-my-none">{{ title }}</h5>
        <h6 v-else class="q-my-none">{{ title }}</h6>
      </slot>
    </q-card-section>
    <slot />
    <q-card-actions v-if="$slots.actions" :align="actionsAlign" :class="actionsClass">
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
type ActionsAlign = 'center' | 'left' | 'right' | 'stretch' | 'between' | 'around' | 'evenly';

interface Props {
  title?: string;
  titleTag?: 'h5' | 'h6';
  cardClass?: string;
  actionsClass?: string;
  actionsAlign?: ActionsAlign;
}

withDefaults(defineProps<Props>(), {
  title: '',
  titleTag: 'h6',
  cardClass: '',
  actionsClass: '',
  actionsAlign: undefined as unknown as ActionsAlign,
});
</script>
