<!-- CustomDialog.vue -->
<template>
  <el-dialog :visible.sync="visible" title="请选择按钮" width="30%" @close="onCancel">
    <!-- 保留原始模板不变 -->
    <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">
      全选
    </el-checkbox>
    <div style="margin: 15px 0;"></div>
    <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
      <el-checkbox v-for="btn in btns" :key="btn.value" :label="btn.value">{{ btn.label }}</el-checkbox>
    </el-checkbox-group>

    <span slot="footer" class="dialog-footer">
      <el-button @click="onCancel">取 消</el-button>
      <el-button type="primary" @click="onConfirm">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    btns: { type: Array, required: true }
  },
  data() {
    return {
      visible: true,
      checkAll: false,
      checkedCities: [],
      isIndeterminate: false
    };
  },
  watch: {},
  methods: {
    handleCheckAllChange(val) {
      this.checkedCities = val ? this.btns.map(item => item.value) : [];
      this.isIndeterminate = false;
    },
    handleCheckedCitiesChange(val) {
      const checkedCount = val.length;
      this.checkAll = checkedCount === this.btns.length;
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.btns.length;
    },
    onCancel() {
      this.visible = false;
      this.$emit("cancel");
    },
    onConfirm() {
      this.visible = false;
      this.$emit("confirm", this.checkedCities);
    }
  }
};
</script>
