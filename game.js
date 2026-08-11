
// ====== CONSTANTS ======
var IMG_BASE = "assets/";
function imgPath(n) { return IMG_BASE + n; }
var BGM_BASE = "assets/bgm/";
var SFX_BASE = "assets/sfx/";
var VOICE_BASE = "assets/voice/";
var TW_SPEED = 2;
var COLS = { PINK:"#ffb7c5", YAN:"#4fc3f7", BEAUTY:"#a5d6a7", FUN:"#ffcc80", NAR:"#c8c0b0", DEF:"#f0ede6" };

// ====== AUDIO SYSTEM ======
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null;
var bgmGainNode = null;
var currentBGMName = null;
var bgmSourceNode = null;
var bgmMuted = false;

function ensureAudio() {
  if (audioCtx) return true;
  try {
    audioCtx = new AudioCtx();
    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.value = 0.4;
    bgmGainNode.connect(audioCtx.destination);
    return true;
  } catch(e) { return false; }
}

var audioBufCache = {};
function loadAudioBuf(url, cb) {
  if (audioBufCache[url]) { cb(audioBufCache[url]); return; }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    if (!audioCtx) return;
    audioCtx.decodeAudioData(xhr.response, function(buf) {
      audioBufCache[url] = buf;
      cb(buf);
    });
  };
  xhr.onerror = function() {};
  xhr.send();
}

function playBGM(name) {
  if (!audioCtx || bgmMuted) return;
  if (currentBGMName === name) return;
  stopBGM();
  currentBGMName = name;
  loadAudioBuf(BGM_BASE + name, function(buf) {
    if (currentBGMName !== name) return;
    try {
      bgmSourceNode = audioCtx.createBufferSource();
      bgmSourceNode.buffer = buf;
      bgmSourceNode.loop = true;
      bgmSourceNode.connect(bgmGainNode);
      bgmSourceNode.start(0);
    } catch(e) {}
  });
}

function stopBGM() {
  try { if (bgmSourceNode) { bgmSourceNode.stop(0); bgmSourceNode.disconnect(); } } catch(e) {}
  bgmSourceNode = null;
  currentBGMName = null;
}

function playSFX(name) {
  if (!audioCtx || bgmMuted) return;
  loadAudioBuf(SFX_BASE + name, function(buf) {
    try {
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      var g = audioCtx.createGain();
      g.gain.value = 0.5;
      src.connect(g); g.connect(audioCtx.destination);
      src.start(0);
    } catch(e) {}
  });
}

function playVoice(name) {
  if (!audioCtx) return;
  loadAudioBuf(VOICE_BASE + name, function(buf) {
    try {
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      var g = audioCtx.createGain();
      g.gain.value = 0.7;
      src.connect(g); g.connect(audioCtx.destination);
      src.start(0);
    } catch(e) {}
  });
}

function toggleMute() {
  bgmMuted = !bgmMuted;
  var mb = document.getElementById("mute-btn");
  if (mb) mb.textContent = bgmMuted ? "M" : "S";
  if (bgmMuted) { stopBGM(); }
  else if (currentBGMName) { playBGM(currentBGMName); }
}

var SCENE_BGM = {
  "start":"classroom.mp3","intro":"classroom.mp3",
  "ch1_fourteen":"classroom.mp3","ch1_fourteen_fun":"classroom.mp3",
  "ch1":"classroom.mp3","ch1_yan":"classroom.mp3","ch1_beauty":"classroom.mp3","ch1_fun":"classroom.mp3",
  "ch2_fourteen":"hallway.mp3","ch2_fourteen_fun":"hallway.mp3",
  "ch2":"hallway.mp3","ch2_yan":"hallway.mp3","ch2_beauty":"hallway.mp3","ch2_fun":"hallway.mp3",
  "ch3_fourteen":"rooftop.mp3","ch3_fourteen_fun":"rooftop.mp3",
  "ch3":"rooftop.mp3","ch3_alone":"rooftop.mp3","ch3_gos_chase":"rooftop.mp3",
  "ch3_yan":"rooftop.mp3","ch3_beauty":"rooftop.mp3","ch3_fun":"rooftop.mp3",
  "ch4_fourteen":"farewell.mp3","ch4_fourteen_fun":"farewell.mp3",
  "ch4":"classroom.mp3",
  "gate":"farewell.mp3","g_gos":"farewell.mp3","g_yan":"farewell.mp3",
  "g_beauty":"farewell.mp3","g_fun":"farewell.mp3","g_group":"farewell.mp3",
  "end_check":"classroom.mp3",
  "end_yan":"farewell.mp3","end_beauty":"farewell.mp3","end_fun":"farewell.mp3",
  "end_gos":"farewell.mp3","end_fourteen":"farewell.mp3","end_friend":"farewell.mp3"
};

// ====== DATA CLASSES ======
function Line(sp, txt, col, ci, voice) { this.speaker=sp; this.text=txt; this.color=col||COLS.DEF; this.charImg=ci||null; this.voice=voice||null; }
function Choice(txt, tgt, act) { this.text=txt; this.target=tgt; this.action=act||null; }
function Scene(bg, ci, cp, ln, ch, nx) {
  this.bg=bg; this.charImg=ci||null; this.charPos=cp||"center";
  this._lines=ln; this._choices=ch; this._next=nx;
}
Scene.prototype.getLines=function(s){return typeof this._lines==="function"?this._lines(s):(this._lines||[]);};
Scene.prototype.getChoices=function(s){return typeof this._choices==="function"?this._choices(s):(this._choices||[]);};
Scene.prototype.getNext=function(s){return typeof this._next==="function"?this._next(s):this._next;};

function addAff(k,n){return function(s){s.affection[k]+=n;};}

﻿
// ====== SCENE DATA ======
var scenes = {};
var PC=COLS.PINK, YC=COLS.YAN, BC=COLS.BEAUTY, FC=COLS.FUN, NC=COLS.NAR, FRC="#ff8c64", GC="#b48cff";
function gosChaseAction(s){ s.affection["gos"] += 50; s.gos_flag = true; }

scenes["start"] = new Scene("教室.png", null, "center", [
  new Line(null, "六月的阳光透过窗户洒进教室，空气里弥漫着离别的味道。", NC),
  new Line(null, "今天是高三的最后一天。明天，所有人就将各奔东西。", NC),
  new Line(null, "我坐在自己的座位上，看着周围熟悉的面孔，心里五味杂陈。", NC),
  new Line("???", "喂！发什么呆呢？"),
  new Line(null, "一个声音从背后传来，打断了我的思绪。", NC),
], null, "intro");

function introLn(s) { var n = s.player_name; return [
  new Line("闫宅君", "嘿"+n+"，高考完了有什么计划？要不要一起去唱歌？", YC, "yan_normal.png", "intro_yan_01.mp3"),
  new Line("闫宅君", "我都跟养胃他们说好了，就差你了！", YC, "yan_normal.png", "intro_yan_02.mp3"),
  new Line(null, "闫宅君，资深老宅，平日里大家都叫他大佐。", NC),
  new Line("头花犯", n+"你别听他的，说不定人家想在家睡觉呢。", FC, "fun_normal.png"),
  new Line("头花犯", "不过说真的，来嘛来嘛，我负责搞笑，保证不冷场。", FC, "fun_normal.png"),
  new Line(null, "头花犯，班里的开心果，嘴贫但人不坏。", NC),
  new Line("李美丽", "……你们太吵了。", BC, "beauty_normal.png", "intro_beauty_01.mp3"),
  new Line("李美丽", "不过"+n+"，毕业之后，确实该聚一聚。", BC, "beauty_normal.png", "intro_beauty_02.mp3"),
  new Line(null, "李美丽，学霸兼骚包，话少但句句都在G点上。", NC),
  new Line(null, "三个男生把我围在中间，你一言我一语。", NC),
  new Line(null, "——好像，被「包围」了。", NC),
  new Line(null, "不过……这种感觉，好像也不坏。", NC),
]; }
scenes["intro"] = new Scene("教室.png", "yan_normal.png", "center", introLn, null, "ch1_fourteen");

