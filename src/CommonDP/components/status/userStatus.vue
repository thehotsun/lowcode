<template>
  <span>
    <span v-if="!status" class="userStatus disabled">禁用</span>
    <span v-if="status === 1" class="userStatus enabled">启用</span>
  </span>
</template>

<script>
export default {
  props: {
    status: {
      type: Number,
      default: 0
    }
  }
};
</script>

<style scoped>
.userStatus {
  border-radius: 6px;
  text-align: center;
  padding: 4px 6px;
}
.enabled {
  background: rgba(0, 182, 50, 0.24);
  color: #00b632;
}
.disabled {
  background: rgba(236, 54, 42, 0.15);
  color: #ec3226;
}
</style>
