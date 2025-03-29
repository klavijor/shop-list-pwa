<template>
    <div class="auth-container">
      <h1>Iniciar sesión</h1>
      <form @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Correo" required />
        <input v-model="password" type="password" placeholder="Contraseña" required />
        <button type="submit">Ingresar</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p>
        ¿No tienes una cuenta?
        <router-link to="/register">Regístrate aquí</router-link>
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../lib/supabase'
  
  const email = ref('')
  const password = ref('')
  const error = ref('')
  const router = useRouter()
  
  const login = async () => {
    error.value = ''
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
  
    if (err) {
      error.value = err.message
    } else {
      router.push('/home') // Cambiar ruta si quieres redirigir a otra página
    }
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
  