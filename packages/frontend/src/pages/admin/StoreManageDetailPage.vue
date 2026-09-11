<template>
  <q-page class="q-pa-md">
    <AdminPageHeader :title="store?.name || $t('admin.manageStores')" back-to="/admin/stores" />

    <div v-if="loading" class="text-center q-py-xl"><q-spinner size="lg" /></div>

    <div v-else-if="!store" class="text-center text-grey q-py-xl">{{ $t('common.noResults') }}</div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-md-7">
        <AppPanelCard>
          <template #title>
            <div class="row items-center">
              <h6 class="q-my-none">{{ $t('store.details') }}</h6>
              <q-space />
              <q-badge :color="store.status === 'active' ? 'positive' : 'negative'">{{
                store.status
              }}</q-badge>
              <q-badge v-if="store.is_verified" color="primary" class="q-ml-sm">{{
                $t('store.verified')
              }}</q-badge>
            </div>
          </template>
          <q-card-section class="q-gutter-sm">
            <q-input v-model="editForm.name" :label="$t('store.name')" outlined dense />
            <q-input
              v-model="editForm.description"
              :label="$t('common.description')"
              outlined
              dense
              type="textarea"
              rows="2"
            />
            <q-input v-model="editForm.address" :label="$t('store.address')" outlined dense />
            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <q-input v-model="editForm.city" :label="$t('store.city')" outlined dense />
              </div>
              <div class="col-4">
                <q-input v-model="editForm.state" :label="$t('store.state')" outlined dense />
              </div>
              <div class="col-4">
                <q-input v-model="editForm.phone" :label="$t('store.phone')" outlined dense />
              </div>
            </div>
            <q-input v-model="editForm.website" :label="$t('store.website')" outlined dense />
            <q-btn
              color="primary"
              :label="$t('common.save')"
              class="full-width"
              :loading="saving"
              @click="handleUpdate"
            />
          </q-card-section>
        </AppPanelCard>
      </div>

      <div class="col-12 col-md-5">
        <AppPanelCard :title="$t('admin.manageStores')">
          <q-card-section class="q-gutter-sm">
            <q-btn
              v-if="!store.is_verified"
              color="primary"
              :label="$t('store.verified')"
              icon="verified"
              class="full-width"
              :loading="verifyLoading"
              @click="handleVerify"
            />
            <q-btn
              v-else
              color="positive"
              :label="$t('store.verified')"
              icon="check_circle"
              class="full-width"
              disable
            />
            <q-btn
              color="warning"
              :label="$t('admin.manageStores')"
              icon="block"
              class="full-width"
              :loading="suspendLoading"
              :disable="store.status === 'suspended'"
              @click="handleSuspend"
            />
            <q-btn
              color="negative"
              :label="$t('common.delete')"
              icon="delete_forever"
              class="full-width"
              :loading="deleteLoading"
              @click="handleDelete"
            />
          </q-card-section>
        </AppPanelCard>

        <AppPanelCard :title="$t('store.members')" card-class="q-mt-md">
          <q-card-section v-if="members.length === 0" class="text-grey">{{
            $t('store.noMembers')
          }}</q-card-section>
          <q-list v-else>
            <q-item v-for="m in members" :key="m.id ?? ''">
              <q-item-section>
                <q-item-label>{{ m.user_id }}</q-item-label>
                <q-item-label caption>
                  <q-badge :color="memberRoleColor(m.role ?? '')">{{ m.role }}</q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </AppPanelCard>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AdminPageHeader from '@/components/molecules/AdminPageHeader.vue';
import AppPanelCard from '@/components/molecules/cards/AppPanelCard.vue';
import {
  fetchStore,
  verifyStore,
  suspendStore,
  deleteStore,
  updateStore,
} from '@/composables/useAdminStore';
import { apiGet } from '@/composables/useApi';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const storeId = route.params.id as string;

const store = ref<Record<string, string> | null>(null);
const members = ref<Array<Record<string, string>>>([]);
const loading = ref(true);
const saving = ref(false);
const verifyLoading = ref(false);
const suspendLoading = ref(false);
const deleteLoading = ref(false);
const editForm = reactive<Record<string, string>>({
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  website: '',
});

function memberRoleColor(role: string) {
  return role === 'owner' ? 'red' : role === 'manager' ? 'warning' : 'primary';
}

async function loadStore() {
  loading.value = true;
  const data = await fetchStore(storeId);
  store.value = data as Record<string, string> | null;
  if (data) {
    editForm.name = String(data.name || '');
    editForm.description = String(data.description || '');
    editForm.address = String(data.address || '');
    editForm.city = String(data.city || '');
    editForm.state = String(data.state || '');
    editForm.phone = String(data.phone || '');
    editForm.website = String(data.website || '');
  }
  loading.value = false;
}

async function loadMembers() {
  try {
    const json = (await apiGet(`/api/stores/${storeId}/members`)) as {
      data: Array<Record<string, string>>;
    };
    members.value = json.data ?? [];
  } catch {
    /* ignore */
  }
}

function handleVerify() {
  void (async () => {
    verifyLoading.value = true;
    const result = await verifyStore(storeId);
    verifyLoading.value = false;
    if (result?.error) {
      $q.notify({ type: 'negative', message: String(result.error) });
    } else {
      $q.notify({ type: 'positive', message: 'Store verified' });
      await loadStore();
    }
  })();
}

function handleSuspend() {
  $q.dialog({
    title: 'Suspend Store',
    message: 'Provide a reason for suspension:',
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk((reason: string) => {
    void (async () => {
      suspendLoading.value = true;
      const result = await suspendStore(storeId, reason);
      suspendLoading.value = false;
      if (result?.error) {
        $q.notify({ type: 'negative', message: String(result.error) });
      } else {
        $q.notify({ type: 'positive', message: 'Store suspended' });
        await loadStore();
      }
    })();
  });
}

function handleDelete() {
  $q.dialog({
    title: 'Delete Store',
    message: 'Are you sure? This soft-deletes the store.',
    cancel: true,
    ok: { label: 'Delete', color: 'negative', flat: true },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      deleteLoading.value = true;
      const result = await deleteStore(storeId);
      deleteLoading.value = false;
      if (result?.error) {
        $q.notify({ type: 'negative', message: String(result.error) });
      } else {
        $q.notify({ type: 'positive', message: 'Store deleted' });
        void router.push('/admin/stores');
      }
    })();
  });
}

async function handleUpdate() {
  saving.value = true;
  const result = await updateStore(storeId, { ...editForm });
  saving.value = false;
  if (result?.error) {
    $q.notify({ type: 'negative', message: String(result.error) });
  } else {
    $q.notify({ type: 'positive', message: 'Store updated' });
    await loadStore();
  }
}

onMounted(() => {
  void loadStore();
  void loadMembers();
});
</script>