// CH1 FOURTEEN
scenes["ch1_fourteen"] = new Scene("教室.png", "fourteen_normal.png", "center", [
  new Line(null, "早自习的铃声还没响，教室里已经乱成一团。", NC),
  new Line(null, "毕竟是最后一天了，连班主任都睁一只眼闭一只眼。", NC),
  new Line("14", "阿泰！来来来，最后一条了！", FRC),
  new Line(null, "14举着手机凑过来，屏幕上是抖音的拍摄界面。", NC),
  new Line(null, "三年了，我们不知道在教室后排拍了多少烂活。", NC),
], function(s) { return [
  new Choice("帮他拍完这条烂活", "ch1_fourteen_fun", addAff("fourteen", 25)),
  new Choice("正常回应", "ch1", null),
]; });

scenes["ch1_fourteen_fun"] = new Scene("教室.png", "fourteen_smile.png", "center", function(s) { return [
  new Line("14", "对对对就是这个角度！保持住！", FRC),
  new Line(null, "我配合着做完了那个有点神经的动作。14笑到手机差点掉了。", NC),
  new Line("14", "绝了。这条绝对权威。", FRC),
  new Line(null, "他说完低头看回放，手指划屏幕的动作很慢。", NC),
  new Line(null, "我认识他三年——他从来是拍完就发。这条他看了两遍。", NC),
  new Line("14", "行了行了，完事。", FRC),
]; }, null, "ch1");

// CH1
scenes["ch1"] = new Scene("教室.png", null, "center", [
  new Line(null, "这时——", NC),
], function(s) { return [
  new Choice("闫宅君拍了拍我的肩膀", "ch1_yan", addAff("yan", 20)),
  new Choice("李美丽递过来一张纸条", "ch1_beauty", addAff("beauty", 20)),
  new Choice("头花犯从旁边探过头来", "ch1_fun", addAff("fun", 20)),
]; });

scenes["ch1_yan"] = new Scene("教室.png", "yan_normal.png", "center", function(s) { var n = s.player_name; return [
  new Line("闫宅君", n+"，你看起来心不在焉的。", YC, null, "yan03.mp3"),
  new Line(null, "啊，没什么……就是觉得以后可能再也见不到大家了。", PC),
  new Line("闫宅君", "说什么呢！大家永远是朋友，想见面随时约啊。", YC, null, "yan04.mp3"),
  new Line("闫宅君", "再说，你不想见我，我还想见你呢。", YC, null, "yan05.mp3"),
  new Line(null, "他说完自己也愣了一下，耳朵微微发红。", NC),
  new Line("闫宅君", "呃，我是说……大家都是同学嘛。", YC, null, "yan06.mp3"),
  new Line(null, "（这人，意外的有点可爱。）", PC),
]; }, null, "ch2_fourteen");

scenes["ch1_beauty"] = new Scene("教室.png", "beauty_normal.png", "center", function(s) { return [
  new Line(null, "李美丽没有说话，只是把一张纸条推到我的桌上。", NC),
  new Line(null, "纸条上写着：不管考去哪里，保持联系。——Swx", NC),
  new Line(null, "字迹工整，和他本人一样一丝不苟。", NC),
  new Line(null, "（他居然会主动写纸条……）", PC),
  new Line(null, "我抬头看他，他正假装在看窗外，耳根却有点红。", NC),
  new Line("李美丽", "……别看了。", BC),
  new Line(null, "（beauty害羞的样子，还挺稀奇的。）", PC),
]; }, null, "ch2_fourteen");

scenes["ch1_fun"] = new Scene("教室.png", "fun_normal.png", "center", function(s) { var n = s.player_name; return [
  new Line("头花犯", n+"！你猜我昨晚干了什么！", FC),
  new Line(null, "……又熬夜打XX了？", PC),
  new Line("头花犯", "不是——我把我们班三年的照片都翻了一遍。", FC),
  new Line("头花犯", "然后发现你每次拍照都在发呆或者被挡住半边脸，哈哈哈。", FC),
  new Line(null, "喂！", PC),
  new Line("头花犯", "别生气别生气，我帮你P图。", FC),
  new Line("头花犯", "不过说真的，你笑的时候好看，以后多笑笑。", FC),
  new Line(null, "他说完就转回去了，好像什么都没发生。", NC),
  new Line(null, "（这人……突然说这种话算什么啊。）", PC),
]; }, null, "ch2_fourteen");

﻿
// CH2 FOURTEEN
scenes["ch2_fourteen"] = new Scene("走廊.png", "fourteen_normal.png", "center", [
  new Line(null, "课间，我走出教室透透气。走廊里三三两两的同学在聊天、合影。", NC),
  new Line(null, "14不知道从哪搞来一把吉他，塞到我手里。", NC),
  new Line("14", "来来来，配合一下。最后一把了。", FRC),
  new Line(null, "我弹了几个和弦——弹得烂。14用课本卷成话筒在旁边唱恶俗改编。", NC),
  new Line(null, "周围围了一圈人，笑倒一片。", NC),
], function(s) { return [
  new Choice("跟他一起把烂活搞到底", "ch2_fourteen_fun", addAff("fourteen", 25)),
  new Choice("正常回应", "ch2", null),
]; });

scenes["ch2_fourteen_fun"] = new Scene("走廊.png", "fourteen_smile.png", "center", function(s) { return [
  new Line(null, "我索性破罐破摔，和弦全弹错。14也跟着跑调，两个人越唱越离谱。", NC),
  new Line("14", "哈哈哈哈！等一下我要录下来。", FRC),
  new Line(null, "他拿手机录了一条回放，看了看。", NC),
  new Line("14", "哎，这东西三年后还能看吗。", FRC),
  new Line(null, "他说完就把手机收起来了。那条视频他没发。", NC),
  new Line("14", "算了算了，收工。烂活留给自己。", FRC),
]; }, null, "ch2");

// CH2
scenes["ch2"] = new Scene("走廊.png", null, "center", [
  new Line(null, "手机震了一下——班群消息，大家约中午一起去天台拍照。", NC),
  new Line(null, "我收起手机，发现——", NC),
], function(s) { return [
  new Choice("闫宅君在走廊尽头招手", "ch2_yan", addAff("yan", 40)),
  new Choice("李美丽靠在窗边看书", "ch2_beauty", addAff("beauty", 40)),
  new Choice("头花犯在跟人讲笑话", "ch2_fun", addAff("fun", 40)),
]; });

scenes["ch2_yan"] = new Scene("走廊.png", "yan_smile.png", "center", function(s) { var n = s.player_name; return [
  new Line("闫宅君", n+"！过来一下。", YC, null, "yan07.mp3"),
  new Line(null, "他把我拉到走廊角落，从口袋里掏出一个索尼克的小挂件。", NC),
  new Line("闫宅君", "送你的。毕业礼物。", YC, null, "yan08.mp3"),
  new Line(null, "你自己买的？", PC),
  new Line("闫宅君", "拼胶比赛赢了发的。我多要了一个。", YC, null, "yan09.mp3"),
  new Line(null, "但我知道纪念品每人只有一个。他把自己的给了我。", NC),
  new Line("闫宅君", "那个……"+n+"，以后有空来跟我一起拼胶吧。", YC, null, "yan10.mp3"),
]; }, null, "ch3_fourteen");

