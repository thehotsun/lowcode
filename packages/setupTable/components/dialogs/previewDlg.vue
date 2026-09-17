<template>
  <el-dialog v-draggable :title="dialogTitle" :visible.sync="dialogVisiblePreview" :close-on-click-modal="false" :close-on-press-escape="false" width="90%" :before-close="handleClosePreview">
    <div class="preview-mode-switch">
      <el-radio-group :value="mode" size="mini" @change="handleModeChange">
        <el-radio-button label="desktop">桌面端</el-radio-button>
        <el-radio-button label="mobile">移动端</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 移动端预览（第三期）：手机壳定宽定高容器，内层provider固定提供isMobile，complete-table据此切换移动端渲染 -->
    <div v-if="mode === 'mobile'" class="phone-shell">
      <mobileModeProvider>
        <complete-table ref="mobileTable" class="preview-mobile"></complete-table>
      </mobileModeProvider>
    </div>

    <complete-table v-else ref="table" class="preview" style="height:650px" :general-request="generalRequest"> </complete-table>
  </el-dialog>
</template>

<script>
import completeTable from "../../../completeTable";

// 仅在移动端预览分支挂载的provide壳：provide不具备响应性，v-if切换重建组件树保证注入正确
const mobileModeProvider = {
  name: "MobileModeProvider",
  provide() {
    return {
      isMobile: true
    };
  },
  render(h) {
    return h("div", { class: "phone-provider" }, this.$slots.default);
  }
};

export default {
  components: { completeTable, mobileModeProvider },
  data() {
    return {
      dialogVisiblePreview: false,
      generalRequest: null,
      random: +new Date(),
      mode: "desktop",
      renderParams: null
    };
  },
  inject: ["generalRequest"],
  computed: {
    dialogTitle() {
      return this.mode === "mobile" ? "预览（移动端）" : "预览";
    }
  },
  methods: {
    handleClosePreview() {
      this.dialogVisiblePreview = false;
    },

    // 预览状态下，外部组件调用此方法；mode为mobile时以手机壳渲染移动端列表
    showDlg(renderParams, mode = "desktop") {
      this.renderParams = renderParams;
      this.mode = mode;
      this.dialogVisiblePreview = true;
      this.random = +new Date();
      this.$nextTick(() => this.previewCurrent());
    },

    handleModeChange(mode) {
      this.mode = mode;
      this.$nextTick(() => this.previewCurrent());
    },

    previewCurrent() {
      const ref = this.mode === "mobile" ? this.$refs.mobileTable : this.$refs.table;
      ref?.expose_preview(this.renderParams);
    }
  }
};
</script>

<style lang="less" scoped>
.preview-mode-switch {
  margin-bottom: 10px;
  text-align: center;
}

.phone-shell {
  width: 375px;
  height: 650px;
  margin: 0 auto;
  border: 8px solid #2e384d;
  border-radius: 24px;
  overflow: hidden;
  background: #f5f6fa;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  // 子组件根元素带父作用域属性，可直接命中；移动端列表自身即height:100%
  .phone-provider {
    width: 100%;
    height: 100%;
  }
}
</style>
