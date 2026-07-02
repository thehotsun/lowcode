<template>
  <el-popover ref="popover" placement="bottom-start" trigger="click" width="268" :disabled="disabled" popper-class="color-picker-popper">
    <div class="color-picker-panel">
      <!-- "无填充" button -->
      <div class="color-picker-top-action">
        <el-button size="mini" class="no-fill-btn" @click="handleNoFill">无填充</el-button>
      </div>

      <!-- Theme colors grid: 6 rows x 10 columns -->
      <div class="color-picker-group">
        <div class="color-picker-group-container">
          <div v-for="(row, rowIdx) in themeColorRows" :key="'row-' + rowIdx" class="color-picker-grid-row">
            <div
              v-for="(color, colIdx) in row"
              :key="colIdx"
              class="color-picker-cell"
              :class="{ 'is-white': color === '#FFFFFF' }"
              :style="{ backgroundColor: color }"
              @click="handleColorClick(color)"
            />
          </div>
        </div>
      </div>

      <!-- Standard colors -->
      <div class="color-picker-group">
        <div class="color-picker-group-label">标准颜色</div>
        <div class="color-picker-group-container">
          <div class="color-picker-standard-row">
            <div v-for="color in standardColors" :key="color" class="color-picker-cell" :style="{ backgroundColor: color }" @click="handleColorClick(color)" />
          </div>
        </div>
      </div>

      <!-- 自定义颜色 with el-color-picker -->
      <div class="color-picker-more">
        <span class="color-picker-more-label">自定义颜色</span>
        <el-color-picker v-model="customColor" size="mini" @change="handleMoreColorChange" />
      </div>
    </div>

    <!-- Trigger button -->
    <el-button slot="reference" size="small" :disabled="disabled" type="text">
      <span v-if="value" class="color-picker-trigger-swatch" :style="{ backgroundColor: value }" />
      <span v-else class="color-picker-trigger-text">{{ value || "颜色" }}</span>
    </el-button>
  </el-popover>
</template>

<script>
export default {
  name: "ColorPicker",
  model: {
    prop: "value",
    event: "change"
  },
  props: {
    value: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      customColor: null,
      themeColorRows: [
        ["#FFFFFF", "#000000", "#485368", "#2972F4", "#00A3F5", "#319B62", "#DE3C36", "#F88825", "#F5C400", "#9A38D7"],
        ["#F2F2F2", "#7F7F7F", "#F3F5F7", "#E5EFFF", "#E5F6FF", "#EAFEF1", "#FFE9E8", "#FFF3EB", "#FFF9E3", "#FDEBFF"],
        ["#D8D8D8", "#595959", "#C5CAD3", "#C7DCFF", "#C7ECFF", "#C3EAD5", "#FFC9C7", "#FFDCC4", "#FFEEAD", "#F2C7FF"],
        ["#BFBFBF", "#3F3F3F", "#808B9E", "#99BEFF", "#99DDFF", "#98D7B6", "#FF9C99", "#FFBA84", "#FFE270", "#D58EFF"],
        ["#A5A5A5", "#262626", "#353B45", "#1450B8", "#1274A5", "#277C4F", "#9E1E1A", "#B86014", "#A38200", "#5E2281"],
        ["#939393", "#0D0D0D", "#24272E", "#0C306E", "#0A415C", "#184E32", "#58110E", "#5C300A", "#665200", "#3B1551"]
      ],
      standardColors: ["#C00000", "#FF0000", "#FFC000", "#FFFF00", "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0"]
    };
  },
  methods: {
    handleColorClick(color) {
      this.$emit("change", color);
      this.closePopover();
    },

    handleNoFill() {
      this.$emit("change", "");
      this.closePopover();
    },

    handleMoreColorChange(color) {
      if (color) {
        this.$emit("change", color);
        this.closePopover();
        this.$nextTick(() => {
          this.customColor = null;
        });
      }
    },

    closePopover() {
      this.$nextTick(() => {
        const popover = this.$refs.popover;
        if (popover && popover.doClose) {
          popover.doClose();
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.color-picker-panel {
  padding: 8px 0;
  background: #fff;
  user-select: none;
}

// Top action: "无填充" button
.color-picker-top-action {
  margin-bottom: 8px;
}

.no-fill-btn {
  width: 100%;
}

// Color groups
.color-picker-group {
  margin-bottom: 2px;
}

.color-picker-group-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
  padding-left: 1px;
}

.color-picker-group-container {
  display: flex;
  flex-direction: column;
}

// Grid rows
.color-picker-grid-row {
  display: flex;
}

// Color cells
.color-picker-cell {
  width: 20px;
  height: 20px;
  margin: 2px;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  flex-shrink: 0;

  &.is-white {
    border-color: #d8d8d8;
  }

  &:hover {
    transform: scale(1.15);
    z-index: 2;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
  }
}

// Standard colors row
.color-picker-standard-row {
  display: flex;
}

// Dividers
.color-picker-divider {
  height: 1px;
  background: #ebeef5;
  margin: 8px 0;
}

// "自定义颜色" row
.color-picker-more {
  display: flex;
  align-items: center;
  margin-top: 4px;
  .color-picker-more-label {
    font-size: 13px;
    color: #606266;
    margin-right: 5px;
  }
}

.color-picker-menu-item-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .more-color-icon {
    display: block;
    width: 16px;
    height: 16px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z' fill='%23909399'/%3E%3C/svg%3E");
  }
}

.color-picker-trigger-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #dcdfe6;
  vertical-align: middle;
  margin-right: 6px;
  flex-shrink: 0;
}

.color-picker-trigger-text {
  vertical-align: middle;
  margin-right: 4px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