scenes["ch2_beauty"] = new Scene("走廊.png", "beauty_blush.png", "center", function(s) { return [
  new Line(null, "李美丽倚在窗边，手里拿着一本地下城生存指南。", NC),
  new Line(null, "我走到他旁边，他没有抬头，但把书往旁边挪了挪。", NC),
  new Line("李美丽", "你看起来有心事。", BC),
  new Line(null, "嗯……觉得三年过得好快。", PC),
  new Line(null, "他沉默了一会儿，从书里抽出一张书签递给我。", NC),
  new Line("李美丽", "这是我自己做的。暑假如果无聊可以看看。", BC),
  new Line(null, "书签是手绘的小猪图案，背面整齐地列着书名。", NC),
  new Line("李美丽", "……还有，我的微信号也在上面。", BC),
  new Line(null, "他说得云淡风轻，牙齿却不由自主的咬起嘴唇。", NC),
  new Line(null, "远处，gos从走廊经过，看了我们一眼，低头快步走开了。", NC),
]; }, null, "ch3_fourteen");

scenes["ch2_fun"] = new Scene("走廊.png", "fun_laugh.png", "center", function(s) { var n = s.player_name; return [
  new Line(null, "头花犯正在跟一群男生讲笑话，看到我过来立刻停下。", NC),
  new Line("头花犯", "正主来了！"+n+"，快来拯救我！", FC),
  new Line(null, "你又干什么了？", PC),
  new Line("头花犯", "我们打赌——我说你高中三年偷偷哭过至少五次。", FC),
  new Line(null, "……你输了。", PC),
  new Line(null, "他瞪大眼睛的样子太滑稽了，周围人都笑了。", NC),
  new Line("头花犯", "好吧我请客，奶茶。", FC),
  new Line("头花犯", "不过说真的，"+n+"，以后不开心了打电话给我。", FC),
  new Line("头花犯", "我帮不上什么忙，但我可以负责让你笑。", FC),
  new Line(null, "（原来他也有认真的时候……）", PC),
]; }, null, "ch3_fourteen");

// CH3 FOURTEEN
scenes["ch3_fourteen"] = new Scene("天台.png", "fourteen_normal.png", "center", [
  new Line(null, "中午，全班同学聚在教学楼前拍毕业照。", NC),
  new Line(null, "六月的风很大，吹得校服猎猎作响。", NC),
  new Line(null, "拍集体照的时候，14站在我旁边。我瞥见他的脚后跟悄悄地离了地。", NC),
  new Line(null, "我没说。他看见我看见了。两个人都没出声。快门按下。", NC),
], function(s) { return [
  new Choice("拍完拉他单独来一张", "ch3_fourteen_fun", addAff("fourteen", 25)),
  new Choice("正常回应", "ch3", null),
]; });

scenes["ch3_fourteen_fun"] = new Scene("天台.png", "fourteen_smile.png", "center", function(s) { return [
  new Line("14", "来，咱俩拍一张。", FRC),
  new Line(null, "14掏出手机。我站过去，他主动蹲下来一点。", NC),
  new Line(null, "干嘛。", PC),
  new Line("14", "构图。你懂个迪奥。", FRC),
  new Line(null, "咔嚓。拍完他看了一眼。", NC),
  new Line("14", "还行。这张能发。", FRC),
  new Line(null, "但他没发。我认识他三年——他什么都往抖音扔。这张没有。", NC),
]; }, null, "ch3");

// CH3
scenes["ch3"] = new Scene("天台.png", null, "center", [
  new Line(null, "拍完集体照，大家三三两两地散开。", NC),
], function(s) { return [
  new Choice("一个人在这里待会儿", "ch3_alone", addAff("yan", 20)),
  new Choice("加入闫宅君他们的自拍群", "ch3_yan", addAff("yan", 40)),
  new Choice("去看李美丽拍的风景照", "ch3_beauty", addAff("beauty", 40)),
  new Choice("跟头花犯一起搞怪合影", "ch3_fun", addAff("fun", 40)),
]; });

scenes["ch3_alone"] = new Scene("天台.png", null, "center", [
  new Line(null, "我一个人站在连接高二的过道，风吹乱了头发。", NC),
  new Line(null, "身后是同学们的笑闹声，眼前是熟悉的校园。", NC),
  new Line(null, "三年的时光，就这样走到了尽头。", NC),
  new Line(null, "但这不是结束。这是一个新的开始。", NC),
  new Line(null, "就在这时——远处楼道拐角，一个毛茸茸的身影一闪而过。", NC),
  new Line(null, "那个身影……不是普通的校服。像是……某种动物的形状。", NC),
], function(s) { return [
  new Choice("追上那个身影", "ch3_gos_chase", gosChaseAction),
  new Choice("算了，还是自己待一会儿吧", "ch4_fourteen", null),
]; });

scenes["ch3_gos_chase"] = new Scene("天台.png", "gos_fursuit.png", "center", function(s) { return [
  new Line(null, "我快步追了过去。那个毛茸茸的身影在走廊尽头拐了个弯。", NC),
  new Line(null, "转过弯，我愣住了。", NC),
  new Line(null, "眼前站着一个穿着完整兽装的人——蓝色的毛发，微微垂下的耳朵。", NC),
  new Line(null, "那双眼睛透过面具看着我，瞳孔里满是慌张。", NC),
  new Line(null, "「……你是谁？」我盯着这个奇怪的生物。", NC),
  new Line(null, "兽装里的人沉默了几秒，然后缓缓摘下了头套。", NC),
  new Line(null, "我睁大了眼睛。", NC),
  new Line(null, "——是gos。", NC),
  new Line("gos", "……别跟别人说。", GC, "gos_normal.png"),
  new Line(null, "他低着头，耳根红得发烫。手里的兽装头套被他紧紧攥着。", NC),
  new Line(null, "原来这就是他藏了三年的秘密。那些深夜不回宿舍的夜晚。", NC),
  new Line(null, "那个总是安静坐在角落的室友，原来有一个这样的世界。", NC),
  new Line("gos", "这……这是我唯一的爱好。", GC, "gos_normal.png"),
  new Line("gos", "我知道很奇怪。", GC, "gos_normal.png"),
  new Line(null, "我看着他那副做错事被抓到的表情，突然觉得有点好笑。", NC),
  new Line(null, "「挺酷的啊。」我说。", NC),
  new Line(null, "他猛地抬头，眼睛里的慌张变成了不可置信。", NC),
  new Line("gos", "……真的？", GC, "gos_normal.png"),
  new Line(null, "「真的。」", NC),
  new Line("gos", "其实……我在圈里的名字叫云澈。", GC, "gos_normal.png"),
  new Line(null, "他说完别过头去，耳朵尖都红透了。", NC),
  new Line(null, "「云澈……好名字。」我笑了笑。", NC),
  new Line("gos", "……谢谢。", GC, "gos_smile.png"),
  new Line(null, "他微微翘起的嘴角，比任何时候都真诚。", NC),
]; }, null, "ch4_fourteen");

