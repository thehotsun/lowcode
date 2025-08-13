<template>
  <div class="el-transfer-panel" @click.stop="panelClick">
    <div class="panel__body">
      <el-input
        v-model="query"
        class="el-transfer-panel__filter"
        size="small"
        :placeholder="placeholder"
        @mouseenter.native="inputHover = true"
        @mouseleave.native="inputHover = false"
      >
        <i slot="prefix" :class="['el-input__icon', 'el-icon-' + inputIcon]" @click="clearQuery"></i>
      </el-input>
      <el-checkbox-group v-show="!hasNoMatch && data.length > 0" v-model="checked" :class="{ 'is-filterable': filterable }" class="el-transfer-panel__list">
        <el-checkbox v-for="item in filteredData" :key="item[keyProp]" class="el-transfer-panel__item" :label="item[keyProp]">
          <span>{{ item[labelProp] }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <p v-show="hasNoMatch" class="el-transfer-panel__empty">无匹配数据</p>
      <p v-show="data.length === 0 && !hasNoMatch" class=" el-transfer-panel__empty">无数据</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Panel",
  props: {
    data: {
      type: Array,
      default() {
        return [];
      }
    },
    placeholder: String,
    title: String,
    filterable: Boolean,
    format: Object,
    filterMethod: Function,
    defaultChecked: Array,
    props: Object
  },

  data() {
    return {
      checked: [],
      query: "",
      inputHover: false,
      labelProp: "label",
      keyProp: "key"
    };
  },

  computed: {
    filteredData() {
      return this.data.filter(item => {
        if (typeof this.filterMethod === "function") {
          return this.filterMethod(this.query, item);
        } else {
          const label = item[this.labelProp] || item[this.keyProp].toString();
          return label.toLowerCase().indexOf(this.query.toLowerCase()) > -1;
        }
      });
    },

    hasNoMatch() {
      return this.query.length > 0 && this.filteredData.length === 0;
    },

    inputIcon() {
      return this.query.length > 0 && this.inputHover ? "circle-close" : "search";
    }
  },

  watch: {
    checked(val) {
      const arr = [];
      val = this.filteredData.map(item => {
        const key = this.keyProp;
        if (val.includes(item[key])) {
          arr.push(item[key]);
        }
      });
      this.$emit("checkedChange", arr);
    },
    data: {
      immediate: true,
      handler(val) {
        this.checked = val.map(item => item[this.keyProp]);
      }
    }
  },

  inject: ["Sortable"],

  mounted() {
    this.rowDrop();
  },
  beforeDestroy() {
    this?.sortableInstance?.destroy();
  },

  methods: {
    panelClick() {},
    clearQuery() {
      if (this.inputIcon === "circle-close") {
        this.query = "";
      }
    },

    rowDrop() {
      // 此时找到的元素是要拖拽元素的父容器
      const dom = this.$el.querySelector(".el-transfer-panel__list");
      const key = this.keyProp;
      this.sortableInstance = this.Sortable.create(dom, {
        onEnd: e => {
          // e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.filteredData.splice(e.oldIndex, 1)[0];
          this.filteredData.splice(e.newIndex, 0, targetRow);
          this.$emit(
            "checkedChange",
            this.filteredData.map(item => item[key])
          );
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.panel__body {
  height: 290px;
}
</style>
