<template>
  <div class="home-container">
    <div class="header">
      <h1>🔐 Mis contraseñas</h1>
      <button @click="mostrarModalAgregar = true">+ Nueva contraseña</button>
    </div>

    <input v-model="busqueda" placeholder="🔍 Buscar..." class="buscador" />

    <!-- Loader -->
    <div v-if="cargando" class="spinner-container">
      <div class="spinner"></div>
      <p>Cargando contraseñas...</p>
    </div>

    <!-- Sin resultados -->
    <p v-else-if="!passwordsFiltradas.length">
      {{ busqueda ? 'No se encontraron contraseñas.' : 'No tienes contraseñas guardadas.' }}
    </p>

    <ul class="lista-passwords">
      <li v-for="item in passwordsFiltradas" :key="item.id">
        <div class="info">
          <h3>{{ item.name }}</h3>
          <p v-if="item.username">👤 <strong>{{ item.username }}</strong></p>
          <p>
            🔑
            <code class="password-box">{{ item.mostrar ? item.password : '••••••••' }}</code>
            <button class="icon-button" @click="item.mostrar = !item.mostrar" :title="item.mostrar ? 'Ocultar' : 'Ver'">
              {{ item.mostrar ? '🙈' : '👁️' }}
            </button>
            <button class="icon-button" @click="copiarAlPortapapeles(item.password)" title="Copiar">
              📋
            </button>
          </p>
          <p v-if="item.notes">📝 {{ item.notes }}</p>
        </div>
        <div class="acciones">
          <button class="icon-button" @click="editar(item)" title="Editar">✏️</button>
          <button class="icon-button" @click="confirmarEliminacion(item.id)" title="Eliminar">🗑️</button>
        </div>
      </li>
    </ul>

    <button class="logout" @click="cerrarSesion">Cerrar sesión</button>

    <!-- Modal Agregar / Editar -->
    <div v-if="mostrarModalAgregar || passwordEditando" class="modal-overlay">
      <div class="modal">
        <h2>{{ passwordEditando ? 'Editar contraseña' : 'Nueva contraseña' }}</h2>
        <form @submit.prevent="guardarPassword">
          <input v-model="nueva.name" placeholder="Nombre del sitio" required />
          <input v-model="nueva.username" placeholder="Usuario (opcional)" />
          <div class="input-con-boton">
            <input id="password" v-model="nueva.password" placeholder="Contraseña" required />
            <button type="button" @click="generarPassword">Generar</button>
          </div>
          <textarea v-model="nueva.notes" placeholder="Notas (opcional)"></textarea>
          <div class="modal-actions">
            <button type="submit">{{ passwordEditando ? 'Actualizar' : 'Guardar' }}</button>
            <button type="button" class="cancelar" @click="cerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div v-if="mostrarConfirmacion" class="modal-overlay">
      <div class="modal">
        <p>¿Estás seguro de eliminar esta contraseña?</p>
        <div class="modal-actions">
          <button class="cancelar" @click="cancelarEliminacion">Cancelar</button>
          <button @click="eliminarConfirmado">Sí, eliminar</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { encrypt, decrypt } from '../lib/crypto'

const router = useRouter()
const passwords = ref([])
const busqueda = ref('')
const nueva = ref({ name: '', username: '', password: '', notes: '' })
const mostrarModalAgregar = ref(false)
const passwordEditando = ref(null)
const cargando = ref(true)
const toast = ref({ visible: false, message: '' })
const mostrarConfirmacion = ref(false)
const idAEliminar = ref(null)

const mostrarToast = (mensaje, duracion = 2500) => {
  toast.value.message = mensaje
  toast.value.visible = true
  setTimeout(() => {
    toast.value.visible = false
  }, duracion)
}

const obtenerPasswords = async () => {
  cargando.value = true
  const { data, error } = await supabase
    .from('passwords')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    passwords.value = data.map(item => ({
      ...item,
      password: decrypt(item.password),
      mostrar: false
    }))
  }

  cargando.value = false
}


