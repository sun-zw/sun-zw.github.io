/**
 * Created by Administrator on 2018/1/9.
 */
window.onload = function() {

    //地址选择器 组件；
    Vue.component('address-selector', {
        props: ['width'],
        template: `
        <div id="picker">
            <div class="shadow" @click="hidePicker"></div>
            <transition v-on:after-leave="afterLeave" name="moveup" >
                <div class="p address_picker" v-show="showSelector">
                    <p class="p_title">选择地址 <span @click="hidePicker">&#215;</span></p>
                    <p class="show_value">
                        <span class="preview_span" :class="{select: selectNum == 1}" data-atype=1 v-on:click="clickSpanToMove($event)">{{preview.province == '' ? '请选择' : preview.province}}</span>
                        <span class="preview_span" :class="{select: selectNum == 2}" data-atype=2 v-on:click="clickSpanToMove($event)">{{preview.province != '' && preview.city == '' ? '请选择' : preview.city}}</span>
                        <span class="preview_span" :class="{select: selectNum == 3}" data-atype=3 v-on:click="clickSpanToMove($event)">{{preview.city != '' && preview.district=='' ? '请选择' : preview.district}}</span>
                    </p>
                    <div class="list_addr">
                        <ul class="list_addr_main" v-bind:class="" v-bind:style="{width: width/2*3 + 'px'}">
                            <li class="select_list">
                                <div class="select_list_box" v-if='provinceList'>
                                    <a v-for="item in provinceList" class="item" href="javascript:" v-bind:data-aid="item.id" data-atype="1" v-on:click="selectAddr($event)" :key="item.id">
                                        <span>{{item.name}}</span>
                                    </a>
                                </div>
                            </li>
                            <li class="select_list">
                                <div class="select_list_box" v-if='cityList'>
                                    <a v-for="item in cityList" class="item" href="javascript:" v-bind:data-aid="item.id" data-atype="2" v-on:click="selectAddr($event)" :key="item.id">
                                        <span>{{item.name}}</span>
                                    </a>
                                </div>
                            </li>
                            <li class="select_list">
                                <div class="select_list_box" v-if='districtList'>
                                    <a href="javascript:" class="item" v-for="item in districtList" v-bind:data-aid="item.id" :key="item.id" data-atype="3" v-on:click="selectAddr($event)">
                                        <span>{{item.name}}</span>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </transition>
        </div>`,
        data: function() {
            return {
                showSelector: false,
                region: {}, //  地址选择 列表，分省、市、区 三个对象值
                cityList: [], //市列表
                districtList: [], //县|区 列表；

                preview: {
                    province: '', //省 
                    city: '', //市 
                    district: '' //区|县
                }, // 地址选择要展示的地址名称(预览)；
                selectNum: 1, //当前选择 (预览) 元素 的标志 （设置样式）；
                direction: 'r', //移动方向 'r' 将要向左移动，'l' 将要向右移动；
            }
        },

        computed: {
            //计算省份列表；
            provinceList: function() {
                return this.initProvince();
            }
        },
        created: function() {
            //请求地址数据
            axios.get('./region.json').then((res) => {
                var arr = res.data;
                var obj = {
                    provinceList: [],
                    cityList: [],
                    districtList: [],
                };
                arr.forEach((val, i) => {
                    if (val.level == 1) {
                        obj.provinceList.push(val);
                    } else if (val.level == 2) {
                        obj.cityList.push(val);
                    } else if (val.level == 3) {
                        obj.districtList.push(val);
                    }
                })
                this.region = obj;
            }).catch((err) => {
                console.error(err);
            })
        },
        // 等dom结构加载之后再去显示 地址选择列表，才会有过渡动画
        mounted: function() {
            this.showSelector = true;
        },
        methods: {
            //初始化省份列表；
            initProvince: function() {
                var ary = this.region.provinceList;
                return ary;
            },
            //隐藏地址选择器；
            hidePicker: function() {
                this.showSelector = false;
            },

            //选择地址（三级联动）；
            selectAddr: function(event) {

                var elmObj = event.currentTarget, //当前点击的对象；
                    pid = elmObj.dataset.aid, //当前点击列表元素的id 即下级元素的父id；
                    val = elmObj.innerText,
                    type = elmObj.dataset.atype; //点击的类型（1、省份 2、市 3、县|区）；
                //设置当前点击 元素 的样式；
                var childElm = elmObj.parentNode.childNodes;
                childElm.forEach(function(val) {
                    val.classList.remove('checked');
                })
                elmObj.classList.add('checked');

                var objData = this.setPreview(pid, val, type); //设置预览值；
                // 发送预览值 给根实例；
                this.$emit('data', objData);

            },
            // 设置预览值；
            setPreview: function(parentId, previewVal, type) {
                //获取 显示选取值 标签元素；
                var previewSpan = document.getElementsByClassName('preview_span');
                var arr = [];
                if (type == 1) {
                    this.region.cityList.forEach(function(val, i) {
                        if (val.parent_id == parentId) {
                            arr.push(val);
                        }
                    });
                    this.cityList = arr;

                    this.preview.province = previewVal; //设置省份为当前选择的值
                    this.preview.city = ''; //
                    this.preview.district = '';

                    this.selectNum = parseInt(type) + 1;
                } else if (type == 2) {
                    if (this.direction == 'r') {
                        this.clickToMove();
                        this.direction = 'l';
                    }
                    this.region.districtList.forEach(function(val, i) {
                        if (val.parent_id == parentId) {
                            arr.push(val);
                        }
                    });
                    this.districtList = arr;

                    this.preview.city = previewVal; //
                    this.preview.district = '';

                    this.selectNum = parseInt(type) + 1;
                } else {
                    this.preview.district = previewVal;
                    this.selectNum = parseInt(type);
                }
                return this.preview;
            },

            //地址选择列表移动
            clickToMove: function() {
                var ul = document.getElementsByClassName('list_addr_main')[0];
                var distance = this.width / 2; //移动距离
                var val = '';
                if (this.direction == 'r') {
                    val = `translateX(-${distance}px)`;
                } else if (this.direction == 'l') {
                    val = `translateX(0)`;
                }
                ul.style.transform = val;
            },

            //点击地址显示区 滚动地址列表；
            clickSpanToMove: function(event) {
                var event = window.event || event;
                var elmObj = event.currentTarget; //当前点击对象；
                var type = elmObj.dataset.atype;

                this.selectNum = parseInt(type);

                if (type == 1) {
                    if (this.direction == 'l') {
                        this.clickToMove();
                        this.direction = 'r';
                    }
                } else {
                    if (this.direction == 'r') {
                        this.clickToMove();
                        this.direction = 'l';
                    }
                }
            },

            // transition 动画离开之后
            afterLeave: function(el) {
                this.$emit('hide', false);
            },
        }
    });

    var app = new Vue({
        el: '#selector',
        data: {
            width: 0,
            height: 0,
            isPicker: false, //是否显示地址选择器；
            info: {

                province: '', //省 校址
                city: '', //市 校址
                district: '', //区|县 校址

                stu_province: '', //省  住址
                stu_city: '', //市 住址
                stu_district: '', //区|县 住址

            },
            which: 'home', // 不同 地址的 区别标志；

        },
        created: function() {
            //获取浏览器的宽高；
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        },

        methods: {

            //显示地址选择器；
            showPicker: function(event) {
                var event = window.event || event;
                this.which = event.currentTarget.dataset.work;

                this.isPicker = true;
                this.isSelectors = true;
            },

            // 接收隐藏 地址选择器 指令；
            hideSelector: function(data) {
                this.isPicker = data;
            },

            //接收地区值 并设置省市区；
            setData: function(data) {

                if (this.which == 'school') {
                    this.info.province = data.province;
                    this.info.city = data.city;
                    this.info.district = data.district;
                } else {
                    this.info.stu_province = data.province;
                    this.info.stu_city = data.city;
                    this.info.stu_district = data.district;
                }
            },

        },

    });

}