scenes["ch3_yan"] = new Scene("天台.png", "yan_smile.png", "center", function(s) { var n = s.player_name; return [
  new Line("闫宅君", "来来来，"+n+"站我旁边！", YC, null, "yan11.mp3"),
  new Line(null, "闫宅君举着手机，半蹲着把大家框进镜头。", NC),
  new Line("闫宅君", "三、二、一——茄子！", YC, null, "yan12.mp3"),
  new Line(null, "后来我才注意到——合照里他站在我身后，笑得比谁都开心。", NC),
]; }, null, "ch4_fourteen");

scenes["ch3_beauty"] = new Scene("天台.png", "beauty_blush.png", "center", function(s) { return [
  new Line(null, "李美丽没有在拍照，而是用手机拍天空和教学楼。", NC),
  new Line(null, "你在拍什么？", PC),
  new Line("李美丽", "记录一些以后可能会怀念的东西。", BC),
  new Line(null, "然后他犹豫了一下，把镜头对准了我。", NC),
  new Line("李美丽", "可以拍一张吗？因为以后可能看不到了。", BC),
  new Line(null, "我点了点头。他按下快门，盯着屏幕看了很久。", NC),
]; }, null, "ch4_fourteen");

scenes["ch3_fun"] = new Scene("天台.png", "fun_laugh.png", "center", function(s) { var n = s.player_name; return [
  new Line("头花犯", n+"！来来来，一起拍个搞怪版的！", FC),
  new Line(null, "头花犯拉着我摆各种夸张姿势——比耶、做鬼脸。", NC),
  new Line("头花犯", "对对对就是这个表情！太绝了！", FC),
  new Line(null, "他把手机收好，难得认真地看了我一眼。", NC),
  new Line("头花犯", "三年了，谢谢你啊，"+n+"。", FC),
]; }, null, "ch4_fourteen");

﻿
// CH4 FOURTEEN
scenes["ch4_fourteen"] = new Scene("校门.png", "fourteen_normal.png", "center", [
  new Line(null, "在校门口，大家互相道别。", NC),
  new Line(null, "有人在拥抱，有人在哭。14在人群里最吵。", NC),
  new Line(null, "笑话一个接一个，一个比一个烂，一个比一个俗。", NC),
  new Line(null, "我认识他三年——他不是在搞笑。他是在筑墙。", NC),
], function(s) { return [
  new Choice("陪他把这堵墙筑到底", "ch4_fourteen_fun", addAff("fourteen", 25)),
  new Choice("正常回应", "ch4", null),
]; });

scenes["ch4_fourteen_fun"] = new Scene("校门.png", "fourteen_smile.png", "center", function(s) { return [
  new Line(null, "我接住他的烂梗，和平时一模一样的节奏。", NC),
  new Line(null, "然后我随口说了一句很普通的话——可能是'明天还出得来吗'。", NC),
  new Line(null, "他停了一拍。很短。但我注意到了。", NC),
  new Line(null, "认识三年，14从来不停。不管多重的气氛，他永远有下一个烂梗等着。", NC),
  new Line(null, "然后他接上了。比之前更恶俗的一个。", NC),
  new Line(null, "我也接了。节奏继续。", NC),
  new Line(null, "两个人都知道那个停顿是什么意思。两个人都没说。", NC),
]; }, null, "ch4");

// CH4
scenes["ch4"] = new Scene("教室.png", null, "center", [
  new Line(null, "放学的钟声终于响起。班主任站在讲台上说了很多话。", NC),
  new Line(null, "我只看到他的眼眶有点红。", NC),
  new Line(null, "教室里安静了几秒，然后整个班都绷不住了。", NC),
  new Line(null, "三年的青春，在这一刻画上了句号。", NC),
], null, "gate");

// GATE
function gateNext(s) {
  if(s.gos_flag) return "g_gos";
  var a = s.affection;
  if(a["yan"] >= a["beauty"] && a["yan"] >= a["fun"]) return "g_yan";
  if(a["beauty"] >= a["yan"] && a["beauty"] >= a["fun"]) return "g_beauty";
  if(a["fun"] >= a["yan"] && a["fun"] >= a["beauty"]) return "g_fun";
  return "g_group";
}

scenes["gate"] = new Scene("校门.png", null, "center", [
  new Line(null, "我站在人群中，看着这些熟悉的面孔，心里空落落的。", NC),
  new Line(null, "然后——", NC),
], null, gateNext);

scenes["g_gos"] = new Scene("校门.png", "gos_normal.png", "center", function(s) { return [
  new Line(null, "校门口，一个熟悉的身影站在人群之外。", NC),
  new Line(null, "gos靠在墙边，和平常一样安静地看着大家。", NC),
  new Line(null, "我走过去，他抬头看我。", NC),
  new Line("gos", "毕业了。", GC),
  new Line(null, "「嗯。」", PC),
  new Line(null, "沉默了一会儿。他从口袋里掏出手机。", NC),
  new Line("gos", "你听这个。", GC),
  new Line(null, "耳机里传来熟悉的旋律——邓紫棋的《光年之外》。", NC),
  new Line(null, "他的眼睛亮了一下，那是我从来没见过的光。", NC),
  new Line("gos", "她的演唱会。暑假。", GC, "gos_smile.png"),
  new Line("gos", "我想……约你一起去。", GC, "gos_smile.png"),
  new Line(null, "他说得很慢，每个字都像是下了很大决心。", NC),
  new Line(null, "我笑了。", NC),
  new Line(null, "「好。」", PC),
  new Line(null, "他把耳机递给我一只。我们靠着墙，一起听完了那首歌。", NC),
]; }, null, "end_check");

scenes["g_yan"] = new Scene("校门.png", "yan_smile.png", "center", function(s) { var n = s.player_name; return [
  new Line("闫宅君", n+"！等一下！", YC, null, "yan13.mp3"),
  new Line(null, "闫宅君从人群中跑出来，额头上有细密的汗珠。", NC),
  new Line("闫宅君", "毕业露营，一起去吧。就我们俩。", YC, null, "yan14.mp3"),
  new Line(null, "他说完立刻别过头去，耳朵红透了。", NC),
  new Line(null, "……好。", PC),
]; }, null, "end_check");

scenes["g_beauty"] = new Scene("校门.png", "beauty_blush.png", "center", function(s) { return [
  new Line("李美丽", "这个给你。", BC),
  new Line(null, "他递给我一个笔记本。翻开后——", NC),
  new Line(null, "每一页都贴着便签，写着三年里关于我的小细节。", NC),
  new Line(null, "3月12日，数学考了第一名，笑了。", NC),
  new Line(null, "……你什么时候记的这些？", PC),
  new Line("李美丽", "重要的是……我想让你知道。", BC),
]; }, null, "end_check");

scenes["g_fun"] = new Scene("校门.png", "fun_laugh.png", "center", function(s) { var n = s.player_name; return [
  new Line("头花犯", "嘿，"+n+"。", FC),
  new Line(null, "你怎么还没走？", PC),
  new Line("头花犯", "等你啊。送你回家。", FC),
  new Line(null, "快到我家楼下的时候，他突然停下。", NC),
  new Line("头花犯", "兄弟，再见了。", FC),
  new Line(null, "他挠着头笑了，但眼睛没有在笑。", NC),
  new Line("头花犯", "你不用回答。不说出来，下次一定会见面。", FC),
]; }, null, "end_check");

scenes["g_group"] = new Scene("校门.png", null, "center", [
  new Line("闫宅君", "以后常联系啊！", YC, null, "yan15.mp3"),
  new Line("李美丽", "保持联系。", BC),
  new Line("头花犯", "群聊不许退！", FC),
  new Line(null, "我看着他们，突然笑了。", NC),
  new Line(null, "好，一言为定。", PC),
], null, "end_check");

