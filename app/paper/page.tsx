"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

type ExplainLine = { original: string; translation: string; plain: string };
type PaperPage = {
  page: number;
  chapter: string;
  title: string;
  time: string;
  summary: string;
  lines: ExplainLine[];
  terms: { term: string; meaning: string; analogy: string }[];
  takeaway: string;
  quiz: { question: string; options: string[]; answer: number; why: string };
};

const pages: PaperPage[] = [
  {
    page: 1, chapter: "封面与摘要", title: "这篇论文到底做了什么？", time: "6 分钟",
    summary: "作者把序列模型里必须一步步走的 RNN 和卷积拿掉，只保留注意力，做出了 Transformer。核心卖点不是‘更玄学’，而是质量更高、训练更并行。",
    lines: [
      { original: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.", translation: "主流的序列转换模型建立在复杂的循环神经网络或卷积神经网络之上。", plain: "当时翻译模型的主流做法，要么像接力赛一样逐词传递信息（RNN），要么用滑动窗口逐块看（CNN）。" },
      { original: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.", translation: "我们提出一种新的简单网络结构 Transformer，它完全基于注意力机制。", plain: "作者的激进之处：不再把注意力当配件，而是让它独挑大梁。" },
      { original: "...more parallelizable and requiring significantly less time to train.", translation: "它更容易并行计算，并显著缩短训练时间。", plain: "一句话：让 GPU 能同时处理整句话，而不是排队等前一个词算完。" },
    ],
    terms: [
      { term: "Sequence transduction", meaning: "把一个序列转换成另一个序列，例如英文变中文。", analogy: "像把一段摩斯密码翻译成文字。" },
      { term: "BLEU", meaning: "机器翻译常用的自动评分，比较译文与参考答案的重合程度。", analogy: "像作文参考答案的相似度分，不等于真正的人类理解。" },
      { term: "State of the art", meaning: "在当时公开基准上达到最好结果。", analogy: "某项比赛的当前纪录。" },
    ],
    takeaway: "先记住一件事：Transformer 的革命，首先是计算路径的革命——整句可以并行处理。",
    quiz: { question: "论文最核心的结构变化是什么？", options: ["把 RNN 做得更深", "用注意力替代循环与卷积", "只增加训练数据"], answer: 1, why: "摘要明确写道：架构完全基于注意力，不再依赖 recurrence 和 convolution。" },
  },
  {
    page: 2, chapter: "1 引言 · 2 背景", title: "为什么要摆脱 RNN？", time: "9 分钟",
    summary: "RNN 的前一个位置没算完，后一个位置就不能开始，这让长句训练难以并行；而且远距离信息要走很多步。自注意力让任意两个位置直接建立联系。",
    lines: [
      { original: "This inherently sequential nature precludes parallelization within training examples.", translation: "这种内在的顺序性，使单个训练样本内部无法并行。", plain: "读一句 100 个词的话，RNN 像必须盖完第 1 个章才能盖第 2 个；GPU 再多也得等。" },
      { original: "Attention mechanisms ... allow modeling of dependencies without regard to their distance.", translation: "注意力机制可以建模依赖关系，不受词之间距离影响。", plain: "句首的‘小明’和句尾的‘他’，可以直接拉一条线，不必经过中间十几个词传话。" },
      { original: "The encoder maps an input sequence ... to continuous representations.", translation: "编码器把输入符号序列映射成连续表示。", plain: "编码器不是翻译，而是先把每个词加工成带上下文的‘理解卡片’。" },
    ],
    terms: [
      { term: "Hidden state", meaning: "模型处理到当前位置时携带的内部信息。", analogy: "接力棒里装着前文摘要。" },
      { term: "Encoder / Decoder", meaning: "编码器负责理解输入，解码器负责逐步生成输出。", analogy: "一个做读题笔记，一个照着笔记写答案。" },
      { term: "Auto-regressive", meaning: "生成下一个词时使用已经生成的词。", analogy: "写句子时边看前文边继续写，不能偷看未来。" },
    ],
    takeaway: "Transformer 并没有消灭‘逐词生成’，它主要消灭了训练和理解输入时不必要的逐步等待。",
    quiz: { question: "RNN 在训练长序列时最根本的限制是什么？", options: ["不会做乘法", "必须按位置顺序计算", "词表太小"], answer: 1, why: "隐藏状态 hₜ 依赖 hₜ₋₁，因此同一句中的多个位置不能完全并行。" },
  },
  {
    page: 3, chapter: "3 模型架构", title: "先看懂 Transformer 总装图", time: "12 分钟",
    summary: "左边编码器读输入，右边解码器写输出；两边各堆 6 层。每层都不是简单直通，而是‘做一次变换，再把原信息加回来，再标准化’。",
    lines: [
      { original: "The encoder is composed of a stack of N = 6 identical layers.", translation: "编码器由 N=6 个相同结构的层堆叠而成。", plain: "像 6 个工位串联，每个工位的流程相同，但学到的参数不同。" },
      { original: "LayerNorm(x + Sublayer(x))", translation: "把原输入 x 与子层加工结果相加，再做层归一化。", plain: "先保留原稿，再叠加修改稿，最后把数值尺度整理整齐；这就是残差连接加归一化。" },
      { original: "...prevent positions from attending to subsequent positions.", translation: "防止当前位置关注到后续位置。", plain: "训练写答案时遮住未来答案，避免模型作弊。" },
    ],
    terms: [
      { term: "Residual connection", meaning: "将子层输入直接加到输出上。", analogy: "修改文档时保留原文，只叠加改动，深层网络更不容易把信息弄丢。" },
      { term: "LayerNorm", meaning: "把单个 token 的特征数值调整到稳定尺度。", analogy: "不同乐器先统一音量，再合奏。" },
      { term: "Mask", meaning: "把不允许看到的位置设为极小分数。", analogy: "考试时用纸遮住后面的标准答案。" },
    ],
    takeaway: "架构图从下往上读：词向量 + 位置 → 反复注意力与前馈加工 → 输出下一个词的概率。",
    quiz: { question: "解码器为什么需要 mask？", options: ["减少词表", "避免训练时看到未来词", "让图片更清楚"], answer: 1, why: "第 i 个位置只能依赖 i 之前已知的输出，保持自回归生成规则。" },
  },
  {
    page: 4, chapter: "3.2 注意力", title: "Q、K、V 到底是什么？", time: "15 分钟",
    summary: "Query 表示‘我现在要找什么’，Key 表示‘我能用什么标签被找到’，Value 是‘被找到后真正取走的信息’。Q 与 K 算相似度，softmax 变权重，再对 V 加权求和。",
    lines: [
      { original: "An attention function can be described as mapping a query and a set of key-value pairs to an output.", translation: "注意力函数把一个查询和一组键值对映射为输出。", plain: "像去档案馆：拿问题（Q）匹配目录标签（K），再取出对应文件内容（V）。" },
      { original: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ)V", translation: "Q 与 K 转置相乘，除以维度平方根，经 softmax 后再乘 V。", plain: "先打相关性分数 → 防止分数过大 → 转成总和为 1 的关注比例 → 按比例混合信息。" },
      { original: "...dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients.", translation: "维度大时点积会变大，使 softmax 进入梯度极小的区域。", plain: "分数差距太夸张，softmax 会像过早认定唯一答案，后续很难纠错；除以 √dₖ 是给分数降温。" },
    ],
    terms: [
      { term: "Dot product", meaning: "两个向量对应元素相乘后求和，可衡量方向相似。", analogy: "两份兴趣清单越一致，匹配分越高。" },
      { term: "Softmax", meaning: "把一组任意分数转成总和为 1 的权重。", analogy: "把 100 元预算按重要性分给不同信息。" },
      { term: "Scaling √dₖ", meaning: "用键向量维度的平方根缩小点积分数。", analogy: "分数膨胀前先调低音量，避免 softmax 过度自信。" },
    ],
    takeaway: "注意力不是‘发现真相’，而是根据当前问题，对可用信息做一次动态加权汇总。",
    quiz: { question: "在档案馆比喻中，Value 对应什么？", options: ["你的问题", "目录标签", "实际取出的文件内容"], answer: 2, why: "Q 与 K 只负责算权重，真正被加权汇总的是 V。" },
  },
  {
    page: 5, chapter: "3.2.2 多头注意力", title: "为什么一个头不够？", time: "10 分钟",
    summary: "一个注意力头会把多种关系平均在一起。多头注意力把表示投影到多个子空间，让不同头分别寻找语法、指代、位置或语义关系，最后再合并。",
    lines: [
      { original: "Multi-head attention allows the model to jointly attend to information from different representation subspaces.", translation: "多头注意力让模型能同时关注不同表示子空间的信息。", plain: "像 8 位编辑同时读一句话：有人查主谓，有人查指代，有人看关键词，最后汇总意见。" },
      { original: "In this work we employ h = 8 parallel attention layers, or heads.", translation: "本文使用 8 个并行注意力层，也就是 8 个头。", plain: "每个头处理 64 维，8 个头拼回 512 维；总计算量仍接近一个完整大头。" },
      { original: "The Transformer uses multi-head attention in three different ways.", translation: "Transformer 以三种方式使用多头注意力。", plain: "编码器自注意力、解码器遮罩自注意力、解码器读取编码器结果的交叉注意力。" },
    ],
    terms: [
      { term: "Head", meaning: "一套独立的 Q/K/V 投影与注意力计算。", analogy: "一位有自己观察角度的编辑。" },
      { term: "Projection", meaning: "通过学习到的矩阵，把同一信息映射到不同特征空间。", analogy: "同一张照片分别转成轮廓图、颜色图和深度图。" },
      { term: "Cross-attention", meaning: "Q 来自解码器，K/V 来自编码器。", analogy: "写译文时不断回头查原文笔记。" },
    ],
    takeaway: "多头不是简单复制 8 次，而是给模型 8 套不同的观察坐标系。",
    quiz: { question: "多头注意力最主要的价值是什么？", options: ["把一句话复制多次", "同时学习不同类型的关系", "让输出必然正确"], answer: 1, why: "不同投影让各个头在不同表示子空间、不同位置上分工。" },
  },
  {
    page: 6, chapter: "3.5 位置编码 · 4 为什么", title: "没有顺序，模型怎么懂先后？", time: "13 分钟",
    summary: "自注意力本身像把词放进一只无序袋子，所以作者给每个位置加一组正弦/余弦坐标。不同频率像钟表的秒针、分针和时针，共同形成位置指纹。",
    lines: [
      { original: "We must inject some information about the relative or absolute position of the tokens.", translation: "必须注入 token 的相对或绝对位置信息。", plain: "‘狗咬人’和‘人咬狗’用词相同，但顺序决定意思；模型必须另外拿到座位号。" },
      { original: "Each dimension of the positional encoding corresponds to a sinusoid.", translation: "位置编码的每个维度对应一条正弦曲线。", plain: "有的维度变化快，有的变化慢，就像多只不同速度的钟；组合读数几乎能唯一标记位置。" },
      { original: "Self-attention ... connects all positions with a constant number of sequentially executed operations.", translation: "自注意力用常数次顺序操作连接所有位置。", plain: "任意两个词一层就能直接交流；RNN 中相隔 20 个词的信息要接力 20 次。" },
    ],
    terms: [
      { term: "Positional encoding", meaning: "加入词向量的位置坐标。", analogy: "给坐在同一教室的每个人发一个座位号。" },
      { term: "Maximum path length", meaning: "任意两个位置之间信息传递要经过的最长层数。", analogy: "两个人传话最坏要经过多少个中间人。" },
      { term: "O(n²·d)", meaning: "全注意力要比较 n×n 对位置，每次涉及 d 维。", analogy: "班里每个人都和每个人握手，人数翻倍时握手数约变四倍。" },
    ],
    takeaway: "位置编码负责顺序，注意力负责关系；两者相加后，模型才同时知道‘是谁’和‘坐哪里’。",
    quiz: { question: "为什么需要位置编码？", options: ["注意力本身不含词序", "让词表变大", "减少训练数据"], answer: 0, why: "纯自注意力对输入排列没有天然顺序感，必须额外注入位置信息。" },
  },
  {
    page: 7, chapter: "4 为什么 · 5 训练", title: "速度优势与训练配方", time: "9 分钟",
    summary: "当句长 n 小于特征维度 d 时，自注意力通常比 RNN 更划算，而且并行度高。论文随后给出数据规模、8 张 P100、Adam 和先升后降的学习率策略。",
    lines: [
      { original: "Self-attention layers are faster than recurrent layers when n is smaller than d.", translation: "当序列长度 n 小于表示维度 d 时，自注意力层比循环层更快。", plain: "注意力不是任何情况下都便宜；长文本里 n² 会变贵。这也是后来长上下文优化的来源。" },
      { original: "We trained our models on one machine with 8 NVIDIA P100 GPUs.", translation: "模型在一台装有 8 张 NVIDIA P100 的机器上训练。", plain: "这是 2017 年的实验条件，不要把它直接等同于今天训练大模型所需算力。" },
      { original: "Increasing the learning rate linearly ... and decreasing it thereafter.", translation: "学习率先线性增大，之后按步数平方根的倒数下降。", plain: "先热身，避免一上来步子太大摔倒；稳定后再慢慢减小步幅做精细调整。" },
    ],
    terms: [
      { term: "Learning rate", meaning: "每次参数更新迈多大一步。", analogy: "下山找最低点时的步幅。" },
      { term: "Warmup", meaning: "训练开头逐渐提高学习率。", analogy: "运动前先热身，不立刻全速冲刺。" },
      { term: "BPE / word-piece", meaning: "把词拆成可复用的子词单元。", analogy: "用偏旁部件拼生词，而不是每个生词都单独造字。" },
    ],
    takeaway: "架构决定上限，训练配方决定能否稳定到达；论文的贡献也包含一套可复现的训练方法。",
    quiz: { question: "Warmup 的直观作用是什么？", options: ["训练初期逐步加大学习率", "删除难样本", "只训练最后一层"], answer: 0, why: "论文前 4000 步线性升高学习率，随后再衰减。" },
  },
  {
    page: 8, chapter: "5.4 正则化 · 6 结果", title: "它真的更好吗？怎么看结果表", time: "10 分钟",
    summary: "Transformer-big 在英德翻译达到 28.4 BLEU，并显著降低训练成本。Dropout 和标签平滑用来防止模型过度记住训练集或过度自信。",
    lines: [
      { original: "This hurts perplexity ... but improves accuracy and BLEU score.", translation: "标签平滑会让困惑度变差，却能提高准确率和 BLEU。", plain: "模型不再被要求对唯一答案 100% 自信；数字上某项指标变差，不代表实际任务效果变差。" },
      { original: "...outperforms the best previously reported models ... by more than 2.0 BLEU.", translation: "它比此前最好结果高出 2 个以上 BLEU。", plain: "这不是只快一点：在更低训练成本下，质量还刷新了纪录。" },
      { original: "We averaged the last 20 checkpoints.", translation: "大模型使用最后 20 个检查点的参数平均。", plain: "把训练末期多个相近模型的参数取平均，常能比只拿最后一次更稳。" },
    ],
    terms: [
      { term: "Dropout", meaning: "训练时随机屏蔽部分连接，减少过拟合。", analogy: "平时练习随机拿走几条提示，逼自己真正掌握。" },
      { term: "Label smoothing", meaning: "不把正确类别目标设成绝对 100%。", analogy: "告诉模型‘大概率是它，但别自信到完全听不进别的可能’。" },
      { term: "FLOPs", meaning: "浮点运算次数，用来粗略衡量计算成本。", analogy: "统计厨房完成菜品共做了多少次切、炒、翻。" },
    ],
    takeaway: "读结果表要同时看质量、成本、是否单模型和比较条件，不能只盯一个最高分。",
    quiz: { question: "标签平滑为什么可能有益？", options: ["让模型更绝对自信", "抑制过度自信、改善泛化", "把数据变成图片"], answer: 1, why: "它牺牲部分困惑度表现，却改善准确率和 BLEU。" },
  },
  {
    page: 9, chapter: "6.2 消融实验", title: "哪些零件真的重要？", time: "11 分钟",
    summary: "作者一次只改一个因素：头数、键维度、层数、模型宽度、前馈宽度、dropout 和位置编码。单头较差、头太多也会下降；更大的模型更好，但代价也更高。",
    lines: [
      { original: "While single-head attention is 0.9 BLEU worse ... quality also drops off with too many heads.", translation: "单头注意力低 0.9 BLEU，但头数过多也会导致质量下降。", plain: "分工有益，但把同样总维度切得太碎，每个头能力太弱，也会适得其反。" },
      { original: "Reducing the attention key size dₖ hurts model quality.", translation: "缩小注意力键的维度会损害模型质量。", plain: "用于匹配的‘标签空间’太小，难以表达复杂的相关性。" },
      { original: "Bigger models are better, and dropout is very helpful in avoiding over-fitting.", translation: "更大的模型更好，而 dropout 对避免过拟合很有帮助。", plain: "容量与正则化要配套：脑容量增大，也更需要防止死记硬背。" },
    ],
    terms: [
      { term: "Ablation", meaning: "控制其他条件，只改变一个组件来判断其作用。", analogy: "做菜时只换一种调料，看味道变化来自哪里。" },
      { term: "Perplexity", meaning: "模型对正确下一个词有多‘意外’，通常越低越好。", analogy: "每一步平均在多少个候选里犹豫。" },
      { term: "Parameters", meaning: "模型从数据中学习的数字总量。", analogy: "可以调整的旋钮数量。" },
    ],
    takeaway: "消融实验比单看最终冠军分更重要：它告诉我们‘为什么有效’，也揭示收益与代价。",
    quiz: { question: "论文中的头数实验说明什么？", options: ["头越多永远越好", "单头最好", "需要合适分工，过少过多都可能变差"], answer: 2, why: "8/16 头附近表现好，单头和 32 头都下降。" },
  },
  {
    page: 10, chapter: "6.3 泛化 · 7 结论", title: "不只会翻译：泛化与遗产", time: "8 分钟",
    summary: "作者把 Transformer 用到英语成分句法分析，少量改动就取得强结果，说明架构不是翻译专用。结论也准确预告了图像、音频、视频和局部注意力等方向。",
    lines: [
      { original: "Despite the lack of task-specific tuning our model performs surprisingly well.", translation: "即使缺少任务专属调参，模型表现仍出人意料地好。", plain: "换一门考试，几乎没专门补课也能考得不错，说明学到的是通用能力。" },
      { original: "The first sequence transduction model based entirely on attention.", translation: "第一个完全基于注意力的序列转换模型。", plain: "注意‘第一个’限定在论文所说的序列转换模型与当时文献范围，不等于注意力概念由它首次发明。" },
      { original: "We plan to extend the Transformer to ... images, audio and video.", translation: "计划把 Transformer 扩展到图像、音频和视频。", plain: "这段当年的展望后来成为现实：Transformer 已跨越几乎所有主流模态。" },
    ],
    terms: [
      { term: "Constituency parsing", meaning: "把句子分析成名词短语、动词短语等层级树。", analogy: "给句子画语法家谱。" },
      { term: "Generalization", meaning: "对没见过的数据或不同任务仍有效。", analogy: "不是背题，而是真学会方法。" },
      { term: "Local attention", meaning: "只关注附近或选定区域，减少全局 n² 成本。", analogy: "先看邻座而不是每次都和全校所有人交流。" },
    ],
    takeaway: "这篇论文重要的不只是刷新翻译分数，而是给出了一种后来可扩展到多任务、多模态的通用计算骨架。",
    quiz: { question: "句法分析实验主要证明什么？", options: ["Transformer 只适合翻译", "架构能泛化到其他序列任务", "RNN 从未有效"], answer: 1, why: "模型只做少量任务专属调整，就在成分句法分析取得很强表现。" },
  },
  {
    page: 11, chapter: "参考文献 I", title: "这篇论文站在谁的肩膀上？", time: "5 分钟",
    summary: "参考文献不是‘跳过区’：这里能看到 Bahdanau 注意力、LayerNorm、Adam、Dropout、LSTM、卷积序列模型等前置积木。Transformer 的创新是重新组合并大胆删掉主干。",
    lines: [{ original: "References [1]–[24]", translation: "前半部分参考文献。", plain: "重点追踪四条线：注意力如何出现、RNN 的限制、卷积如何并行、优化与正则化如何让深网可训练。" }],
    terms: [
      { term: "Prior work", meaning: "已有研究与可复用结论。", analogy: "新建筑下方已有的地基和材料标准。" },
      { term: "Citation", meaning: "对观点、方法或数据来源的标注。", analogy: "给知识附上可追溯的收据。" },
    ],
    takeaway: "Transformer 不是凭空出现：它把已有注意力、归一化、残差、词嵌入和优化方法组合成新主干。",
    quiz: { question: "读参考文献最有价值的方式是？", options: ["只数数量", "追踪关键思想从哪里来", "全部忽略"], answer: 1, why: "引用网络能区分哪些是本文首创，哪些是已有积木。" },
  },
  {
    page: 12, chapter: "参考文献 II", title: "从引用网络找到学习路线", time: "5 分钟",
    summary: "后半参考文献补齐 BPE、Mixture-of-Experts、Dropout、Seq2Seq 与 GNMT。建议按‘Seq2Seq → 注意力 → Transformer → 后续大模型’的路线学习，而不是逐条硬啃。",
    lines: [{ original: "References [25]–[40]", translation: "后半部分参考文献。", plain: "如果只选三篇前置阅读：Seq2Seq、Bahdanau Attention、GNMT；再回来看 Transformer 会清晰很多。" }],
    terms: [
      { term: "Seq2Seq", meaning: "用编码器—解码器把一个序列映射到另一个序列。", analogy: "先读完整题目形成笔记，再写答案。" },
      { term: "Mixture-of-Experts", meaning: "让不同专家子网络处理不同输入。", analogy: "总台按问题类型分派给不同专科医生。" },
    ],
    takeaway: "参考文献的真正作用是构建概念地图，而不是制造 40 篇待读焦虑。",
    quiz: { question: "推荐的前置学习顺序是？", options: ["Transformer→算术→Seq2Seq", "Seq2Seq→注意力→Transformer", "只读参考文献"], answer: 1, why: "先理解编码器—解码器和注意力解决的问题，再看 Transformer 的替换才自然。" },
  },
  {
    page: 13, chapter: "附录 · 图 3", title: "注意力真的学会了远距离关系吗？", time: "7 分钟",
    summary: "图中只看单词 making：不同颜色的头跨过很多词连到 more difficult，显示模型能捕捉‘make something more difficult’这一远距离搭配。线是权重，不是人类可读的绝对因果证明。",
    lines: [{ original: "Many of the attention heads attend to a distant dependency of the verb ‘making’.", translation: "许多注意力头关注动词 making 的远距离依赖。", plain: "模型把相隔很远的 making 与 more difficult 直接连起来，不需要逐词传话。" }],
    terms: [
      { term: "Attention visualization", meaning: "把 token 间注意力权重画成连线或热力图。", analogy: "把模型‘此刻更看谁’画出来。" },
      { term: "Dependency", meaning: "词与词之间的语法或语义依赖。", analogy: "句子里隔得很远但互相搭配的零件。" },
    ],
    takeaway: "可视化能帮助提出解释假设，但注意力权重本身不等于完整的模型推理过程。",
    quiz: { question: "图 3 最直接展示了什么？", options: ["所有头完全相同", "跨长距离的词间关联", "模型永远不会错"], answer: 1, why: "making 与 more difficult 相距较远，但多个头给出明显连接。" },
  },
  {
    page: 14, chapter: "附录 · 图 4", title: "某些头会追踪代词指向", time: "6 分钟",
    summary: "作者观察到两个头在处理 its 时注意到 The Law，像是在做指代消解。这里用 apparently（似乎）很谨慎：现象支持解释，但还不是严格证明。",
    lines: [{ original: "Two attention heads ... apparently involved in anaphora resolution.", translation: "两个注意力头似乎参与了指代消解。", plain: "当读到 its，某些头会回看 The Law，像是在回答‘它指的是谁’。" }],
    terms: [
      { term: "Anaphora resolution", meaning: "判断代词或指代表达对应前文哪个实体。", analogy: "看到‘它’，找到前面被代替的名字。" },
      { term: "Sharp attention", meaning: "权重高度集中在少数位置。", analogy: "聚光灯只照一个演员，而不是平均照全场。" },
    ],
    takeaway: "读论文措辞也很重要：apparently 表示作者在报告观察，不把可视化过度包装成定论。",
    quiz: { question: "为什么作者使用 apparently？", options: ["承认这是观察性解释而非严格因果证明", "因为图片损坏", "因为没有注意力"], answer: 0, why: "注意力图能提示功能，但不能单独证明该头承担唯一明确的语言学任务。" },
  },
  {
    page: 15, chapter: "附录 · 图 5", title: "不同头形成了不同分工", time: "6 分钟",
    summary: "同一句话在不同头里出现不同连接模式，说明多头没有学成完全相同的副本。部分头似乎追踪句法结构，呼应正文‘不同表示子空间’的设计动机。",
    lines: [{ original: "The heads clearly learned to perform different tasks.", translation: "这些头显然学会了执行不同任务。", plain: "多位编辑确实出现分工：有人找指代，有人找搭配，有人追踪句法边界。" }],
    terms: [
      { term: "Representation subspace", meaning: "高维表示中侧重某类特征的子空间。", analogy: "同一个人可以从职业、兴趣、位置等不同坐标系描述。" },
      { term: "Interpretability", meaning: "理解模型内部机制与输出原因的程度。", analogy: "不仅知道机器给了答案，还能检查它参考了什么。" },
    ],
    takeaway: "论文最后用图回应一个核心问题：并行的多个头并非纯冗余，它们可能自然形成互补分工。",
    quiz: { question: "图 5 与多头设计的关系是什么？", options: ["显示不同头可能学习互补模式", "证明头越多越好", "显示模型不使用词序"], answer: 0, why: "两个头呈现不同结构性注意模式，支持多子空间分工的直觉。" },
  },
];

const attentionTokens = [
  { word: "动物", scores: [92, 18, 12, 24, 72, 10] },
  { word: "没有", scores: [10, 88, 42, 18, 12, 9] },
  { word: "穿过", scores: [12, 46, 90, 70, 18, 8] },
  { word: "街道", scores: [16, 12, 66, 94, 14, 8] },
  { word: "因为它", scores: [78, 10, 14, 10, 90, 36] },
  { word: "累了", scores: [34, 9, 12, 8, 60, 96] },
];

function ConceptLab({ page }: { page: number }) {
  const [query, setQuery] = useState(4);
  const [head, setHead] = useState(0);
  const [position, setPosition] = useState(6);
  const [length, setLength] = useState(32);
  const heads = [
    { name: "指代头", note: "“因为它”更关注“动物”", color: "#4169e1" },
    { name: "动作头", note: "“穿过”更关注动作与宾语", color: "#ff6a2a" },
    { name: "邻近头", note: "更关注当前位置附近", color: "#9bbe19" },
    { name: "句法头", note: "尝试连接主谓宾结构", color: "#8b5cf6" },
  ];
  const activeScores = attentionTokens[query].scores.map((score, i) => {
    if (head === 0) return score;
    if (head === 1) return [20, 35, 96, 84, 18, 12][i];
    if (head === 2) return Math.max(8, 100 - Math.abs(query - i) * 24);
    return [82, 20, 76, 58, 66, 22][i];
  });

  if (page === 6) {
    const values = Array.from({ length: 12 }, (_, i) => Math.sin(position / Math.pow(10000, (2 * i) / 12)));
    return <div className="position-lab">
      <div className="lab-title"><span>位置编码实验</span><b>位置 {position}</b></div>
      <input aria-label="选择 token 位置" type="range" min="0" max="30" value={position} onChange={(e) => setPosition(Number(e.target.value))} />
      <div className="wave-bars">{values.map((v, i) => <i key={i} title={v.toFixed(3)} style={{ height: `${Math.abs(v) * 72 + 6}px`, background: v >= 0 ? "var(--blue)" : "var(--orange)" }} />)}</div>
      <p>每根柱是一维“时钟”。快慢不同的时钟组合，给位置 {position} 形成独特指纹；蓝色为正，橙色为负。</p>
    </div>;
  }
  if (page === 7) {
    const attention = length * length * 512;
    const recurrent = length * 512 * 512;
    const max = Math.max(attention, recurrent);
    return <div className="complexity-lab">
      <div className="lab-title"><span>复杂度比较</span><b>序列长度 n = {length}</b></div>
      <input aria-label="调整序列长度" type="range" min="8" max="1024" step="8" value={length} onChange={(e) => setLength(Number(e.target.value))} />
      <div className="cost-row"><span>自注意力 n²·d</span><i><b style={{ width: `${attention / max * 100}%` }} /></i><strong>{(attention / 1e6).toFixed(1)}M</strong></div>
      <div className="cost-row"><span>RNN n·d²</span><i><b style={{ width: `${recurrent / max * 100}%` }} /></i><strong>{(recurrent / 1e6).toFixed(1)}M</strong></div>
      <p>{length < 512 ? "此时 n < d，自注意力计算量更低，并且所有位置可并行。" : "此时 n² 开始占上风：长上下文需要稀疏、局部或线性注意力优化。"}</p>
    </div>;
  }
  return <div className="attention-lab">
    <div className="lab-title"><span>{page === 5 || page >= 13 ? "多头观察室" : "Q / K / V 注意力实验"}</span><b>{heads[head].name}</b></div>
    <p className="lab-prompt">点击一个词，把它当作 Query；柱高表示它对每个 Key/Value 的关注权重。</p>
    <div className="head-tabs">{heads.map((item, i) => <button key={item.name} className={head === i ? "active" : ""} onClick={() => setHead(i)}>{item.name}</button>)}</div>
    <div className="token-bars">{attentionTokens.map((token, i) => <button key={token.word} className={query === i ? "query" : ""} onClick={() => setQuery(i)}><i style={{ height: `${activeScores[i]}%`, background: heads[head].color }} /><b>{token.word}</b><small>{activeScores[i]}%</small></button>)}</div>
    <div className="lab-caption"><span>当前 Query：<b>{attentionTokens[query].word}</b></span><p>{heads[head].note}。这是教学用简化权重，不是论文真实模型输出。</p></div>
  </div>;
}

export default function PaperPage() {
  const [activePage, setActivePage] = useState(1);
  const [tab, setTab] = useState<"explain" | "terms" | "lab" | "quiz">("explain");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState<number[]>([]);
  const active = useMemo(() => pages[activePage - 1], [activePage]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("attention-paper-progress") || "[]");
    if (Array.isArray(stored)) setCompleted(stored);
  }, []);

  const choosePage = (page: number) => {
    setActivePage(page);
    setTab("explain");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishPage = () => {
    const next = completed.includes(activePage) ? completed.filter((p) => p !== activePage) : [...completed, activePage];
    setCompleted(next);
    localStorage.setItem("attention-paper-progress", JSON.stringify(next));
  };

  return <main className="paper-app">
    <SiteHeader current="/paper" />
    <header className="paper-toolbar">
      <div><span>ATTENTION IS ALL YOU NEED</span><b>逐页精读工作台</b></div>
      <div className="paper-progress"><i style={{ width: `${completed.length / pages.length * 100}%` }} /><span>{completed.length} / {pages.length} 页</span></div>
      <a href="/attention-paper/attention-is-all-you-need.pdf" target="_blank" rel="noreferrer">打开原始 PDF</a>
    </header>

    <div className="paper-workspace">
      <aside className="paper-pages" aria-label="论文页码">
        <div className="paper-pages-title"><span>论文地图</span><small>15 PAGES</small></div>
        {pages.map((item) => <button key={item.page} className={`${activePage === item.page ? "active" : ""} ${completed.includes(item.page) ? "done" : ""}`} onClick={() => choosePage(item.page)}>
          <span>{completed.includes(item.page) ? "✓" : String(item.page).padStart(2, "0")}</span>
          <div><small>{item.chapter}</small><b>{item.title}</b></div>
        </button>)}
      </aside>

      <section className="paper-scan">
        <div className="scan-head"><span>原论文 · PDF {active.page} / 15</span><em>可点击放大</em></div>
        <a href={`/attention-paper/page-${String(active.page).padStart(2, "0")}.jpg`} target="_blank" rel="noreferrer">
          <img src={`/attention-paper/page-${String(active.page).padStart(2, "0")}.jpg`} alt={`Attention Is All You Need 原论文第 ${active.page} 页`} />
        </a>
        <p>左边保留原始版面，右边按阅读顺序拆解。图表页建议先看图，再读讲解。</p>
      </section>

      <article className="paper-guide">
        <div className="guide-heading"><div><span>PAGE {String(active.page).padStart(2, "0")} · {active.time}</span><h1>{active.title}</h1></div><button className={completed.includes(activePage) ? "done" : ""} onClick={finishPage}>{completed.includes(activePage) ? "✓ 已读懂" : "标记读懂"}</button></div>
        <p className="page-summary">{active.summary}</p>

        <div className="guide-tabs" role="tablist">
          {([['explain','逐句译解'],['terms','概念卡'],['lab','动手实验'],['quiz','检查理解']] as const).map(([id, label]) => <button role="tab" aria-selected={tab === id} key={id} onClick={() => setTab(id)}>{label}</button>)}
        </div>

        {tab === "explain" && <section className="line-explainer">
          {active.lines.map((line, index) => <details key={line.original} open={index === 0}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span><p>{line.original}</p><i>展开</i></summary>
            <div><label>直译</label><p>{line.translation}</p><label>说人话</label><p>{line.plain}</p></div>
          </details>)}
          <blockquote><span>这一页只带走这句话</span>{active.takeaway}</blockquote>
        </section>}

        {tab === "terms" && <section className="term-cards">{active.terms.map((term, index) => <div key={term.term}><span>{String(index + 1).padStart(2, "0")}</span><h2>{term.term}</h2><p>{term.meaning}</p><small>{term.analogy}</small></div>)}</section>}

        {tab === "lab" && <ConceptLab page={activePage} />}

        {tab === "quiz" && <section className="paper-quiz"><span>只选一个最准确的答案</span><h2>{active.quiz.question}</h2>{active.quiz.options.map((option, index) => <button key={option} onClick={() => setRevealed({ ...revealed, [activePage]: true })} className={revealed[activePage] && index === active.quiz.answer ? "correct" : ""}><i>{String.fromCharCode(65 + index)}</i>{option}</button>)}{revealed[activePage] && <p><b>答案：{String.fromCharCode(65 + active.quiz.answer)}</b>{active.quiz.why}</p>}</section>}

        <nav className="paper-nav">
          <button disabled={activePage === 1} onClick={() => choosePage(activePage - 1)}>上一页</button>
          <span>{activePage} / 15</span>
          <button disabled={activePage === 15} onClick={() => choosePage(activePage + 1)}>下一页</button>
        </nav>
        <section className="paper-bridge">
          <span>读完这篇论文，下一步问什么？</span>
          <h2>从“模型怎么计算”走向“系统是否可靠”</h2>
          <p>论文里的 Transformer 让我们理解模型如何处理序列；但面对闭源 API，你通常看不到参数、hidden state 或 attention map。工程评测因此要转向黑盒行为：任务是否完成、规则是否遵守、工具轨迹是否合规、失败能否归因。</p>
          <a href="/learn">去课程：闭源模型与业务测试自动化 →</a>
        </section>
      </article>
    </div>
  </main>;
}
