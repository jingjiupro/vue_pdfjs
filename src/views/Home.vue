<template>
  <div class="home" style="display:flex;">
    <div style="width: 200px; height: 200px; border: solid 1px blue;">
     <div class="btn">
        <button @click="sign">盖章</button>
     </div>
      <div class="btn">
        <button @click="undo">撤回</button>
      </div>
    </div>
    <div id="pdf-container" @mousemove="move">
      <img id="pdf-sign-img" :src="signUrl" v-if="signUrl !== ''" v-drag />
      <pdf
        :url="pdfUrl"
        :type="'canvas'"
        :pdfjsDistPath="'/static'"
        ref="pdf"
      />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import pdf from "@/components/PDF/pdf";
export default {
  name: "Home",
  data() {
    return {
      pdfUrl: "",
      signUrl: "",
      orignCanvas:[]
    };
  },
  components: {
    pdf,
  },
  directives: {
    drag: {
      // 指令的定义
      bind: function (el, binding, vnode, oldVnode) {
        let odiv = el; //获取当前元素
        el.onmousedown = (e) => {
          //算出鼠标相对元素的位置;  e.clientX:鼠标距离浏览器边界的距离，odiv.offsetLeft:图片块距离父级边界的距离
          let disX = e.clientX - odiv.offsetLeft;
          let disY = e.clientY - odiv.offsetTop;
          let left = "";
          let top = "";
          const this_ = vnode.context;
          var pdfcontainer = document.getElementById("pdf-container");
          pdfcontainer.onmousemove = (e) => {
            // 用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
            left = e.clientX - disX;
            top = e.clientY - disY;
            //边界的值
            if (left < 11) {
              left = 11;
            } else if (
              left >
              document
                .getElementsByClassName("canvasWrapper")[0]
                .getElementsByTagName("canvas")[0].offsetWidth -
                odiv.offsetWidth +
                11
            ) {
              left =
                document
                  .getElementsByClassName("canvasWrapper")[0]
                  .getElementsByTagName("canvas")[0].offsetWidth -
                odiv.offsetWidth +
                11;
            }
            if (top < 0) {
              top = 0;
            }
            //绑定元素位置到positionX和positionY上面
            //移动当前元素
          };
          document.onmouseup = (e) => {
            var CanvasLeft = odiv.style.left.substring(
              0,
              odiv.style.left.length - 2
            );
            var CanvasTop = odiv.style.top.substring(
              0,
              odiv.style.top.length - 2
            );
            var pageIndex = 0;
            var myCanvas = document
              .getElementsByClassName("canvasWrapper")[0]
              .getElementsByTagName("canvas")[0];
            if (CanvasTop > myCanvas.offsetHeight) {
              //获取当前印章所在页数
              pageIndex = Math.floor(CanvasTop / myCanvas.offsetHeight);
              myCanvas = document
                .getElementsByClassName("canvasWrapper")[pageIndex].getElementsByTagName("canvas")[0];
            }
            var ctx = myCanvas.getContext("2d");
            //按下时存储历史画布
            const historyCanvas = {
              canvansImg: ctx.getImageData(
                0,
                0,
                myCanvas.width,
                myCanvas.height
              ),
              pageIndex: pageIndex,
            };
            this_.orignCanvas.push(historyCanvas);
            var img = new Image();
            img.onload = function () {
              // 将图片画到canvas上面上去,高度*页数
              if (pageIndex == 0) {
                ctx.drawImage(img, CanvasLeft - 11, CanvasTop);
                const positon = {
                  pageindex: 1,
                  xposition: CanvasLeft - 11,
                  yposition: CanvasTop,
                };
                this_.sealPosition.push(positon);
                const data = {
                  pageNum: 1,
                  sealCode: this_.signCode,
                  positionType: "0",
                  type: "1",
                  xposition: Math.floor(
                    ((CanvasLeft - 11) * 600) / myCanvas.offsetWidth
                  ),
                  yposition: Math.floor(
                    (CanvasTop * 840) / myCanvas.offsetHeight
                  ),
                };
                this_.sealInfo.push(data);
              } else {
                ctx.drawImage(
                  img,
                  CanvasLeft - 11,
                  CanvasTop - myCanvas.offsetHeight * pageIndex
                );
                const data = {
                  pageNum: pageIndex + 1,
                  sealCode: this_.signCode,
                  positionType: "0",
                  type: "1",
                  xposition: Math.floor(
                    ((CanvasLeft - 11) * 600) / myCanvas.offsetWidth
                  ),
                  yposition: Math.floor(
                    ((CanvasTop - myCanvas.offsetHeight * pageIndex) * 840) /
                      myCanvas.offsetHeight
                  ),
                };
                this_.sealInfo.push(data);
                const positon = {
                  pageindex: pageIndex + 1,
                  xposition: CanvasLeft - 11,
                  yposition: CanvasTop - myCanvas.offsetHeight * pageIndex,
                };
                this_.sealPosition.push(positon);
              }
            };
            img.src = this_.signUrl;
            this_.signUrl = "";
            this_.signActive = -1;
            this_.personActive = -1;
            //清空事件
            document.onmousemove = null;
            document.onmouseup = null;
          };
        };
      },
    },
  },
  methods: {
    move(e) {
      if (this.signUrl !== "") {
        var pdfContainer = document.getElementById("pdf-container");
        var scrollY = pdfContainer.scrollTop;
        var moveX = e.clientX - pdfContainer.offsetLeft - 200;
        var moveY = e.clientY - pdfContainer.offsetTop + scrollY;
        var SignImg = document.getElementById("pdf-sign-img");
        if (moveX < 0) {
          SignImg.style.left = 0 + "px";
        } else if (
          moveX >
          document
            .getElementsByClassName("canvasWrapper")[0]
            .getElementsByTagName("canvas")[0].offsetWidth -
            SignImg.offsetWidth +
            11
        ) {
          SignImg.style.left =
            document
              .getElementsByClassName("canvasWrapper")[0]
              .getElementsByTagName("canvas")[0].offsetWidth -
            SignImg.offsetWidth +
            11 +
            "px";
        } else {
          SignImg.style.left = moveX + "px";
        }
        SignImg.style.top = moveY + "px";
      }
    },
    sign() {
      this.signUrl = "/static/印章.png";
    },
    undo() {
      if (this.orignCanvas.length > 0) {
        var backCanvasInfo = this.orignCanvas[this.orignCanvas.length - 1];
        var canvas = document.getElementsByClassName("canvasWrapper")[backCanvasInfo.pageIndex].getElementsByTagName("canvas")[0];
        var ctx = canvas.getContext("2d");
        ctx.putImageData(backCanvasInfo.canvansImg, 0, 0);
        this.orignCanvas.pop();
        this.sealInfo.pop();
      } else {
        this.$notify.error({ title: "撤回到最后一步了" })
      }
    },
  },
  mounted() {
    this.pdfUrl = "/static/前端面试html篇.pdf";
    // this.signUrl = "/static/印章.png";
  },
};
</script>

<style lang="scss" scoped>
.btn button{
  width: 100px;
  margin-top: 20px;
  height: 40px;
  border-radius: 10px;
}
#pdf-container {
  width: 830px;
  height: 100vh;
  // margin: 0 auto;
  overflow-y: scroll;
  position: relative;
  // border: 1px solid red;
  #pdf-sign-img {
    position: absolute;
    // width: 100px;
    left: 11px;
    top: 0;
    z-index: 2;
    border: 2px dashed blue;
    &:hover {
      cursor: pointer;
    }
    &:active {
      cursor: move;
    }
  }
}
</style>
