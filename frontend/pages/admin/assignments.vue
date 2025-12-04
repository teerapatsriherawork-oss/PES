<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const { $api } = useNuxtApp()
const auth = useAuthStore()

// --- State ---
const assignments = ref([])
const periods = ref([])
const evaluators = ref([]) // รายชื่อกรรมการ
const evaluatees = ref([]) // รายชื่อผู้รับการประเมิน
const loading = ref(false)

// --- Form ---
const dialog = ref(false)
const form = ref({
  period_id: null,
  evaluator_id: null,
  evaluatee_id: null
})

// --- Load Data ---
async function loadAll() {
  loading.value = true
  try {
    // 1. โหลดรายการ Assignments ทั้งหมด
    const resAssign = await $api.get('/api/assignments')
    assignments.value = resAssign.data.items

    // 2. โหลด Master Data เพื่อใช้ใน Dropdown
    const resPeriods = await $api.get('/api/periods')
    // กรองเอาเฉพาะที่เปิดอยู่ หรือจะเอาทั้งหมดก็ได้
    periods.value = resPeriods.data.items 

    const resUsers = await $api.get('/api/users/server?itemsPerPage=1000') // โหลดมาเยอะๆ
    const allUsers = resUsers.data.items
    
    evaluators.value = allUsers.filter(u => u.role === 'evaluator' || u.role === 'admin')
    evaluatees.value = allUsers.filter(u => u.role === 'evaluatee')

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// --- Helpers เพื่อแปลง ID เป็นชื่อ ---
function getPeriodName(id) {
  return periods.value.find(p => p.id === id)?.name_th || id
}
function getUserName(id, list) {
  return list.find(u => u.id === id)?.name_th || id
}

// --- Submit ---
async function onSubmit() {
  try {
    await $api.post('/api/assignments', form.value)
    dialog.value = false
    loadAll() // โหลดใหม่
  } catch (e) {
    alert('บันทึกไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
  }
}

async function deleteItem(id) {
  if (!confirm('ลบการจับคู่นี้?')) return
  try {
    await $api.delete(`/api/assignments/${id}`)
    loadAll()
  } catch (e) {
    alert('ลบไม่สำเร็จ')
  }
}

onMounted(() => {
  if (auth.user?.role === 'admin') loadAll()
})

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'รอบการประเมิน', key: 'period_id' },
  { title: 'กรรมการ (Evaluator)', key: 'evaluator_id' },
  { title: 'ผู้รับการประเมิน (Evaluatee)', key: 'evaluatee_id' },
  { title: 'Actions', key: 'actions', sortable: false }
]
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">กำหนดการมอบหมาย (Assignments)</h1>
      <v-btn color="primary" @click="dialog = true">จับคู่ประเมิน</v-btn>
    </div>

    <v-data-table :headers="headers" :items="assignments" :loading="loading">
      <template #item.period_id="{ item }">
        {{ getPeriodName(item.period_id) }}
      </template>
      <template #item.evaluator_id="{ item }">
        {{ getUserName(item.evaluator_id, evaluators) }}
      </template>
      <template #item.evaluatee_id="{ item }">
        {{ getUserName(item.evaluatee_id, evaluatees) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" color="error" icon="mdi-delete" @click="deleteItem(item.id)"></v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card title="เพิ่มการมอบหมาย">
        <v-card-text>
          <v-form @submit.prevent="onSubmit" class="flex flex-col gap-3">
            
            <v-select
              v-model="form.period_id"
              :items="periods"
              item-title="name_th"
              item-value="id"
              label="เลือกรอบการประเมิน"
            />

            <v-select
              v-model="form.evaluator_id"
              :items="evaluators"
              item-title="name_th"
              item-value="id"
              label="เลือกกรรมการ (ผู้ประเมิน)"
            />

            <v-select
              v-model="form.evaluatee_id"
              :items="evaluatees"
              item-title="name_th"
              item-value="id"
              label="เลือกผู้ถูกประเมิน"
            />

            <div class="flex justify-end gap-2 mt-4">
              <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
              <v-btn color="primary" type="submit">บันทึก</v-btn>
            </div>

          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>