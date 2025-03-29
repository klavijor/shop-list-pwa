<template>
    <div class="detalle-lista">
      <button @click="volver">← Volver</button>
      <h1>{{ listaNombre }}</h1>
      <p class="creador" v-if="creadorNombre">👤 Creador: <strong>{{ creadorNombre }}</strong></p>
  
      <form @submit.prevent="agregarProducto">
        <input v-model="nuevoProducto" placeholder="Nuevo producto" required />
        <button type="submit">Agregar</button>
      </form>
  
      <!-- 🔄 Filtro de productos -->
      <div class="filtros">
        <label>Filtrar:</label>
        <select v-model="filtro">
          <option value="todos">Todos</option>
          <option value="pendientes">Pendientes</option>
          <option value="comprados">Comprados</option>
        </select>
      </div>

      <!-- 💰 Total gastado -->
      <div class="total-gastado">
        Total gastado: <strong>${{ totalGastado }}</strong>
      </div>

      <div class="resumen-productos">
       🛒 Pendientes: <strong>{{ resumenProductos.pendientes }}</strong> |
       ✅ Comprados: <strong>{{ resumenProductos.comprados }}</strong>
      </div>
  
      <!-- 👥 Compartir lista -->
      <div class="compartir">
        <button @click="compartirLista">➕ Compartir con usuario</button>
      </div>

      <div class="invitados" v-if="invitados.length">
  <p>👥 Invitados:</p>
  <ul>
    <li v-for="invitado in invitados" :key="invitado.id">
      • {{ invitado.nombre }}
      <button @click="eliminarInvitado(invitado.id)">Eliminar</button>
    </li>
  </ul>
</div>

  
      <ul>
        <li
          v-for="producto in productosFiltrados"
          :key="producto.id"
        >
          <div class="info">
            <strong>{{ producto.nombre }}</strong>
            <div v-if="producto.comprado">
              <span class="estado comprado">Comprado</span>
              <div>💰 Precio: ${{ producto.precio }}</div>
              <div>🧮 Cantidad: {{ producto.cantidad }}</div>
            </div>
            <div v-else>
              <span class="estado pendiente">Pendiente</span>
            </div>
          </div>
  
          <div class="acciones">
            <button v-if="!producto.comprado" @click="marcarComoComprado(producto)">Marcar como comprado</button>
            <button @click="editarProducto(producto)">Editar</button>
            <button @click="eliminarProducto(producto)">Eliminar</button>
          </div>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { supabase } from '../lib/supabase'
  
  const route = useRoute()
  const router = useRouter()
  const listaId = route.params.id
  
  const usuarioActualId = ref(null)
  const listaNombre = ref('')
  const productos = ref([])
  const creadorNombre = ref('')
  const invitados = ref([])
  const nuevoProducto = ref('')
  const filtro = ref('todos')
  
  const volver = () => router.push('/home')
  
  const creadorId = ref(null)

