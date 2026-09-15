<template>
  <el-dialog
    v-draggable
    title="移动端设置"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="600px"
    :before-close="handleClose"
  >
    <div style="background: #fff; padding: 10px;">
      <el-form ref="ruleForm" :model="mobileAttrs" :rules="rules" label-width="120px" style="padding-bottom: 20px">
        <el-form-item label="标题键">
          <el-tooltip slot="label" class="fontSize14" effect="dark" content="卡片标题行单独渲染的字段；不选则标题行不展示" placement="top-start">
            <span>标题键<i style="width: 20px;" class="el-icon-question"></i></span>
          </el-tooltip>
          <el-select v-model="mobileAttrs.titleField" placeholder="请选择标题字段（可选）" filterable clearable>
            <el-option v-for="item in visibleLeafFields" :key="item.fieldCode" :label="item.fieldName" :value="item.fieldCode"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="展示列">
          <el-tooltip slot="label" class="fontSize14" effect="dark" content="卡片字段区展示的字段，按选择顺序渲染；不选则默认取前4个显示字段" placement="top-start">
            <span>展示列<i style="width: 20px;" class="el-icon-question"></i></span>
          </el-tooltip>
          <el-select v-model="mobileAttrs.mobileFields" placeholder="请选择展示字段（多选）" multiple filterable>
            <el-option v-for="item in fieldOptionsExcludeTitle" :key="item.fieldCode" :label="item.fieldName" :value="item.fieldCode"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="字段布局">
          <el-radio-group v-model="mobileAttrs.fieldLayout">
            <el-radio v-for="item in fieldLayoutOptions" :key="item.value" :label="item.value">{{ item.cnName }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="label布局">
          <el-radio-group v-model="mobileAttrs.labelLayout">
            <el-radio v-for="item in labelLayoutOptions" :key="item.value" :label="item.value">{{ item.cnName }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { cloneDeep } from "lodash";
import { getMobileAttrs } from "/baseConfig/tableBaseConfig";
import { fieldLayout, labelLayout } from "/baseConfig/tableSelectConfigs";
export default {
  name: "MobileAttrsDlg",
  props: {
    // 显示叶子字段列表（show为真值且无children），由table-widget提供
    leafFields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      mobileAttrs: getMobileAttrs(),
      dialogVisible: false,
      rules: {}
    };
  },
  computed: {
    // 布局枚举选项（来源 tableSelectConfigs.js，供模板 v-for 使用）
    fieldLayoutOptions() {
      return fieldLayout;
    },
    labelLayoutOptions() {
      return labelLayout;
    },
    // 只处理 show 为真值的叶子字段（不含children的父节点）
    visibleLeafFields() {
      const flat = [];
      const traverse = items => {
        (items || []).forEach(item => {
          if (item.children && item.children.length) {
            traverse(item.children);
          } else if (item.show) {
            flat.push(item);
          }
        });
      };
      traverse(this.leafFields);
      return flat;
    },
    fieldOptionsExcludeTitle() {
      return this.visibleLeafFields.filter(item => item.fieldCode !== this.mobileAttrs.titleField);
    }
  },
  methods: {
    showDlg(attrs) {
      // 与默认值merge，保证旧JSON无该键或新增字段时自动补默认值
      this.mobileAttrs = cloneDeep({ ...getMobileAttrs(), ...(attrs || {}) });
      this.dialogVisible = true;
    },
    handleClose() {
      this.dialogVisible = false;
    },
    handleConfirm() {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return;
        const validCodes = this.visibleLeafFields.map(item => item.fieldCode);
        // 保存时剔除失效项（字段已隐藏或删除）
        if (this.mobileAttrs.titleField && !validCodes.includes(this.mobileAttrs.titleField)) {
          this.mobileAttrs.titleField = "";
        }
        this.mobileAttrs.mobileFields = (this.mobileAttrs.mobileFields || []).filter(code => validCodes.includes(code));
        this.$emit("changeMobileAttrs", cloneDeep(this.mobileAttrs));
        this.handleClose();
      });
    }
  }
};
</script>

<style lang="less" scoped>
.fontSize14 {
  font-size: 14px;
}
</style>
