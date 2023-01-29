<template>
  <div class="wrap">
    <div>{{ formData.count }}</div>
    <el-button @click="handleClick">点我加1</el-button>
  </div>
</template>


<script>
export default {
  data () {
    return {}
  },
  props: {
    formData: Object
  },
  mounted () {
    console.log(this.formData, 'custom');
    console.log(this.$parent, 'xxx');
  },

  methods: {
    handleClick () {
      const val = this.formData.count + 1
      this.$emit('changeFormData', 'count', val)
    }
  }
}
</script>