// ENDINGS
function endNext(s) {
  if(s.gos_flag) return "end_gos";
  if(s.affection["fourteen"] >= 100) return "end_fourteen";
  if(s.affection["yan"] >= 100) return "end_yan";
  if(s.affection["beauty"] >= 100) return "end_beauty";
  if(s.affection["fun"] >= 100) return "end_fun";
  return "end_friend";
}
scenes["end_check"] = new Scene("教室.png", null, "center", [], null, endNext);

scenes["end_yan"] = new Scene("黄昏.png", "yan_smile.png", "center", [
  new Line(null, "三个月后。大学开学的第一个周末。", NC),
  new Line(null, "宿舍楼下，闫宅君悠闲地散步，我大声叫他的名字，就像高中时那样。", NC),
  new Line(null, "他抬头看到我，咧嘴笑了，朝我挥了挥手。", NC),
  new Line(null, "那笑容和毕业那天一模一样。", NC),
  new Line(null, "——我们的故事，才刚刚开始。", NC),
  new Line(null, "【闫宅君结局：未完待续】", NC),
]);

scenes["end_beauty"] = new Scene("黄昏.png", "beauty_blush.png", "center", [
  new Line(null, "八月的某个午后。我和李美丽约在咖啡馆。", NC),
  new Line(null, "他合上书，深吸了一口气。", NC),
  new Line("李美丽", "看什么书不重要。重要的是和谁分享。", BC),
  new Line(null, "他从包里拿出另一个笔记本。", NC),
  new Line(null, "封面上写着：欢迎来到地下城。", NC),
  new Line(null, "【李美丽结局：未完待续】", NC),
]);

scenes["end_fun"] = new Scene("黄昏.png", "fun_laugh.png", "center", [
  new Line(null, "暑假的最后一天。头花犯发来消息：下楼。", NC),
  new Line(null, "他推着自行车，后座上系着巨大的粉色气球。", NC),
  new Line("头花犯", "路上捡的帕母蛋。也是荒野乱斗启动了。", FC),
  new Line(null, "我接过奶茶——是他知道我最爱的口味。", NC),
  new Line(null, "上号。", PC),
  new Line(null, "他愣了三秒，然后原地蹦了起来。", NC),
  new Line(null, "【头花犯结局：未完待续】", NC),
]);

scenes["end_gos"] = new Scene("校门.png", "gos_smile.png", "center", [
  new Line(null, "八月。邓紫棋演唱会。", NC),
  new Line(null, "场馆里的灯光暗下来，尖叫声从四面八方涌来。", NC),
  new Line(null, "我转头看gos。他没有在尖叫。", NC),
  new Line(null, "他只是仰着头，聚光灯落在他的眼睛里，像一整个银河。", NC),
  new Line(null, "台上的人开始唱《泡沫》。他跟着唱，声音很小。", NC),
  new Line(null, "但我听到了。", NC),
  new Line(null, "他唱得很认真，每一句都像是唱给自己的。", NC),
  new Line("gos", "谢谢你。", GC, "gos_smile.png"),
  new Line(null, "他没看我。但我看到他笑了——", NC),
  new Line(null, "不是那种藏了东西的笑。是第一次，完全放松的笑。", NC),
  new Line(null, "【gos结局：云澈之声】", NC),
]);

scenes["end_fourteen"] = new Scene("泰山.png", "fourteen_outdoor.png", "center", [
  new Line(null, "毕业后那年夏天。", NC),
  new Line(null, "14说去爬泰山。我说行。两个人就这么出发了。", NC),
  new Line(null, "一路上他没怎么说话。和平时不一样。", NC),
  new Line(null, "没有烂梗，没有恶俗笑话。就是一步一步往上走。", NC),
  new Line("14", "你知道吗。", FRC),
  new Line(null, "快到山顶的时候他忽然开口。", NC),
  new Line("14", "高中三年，也就跟你拍那些烂活的时候最开心。", FRC),
  new Line(null, "我看了看他。他没看我。看着前面的台阶。", NC),
  new Line(null, "到了山顶，风很大。他掏出手机，打开前置摄像头。", NC),
  new Line("14", "来。最后一条。", FRC),
  new Line(null, "咔嚓。", NC),
  new Line(null, "他没说这条发不发。我也没问。", NC),
  new Line(null, "但我知道，这条他会留一辈子。", NC),
  new Line(null, "【14结局：极值点组合】", NC),
]);

scenes["end_friend"] = new Scene("黄昏.png", null, "center", [
  new Line(null, "毕业半年后。班群里依然热闹。", NC),
  new Line(null, "偶尔深夜翻到毕业合影，还是会忍不住笑出来。", NC),
  new Line(null, "那个夏天，那些男孩，那些笨拙却真挚的心意——", NC),
  new Line(null, "都是青春里最珍贵的礼物。", NC),
  new Line(null, "【友情结局：青春不散场】", NC),
]);

﻿
// ====== GAME STATE ======
function GameState() {
  this.player_name = "阿泰";
  this.affection = {yan:0, beauty:0, fun:0, fourteen:0, gos:0};
  this.current_label = "start";
  this.history = [];
  this.gos_flag = false;
}

// ====== ACHIEVEMENTS ======
var ACHIEVEMENTS = [
  { id:"end_yan", name:"阳光下的约定", desc:"达成闫宅君结局", scene:"end_yan", color:"#4fc3f7", icon:"闫" },
  { id:"end_beauty", name:"书页间的秘密", desc:"达成李美丽结局", scene:"end_beauty", color:"#a5d6a7", icon:"李" },
  { id:"end_fun", name:"粉色气球", desc:"达成头花犯结局", scene:"end_fun", color:"#ffcc80", icon:"华" },
  { id:"end_fourteen", name:"极值点组合", desc:"和14一起爬上泰山", scene:"end_fourteen", color:"#ff8c64", icon:"14" },
  { id:"end_gos", name:"云澈之声", desc:"和gos一起去邓紫棋演唱会", scene:"end_gos", color:"#b48cff", icon:"澈" },
  { id:"end_friend", name:"青春不散场", desc:"达成友情结局", scene:"end_friend", color:"#c8b4dc", icon:"友" },
  { id:"all_endings", name:"???", desc:"达成所有角色结局", hidden:true, color:"#ffd700", icon:"★",
    cond: function(u) { return u.has("end_yan")&&u.has("end_beauty")&&u.has("end_fun")&&u.has("end_fourteen"); },
    rname:"忧蓝毕业册", rdesc:"集齐闫宅君、李美丽、头花犯、14全部结局" }
];

function ldUnlocked() { try { return new Set(JSON.parse(localStorage.getItem("yl_ach")||"[]")); } catch(e) { return new Set(); } }
function svUnlocked(u) { localStorage.setItem("yl_ach", JSON.stringify([].slice.call(u))); }
function getAchByScene(l) { for(var i=0;i<ACHIEVEMENTS.length;i++) if(ACHIEVEMENTS[i].scene===l) return ACHIEVEMENTS[i]; return null; }
function chkHidden(u) { var n=[]; for(var i=0;i<ACHIEVEMENTS.length;i++) { var a=ACHIEVEMENTS[i]; if(a.hidden&&!u.has(a.id)&&a.cond&&a.cond(u)) n.push(a); } return n; }
function tryUnlockScene(l) { var u=ldUnlocked(); var d=null; var a=getAchByScene(l); if(a&&!u.has(a.id)){u.add(a.id);d=a;} var hn=chkHidden(u); hn.forEach(function(h){u.add(h.id);}); if(d||hn.length) svUnlocked(u); return {direct:d,hidden:hn}; }

