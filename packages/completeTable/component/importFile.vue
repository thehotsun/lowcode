<template>
  <div class="wrap">
    <div v-if="!fileList.length" style="height:32px;line-height:32px">
      <p style="float: left;">请下载导入模板，按格式修改后导入</p>
      <el-button style="float: right;" size="small" type="primary" @click="download">
        模板下载
      </el-button>
    </div>
    <div v-if="!fileList.length">
      <div style="text-align: center;margin-top: 15px;">
        <el-upload drag action="/" :before-upload="dataprogress1" :show-file-list="false" :http-request="httpRequest">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖拽至此区域，或<em>点击上传</em>
          </div>
          <div slot="tip" class="el-upload__tip">
            仅支持xls、xlsx格式，文件大小不超过5M
          </div>
        </el-upload>
      </div>
    </div>
    <div v-if="fileList.length && isfail == 2">
      <div
        style="text-align:center;border: 1px dashed #d9d9d9;border-radius:6px;width: 360px;margin: 0 auto;padding: 50px 0px;">
        <img :src="xlssrc" alt="" style="vertical-align: text-bottom;" />
        <p>
          <span>{{ fileList[0].name }}</span>
        </p>
      </div>
      <div style="text-align:center;margin-top:20px">
        <el-button size="small" type="primary" plain :loading="disabledone2" @click="newuplode">
          重新上传
        </el-button>
        <el-button size="small" type="primary" :loading="disabledone2" @click="suredaoru">
          确认导入
        </el-button>
      </div>
    </div>
    <div v-if="fileList.length && isfail == 1">
      <div style="text-align:center;">
        <img :src="dangersrc" alt="" />
      </div>
      <p style="text-align:center;margin-top:20px;font-size:16px">
        <span style="color:#409EFF">{{ successtotals }}</span>条导入成功， <span style="color:#E6A23C">{{ dangertotals
        }}</span>条导入失败
        <span style="color:#409EFF;cursor: pointer;" @click="getList(dangerlist)">下载失败列表</span>
      </p>
      <div style="text-align:center;margin-top:20px">
        <el-button size="small" type="primary" plain @click="newuplode">
          重新导入
        </el-button>
      </div>
    </div>
    <div v-if="fileList.length && isfail == 0">
      <div style="text-align:center">
        <img :src="successsrc" alt="" />
      </div>
      <p style="text-align:center;margin-top:20px;font-size:16px">
        <span style="color:#409EFF">{{ successtotals }}</span>条导入成功
      </p>
      <div style="text-align:center;margin-top:20px">
        <el-button size="small" type="primary" plain @click="newuplode">
          继续导入
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    requestDownload: {
      type: Function,
    },
  },
  data () {
    return {
      fileList: [],// 上传的文件      有文件 就展示文件列表页面 没文件就展示选择文件的页面
      isfail: 2, // 1 展示失败 0展示成功 2展示文件列表页
      disabledone2: false, // 正在调用上传文件的接口
      successtotals: 0, // 成功的条数
      dangertotals: 0, // 失败的条数
      dangerlist: [], // 失败的文件
      xlssrc: require("@/assets/chart.png"),
      successsrc: require("@/assets/success.png"),
      dangersrc: require("@/assets/fail.png"),
    }
  },
  methods: {
    download () {
      requestDownload(failList).then(response => {
          const link = document.createElement('a');
          const blob = response;
          link.style.display = 'none';
          link.href = URL.createObjectURL(blob);
          link.setAttribute('download', decodeURI(fileName));
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
    },
    // 上传1
    dataprogress1 (file) {
      console.log(file, "1");
      var arr = file.name.split(".");
      var index = arr.length - 1;
      const isXLSX = arr[index] === "xlsx";
      const isXLS = arr[index] === "xls";
      const isPG = isXLSX || isXLS;
      const isLt2M = file.size / 1024 / 1024 < 5;
      if (!isPG) {
        this.$message({
          showClose: true,
          message: "上传文件只能是 .xls .xlsx 格式!",
          type: "warning"
        });
      } else if (!isLt2M) {
        this.$message({
          showClose: true,
          message: "上传文件大小不能超过 5M!",
          type: "warning"
        });
      }
      return isPG && isLt2M;
    },
    // 上传2
    async httpRequest ({ file }) {
      this.fileList.push(file);
    },
    newuplode () {
      this.disabledone2 = false;
      this.fileList = [];
      this.dangerlist = [];
      this.isfail = 2;
    },
    suredaoru () {
      this.disabledone2 = true;
      const data = new FormData();
      data.append("file", this.fileList[0]);
      data.append("enterpriseId", this.enterpriseId);
      systemPersonService
        .enterpriseimport(data)
        .then((res1) => {
          if (res1.result == "0") {
            this.disabledone2 = false;
            if (res1.data.failList.length) {
              // 导入失败
              this.successtotals = res1.data.total - res1.data.failList.length; // 成功条数
              this.dangertotals = res1.data.failList.length; // 失败条数
              this.dangerlist = res1.data.failList;
              this.isfail = 1;
            } else {
              // 导入成功
              this.dangerlist = [];
              this.successtotals = res1.data.total;
              this.isfail = 0;
            }
          }
        })
        .catch(() => {
          this.disabledone2 = false;
        });
    },
    async getList (failList) {
      systemPersonService.drawingDrawingQuesExport(failList).then((response) => {
        const fileName = "导入失败列表.xlsx";
        if ("msSaveOrOpenBlob" in navigator) {
          // 兼容ie
          // var blob = response
          window.navigator.msSaveOrOpenBlob(response, fileName);
          return;
        } else {
          const link = document.createElement("a");
          const blob = response;
          link.style.display = "none";
          link.href = URL.createObjectURL(blob);
          link.setAttribute("download", decodeURI(fileName));
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    },

  }
}
</script>
