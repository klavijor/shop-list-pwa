<template>
    <div class="auth-container">
      <h1>Registro</h1>
      <form @submit.prevent="register">
        <input v-model="name" type="text" placeholder="Nombre" required />
        <input v-model="email" type="email" placeholder="Correo" required />
        <input v-model="password" type="password" placeholder="Contraseña" required />
        <button type="submit">Registrarse</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p>
        ¿Ya tienes cuenta?
        <router-link to="/login">Inicia sesión</router-link>
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../lib/supabase'
  
  const email = ref('')
  const password = ref('')
  const name = ref('')
  const error = ref('')
  const router = useRouter()
  
  const register = async () => {
    error.value = ''
  
    const { data, error: err } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })
  
    if (err) {
      error.value = err.message
      return
    }
  
    const user = data.user
    if (user) {
      // Verificamos si ya existe el perfil
      const { data: perfilExistente } = await supabase
        .from('perfiles')
        .select('id')
        .eq('usuario_id', user.id)
        .maybeSingle()
  
      if (!perfilExistente) {
        await supabase.from('perfiles').insert({
          usuario_id: user.id,
          nombre: name.value,
          correo: email.value
        })
      }
    }
  
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .auth-container {
    max-width: 400px;
    margin: auto;
    padding: 2rem;
    text-align: center;
  }
  input {
    display: block;
    margin: 1rem auto;
    padding: 0.5rem;
    width: 100%;
  }
  button {
    padding: 0.5rem 1rem;
    background: #42b883;
    border: none;
    color: white;
    border-radius: 4px;
  }
  .error {
    color: red;
  }
  </style>
  