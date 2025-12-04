<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'

const { $api } = useNuxtApp()
const auth = useAuthStore()

// --- Config ---
const BASE_URL = '/api/topics'
const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Code', key: 'code' },
  { title: 'Title', key: 'title_th' },
  { title: 'Weight', key: 'weight' },
  { title: 'Status', key: 'active' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// --- State ---
const items = ref([])
const loading = ref(false)
const dialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const errorMsg = ref('')

// --- Form Validation ---
const schema = yup.object({
  code: yup.string().required('กรอกรหัส'),
  title_th: yup.string().required('กรอกชื่อหัวข้อ'),
  weight: yup.number().required('กรอกน้ำหนัก').min(0),
  description: yup.string(),
  active: yup.boolean()
})
const { handleSubmit, resetForm, setValues } = useForm({ validationSchema: schema })
const { value: code, errorMessage: codeErr } = useField('code')
const { value: title_th, errorMessage: titleErr } = useField('title_th')
const { value: weight, errorMessage: weightErr } = useField('weight')
const { value: description } = useField('description')
const { value: active } = useField('active')

// --- Methods ---
async function load() {
  loading.value = true
  try {
    const { data } = await $api.get(BASE_URL)
    items.value = data.items
  } catch (e) {
    errorMsg.value = 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  resetForm({ values: { code: '', title_th: '', weight: 0, description: '', active: true } })
  dialog.value = true
}

function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  setValues(item)
  dialog.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit.value) {
      await $api.put(`${BASE_URL}/${editId.value}`, values)
    } else {
      await $api.post(BASE_URL, values)
    }
    dialog.value = false
    load()
  } catch (e) {
    alert('บันทึกไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
  }
})

async function deleteItem(id) {
  if (!confirm('ยืนยันการลบ?')) return
  try {
    await $api.delete(`${BASE_URL}/${id}`)
    load()
  } catch (e) {
    alert('ลบไม่สำเร็จ')
  }
}

onMounted(() => {
  if (auth.user?.role === 'admin') load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">จัดการหัวข้อการประเมิน (Topics)</h1>
      <v-btn color="primary" @click="openCreate">เพิ่มหัวข้อ</v-btn>
    </div>

    <v-data-table :headers="headers" :items="items" :loading="loading">
      <template #item.active="{ item }">
        <v-chip :color="item.active ? 'success' : 'default'">
          {{ item.active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" icon="mdi-pencil" @click="openEdit(item)"></v-btn>
        <v-btn size="small" variant="text" color="error" icon="mdi-delete" @click="deleteItem(item.id)"></v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>{{ isEdit ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</v-card-title>
        <v-card-text>
          <form @submit.prevent="onSubmit" class="flex flex-col gap-3">
            <v-text-field v-model="code" label="รหัส (Code)" :error-messages="codeErr" />
            <v-text-field v-model="title_th" label="ชื่อหัวข้อ" :error-messages="titleErr" />
            <v-textarea v-model="description" label="คำอธิบาย" rows="2" />
            <v-text-field v-model="weight" type="number" label="น้ำหนักคะแนน" :error-messages="weightErr" />
            <v-switch v-model="active" label="สถานะใช้งาน" color="primary" />
            
            <div class="flex justify-end gap-2 mt-2">
              <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
              <v-btn color="primary" type="submit">บันทึก</v-btn>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>