// ====== SAVE/LOAD ======
function saveGame(st, slot) {
  var d = { pn:st.player_name, aff:{yan:st.affection.yan,beauty:st.affection.beauty,fun:st.affection.fun,fourteen:st.affection.fourteen,gos:st.affection.gos},
    cl:st.current_label, hist:st.history.slice(), gf:st.gos_flag,
    ts:new Date().toLocaleString("zh-CN"),
    sum:"闫"+st.affection.yan+"% 李"+st.affection.beauty+"% 华"+st.affection.fun+"% 14:"+st.affection.fourteen+"%" };
  localStorage.setItem("yl_save_"+slot, JSON.stringify(d)); return d.sum; }
function loadGame(slot) { try { var r=localStorage.getItem("yl_save_"+slot); if(!r) return null; var d=JSON.parse(r);
  var s=new GameState(); s.player_name=d.pn; s.affection=d.aff; s.current_label=d.cl; s.history=d.hist||[]; s.gos_flag=d.gf||false; return s; } catch(e){return null;} }
function deleteSave(slot) { localStorage.removeItem("yl_save_"+slot); }
function listSlots() { var sl=[]; for(var i=1;i<=6;i++) { var r=localStorage.getItem("yl_save_"+i);
  if(r) { try { var d=JSON.parse(r); sl.push({id:i,label:"存档 "+i,ts:d.ts||"",sum:d.sum||""}); } catch(e) { sl.push({id:i,label:"存档 "+i,ts:"",sum:""}); } }
  else sl.push({id:i,label:"存档 "+i,ts:"",sum:""}); } return sl; }

// ====== DOM REFS ======
function $(id){return document.getElementById(id);}
var bgImg=$("bg-img"), charImg=$("char-img"), dialogueBox=$("dialogue-box"), nameTag=$("name-tag");
var dialogueText=$("dialogue-text"), dialogueHint=$("dialogue-hint"), choicesDiv=$("choices");
var overlay=$("overlay"), notifyDiv=$("notify"), pauseBtn=$("pause-btn"), affectionBar=$("affection-bar");
var affYan=$("aff-yan"), affBeauty=$("aff-beauty"), affFun=$("aff-fun"), aff14=$("aff-14"), affGos=$("aff-gos");
var transOverlay=$("transition-overlay");

function hideOverlay(){overlay.classList.add("hidden");}
function showNotify(m){notifyDiv.textContent=m;notifyDiv.classList.remove("hidden");setTimeout(function(){notifyDiv.classList.add("hidden");},1800);}

