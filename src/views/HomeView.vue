<!-- src/views/HomeView.vue -->
<template>
    <div class="home-container">
      <h1>Mis listas de mercado</h1>
  
      <button @click="crearLista">+ Nueva lista</button>
  
      <div v-if="listas.length === 0">
        <p>No tienes listas aún.</p>
      </div>
  
      <ul>
        <li v-for="lista in listas" :key="lista.id">
            <router-link :to="`/listas/${lista.id}`">{{ lista.nombre }}</router-link>
        </li>
      </ul>
  
      <button class="logout" @click="cerrarSesion">Cerrar sesión</button>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../lib/supabase'
  
  const router = useRouter()
  const listas = ref([])
  
  const obtenerListas = async () => {
  const { data: session } = await supabase.auth.getSession()
  const user = session.session?.user

  if (!user) {
    router.push('/login')
    return
  }

  // 🔍 Buscar el perfil del usuario autenticado
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('id')
    .eq('usuario_id', user.id)
    .single()

  if (perfilError || !perfil) {
    console.error('❌ Error obteniendo perfil:', perfilError)
    return
  }

  // 🟩 Listas creadas por este usuario (según perfil.id)
  const { data: creadas, error: err1 } = await supabase
    .from('listas')
    .select('id, nombre')
    .eq('creador_id', perfil.id)

  // 🟦 Listas compartidas con este usuario
  const { data: compartidas, error: err2 } = await supabase
    .from('perfiles_listas')
    .select('listas(id, nombre)')
    .eq('usuario_id', perfil.id)

  if (err1 || err2) {
    console.error('❌ Error obteniendo listas:', err1 || err2)
    return
  }

  // 👥 Unimos las creadas y las compartidas (evitando duplicados)
  const listasCompartidas = compartidas.map(item => item.listas)
  const creadasIds = new Set(creadas.map(l => l.id))
  const compartidasFiltradas = listasCompartidas.filter(l => !creadasIds.has(l.id))

  listas.value = [...creadas, ...compartidasFiltradas]
}

  
const crearLista = async () => {
  const nombre = prompt('Nombre de la nueva lista:')
  if (!nombre) return

  const { data: session, error: sessionError } = await supabase.auth.getSession()
  const user = session?.session?.user

  console.log('🔐 Usuario auth:', user)

  if (!user) return

  // Buscar perfil
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('id, usuario_id')
    .eq('usuario_id', user.id)
    .single()

  console.log('👤 Perfil:', perfil)
  if (perfilError || !perfil) {
    console.error('❌ Error obteniendo perfil:', perfilError)
    return
  }

  // Intentar crear lista
  const { data, error } = await supabase
    .from('listas')
    .insert({
      nombre,
      creador_id: perfil.id
    })
    .select()
    .single()

  console.log('📥 Payload lista:', { nombre, creador_id: perfil.id })
  console.log('🧾 Resultado creación:', data, error)

  if (error) {
    console.error('❌ Error creando lista:', error.message, error)
    return
  }

  const nuevaListaId = data.id

  // Insertar en perfiles_listas
  const { error: errorRelacion } = await supabase
    .from('perfiles_listas')
    .insert({
      usuario_id: perfil.id,
      lista_id: nuevaListaId
    })

  if (errorRelacion) {
    console.error('❌ Error asignando lista al usuario:', errorRelacion.message, errorRelacion)
    return
  }

  await obtenerListas()
}
  
  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  onMounted(() => {
    obtenerListas()
  })
  </script>
  
  <style scoped>
  .home-container {
    max-width: 600px;
    margin: auto;
    padding: 2rem;
    text-align: center;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    background: #f2f2f2;
    margin: 0.5rem 0;
    padding: 1rem;
    border-radius: 8px;
  }
  button.logout {
    margin-top: 2rem;
    background-color: #ff6b6b;
  }
  </style>
  