const cargarLista = async () => {
  const { data } = await supabase
    .from('listas')
    .select('nombre, creador_id, perfiles(nombre)')
    .eq('id', listaId)
    .single()

  if (data) {
    listaNombre.value = data.nombre
    creadorNombre.value = data.perfiles?.nombre ?? ''
    creadorId.value = data.creador_id
  }
}

  
  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('lista_id', listaId)
      .order('creado_en', { ascending: false })
  
    productos.value = data ?? []
  }

  const cargarInvitados = async () => {
  console.log('Iniciando carga de invitados para la lista:', listaId);
  const { data, error } = await supabase
    .from('perfiles_listas')
    .select('id, usuario_id, perfiles(nombre)')
    .eq('lista_id', listaId);

  if (error) {
    console.error('Error al cargar invitados:', error);
  } else {
    console.log('Invitados obtenidos:', data);
    invitados.value = data
      .filter(item => item.usuario_id !== usuarioActualId.value)
      .map(item => ({
        id: item.id,
        nombre: item.perfiles?.nombre ?? 'Nombre no disponible'
      }));
  }
};


  
  const productosFiltrados = computed(() => {
    if (filtro.value === 'pendientes') {
      return productos.value.filter(p => !p.comprado)
    } else if (filtro.value === 'comprados') {
      return productos.value.filter(p => p.comprado)
    }
    return productos.value
  })

  const totalGastado = computed(() => {
  return productos.value
    .filter(p => p.comprado && p.precio && p.cantidad)
    .reduce((total, p) => total + (p.precio * p.cantidad), 0)
  })

  const resumenProductos = computed(() => {
    const pendientes = productos.value.filter(p => !p.comprado).length
    const comprados = productos.value.filter(p => p.comprado).length
    return { pendientes, comprados }
  })
  
  const agregarProducto = async () => {
    if (!nuevoProducto.value) return
  
    await supabase.from('productos').insert({
      lista_id: listaId,
      nombre: nuevoProducto.value,
      comprado: false
    })
  
    nuevoProducto.value = ''
    cargarProductos()
  }
  
  const marcarComoComprado = async (producto) => {
    const precio = prompt(`Precio de "${producto.nombre}"`)
    const cantidad = prompt(`Cantidad comprada de "${producto.nombre}"`)
    if (!precio || !cantidad) return
  
    await supabase
      .from('productos')
      .update({
        comprado: true,
        precio: parseFloat(precio),
        cantidad: parseInt(cantidad)
      })
      .eq('id', producto.id)
  
    cargarProductos()
  }
  
  const editarProducto = async (producto) => {
    const nuevoNombre = prompt('Nuevo nombre:', producto.nombre)
    if (!nuevoNombre) return
  
    let nuevoPrecio = producto.precio
    let nuevaCantidad = producto.cantidad
  
    if (producto.comprado) {
      nuevoPrecio = prompt('Nuevo precio:', producto.precio)
      nuevaCantidad = prompt('Nueva cantidad:', producto.cantidad)
      if (!nuevoPrecio || !nuevaCantidad) return
    }
  
    await supabase
      .from('productos')
      .update({
        nombre: nuevoNombre,
        precio: producto.comprado ? parseFloat(nuevoPrecio) : null,
        cantidad: producto.comprado ? parseInt(nuevaCantidad) : null
      })
      .eq('id', producto.id)
  
    cargarProductos()
  }
  
  const eliminarProducto = async (producto) => {
    const confirmacion = confirm(`¿Eliminar "${producto.nombre}"?`)
    if (!confirmacion) return
  
    await supabase.from('productos').delete().eq('id', producto.id)
    cargarProductos()
  }
  
  const compartirLista = async () => {
  const correo = prompt('Correo del usuario con quien compartir la lista:')
  if (!correo) return

  // Buscar perfil por correo
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('correo', correo)
    .maybeSingle()

  if (!perfil) {
    alert('Usuario no encontrado.')
    return
  }

  // Verificar si ya se compartió antes
  const { data: existente } = await supabase
    .from('perfiles_listas')
    .select('id')
    .eq('usuario_id', perfil.id)
    .eq('lista_id', listaId)
    .maybeSingle()

  if (existente) {
    alert('La lista ya fue compartida con este usuario.')
    return
  }

  // Insertar relación en perfiles_listas
  const { error: errorInsert } = await supabase.from('perfiles_listas').insert({
    usuario_id: perfil.id,
    lista_id: listaId
  })

  if (!errorInsert) {
    alert('Lista compartida exitosamente.')
    cargarInvitados()
  } else {
    alert('Ocurrió un error al compartir la lista.')
  }
}


  const eliminarInvitado = async (invitadoId) => {
  const confirmar = confirm('¿Seguro que deseas eliminar este invitado?')
  if (!confirmar) return

  const { error } = await supabase
    .from('perfiles_listas')
    .delete()
    .eq('id', invitadoId)

  if (!error) {
    cargarInvitados()
  } else {
    alert('Error eliminando al invitado.')
  }
}

  
onMounted(async () => {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id ?? null

  if (!userId) return

  const { data: perfilData, error: perfilError } = await supabase
  .from('perfiles')
  .select('id')
  .eq('usuario_id', userId)
  .maybeSingle()

if (perfilError || !perfilData) {
  console.error('No se pudo obtener el perfil del usuario actual:', perfilError)
  return
}

usuarioActualId.value = perfilData.id


  await cargarLista()
  await cargarProductos()
  await cargarInvitados()
})


  </script>
  
  <style scoped>
  .detalle-lista {
    max-width: 600px;
    margin: auto;
    padding: 2rem;
  }
  form {
    margin-bottom: 1rem;
  }
  .filtros, .compartir {
    margin-bottom: 1rem;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    background: #f4f4f4;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
  }
  button {
    margin-top: 0.5rem;
    margin-right: 0.5rem;
  }
  .acciones {
    margin-top: 0.5rem;
  }
  .estado {
    font-weight: bold;
    display: inline-block;
    margin: 0.3rem 0;
  }
  .estado.pendiente {
    color: orange;
  }
  .estado.comprado {
    color: green;
  }
  .total-gastado {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
}
.resumen-productos {
  margin-bottom: 1rem;
  font-weight: 500;
  color: #333;
}
.invitados {
  margin-bottom: 1rem;
  text-align: left;
}
.invitados ul {
  padding-left: 1rem;
}
.creador {
  margin-bottom: 1rem;
  font-style: italic;
  color: #555;
}
  </style>
  