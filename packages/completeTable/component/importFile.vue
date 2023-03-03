<template>
  <div class="wrap">
    <div v-if="!fileList2.length" style="height:32px;line-height:32px">
      <p style="float: left;">请下载导入模板，按格式修改后导入</p>
      <el-button style="float: right;" size="small" type="primary" @click="down">
        模板下载
      </el-button>
    </div>
    <div v-if="!fileList2.length">
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
    <div v-if="fileList2.length && isfail == 2">
      <div
        style="text-align:center;border: 1px dashed #d9d9d9;border-radius:6px;width: 360px;margin: 0 auto;padding: 50px 0px;">
        <img :src="xlssrc" alt="" style="vertical-align: text-bottom;" />
        <p>
          <span>{{ fileList2[0].name }}</span>
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
    <div v-if="fileList2.length && isfail == 1">
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
    <div v-if="fileList2.length && isfail == 0">
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

  },
  data () {
    return {
      fileList2: [],
      isfail: '',
      xlssrc: '',
      successsrc: '',
      disabledone2: false,
      successtotals: false,
      dangertotals: false,
      dangerlist: [],
    }
  },
  methods: {
    down () { },
    dataprogress1 () { },
    httpRequest () { },
    newuplode () { },
    suredaoru () { },
    getList () { },
  }
}
</script>
