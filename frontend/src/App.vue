<template>
  <router-view />
  <Toast />
  <ConfirmDialog />
</template>

<script setup>
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>