﻿
// ====== ENGINE ======
var E = {
  state: new GameState(),
  currentScene: null,
  bgName:"", charName:"", charPos:"center",
  dialogueLines:[], lineIndex:0, charIndex:0,
  fullText:"", displayedText:"", inDialogue:false, dialogueFinished:false,
  currentSpeaker:"", currentColor:COLS.DEF,
  choices:[], showChoices:false,
  transitioning:false, transitionTarget:"",
  showAffection:false, affectionTimer:0,
  showPause:false, showTitle:true, hasActiveGame:false,
  showSaveMenu:false, saveMenuMode:"save", saveSlots:[],
  showAchievements:false,
  pendingAchievements:[], pendingHiddenCheck:false,
  twTimer:0, _currentBGM:null,

  loadStory: function() { this.jumpTo("start"); },
  jumpTo: function(l) {
    if(!scenes[l]){this.state.current_label=null;return;}
    this.currentScene=scenes[l]; this.state.current_label=l;
    var bgmName = SCENE_BGM[l];
    if (bgmName && bgmName !== this._currentBGM) {
      this._currentBGM = bgmName;
      playBGM(bgmName);
    }
    if(l.indexOf("end_")===0){
      var r=tryUnlockScene(l);
      if(r.direct) this.pendingAchievements.push(r.direct);
      this.pendingHiddenCheck=true;
    }
    this.startScene();
  },
  startScene: function() {
    var sc=this.currentScene;
    this.bgName=sc.bg; this.charName=sc.charImg; this.charPos=sc.charPos;
    this.dialogueLines=sc.getLines(this.state); this.lineIndex=0;
    this.inDialogue=true; this.showChoices=false; this.choices=[];
    this.dialogueFinished=false; hideOverlay();
    if(this.dialogueLines&&this.dialogueLines.length>0){this.startLine();}
    else{this.inDialogue=false;this.showChoicesForScene();}
    this.render();
  },
  startLine: function() {
    if(this.lineIndex>=this.dialogueLines.length){
      this.inDialogue=false; this.dialogueFinished=true;
      this.showChoicesForScene(); return;
    }
    var ln=this.dialogueLines[this.lineIndex];
    this.fullText=ln.text; this.currentSpeaker=ln.speaker;
    this.currentColor=ln.color||COLS.DEF;
    this.charIndex=0; this.displayedText=""; this.dialogueFinished=false;
    if(ln.charImg) this.charName=ln.charImg;
    if(ln.voice) playVoice(ln.voice);
    this.render();
  },
  showChoicesForScene: function() {
    if(!this.currentScene) return;
    var raw=this.currentScene.getChoices(this.state);
    if(raw&&raw.length>0){this.choices=raw;this.showChoices=true;}
    else{
      var nx=this.currentScene.getNext(this.state);
      if(nx){this.transitionTo(nx);}
      else{var s=this;dialogueBox.style.display="none";setTimeout(function(){s.goToTitle();},2500);}
    }
    this.render();
  },
  selectChoice: function(idx) {
    var c=this.choices[idx]; if(c.action) c.action(this.state);
    this.showChoices=false; this.choices=[];
    choicesDiv.innerHTML="";
    this.flashAffection();
    playSFX("click.mp3");
    if(c.target) this.transitionTo(c.target);
  },
  transitionTo: function(l) {
    var s=this; this.transitioning=true; this.transitionTarget=l;
    transOverlay.classList.remove("hidden");
    setTimeout(function(){s.transitioning=false;transOverlay.classList.add("hidden");s.jumpTo(l);},350);
  },
  flashAffection: function() { this.showAffection=true; this.affectionTimer=60; },
  advance: function() {
    if(this.transitioning) return;
    if(this.showTitle||this.showPause||this.showSaveMenu||this.showAchievements) return;
    if(this.showChoices) return;
    if(this.inDialogue){
      if(!this.dialogueFinished){
        this.charIndex=this.fullText.length;
        this.displayedText=this.fullText;
        this.dialogueFinished=true;
        this.render();
      }else{
        this.lineIndex++;
        this.startLine();
      }
    }
  },

  goToTitle: function() {
    this.showTitle=true; this.inDialogue=false; this.showChoices=false;
    this.showPause=false; this.showSaveMenu=false; this.showAchievements=false;
    dialogueBox.style.display="none"; choicesDiv.innerHTML=""; hideOverlay();
    stopBGM(); this._currentBGM = null;
    if(this.pendingHiddenCheck){
      this.pendingHiddenCheck=false; var u=ldUnlocked();
      var hn=chkHidden(u); hn.forEach(function(h){u.add(h.id);}); svUnlocked(u);
      var s=this; hn.forEach(function(h){s.pendingAchievements.push(h);});
    }
    this.renderTitle();
  },
  continueGame: function() {
    this.showTitle=false; hideOverlay(); ensureAudio();
    this.jumpTo(this.state.current_label);
  },
  startNewGame: function() {
    this.state=new GameState();
    this.bgName=""; this.charName="";
    this.hasActiveGame=true; this.showTitle=false; this.showPause=false;
    this.showSaveMenu=false; this.showAchievements=false;
    this.showChoices=false; this.inDialogue=false;
    this.transitioning=false; this.showAffection=false;
    this.pendingAchievements=[]; this.pendingHiddenCheck=false;
    this._currentBGM = null;
    hideOverlay(); dialogueBox.style.display="none";
    choicesDiv.innerHTML=""; ensureAudio(); playBGM("classroom.mp3"); this._currentBGM="classroom.mp3"; this.loadStory();
  },

  openPause: function() {
    if(this.showTitle||this.transitioning) return;
    this.showPause=true; this.showSaveMenu=false; this.showAchievements=false;
    this.render();
  },
  closePause: function() {
    this.showPause=false; this.showSaveMenu=false; this.showAchievements=false;
    hideOverlay(); this.render();
  },

  openSaveMenu: function(mode) {
    this.saveMenuMode=mode; this.showSaveMenu=true; this.showPause=false;
    this.showAchievements=false; this.saveSlots=listSlots(); this.render();
  },
  openLoadMenu: function() {
    this.showTitle=false; this.openSaveMenu("load");
  },
  doSaveSlot: function(slot) {
    var sum=saveGame(this.state, slot);
    showNotify("存档"+slot+" 已保存");
    this.saveSlots=listSlots(); this.render();
  },
  doLoadSlot: function(slot) {
    var st=loadGame(slot);
    if(!st){showNotify("存档为空");return;}
    this.state=st; this.hasActiveGame=true;
    this.showSaveMenu=false; this.showPause=false; hideOverlay();
    this.jumpTo(this.state.current_label);
    showNotify("存档"+slot+" 已读取");
  },

  showAchievementsScreen: function() {
    this.showTitle=false; this.showPause=false; this.showSaveMenu=false;
    this.showAchievements=true;
    dialogueBox.style.display="none"; choicesDiv.innerHTML="";
    this.render();
  },
  closeAchievements: function() {
    this.showAchievements=false;
    if(this.inDialogue||this.showChoices){hideOverlay();this.render();}
    else{this.goToTitle();}
  },

  render: function() {
    if(this.showTitle){this.renderTitle();return;}
    if(this.showAchievements){this.renderScene();this.renderAchievements();return;}
    if(this.showPause){this.renderScene();this.renderPause();return;}
    if(this.showSaveMenu){this.renderScene();this.renderSaveMenu();return;}
    this.renderScene();
    if(this.showChoices){this.renderChoices();dialogueBox.style.display="none";}
    else if(this.inDialogue){dialogueBox.style.display="block";this.renderDialogue();}
    else{dialogueBox.style.display="none";}
    if(this.showAffection) this.renderAffectionBar();
    pauseBtn.style.display="block";
  },
  renderScene: function() {
    if(this.bgName){bgImg.src=imgPath(this.bgName);bgImg.style.display="block";}
    if(this.charName){charImg.src=imgPath(this.charName);charImg.style.display="block";}else{charImg.style.display="none";}
  },
  renderDialogue: function() {
    if(this.currentSpeaker){nameTag.textContent=this.currentSpeaker;nameTag.style.display="inline-block";}
    else{nameTag.style.display="none";}
    dialogueHint.style.display=this.dialogueFinished?"block":"none";
    dialogueText.innerHTML=this.displayedText.replace(/\n/g,"<br>");
    dialogueText.style.color=this.currentColor;
  },
  renderChoices: function() {
    var h=""; for(var i=0;i<this.choices.length;i++)
      h+='<div class="choice-btn" data-idx="'+i+'">'+this.choices[i].text+'</div>';
    choicesDiv.innerHTML=h;
    var s=this;
    choicesDiv.querySelectorAll(".choice-btn").forEach(function(b){
      b.addEventListener("click",function(){s.selectChoice(parseInt(this.getAttribute("data-idx")));});
    });
  },
  renderAffectionBar: function() {
    affYan.textContent="闫 "+this.state.affection.yan+"%";
    affBeauty.textContent="李 "+this.state.affection.beauty+"%";
    affFun.textContent="华 "+this.state.affection.fun+"%";
    aff14.textContent="14 "+this.state.affection.fourteen+"%";
    affGos.textContent="gos "+this.state.affection.gos+"%";
    affectionBar.style.opacity="1";
  },

  renderTitle: function() {
    bgImg.src=imgPath("教室.png"); bgImg.style.display="block";
    charImg.style.display="none"; dialogueBox.style.display="none";
    choicesDiv.innerHTML=""; affectionBar.style.opacity="0";
    pauseBtn.style.display="none";
    var btns=this.hasActiveGame?[
      {l:">> 继续游戏",a:"continue"},
      {l:"+ 开始新游戏",a:"new"},
      {l:"[] 读取存档",a:"load"},
      {l:"★ 成就画廊",a:"ach"}
    ]:[
      {l:">> 开始游戏",a:"new"},
      {l:"[] 读取存档",a:"load"},
      {l:"★ 成就画廊",a:"ach"}
    ];
    var h='<div id="title-screen"><div class="school">郑州四中</div><div class="motto">向 善 向 前</div>';
    h+='<div class="deco-line"><div class="line"></div><div class="diamond"></div><div class="line"></div></div>';
    h+='<div class="game-title">忧蓝回忆</div><div class="subtitle">校园青春物语</div>';
    for(var i=0;i<btns.length;i++) h+='<button class="menu-btn" data-act="'+btns[i].a+'">'+btns[i].l+'</button>';
    h+='</div>';
    overlay.innerHTML=h; overlay.classList.remove("hidden");
    var s=this;
    overlay.querySelectorAll(".menu-btn").forEach(function(b){
      b.addEventListener("click",function(){
        var a=this.getAttribute("data-act");
        ensureAudio();
        if(a==="continue")s.continueGame();
        else if(a==="new")s.startNewGame();
        else if(a==="load")s.openLoadMenu();
        else if(a==="ach")s.showAchievementsScreen();
      });
    });
  },

  renderPause: function() {
    var st=this.state;
    var chars=[
      {n:"闫宅君",k:"yan",c:"#4fc3f7"},
      {n:"李美丽",k:"beauty",c:"#a5d6a7"},
      {n:"头花犯",k:"fun",c:"#ffcc80"},
      {n:"14",k:"fourteen",c:"#ff8c64"},
      {n:"gos",k:"gos",c:"#b48cff"}
    ];
    var h='<div id="pause-menu"><h2>菜单</h2>';
    for(var i=0;i<chars.length;i++){
      var ch=chars[i],v=st.affection[ch.k];
      h+='<div class="aff-row"><span style="color:'+ch.c+'">'+ch.n+'</span><div class="aff-bar-bg"><div class="aff-bar-fill" style="width:'+v+'%;background:'+ch.c+'"></div></div><span>'+v+'%</span></div>';
    }
    h+='<button class="pause-btn" data-act="resume">继续游戏</button>';
    h+='<button class="pause-btn" data-act="save">保存游戏</button>';
    h+='<button class="pause-btn" data-act="load">读取存档</button>';
    h+='<button class="pause-btn" data-act="ach">成就画廊</button>';
    h+='<button class="pause-btn" data-act="title">返回标题</button>';
    h+='</div>';
    overlay.innerHTML=h; overlay.classList.remove("hidden");
    var s=this;
    overlay.querySelectorAll(".pause-btn").forEach(function(b){
      b.addEventListener("click",function(){
        var a=this.getAttribute("data-act");
        if(a==="resume")s.closePause();
        else if(a==="save")s.openSaveMenu("save");
        else if(a==="load")s.openSaveMenu("load");
        else if(a==="ach"){s.showPause=false;s.showAchievementsScreen();}
        else if(a==="title")s.goToTitle();
      });
    });
  },

  renderSaveMenu: function() {
    var mode=this.saveMenuMode;
    var h='<div id="save-menu"><h2>'+(mode==="save"?"保存游戏":"读取存档")+'</h2>';
    for(var i=0;i<this.saveSlots.length;i++){
      var sl=this.saveSlots[i];
      if(sl.sum){
        h+='<div class="save-slot"><div class="slot-num">'+sl.label+'</div><div class="slot-info"><div class="slot-date">'+sl.ts+'</div><div class="slot-summary">'+sl.sum+'</div></div></div>';
      }else{
        h+='<div class="save-slot"><div class="slot-num">'+sl.label+'</div><div class="slot-info"><div class="slot-empty">空</div></div></div>';
      }
    }
    h+='<div class="menu-hint">点击存档位进行'+(mode==="save"?"保存":"读取")+'</div></div>';
    overlay.innerHTML=h; overlay.classList.remove("hidden");
    var s=this;
    overlay.querySelectorAll(".save-slot").forEach(function(b,idx){
      b.addEventListener("click",function(){
        if(mode==="save") s.doSaveSlot(idx+1);
        else s.doLoadSlot(idx+1);
      });
    });
  },

  renderAchievements: function() {
    var u=ldUnlocked();
    var h='<div id="achievements"><h2>成就画廊</h2>';
    for(var i=0;i<ACHIEVEMENTS.length;i++){
      var a=ACHIEVEMENTS[i];
      var unlocked=u.has(a.id);
      var name=a.name, desc=a.desc;
      if(a.hidden&&!unlocked&&a.rname){name=a.rname;desc=a.rdesc;}
      h+='<div class="ach-card'+(unlocked?" unlocked":"")+'">';
      h+='<div class="ach-icon'+(unlocked?"":" locked")+'" style="'+(unlocked?"background:"+a.color+";color:#fff":"")+'">'+(unlocked?a.icon:"?")+'</div>';
      h+='<div><div class="ach-name'+(unlocked?"":" locked")+'">'+name+'</div><div class="ach-desc">'+desc+'</div></div>';
      h+='</div>';
    }
    h+='<div class="ach-count">已解锁 '+u.size+'/'+ACHIEVEMENTS.length+'</div>';
    h+='<button class="pause-btn" data-act="back">返回</button></div>';
    overlay.innerHTML=h; overlay.classList.remove("hidden");
    var s=this;
    overlay.querySelectorAll(".pause-btn").forEach(function(b){
      b.addEventListener("click",function(){s.closeAchievements();});
    });
  }
};

