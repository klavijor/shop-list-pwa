import CryptoJS from 'crypto-js'

const SECRET_KEY = 'clave-secreta-segura' // Puedes hacer esto más seguro con una key por usuario

export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
}

export function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
