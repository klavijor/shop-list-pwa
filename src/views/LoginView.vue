<template>
  <div class="auth-container">
    <h1>Iniciar sesión</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Correo" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Ingresando...' : 'Ingresar' }}</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p>
      ¿No tienes cuenta?
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
const loading = ref(false)
const router = useRouter()

const login = async () => {
  error.value = ''
  loading.value = true

  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  loading.value = false

  if (err) {
    error.value = 'Correo o contraseña incorrectos.'
  } else {
    router.replace('/home')
  }
}
</script>

<style scoped>
.auth-container {
  width: 90%;
  max-width: 400px;
  margin: auto;
  padding: 2rem 1rem;
  text-align: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

input {
  width: 100%;
  padding: 0.75rem;
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: #42b883;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