﻿
// ====== GAME LOOP ======
function gameLoop() {
  if(E.twTimer>0){
    E.twTimer--;
    if(E.twTimer===0){
      E.displayedText=E.fullText;
      E.dialogueFinished=true;
      E.render();
    }
  }
  if(E.inDialogue&&!E.dialogueFinished){
    if(E.charIndex<E.fullText.length){
      E.charIndex+=TW_SPEED;
      if(E.charIndex>E.fullText.length) E.charIndex=E.fullText.length;
      E.displayedText=E.fullText.substring(0,E.charIndex);
      if(E.charIndex>=E.fullText.length){E.dialogueFinished=true;E.twTimer=0;}
      E.render();
    }
  }
  if(E.showAffection&&E.affectionTimer>0){
    E.affectionTimer--;
    if(E.affectionTimer<=0){E.showAffection=false;affectionBar.style.opacity="0";}
  }
  if(E.pendingAchievements.length>0){
    var ach=E.pendingAchievements.shift();
    showNotify("★ 解锁成就："+ach.name);
  }
}

// ====== EVENT HANDLERS ======
document.addEventListener("click", function(e){
  ensureAudio();
  if(E.showTitle||E.showPause||E.showSaveMenu||E.showAchievements) return;
  if(e.target.closest("#overlay")) return;
  if(e.target.closest("#choices")) return;
  if(e.target.closest("#pause-btn")) return;
  if(e.target.closest("#mute-btn")) return;
  playSFX("click.mp3");
  E.advance();
});

document.addEventListener("touchstart", function(e){
  if(e.target.closest(".choice-btn")||e.target.closest(".menu-btn")||
     e.target.closest(".pause-btn")||e.target.closest(".save-slot")||
     e.target.closest(".top-btn")) return;
}, {passive:true});

pauseBtn.addEventListener("click", function(e){
  e.stopPropagation();
  ensureAudio();
  if(E.showPause) E.closePause();
  else E.openPause();
});

document.addEventListener("dblclick", function(e){e.preventDefault();});


// ====== PRELOADER ======
function startPreloader() {
  var bar = document.getElementById("loading-bar-fill");
  var txt = document.getElementById("loading-text");
  var screen = document.getElementById("loading-screen");
  var game = document.getElementById("game");
  var urls = [];
  var seen = {};
  function add(url) { if (!seen[url]) { seen[url] = true; urls.push(url); } }
  for (var k in scenes) {
    var sc = scenes[k];
    if (sc.bg) add(IMG_BASE + sc.bg);
    if (sc.charImg) add(IMG_BASE + sc.charImg);
    var lines = sc.lines;
    if (Array.isArray(lines)) {
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].charImg) add(IMG_BASE + lines[i].charImg);
        if (lines[i].voice) add(VOICE_BASE + lines[i].voice);
      }
    }
    if (typeof lines === "function") {
      var src = lines.toString();
      var re = /"([^"]+\.(png|mp3))"/g;
      var m;
      while ((m = re.exec(src)) !== null) {
        var name = m[1];
        if (name.indexOf("/") === -1) {
          add((name.indexOf(".mp3") !== -1 ? VOICE_BASE : IMG_BASE) + name);
        }
      }
    }
  }
  for (var bk in SCENE_BGM) { add(BGM_BASE + SCENE_BGM[bk]); }
  add(SFX_BASE + "click.mp3");
  var total = urls.length;
  var loaded = 0;
  function update() {
    bar.style.width = Math.round((loaded / total) * 100) + "%";
    txt.textContent = "正在加载... " + loaded + "/" + total;
  }
  function finish() {
    screen.style.display = "none";
    game.style.display = "block";
    bgImg.src = imgPath("教室.png");
    bgImg.style.display = "block";
    E.renderTitle();
    setInterval(gameLoop, 40);
  }
  var idx = 0;
  var CONCURRENT = 6;
  var finished = false;
  function loadOne() {
    if (idx >= total) return;
    var i = idx++;
    var url = urls[i];
    function done() {
      loaded++;
      update();
      if (!finished && loaded >= total) { finished = true; finish(); }
      else if (idx < total) { loadOne(); }
    }
    if (url.indexOf(".mp3") !== -1) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = done;
      xhr.onerror = done;
      xhr.send();
    } else {
      var img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }
  }
  update();
  for (var c = 0; c < CONCURRENT; c++) { loadOne(); }
}

// ====== INIT ======
startPreloader();