const generarPassword = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+'
  let resultado = ''
  for (let i = 0; i < 16; i++) {
    const random = Math.floor(Math.random() * caracteres.length)
    resultado += caracteres[random]
  }
  nueva.value.password = resultado
}

const passwordsFiltradas = computed(() => {
  const texto = busqueda.value.toLowerCase()
  return passwords.value
    .filter(p =>
      p.name.toLowerCase().includes(texto) ||
      (p.username && p.username.toLowerCase().includes(texto)) ||
      (p.notes && p.notes.toLowerCase().includes(texto))
    )
    .sort((a, b) => a.name.localeCompare(b.name))
})


const guardarPassword = async () => {
  const { data: session } = await supabase.auth.getSession()
  const user = session.session?.user
  if (!user) return

  const payload = {
    name: nueva.value.name,
    username: nueva.value.username,
    password: encrypt(nueva.value.password),
    notes: nueva.value.notes
  }

  let error = null

  if (passwordEditando.value) {
    // Editar
    const { error: updateError } = await supabase
      .from('passwords')
      .update(payload)
      .eq('id', passwordEditando.value.id)

    error = updateError
  } else {
    // Crear nueva
    const { error: insertError } = await supabase.from('passwords').insert({
      ...payload,
      user_id: user.id
    })

    error = insertError
  }

  if (error) {
    console.error('❌ Error al guardar:', error)
    return
  }

  cerrarModal()
  obtenerPasswords()
}

const copiarAlPortapapeles = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto)
    mostrarToast('🔑 Contraseña copiada')
  } catch (err) {
    mostrarToast('❌ No se pudo copiar')
    console.error(err)
  }
}


const editar = (item) => {
  passwordEditando.value = item
  nueva.value = { ...item }
}

const cerrarModal = () => {
  mostrarModalAgregar.value = false
  passwordEditando.value = null
  nueva.value = { name: '', username: '', password: '', notes: '' }
}

const confirmarEliminacion = (id) => {
  idAEliminar.value = id
  mostrarConfirmacion.value = true
}

const cancelarEliminacion = () => {
  idAEliminar.value = null
  mostrarConfirmacion.value = false
}

const eliminarConfirmado = async () => {
  if (!idAEliminar.value) return
  await supabase.from('passwords').delete().eq('id', idAEliminar.value)
  mostrarConfirmacion.value = false
  idAEliminar.value = null
  obtenerPasswords()
  mostrarToast('🗑️ Contraseña eliminada')
}

const cerrarSesion = async () => {
  await supabase.auth.signOut()
  router.replace('/login')
}

onMounted(obtenerPasswords)
</script>

<style scoped>
.home-container {
  width: 95%;
  max-width: 800px;
  margin: auto;
  padding: 2rem 1rem;
  text-align: center;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1rem;
}

@media (min-width: 600px) {
  .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.buscador {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.lista-passwords {
  list-style: none;
  padding: 0;
}

.lista-passwords li {
  background: #fff;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 600px) {
  .lista-passwords li {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.lista-passwords .info {
  flex: 1;
  text-align: left;
}

.lista-passwords .acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lista-passwords button {
  padding: 0.5rem;
  font-size: 0.9rem;
}

button.logout {
  margin-top: 2rem;
  background-color: #ff6b6b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
}

.modal input,
.modal textarea {
  width: 100%;
  margin: 0.5rem 0;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.input-con-boton {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-con-boton input {
  flex: 1;
}

.input-con-boton button {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ccc;
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 9999;
  font-size: 0.95rem;
  animation: pop-in 0.3s ease;
}

/* Animación de fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: transform 0.2s;
}

.icon-button:hover {
  transform: scale(1.2);
}

.password-line {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.password-box {
  display: inline-block;
  width: 60px; /* ancho fijo */
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>
