<template>
  <div class="el-transfer-panel">
    <div :class="['panel__body']">
      <el-input class="el-transfer-panel__filter" v-model="query" size="small" :placeholder="placeholder"
        @mouseenter.native="inputHover = true" @mouseleave.native="inputHover = false">
        <i slot="prefix" :class="['el-input__icon', 'el-icon-' + inputIcon]" @click="clearQuery"></i>
      </el-input>
      <el-checkbox-group v-model="checked" v-show="!hasNoMatch && data.length > 0"
        :class="{ 'is-filterable': filterable }" class="el-transfer-panel__list">
        <el-checkbox class="el-transfer-panel__item" :label="item[keyProp]" :key="item[keyProp]"
          v-for="item in filteredData">
          <span>{{ item[labelProp] }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <p class="el-transfer-panel__empty" v-show="hasNoMatch">无匹配数据</p>
      <p class="el-transfer-panel__empty" v-show="data.length === 0 && !hasNoMatch">无数据</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'panel',
  props: {
    data: {
      type: Array,
      default () {
        return [

        ];
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

  data () {
    return {
      checked: [],
      query: '',
      inputHover: false,
      labelProp: 'label',
      keyProp: 'key',
    };
  },

  watch: {
    checked (val) {
      this.$emit('checkedChange', val);
    },
    data: {
      immediate: true,
      handler (val) {
        this.checked = val.map(item => item[this.keyProp])
      }
    }
  },

  computed: {
    filteredData () {
      return this.data.filter(item => {
        if (typeof this.filterMethod === 'function') {
          return this.filterMethod(this.query, item);
        } else {
          const label = item[this.labelProp] || item[this.keyProp].toString();
          return label.toLowerCase().indexOf(this.query.toLowerCase()) > -1;
        }
      });
    },

    hasNoMatch () {
      return this.query.length > 0 && this.filteredData.length === 0;
    },

    inputIcon () {
      return this.query.length > 0 && this.inputHover
        ? 'circle-close'
        : 'search';
    },
  },

  methods: {
    clearQuery () {
      if (this.inputIcon === 'circle-close') {
        this.query = '';
      }
    }
  }
};
</script>

<style lang="sass" scoped>
.panel__body{
    height: 290px
}
</style>

