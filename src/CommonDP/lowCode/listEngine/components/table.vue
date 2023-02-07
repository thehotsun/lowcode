<!-- 组织架构中的人员 -->
<template>
  <div class="person_table">

    <el-table :data="tableData" :header-cell-style="headerStyle" highlight-current-row height="100%"
      @row-click="rowClick" @selection-change="handleSelectionChange">
      <template slot="empty">
        <img :src="zanwu" alt="" />
        <p style="font-size: 16px; color: #000; margin-top: 36px">
          暂无数据
        </p>
      </template>
      <el-table-column v-if="showSelection" type="selection" align="center" width="42" header-align="center" />
      <el-table-column label="列表编号" prop="username" min-width="120px" />
      <el-table-column label="列表名称" prop="name" align="center" min-width="120px" />
      <el-table-column label="相关业务数据" prop="sex" align="center" min-width="80">
        <el-table-column label="库名" prop="name" align="center" min-width="120px" />
        <el-table-column label="SQL" prop="name" align="center" min-width="120px" />
      </el-table-column>
      <el-table-column label="最后修订时间" prop="name" align="center" min-width="120px" />
      <el-table-column label="修订" prop="name" align="center" min-width="120px">
        <el-table-column label="基本属性" prop="name" align="center" min-width="120px">
          <div class="highLight" @click="basisAttr">
            基本属性
          </div>
        </el-table-column>
        <el-table-column label="表格属性" prop="name" align="center" min-width="120px">
          <div class="highLight" @click="basisAttr">
            表格属性
          </div>
        </el-table-column>
        <el-table-column label="字段信息" prop="name" align="center" min-width="120px">
          <div class="highLight" @click="basisAttr">
            字段信息
          </div>
        </el-table-column>
        <el-table-column label="按钮信息" prop="name" align="center" min-width="120px">
          <div class="highLight" @click="basisAttr">
            字段授权
          </div>
        </el-table-column>
        <el-table-column label="数据源" prop="name" align="center" min-width="120px">
          <div class="highLight" @click="basisAttr">
            数据源
          </div>
        </el-table-column>
      </el-table-column>
      <el-table-column label="预览" prop="name" align="center" min-width="120px">
        <div class="highLight" @click="basisAttr">
          预览
        </div>
      </el-table-column>
      <el-table-column label="导出HTML" prop="name" align="center" min-width="120px">
        <div class="highLight" @click="basisAttr">
          导出HTML
        </div>
      </el-table-column>
      <el-table-column label="导出SQL" prop="name" align="center" min-width="120px">
        <div class="highLight" @click="basisAttr">
          导出SQL
        </div>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import userStatus from "@/CommonDP/components/status/userStatus";
import service from '@/CommonDP/service/listEngine-service';

import { mapState } from "vuex";
export default {
  components: { userStatus },
  props: {
    showSelection: { type: Boolean, default: true }
  },
  data () {
    return {
      selectedRows: [],
      zanwu: require("@/CommonDP/assets/暂无数据.png"),
      tableData: [],
    };
  },
  computed: {
    ...mapState({
      enterpriseId: state => state.enterprise.enterpriseId
    })
  },
  created () { 
    // this.getTableData();
  },
  methods: {
    getTableData () {
      const params = {}
      service.getElectronic(params).then(({ data }) => {
        this.tableData = data || [];
      });
    },
    basisAttr () { },
    isShow (row) {
      if (row.deptList && row.deptList.length > 0) {
        const show = row.deptList.find(({ fullDeptName }) => fullDeptName !== null);
        if (show) return true;
        else return false;
      }
    },
    rowClick (val) {
      this.$emit("handleChange", val);
    },
    handleSelectionChange (rows) {
      this.selectedRows = rows;
      this.$emit("rowsSelected", this.selectedRows);
    },

    getSelectedRows () {
      return this.selectedRows;
    },
    headerStyle () {
      return "background-color: #F7F9FF;color:#000;height:54px;padding:6px 0;";
    }
  }
};
</script>

<style lang="scss" scoped>
.person_table {
  height: 100%;
}
</style> 
