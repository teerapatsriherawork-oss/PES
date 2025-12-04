<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'


const router = useRouter()
const { $api } = useNuxtApp()
const auth = useAuthStore()


const BASE_URL = '/api/periods'
const TABLE_TITLE = 'Evaluation Periods'


// --- List State ---
const items = ref([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')


// --- Form State ---
const formDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formError = ref('')


// --- Validation Schema ---
const schema = yup.object({
  code: yup.string().required('กรอกรหัสรอบประเมิน'),
  name_th: yup.string().required('กรอกชื่อรอบประเมิน'),
  buddhist_year: yup.number().typeError('ปี พ.ศ. ต้องเป็นตัวเลข').integer().min(2500, 'ปี พ.ศ. ต้องเป็นตัวเลข (เช่น 2568)').required('กรอกปี พ.ศ.'),
  start_date: yup.string().required('เลือกวันเริ่มต้น'),
  end_date: yup.string().required('เลือกวันสิ้นสุด'),
  is_active: yup.boolean(),
})


const { handleSubmit, resetForm, setValues } = useForm({ validationSchema: schema })
const { value: code, errorMessage: codeErr } = useField('code')
const { value: name_th, errorMessage: name_thErr } = useField('name_th')
const { value: buddhist_year, errorMessage: yearErr } = useField('buddhist_year')
const { value: start_date, errorMessage: startErr } = useField('start_date')
const { value: end_date, errorMessage: endErr } = useField('end_date')
const { value: is_active } = useField('is_active')


// --- Load Logic ---
async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await $api.get(BASE_URL)
   
    items.value = (data.items || []).map(item => ({
      ...item,
      is_active: !!item.is_active,
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : ''
    }))
    total.value = items.value.length
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || `Load ${TABLE_TITLE} failed`
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  if (!auth.isLogged || auth.user?.role !== 'admin') {
    router.push('/login')
    return
  }
  load()
})


// --- Form Logic ---
function openCreate() {
  isEdit.value = false
  editId.value = null
  formError.value = ''
  resetForm({
    values: {
      code: '',
      name_th: '',
      buddhist_year: new Date().getFullYear() + 543,
      start_date: '',
      end_date: '',
      is_active: false
    }
  })
  formDialog.value = true
}


async function openEdit(item) {
  isEdit.value = true
  editId.value = item.id
  formError.value = ''
  try {
    const { data } = await $api.get(`${BASE_URL}/${item.id}`)
    setValues({
      code: data.code,
      name_th: data.name_th,
      buddhist_year: data.buddhist_year,
      start_date: data.start_date.split('T')[0],
      end_date: data.end_date.split('T')[0],    
      is_active: !!data.is_active
    })
    formDialog.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || `Load Period failed`
  }
}


const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  formError.value = ''
  try {
    const payload = {
        ...values,
        buddhist_year: Number(values.buddhist_year),
        is_active: !!values.is_active,
    }
   
    if (isEdit.value) {
      await $api.put(`${BASE_URL}/${editId.value}`, payload)
    } else {
      await $api.post(BASE_URL, payload)
    }
   
    formDialog.value = false
    await load()
  } catch (e) {
    formError.value = e.response?.data?.message || e.message || (isEdit.value ? 'Update failed' : 'Create failed')
  } finally {
    submitting.value = false
  }
})


// --- Delete Logic ---
const confirmDialog = ref(false)
const selectedItem = ref(null)


function askDelete(item) {
  selectedItem.value = item
  confirmDialog.value = true
}


async function confirmDelete() {
  try {
    await $api.delete(`${BASE_URL}/${selectedItem.value.id}`)
    confirmDialog.value = false
    selectedItem.value = null
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Delete failed'
  }
}


// --- Headers for v-data-table ---
const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Code', key: 'code' },
    { title: 'Name (TH)', key: 'name_th' },
    { title: 'Year (B.E.)', key: 'buddhist_year' },
    { title: 'Start Date', key: 'start_date' },
    { title: 'End Date', key: 'end_date' },
    { title: 'Active', key: 'is_active' },
    { title: 'Actions', key: 'actions', sortable: false }
]
</script>


<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4 gap-3">
      <h1 class="text-xl font-semibold">{{ TABLE_TITLE }}</h1>
      <v-btn color="primary" variant="elevated" @click="openCreate">Create Period</v-btn>
    </div>


    <v-card>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">
          {{ errorMsg }}
        </v-alert>


        <v-data-table
          :items-length="total"
          :items="items"
          :loading="loading"
          :headers="headers"
        >
          <template #item.is_active="{ item }">
            <v-chip :color="item.is_active ? 'success' : 'error'" density="comfortable" size="small">
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>


          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" @click="openEdit(item)">Edit</v-btn>
            <v-btn size="small" color="error" variant="text" @click="askDelete(item)">Delete</v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>


    <v-dialog v-model="formDialog" max-width="600" persistent>
      <v-card :title="isEdit ? `Edit Period #${editId}` : `Create New Period`">
        <v-card-text>
          <v-form @submit.prevent="onSubmit" class="d-flex flex-column ga-4">
            <v-text-field label="Code (รหัสรอบ)" v-model="code" :error-messages="codeErr ? [codeErr] : []" />
            <v-text-field label="Name (ชื่อรอบ)" v-model="name_th" :error-messages="name_thErr ? [name_thErr] : []" />
            <v-text-field
              label="Buddhist Year (ปี พ.ศ.)" v-model="buddhist_year" type="number" min="2500"
              :error-messages="yearErr ? [yearErr] : []"
            />
           
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="Start Date (วันเริ่ม)" v-model="start_date" type="date"
                  :error-messages="startErr ? [startErr] : []"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="End Date (วันสิ้นสุด)" v-model="end_date" type="date"
                  :error-messages="endErr ? [endErr] : []"
                />
              </v-col>
            </v-row>
           
            <v-switch
              v-model="is_active"
              :label="is_active ? 'Status: Active' : 'Status: Inactive'"
              color="success"
              inset
              hide-details
            />


            <v-alert v-if="formError" type="error" variant="tonal" class="mt-2">{{ formError }}</v-alert>
          </v-form>
        </v-card-text>


        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="submitting" @click="formDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="submitting" @click="onSubmit">
            {{ isEdit ? 'Save Changes' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Delete period <strong>#{{ selectedItem?.id }}</strong> ({{ selectedItem?.name_th }}) ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>