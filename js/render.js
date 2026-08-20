// render.js — 总图渲染引擎（浙江省人工智能高质量发展工作图谱）
// 数据来源: 内联 TASKS + 外部 JSON (goals/rail/mechanism/news)
// 浏览器兼容性: Chrome/Firefox/Safari/Edge 最新版（支持 ES2022）

// ── 内联任务数据 ─────────────────────────────────────────
const TASKS = [{"id": 1, "category": "推动芯片全链发展", "group": "聚力推动“GPU浙江造”。", "task": "聚力推动“GPU浙江造”。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "2026年12月", "dimension": "算力"}, {"id": 2, "category": "推动芯片全链发展", "group": "聚力推动“GPU浙江造”。", "task": "在产业链协同创新、强链补链等相关项目中设立TPU、AI芯片等方向，支持产业化项目发展。", "owner": "省经信厅", "co": "省发展改革委、省科技厅", "time": "2026年12月", "dimension": "算力"}, {"id": 3, "category": "推动芯片全链发展", "group": "聚力推动“GPU浙江造”。", "task": "设立省重大科技专项支持GPU芯片、新型异构AI芯片等研发攻关。加快先进封装技术和产线发展。", "owner": "省科技厅", "co": "省经信厅、省科技厅", "time": "2026年12月", "dimension": "算力"}, {"id": 4, "category": "推动芯片全链发展", "group": "推动电子设计自动化（EDA）串链整合。", "task": "聚力推进“GPU浙江造”，全链条推动集成电路关键核心技术攻关。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "持续推进", "dimension": "算力"}, {"id": 5, "category": "推动芯片全链发展", "group": "推动电子设计自动化（EDA）串链整合。", "task": "以“GPU浙江造”为牵引，支持骨干企业联合开展数字芯片设计全流程工具链攻关，探索全周期EDA设计服务协同机制。", "owner": "省发展改革委", "co": "省经信厅、省科技厅、省财政厅、省国资委，杭州市政府", "time": "持续推进", "dimension": "算力"}, {"id": 7, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "支持“模芯协同”中试服务平台建设，提供标准化芯片与模型适配验证服务。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "2026年12月", "dimension": "算力"}, {"id": 8, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "充分发挥我省现有大模型的生态牵引，招引1—2家人工智能芯片设计龙头企业总部，支持国内人工智能芯片重点企业做大做强浙江基地。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "2026年12月", "dimension": "算力"}, {"id": 9, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "支持模型企业和人工智能芯片企业联合开展软件生态工具链等研发，加快“国模”用“国芯”进程。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "持续推进", "dimension": "算力"}, {"id": 10, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "开展国产大模型与国产AI芯片的规模化适配验证与联合优化，争取在国产万卡上实现国产万亿参数模型端到端训练。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "2026年6月", "dimension": "算力"}, {"id": 11, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "探索建立统一的软硬件适配规范与测试标准，减少跨平台适配成本，破解“芯片多、模型大、适配效率低”的瓶颈。", "owner": "省发展改革委", "co": "省经信厅、省科技厅", "time": "持续推进", "dimension": "算力"}, {"id": 12, "category": "推动芯片全链发展", "group": "实施“模芯协同”行动。", "task": "加快国家“芯火”平台、省CMOS 集成电路成套工艺与设计技术创新中心等概念验证中心和中试平台建设，提供科技成果评估、技术可行性评价、中试熟化等创新服务。", "owner": "省经信厅、省科技厅按职责分工负责", "co": "省发展改革委", "time": "持续推进", "dimension": "算力"}, {"id": 13, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "严格落实国家“东数西算”工程布局和算力“窗口指导”要求，国家枢纽节点外原则上不得新建大型及超大型算力中心（包括通算中心、智算中心、超算中心）。", "owner": "省发展改革委", "co": "省经信厅、省能源局、省通信管理局", "time": "持续推进", "dimension": "算力"}, {"id": 14, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "强化算力资源统筹布局，加强新建中心PUE等能耗准入审查，不符合国家和省级政策规划的项目，不得办理备案、能评、网络接入等手续，不享受支持政策。", "owner": "省发展改革委", "co": "省能源局、省通信管理局", "time": "持续推进", "dimension": "算力"}, {"id": 15, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "建设“浙里算”算力监测调度平台，通过电力等指标监控提升算力综合使用效率。实施算力普惠政策、发放算力券，推动算力资源普惠共享和高效利用。", "owner": "省发展改革委", "co": "省经信厅、省能源局、省通信管理局", "time": "2026年6月", "dimension": "算力"}, {"id": 16, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "支持算力中心项目申报国家“窗口指导”，推动算力中心与国家枢纽节点建设协同衔接。", "owner": "省发展改革委", "co": "省经信厅、省能源局、省通信管理局", "time": "持续推进", "dimension": "算力"}, {"id": 17, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "优化全省算力基础设施布局，结合我省实际，按照绿色化、市场化、集约化原则统筹管理，制定出台算力基础设施项目产业政策（规划）合规性评估工作指引。", "owner": "省发展改革委", "co": "省经信厅", "time": "2026年3月", "dimension": "算力"}, {"id": 18, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "研究理顺运营机制，推动XLC与医疗、具身智能等中试基地实现算力共享、语料互通、模型共用，形成良性循环，更好发挥国家XLC作用。", "owner": "省发展改革委", "co": "杭州市政府", "time": "2026年9月", "dimension": "算力"}, {"id": 19, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "研究探索“太空算力”产业在我省发展可行性及相关路径。", "owner": "省发展改革委", "co": "省经信厅、省国防科工办、之江实验室", "time": "2026年9月", "dimension": "算力"}, {"id": 20, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "指导基础电信企业建设省级新型算力中心集群，加快推进长三角算力枢纽节点重点项目建设。", "owner": "省通信管理局", "co": "省发展改革委、省经信厅、省能源局", "time": "持续推进", "dimension": "算力"}, {"id": 21, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "加快建设运力网络，积极申建国家算力互联互通节点，积极打造主要城市内1ms、到长三角国家算力枢纽节点3ms、全省5ms低时延圈。", "owner": "省通信管理局", "co": "省发展改革委、省经信厅、省能源局", "time": "2026年12月", "dimension": "算力"}, {"id": 22, "category": "强化算力设施保障", "group": "有序推进算力布局。", "task": "对接国家发展改革委相关指引要求，尽快形成符合国家要求、符合发展实际的XLC运营收费机制。", "owner": "杭州市政府", "co": "省发展改革委、之江实验室", "time": "2026年9月", "dimension": "算力"}, {"id": 23, "category": "强化算力设施保障", "group": "加强电力配套保障。", "task": "推动算电协同，加强对算力中心项目的电力接入等配套保障，鼓励符合条件的算力中心参加省内电力中长期交易，与风、光、水、核电等低价优质能源运营方直接达成交易。", "owner": "省能源局", "co": "省发展改革委、省电力公司", "time": "持续推进", "dimension": "算力"}, {"id": 24, "category": "强化算力设施保障", "group": "加强电力配套保障。", "task": "探索万卡算力集群与可再生能源就近布局，通过微网推动就地峰谷平衡。", "owner": "省能源局", "co": "省发展改革委、省电力公司", "time": "持续推进", "dimension": "算力"}, {"id": 25, "category": "强化算力设施保障", "group": "实施人工智能券补助。", "task": "支持有条件的地区发放人工智能券，对企业大模型训练推理中租用算力、使用语料、调用模型和依托杭州语料库开放、使用、流通交易高质量数据集时的合理费用，可按照不高于合同实际执行金额的30%，给予最高800万元补助。", "owner": "省发展改革委", "co": "省财政厅", "time": "2026年9月", "dimension": "算力"}, {"id": 26, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "提升企业数据治理能力，遴选省级数据治理优秀企业20家，新增 CDO建设试点企业30家。", "owner": "省经信厅", "co": "省数据局", "time": "2026年12月", "dimension": "数据"}, {"id": 27, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "着力壮大浙江数商群体，修订优质浙江数商遴选标准，选树第三批优质浙江数商，拟遴选“领军型浙江数商”10家、“成长型浙江数商”50家、数商优秀案例100个。", "owner": "省经信厅", "co": "省数据局", "time": "2026年12月", "dimension": "数据"}, {"id": 28, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "完善《浙江省工业领域高质量数据集评价指标体系》，遴选首批20个技术先进、场景适配、价值显著的省级重点行业高质量数据集。", "owner": "省经信厅", "co": "省数据局", "time": "2026年12月", "dimension": "数据"}, {"id": 29, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "进一步完善数据安全管理机制，防范数据非法售卖与滥用。", "owner": "省委网信办", "co": "省数据局、省公安厅", "time": "2026年5月", "dimension": "数据"}, {"id": 30, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "健全公共数据开放政策体系，明确权责范围，在保障安全与隐私前提下，依法依规优先开放市场高需求领域的数据。", "owner": "省数据局", "co": "无", "time": "2026年6月", "dimension": "数据"}, {"id": 31, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "优化公共数据授权运营机制，采用整体、分领域、依场景等多模式授权，开展公共数据资源应用及运营。", "owner": "省数据局", "co": "无", "time": "2026年6月", "dimension": "数据"}, {"id": 32, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "支持龙头、链主企业及第三方服务商建设综合性数字赋能平台，打通产业链堵点，深化跨领域数据融合应用。", "owner": "省经信厅", "co": "省数据局", "time": "持续推进", "dimension": "数据"}, {"id": 33, "category": "加大数据开发利用", "group": "加强公共数据有序利用。", "task": "率先试点推进数据词元化计费等模式，鼓励企业登记、运用数据产权、数据知识产权等权益，巩固高质量数据创新成果，增强语料供给。", "owner": "省数据局", "co": "省卫生健康委、省发展改革委、省市场监管局（省知识产权局）、之江实验室", "time": "2026年12月", "dimension": "数据"}, {"id": 34, "category": "加大数据开发利用", "group": "布局高端数据标注平台。", "task": "鼓励企业牵头制定数据标准，按国际、国家分级，分别给予不超过100万元/项、50万元/项的奖励。", "owner": "省市场监管局（省知识产权局）", "co": "省财政厅、省数据局", "time": "2026年12月", "dimension": "数据"}, {"id": 35, "category": "加大数据开发利用", "group": "布局高端数据标注平台。", "task": "推动落实《浙江省人工智能标准化建设指南（2026版）》，加快培育人工智能、数据领域的标准化项目，推进相关标准化技术组织建设。", "owner": "省经信厅、省数据局", "co": "省发展改革委、省市场监管局（省知识产权局）", "time": "2026年12月", "dimension": "数据"}, {"id": 36, "category": "加大数据开发利用", "group": "布局高端数据标注平台。", "task": "深化企业标准筑基工程，加快数据采集、标注、处理、服务及机器学习等领域相关标准研制，提升企业标准创新发展水平。", "owner": "省市场监管局（省知识产权局）、省数据局", "co": "省经信厅", "time": "2026年12月", "dimension": "数据"}, {"id": 37, "category": "加大数据开发利用", "group": "布局高端数据标注平台。", "task": "建设高质量数据集与语料库，培育一批符合人工智能数据处理要求的数商及高质量数据标注企业和高端数据标注基地，为市场提供更多可用于大模型训练和交易的数据。", "owner": "省数据局", "co": "省经信厅、省发展改革委", "time": "2026年12月", "dimension": "数据"}, {"id": 38, "category": "加大数据开发利用", "group": "布局高端数据标注平台。", "task": "鼓励有条件的地区打造产学研用创新载体，建设特色高效数据标注基地，开发行业高质量数据集。", "owner": "省数据局", "co": "省经信厅", "time": "持续推进", "dimension": "数据"}, {"id": 39, "category": "加大数据开发利用", "group": "支持建设可信数据空间。", "task": "推进落实《浙江省工业可信数据创新发展试点方案》要求，完善试点评估标准，面向工业重点行业和企业遴选省级试点10个左右。", "owner": "省经信厅", "co": "省数据局、省市场监管局（省知识产权局）", "time": "2026年12月", "dimension": "数据"}, {"id": 40, "category": "加大数据开发利用", "group": "支持建设可信数据空间。", "task": "加快推进工业和信息化领域数据知识产权试点，鼓励企业进行“数据产权＋数据资产＋数据知识产权”三权协同登记。", "owner": "省经信厅", "co": "省数据局、省市场监管局（省知识产权局）", "time": "2026年12月", "dimension": "数据"}, {"id": 41, "category": "加大数据开发利用", "group": "支持建设可信数据空间。", "task": "推进《人工智能领域数据知识产权登记指引》实施，发布《数据知识产权登记指南》《数据知识产权价值评价与应用指南》等地方标准。", "owner": "省市场监管局（省知识产权局）", "co": "省数据局、省经信厅", "time": "2026年12月", "dimension": "数据"}, {"id": 42, "category": "加大数据开发利用", "group": "支持建设可信数据空间。", "task": "建立数据知识产权与高质量数据集、语料数据标准对接机制。", "owner": "省市场监管局（省知识产权局）", "co": "省数据局、省经信厅", "time": "2026年12月", "dimension": "数据"}, {"id": 43, "category": "加大数据开发利用", "group": "支持建设可信数据空间。", "task": "支持互联网平台、行业龙头企业牵头建设企业、行业可信数据空间，支持有条件的地区建设城市可信数据空间。", "owner": "省数据局", "co": "省经信厅、省市场监管局（省知识产权局）", "time": "持续推进", "dimension": "数据"}, {"id": 44, "category": "推动模型研发应用", "group": "加强核心技术攻关。", "task": "加快通义千问、Deepseek等全模态大模型技术攻关与迭代。", "owner": "省发展改革委", "co": "省科技厅、杭州市", "time": "2026年7月", "dimension": "模型"}, {"id": 45, "category": "推动模型研发应用", "group": "加强核心技术攻关。", "task": "聚焦世界模型、视觉语言动作模型（VLA模型）、自主软硬件技术、数据合成仿真等领域，支持产学研联合创新，强化高价值专利布局。", "owner": "省科技厅", "co": "省发展改革委、省财政厅、省市场监管局（省知识产权局）", "time": "持续推进", "dimension": "模型"}, {"id": 46, "category": "推动模型研发应用", "group": "加强核心技术攻关。", "task": "实施专利质量提升行动，推进《人工智能领域专利布局指引》实施，支持脑机接口、具身智能等前沿领域专利布局，支持人工智能领域高价值专利培育，实施新一轮高价值专利培育项目、平台100个以上。", "owner": "省市场监管局（省知识产权局）", "co": "无", "time": "2026年12月", "dimension": "模型"}, {"id": 47, "category": "推动模型研发应用", "group": "加强核心技术攻关。", "task": "围绕高质量数据集、具身智能等领域，按照“成熟一个、启动一个”实施省重大科技专项，对符合条件的重大项目，省财政给予最高1000万元补助。", "owner": "省科技厅", "co": "省数据局、省经信厅", "time": "2026年12月", "dimension": "模型"}, {"id": 48, "category": "推动模型研发应用", "group": "建设行业中试基地。", "task": "建设运营好医疗、石化、具身智能、时空信息、文旅、地球科学等人工智能应用中试基地，谋划应急、影视等领域中试基地。", "owner": "省发展改革委", "co": "省委宣传部、省经信厅、省科技厅、省财政厅、省自然资源厅、省文化广电和旅游厅、省卫生健康委、省应急管理厅", "time": "持续推进", "dimension": "模型"}, {"id": 49, "category": "推动模型研发应用", "group": "建设行业中试基地。", "task": "对认定为国家人工智能应用中试基地的，省级给予一定政策支持。", "owner": "省发展改革委", "co": "省委宣传部、省经信厅、省科技厅、省财政厅、省自然资源厅、省文化广电和旅游厅、省卫生健康委、省应急管理厅", "time": "持续推进", "dimension": "模型"}, {"id": 50, "category": "推动模型研发应用", "group": "建设行业中试基地。", "task": "统筹引导国家行业中试基地集聚上下游企业，系统解决行业痛点。医疗领域可“边试边推”；具身智能、石化、时空信息、地球科学等领域应探索市场化机制，并在数据流通等方面开展制度性先行先试，形成可复制的机制经验。", "owner": "省发展改革委", "co": "省卫生健康委、省经信厅、省自然资源厅、省市场监管局（省知识产权局）、省数据局、之江实验室、莫干山地信实验室、杭州市政府", "time": "2026年11月", "dimension": "模型"}, {"id": 51, "category": "推动模型研发应用", "group": "打造出海服务平台。", "task": "发挥自贸试验区先行先试作用，推进数据跨境流动、数字产品非歧视待遇等规则与国际规则对接，深化与新兴市场国家的技术交流合作。", "owner": "省商务厅", "co": "无", "time": "持续推进", "dimension": "应用"}, {"id": 52, "category": "推动模型研发应用", "group": "打造出海服务平台。", "task": "谋划建设面向“一带一路”沿线国家和地区的国际合作平台，全力打造中国-阿盟国家人工智能应用合作中心，助力人工智能相关产品和服务出海。", "owner": "省商务厅", "co": "省发展改革委", "time": "2026年9月", "dimension": "应用"}, {"id": 53, "category": "推动模型研发应用", "group": "打造出海服务平台。", "task": "依托浙企出海综合服务港、自贸区、境外经贸合作区等平台，构建全链条人工智能出海服务体系，更好服务人工智能国际合作。", "owner": "省商务厅", "co": "省经信厅、省科技厅、杭州市", "time": "2026年3月", "dimension": "应用"}, {"id": 54, "category": "推动模型研发应用", "group": "打造出海服务平台。", "task": "研究我省算力出海、数据出境、模型赋能全球现状与路径，建立人工智能企业出海场景要素的培育和对接机制。", "owner": "省商务厅", "co": "省外办、省数据局、省委网信办、省经信厅、省科技厅、省贸促会、杭州市", "time": "2026年6月", "dimension": "应用"}, {"id": 55, "category": "推动模型研发应用", "group": "培育壮大开源社区。", "task": "依托魔搭社区建设国际领先的人工智能开源社区，汇聚国内外优质机构、场景、人才、资金。支持魔搭社区实现国内版和国际版推广和高效运营。", "owner": "省发展改革委", "co": "省经信厅、杭州市政府", "time": "持续推进", "dimension": "生态"}, {"id": 56, "category": "推动模型研发应用", "group": "培育壮大开源社区。", "task": "围绕我省现有开源模型，开发数据集、工具集、应用、框架等原创性技术产品，打造自主可控的开源技术生态。", "owner": "省发展改革委", "co": "省经信厅", "time": "持续推进", "dimension": "生态"}, {"id": 57, "category": "推动模型研发应用", "group": "培育壮大开源社区。", "task": "出台《关于加快推进浙江省开源体系建设的实施意见》，支持打造国际领先的开源模型社区。", "owner": "省经信厅", "co": "无", "time": "2026年9月", "dimension": "生态"}, {"id": 58, "category": "推动模型研发应用", "group": "培育标杆应用场景。", "task": "推动杭州加快建设国家人工智能创新高地。", "owner": "省发展改革委", "co": "无", "time": "持续推进", "dimension": "应用"}, {"id": 59, "category": "推动模型研发应用", "group": "培育标杆应用场景。", "task": "依托“415X”产业集群，在制造、物流、医疗、养老、教育、文化、应急、农业等优势赛道，打造300个以上“人工智能+”典型应用场景。", "owner": "省发展改革委", "co": "省委宣传部、省经信厅、省教育厅、省财政厅、省交通运输厅、省农业农村厅、省海洋经济厅、省商务厅、省文化广电和旅游厅、省卫生健康委、省应急管理厅、省国资委", "time": "2026年12月", "dimension": "应用"}, {"id": 60, "category": "推动模型研发应用", "group": "培育标杆应用场景。", "task": "对具有全国影响力的“人工智能+”标杆应用场景，省市县联动按项目总投资额的30%给予补助，最高不超过500万元。", "owner": "省发展改革委", "co": "省财政厅", "time": "2026年12月", "dimension": "应用"}, {"id": 61, "category": "推动模型研发应用", "group": "培育标杆应用场景。", "task": "加速推进“人工智能+育种”、智慧检疫、动植物疫病监测预警、“低空+AI”农事服务中心等典型场景培育和开放。", "owner": "省农业农村厅", "co": "无", "time": "2026年12月", "dimension": "应用"}, {"id": 62, "category": "推动模型研发应用", "group": "培育标杆应用场景。", "task": "指导省属企业加强与人工智能领域优质主体的合作，结合主业开发垂类大模型，开发和应用可嵌入企业研发、生产、管理、服务等核心业务流程的智能体产品，滚动发布“人工智能+”典型案例和开放场景30个以上。", "owner": "省国资委", "co": "无", "time": "2026年12月", "dimension": "应用"}, {"id": 63, "category": "推动模型研发应用", "group": "支持企业引领创新应用。", "task": "打造世界级人工智能产业集群", "owner": "省经信厅", "co": "省发展改革委、省科技厅、省数据局", "time": "持续推进", "dimension": "应用"}, {"id": 64, "category": "推动模型研发应用", "group": "支持企业引领创新应用。", "task": "鼓励省内龙头企业和平台联合培育创新生态。", "owner": "省科技厅", "co": "省经信厅", "time": "持续推进", "dimension": "应用"}, {"id": 65, "category": "推动模型研发应用", "group": "支持企业引领创新应用。", "task": "支持企业、开发者围绕降本增效、产品创新自研“轻量化、专用化、低成本”模型。", "owner": "省经信厅", "co": "无", "time": "持续推进", "dimension": "应用"}, {"id": 66, "category": "推动模型研发应用", "group": "支持企业引领创新应用。", "task": "推动创新产品应用，鼓励创新产品积极申报首台（套）产品认定，对符合条件的首台（套）产品实施应用奖励，省级财政给予支持。", "owner": "省经信厅", "co": "省财政厅", "time": "2026年12月", "dimension": "应用"}, {"id": 67, "category": "推动模型研发应用", "group": "支持企业引领创新应用。", "task": "优化首台（套）产品认定标准，迭代更新首台（套）产品认定工作指南，组织编制《浙江省首台（套）产品需求清单》，支持支持首台（套）工程化攻关。", "owner": "省经信厅", "co": "无", "time": "2026年12月", "dimension": "应用"}, {"id": 68, "category": "推动模型研发应用", "group": "鼓励智能体创新应用。", "task": "鼓励龙头企业牵头建设智能体开源平台和插件市场。", "owner": "省经信厅", "co": "省发展改革委", "time": "2026年12月", "dimension": "应用"}, {"id": 69, "category": "推动模型研发应用", "group": "鼓励智能体创新应用。", "task": "实施智能体“百景千品万企”行动，打造百项高价值场景，开发千款智能体产品，推动万家企业牵头应用，对符合条件的项目，省市县联动按不超过项目总投资额30%的标准给予补助，最高不超过500万元。", "owner": "省发展改革委", "co": "省经信厅、省财政厅", "time": "2026年12月", "dimension": "应用"}, {"id": 70, "category": "推动模型研发应用", "group": "支持具身智能应用。", "task": "建设具身智能行业测试基地，搭建公共测试环境、测试验证平台等，支撑具身智能软硬件迭代升级，推动形成一批行业标准。", "owner": "省发展改革委", "co": "无", "time": "持续推进", "dimension": "应用"}, {"id": 71, "category": "推动模型研发应用", "group": "支持具身智能应用。", "task": "鼓励国有企事业单位聚焦未来工厂、智慧园区、特色小镇等，滚动开放不低于50个应用场景，打造具身智能应用“样板间”和“体验中心”。", "owner": "省经信厅", "co": "省发展改革委、省国资委", "time": "2026年9月", "dimension": "应用"}, {"id": 72, "category": "推动模型研发应用", "group": "支持具身智能应用。", "task": "省属企业滚动发布具身智能领域典型案例和开放场景30个以上。", "owner": "省国资委", "co": "无", "time": "2026年9月", "dimension": "应用"}, {"id": 73, "category": "推动模型研发应用", "group": "支持智能终端消费。", "task": "鼓励各地按照国家有关要求支持智能终端消费。", "owner": "省商务厅", "co": "省经信厅", "time": "持续推进", "dimension": "应用"}, {"id": 74, "category": "推动模型研发应用", "group": "支持智能终端消费。", "task": "推动新一代智能终端、企业智能体等在重点行业的应用普及率超过70%。", "owner": "省发展改革委", "co": "省经信厅", "time": "2026年12月", "dimension": "应用"}, {"id": 75, "category": "推动模型研发应用", "group": "支持智能终端消费。", "task": "强化具身智能、人形机器人等智能终端产业发展，深化智能装备在社会治理场景应用。", "owner": "省经信厅", "co": "省发展改革委、省政法委", "time": "2026年5月", "dimension": "应用"}, {"id": 76, "category": "打造最优创新生态", "group": "布局产业孵化平台。", "task": "鼓励有条件的地方谋划建设集开源社区、算力、数据、模型、融资服务、产业对接等功能于一体的全流程、开放式孵化加速平台。", "owner": "省发展改革委", "co": "省经信厅", "time": "持续推进", "dimension": "生态"}, {"id": 77, "category": "打造最优创新生态", "group": "布局产业孵化平台。", "task": "鼓励有条件的市、县（市、区）综合考虑企业研发实力，按研发费用的一定比例给予财政奖励。", "owner": "省经信厅、省科技厅", "co": "省财政厅", "time": "2026年12月", "dimension": "生态"}, {"id": 78, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "支持人工智能芯片重点企业引进顶尖人才，放宽海外学习（工作）经历条件限制，对引进的存在安全风险或有保密需求等特殊情况的人才，可不经集中评审，按程序审议后直接纳入“鲲鹏行动”支持范围，授权浙江大学、西湖大学、之江实验室等重点平台开展“鲲鹏行动”自主评审，每年引进10名以上顶尖人才。", "owner": "省委组织部、省人力社保厅", "co": "省经信厅、省教育厅、省科技厅", "time": "2026年12月", "dimension": "生态"}, {"id": 79, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "探索“企业认定、政府认账”的人才评价机制，省市人才项目单列人工智能赛道，放宽资格条件，不限申报名额，每年申报人工智能人才300名以上。", "owner": "省委组织部、省人力社保厅", "co": "省经信厅、省科技厅", "time": "2026年12月", "dimension": "生态"}, {"id": 80, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "优化省海外引才计划申报资格条件，对人工智能人才可放宽海外学习（工作）时间、年龄、学历、职务等方面要求，不限申报名额，加大人工智能人才引进支持力度。", "owner": "省委组织部、省人力社保厅", "co": "省经信厅、省教育厅、省科技厅", "time": "持续推进", "dimension": "生态"}, {"id": 81, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "对重点企业、重点平台对接过程中的海外高层次人才和世界排名、专业排名前100高校人工智能领域在校硕士生、博士生，可先给予省级人才计划称号，到岗后经认定按规定兑现政策。", "owner": "省委组织部、省人力社保厅", "co": "省经信厅、省教育厅、省科技厅", "time": "2026年12月", "dimension": "生态"}, {"id": 82, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "加大人工智能人才激励力度，省级人才计划对人工智能人才支持比例不低于25%，高校院所与企业共同引进的人工智能人才薪酬可合并计算作为兑现政策的依据。", "owner": "省委组织部、省人力社保厅", "co": "无", "time": "2026年6月", "dimension": "生态"}, {"id": 83, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "高校、科研院所人才到企业全职双聘或创业，同等享受当地人才政策。企业人才任高校产业教授可担任研究生第一导师。", "owner": "省委组织部、省人力社保厅", "co": "省教育厅", "time": "2026年9月", "dimension": "生态"}, {"id": 84, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "加强高水平人才高地建设，争取杭州、宁波等城市纳入国家人才平台布局。", "owner": "省委组织部", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 85, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "推行人才市场化社会化评价，年薪100万元以上且具有5年以上研发经验（年薪50万元以上且具有3年以上研发经验）的人工智能人才，可直接认定省级领军人才（青年人才）。", "owner": "省委组织部、省人力社保厅", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 86, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "优化人工智能人才遴选，在政府特殊津贴遴选推荐中对人工智能人才予以倾斜，在省级创业人才遴选中对人工智能人才单列评审。", "owner": "省人力社保厅", "co": "省委组织部", "time": "2026年12月", "dimension": "生态"}, {"id": 87, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "整合浙大等高校、之江实验室等实训资源，有计划开展人工智能跨行业人才培训，探索体系化培养方式、培育目标、认定标准等。", "owner": "省人力社保厅", "co": "省教育厅", "time": "2026年6月", "dimension": "生态"}, {"id": 88, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "开展制造业等重点行业人工智能对就业的影响专题分析", "owner": "省人力社保厅", "co": "无", "time": "2026年6月", "dimension": "生态"}, {"id": 89, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "指导省人工智能高评委开展高级工程师职称评审，开发人工智能大模型训练师高级职称评价标准。建立符合人工智能人才职业属性和岗位特点的分类评价标准，打破学历、资历、论文等方面的限制，将薪酬待遇、开源贡献等实战经验作为评价重要依据。", "owner": "省人力社保厅", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 90, "category": "打造最优创新生态", "group": "加大人才引育力度。", "task": "围绕人工智能新职业岗位（如提示词工程师/数据标注师）加大就业支持。", "owner": "省人力社保厅", "co": "无", "time": "2026年6月", "dimension": "生态"}, {"id": 91, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "联合高校、科研院所、第三方机构等举办人工智能创新等高规格大赛，指导各地加大“以赛代评”等政策支持力度，适时将人工智能高规格大赛获奖相应等次人员纳入当地高层次人才目录。", "owner": "省发展改革委", "co": "省委组织部、省科技厅、省教育厅", "time": "2026年12月", "dimension": "生态"}, {"id": 92, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "积极承接世界互联网大会乌镇峰会人工智能领域分论坛的筹办，加强与世界互联网大会人工智能专委会的合作。创新打造“直通乌镇”全球互联网大赛人工智能赛道品牌，探索世界互联网大会乌镇峰会、全球数字贸易博览会、云栖大会“三会联动”。", "owner": "省委网信办", "co": "省经信厅、省商务厅", "time": "2026年12月", "dimension": "生态"}, {"id": 93, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "办好“数据要素x”大赛浙江分赛等活动，助力打造更多数据安全和人工智能治理交流合作高能级平台。", "owner": "省委网信办", "co": "省数据局", "time": "2026年12月", "dimension": "生态"}, {"id": 94, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "依托世界互联网大会乌镇峰会、全球数字贸易博览会、云栖大会等重大平台，承接人工智能创新活动。在数字贸易博览会、世界互联网大会乌镇峰会等重大展会中展示推广人形机器人、智能终端、脑机接口等人工智能产品。", "owner": "省发展改革委", "co": "省委组织部、省委网信办、省经信厅、省人力社保厅、省商务厅、省数据局", "time": "2026年12月", "dimension": "生态"}, {"id": 95, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "谋划争取省政府和国家发展改革委等共同举办世界人工智能开源大赛，对顶尖团队和优质项目，给予“一站式”政策支持包，吸引更多开发者和项目落地浙江。", "owner": "省发展改革委", "co": "省经信厅、省商务厅", "time": "2026年10月", "dimension": "生态"}, {"id": 96, "category": "打造最优创新生态", "group": "举办赛事会议活动。", "task": "构建人工智能项目资本对接机制。依托数贸创投日、DT 奖、创新大赛等载体，定向匹配人工智能优秀项目与资本需求，加速科技成果转化落地。", "owner": "省商务厅", "co": "无", "time": "持续推进", "dimension": "生态"}, {"id": 97, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "鼓励将人工智能知识融入企业家培训教学内容，纳入基础教育（K12）通识课程。推进人工智能安全课程体系、培养体系建设，加强人工智能安全领域人才培育。", "owner": "省委组织部、省教育厅", "co": "省委宣传部", "time": "持续推进", "dimension": "生态"}, {"id": 98, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "依托“共富善治大讲堂”，拟围绕培育壮大新兴产业和未来产业等主题开展教育培训，并将人工智能相关内容纳入各级党校（行政学院）主体班次教学内容。", "owner": "省委组织部", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 99, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "用好浙江领导干部网络学院平台，围绕培育壮大新兴产业和未来产业上线一批优质网络课程。", "owner": "省委组织部", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 100, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "围绕事业单位工作人员人工智能素养提升，构建岗前培训、在岗培训、专项培训三维矩阵，系统化推进人工智能通识教育培训落地见效。", "owner": "省人力社保厅", "co": "无", "time": "持续推进", "dimension": "生态"}, {"id": 101, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "加快建设省人工智能学院、国家产教融合平台，支持高校专设人工智能学院或交叉学科，鼓励校企合作培养复合型、实践型人才。", "owner": "省人力社保厅", "co": "省发展改革委、省人力社保厅", "time": "持续推进", "dimension": "生态"}, {"id": 102, "category": "打造最优创新生态", "group": "加大全社会通识教育。", "task": "推动优质教学资源共享共用和公平可及。", "owner": "省人力社保厅", "co": "省教育厅", "time": "持续推进", "dimension": "生态"}, {"id": 103, "category": "打造最优创新生态", "group": "加强金融支持。", "task": "用好省科创母基金三期（人工智能）等基金，稳步推进浙江社保科创基金市场化投资，打造人工智能基金群，引导资本投早、投小、投长期、投硬科技，满足企业全周期融资需求。", "owner": "省创新投资集团", "co": "省发展改革委、浙江金融监管局", "time": "2026年6月", "dimension": "生态"}, {"id": 104, "category": "打造最优创新生态", "group": "加强金融支持。", "task": "推进基金接力投资和投贷联动，持续为被投项目提供全生命周期支持。重视高层次人才在浙人工智能创业项目，协同地方政策、科研等资源为人才提供针对性服务。", "owner": "省委金融办", "co": "省委组织部", "time": "2026年12月", "dimension": "生态"}, {"id": 105, "category": "打造最优创新生态", "group": "加强金融支持。", "task": "争取国家创投引导基金更多投资浙江。鼓励开发相关信贷产品支持中小企业发展。", "owner": "省发展改革委", "co": "省财政厅、省创新投资集团", "time": "持续推进", "dimension": "生态"}, {"id": 106, "category": "打造最优创新生态", "group": "加强金融支持。", "task": "深入推进知识产权金融生态、AIC股权投资、科技企业并购贷款等科技金融系列试点，支持人工智能高质量发展。打造“浙科贷2.0”产品体系，鼓励银行机构丰富深化知识产权质押、创新积分贷、人才贷等金融产品，加大对科技型中小企业的融资支持力度。", "owner": "省委金融办、人行浙江省分行", "co": "省市场监管局（省知识产权局）", "time": "2026年12月", "dimension": "生态"}, {"id": 107, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "人工智能产业发展中的潜在风险、安全问题及对策建议研究", "owner": "省发展改革委", "co": "省委国安办、省国家安全厅、省公安厅", "time": "2026年6月", "dimension": "生态"}, {"id": 108, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "强化全链条安全能力建设，防范技术风险，加强前瞻评估监测，探索构建数据产权制度，推动人工智能合规、透明、可信赖。", "owner": "省委网信办", "co": "省市场监管局（省知识产权局）、省数据局", "time": "2026年6月", "dimension": "生态"}, {"id": 109, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "优化大模型备案登记工作，落实《生成式人工智能服务管理暂行办法》相关要求，完善生成式人工智能分类分级管理机制，高效开展安全评估和备案工作，实现大模型“应备尽备”", "owner": "省委网信办", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 110, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "健全技术监测、风险预警、应急管理体系，强化政府引导、行业自律，构建动态治理格局。探索设立虚拟安全测评中心，组织技术力量对大模型进行事前事中事后全过程监管，防范技术滥用风险。", "owner": "省委网信办", "co": "无", "time": "持续推进", "dimension": "生态"}, {"id": 111, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "加强《人工智能生成合成内容标识办法》政策宣贯，督促相关企业落实标识义务。", "owner": "省委网信办", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 112, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "在重点外贸地区开展WIPO马德里体系系列推广活动，迭代升级“浙江知识产权在线”海外服务应用场景，提供马德里申请服务，完成600家以上重点涉外企业的《企业海外知识产权合规管理规范》宣贯。", "owner": "省市场监管局（省知识产权局）", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 113, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "开展大模型知识产权侵权预警，依托“国内专利快速预审+海外专利审查高速路（PPH）”，构筑“专利+商业秘密保护”路径，实施“国内快速预审+海外专利审查高速路（PPH）”工作机制。", "owner": "省市场监管局（省知识产权局）", "co": "无", "time": "2026年12月", "dimension": "生态"}, {"id": 114, "category": "打造最优创新生态", "group": "提升安全能力。", "task": "开展国家级课题《国产AI大模型的知识产权相关风险及保护策略研究》研究工作，发布《AI大模型知识产权保护策略研究报告》。", "owner": "省市场监管局（省知识产权局）", "co": "无", "time": "2026年12月", "dimension": "生态"}];
const DIMS = ["算力", "数据", "模型", "应用", "生态"];

// ── 工具函数 ────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

// ── 动态生成 Matrix HTML ────────────────────────────────
const GOALS_DATA = {"version": "2026-08-20", "overall": {"target_2026": {"value": "8300亿元", "desc": "2026年核心产业营收"}, "target_2030": {"value": "1.2万亿元", "desc": "2030年核心产业营收"}, "vision": "人工智能创新发展高地", "milestones": ["中阿应用合作中心", "10万卡算力中心", "开源社区"]}, "dimensions": {"算力": {"目标体系": "2026年：200 EFlops以上；2030年：算力规模全国前三；云服务规模全国领先", "政策体系": "《浙江省推进算力网建设实施方案》《公共算力池建设工作指引》", "重点任务": "有序推进算力布局；加强电力配套保障；实施人工智能券补助", "重大项目": "算力基础设施；网络基础设施", "应用场景": "芯模协同场景", "责任主体": "省发展改革委；省经信厅等"}, "数据": {"目标体系": "2026年：建成不低于10PB的高质量数据集；2030年：建成不低于20PB的高质量数据集", "政策体系": "《浙江省关于支持先行探索数据要素资源化价值化的若干措施（试行）》", "重点任务": "加强公共数据有序利用；布局高端数据标注平台；支持建设可信数据空间", "重大项目": "高质量数据集；数据基础设施", "应用场景": "数据要素×行业应用；高质量数据集应用", "责任主体": "省数据局；省经信厅等"}, "模型": {"目标体系": "2026年：突破20项以上关键核心技术；培育80个以上高价值垂类模型", "政策体系": "《生成式人工智能服务管理暂行办法》", "重点任务": "加强核心技术攻关；建设行业中试基地", "重大项目": "代理模型攻关；基础模型；领域模型；适配攻关", "应用场景": "行业模型应用；数模共振应用", "责任主体": "省委网信办；省科技厅等"}, "应用": {"目标体系": "2026年：打造300个以上典型应用场景；重点行业应用普及率超过70%", "政策体系": "《支持国家人工智能应用中试基地建设的若干举措》；国家人工智能应用中试基地项目调整管理细则", "重点任务": "打造出海服务平台；培育标杆应用场景；鼓励智能体创新应用；支持具身智能应用；支持智能终端消费", "重大项目": "具身智能和人形机器人；应用攻关；中试基地", "应用场景": "智能体应用场景；智能终端应用场景", "责任主体": "省发展改革委；省经信厅等"}, "生态": {"目标体系": "核心产业规模跃升；形成高能级产业生态", "政策体系": "《促进人工智能高质量发展行动方案（2026版）》《关于支持人工智能创新发展的若干措施》", "重点任务": "培育壮大开源社区；布局产业孵化平台；加大人才引育力度；举办赛事会议活动；提升安全能力", "重大项目": "产业；数字化转型", "应用场景": "魔搭社区；AI＋产业", "责任主体": "省发展改革委；省经信厅、省委组织部、省教育厅、省科技厅等"}}};
const RAIL_DATA = {"version": "2026-08-20", "leftRail": {"label": "工作体系", "items": [{"name": "例会", "desc": ["协调", "机制"], "interactive": false}, {"name": "统计", "desc": ["监测", "机制"], "interactive": false}, {"name": "专题", "desc": ["调研", "机制"], "interactive": true}, {"name": "跟踪", "desc": ["调度", "机制"], "interactive": false}, {"name": "安全", "desc": ["保障", "机制"], "interactive": false}, {"name": "评价", "desc": ["推广", "机制"], "interactive": false}]}, "rightRail": {"label": "评价体系", "items": [{"name": "目标", "desc": ["监测"], "interactive": false}, {"name": "政策", "desc": ["评估"], "interactive": false}, {"name": "任务", "desc": ["调度"], "interactive": false}, {"name": "项目", "desc": ["跟踪"], "interactive": false}, {"name": "综合", "desc": ["评价"], "interactive": false}, {"name": "通报", "desc": ["晾晒"], "interactive": false}]}};
const MECH_DATA = {"version": "2026-08-20", "chain": ["专班研究", "办公室协调", "领导小组审议"], "topics": ["算力专题", "数据专题", "模型专题", "应用专题", "生态专题"], "paradigm": "4353工作范式（分类分层分级）"};

function buildMatrix() {
  const el = document.getElementById("matrix");
  if (!el) return;

  const cols = DIMS.map(d => `<div class="cell head">${d}</div>`).join("");
  const rows = [
    ["目标体系", "目标体系"],
    ["政策体系", "政策体系"],
    ["重点任务", "action"],
    ["重大项目", "重大项目"],
    ["应用场景", "应用场景"],
    ["责任主体", "责任主体"],
  ];

  const rowHTML = rows.map(([label, key]) => {
    const cells = DIMS.map((dim, i) => {
      const val = GOALS_DATA.dimensions[dim] && GOALS_DATA.dimensions[dim][key] || "";
      const cls = key === "action" ? `cell action" data-dimension="${dim}` : "cell";
      // 重点任务特殊处理
      if (key === "action") {
        const tasks = TASKS.filter(t => t.dimension === dim).slice(0, 5);
        const links = tasks.map((t, idx) =>
          `<li><span class="task-no">${idx+1}．</span><span class="task-text">${esc(t.group.replace(/"/g, "").slice(0,12))}</span></li>`
        ).join("");
        return `<div class="${cls}"><ul>${links}</ul></div>`;
      }
      return `<div class="${cls}">${esc(val)}</div>`;
    }).join("");
    return `<div class="cell row">${label}</div>${cells}`;
  }).join("");

  el.innerHTML = `<div class="cell head"></div>${cols}${rowHTML}`;
}

// ── 动态生成 Rail HTML ──────────────────────────────────
function buildRails() {
  const left = document.querySelector(".rail");
  const right = document.querySelectorAll(".rail");
  if (left) {
    const items = RAIL_DATA.leftRail.items.map(item =>
      `<div class="rail-cell${item.interactive ? " interactive" : ""}">${item.name}<br>${item.desc.join("<br>")}</div>`
    ).join("");
    left.innerHTML = `<div class="rail-cell head">${RAIL_DATA.leftRail.label.split("").join("<br>")}</div>${items}`;
  }
  if (right[1]) {
    const items = RAIL_DATA.rightRail.items.map(item =>
      `<div class="rail-cell">${item.name}<br>${item.desc.join("<br>")}</div>`
    ).join("");
    right[1].innerHTML = `<div class="rail-cell head">${RAIL_DATA.rightRail.label.split("").join("<br>")}</div>${items}`;
  }
}

// ── 动态生成 Mechanism HTML ────────────────────────────
function buildMechanism() {
  const el = document.querySelector(".mechanism");
  if (!el) return;
  const chain = MECH_DATA.chain.map((c, i) =>
    i > 0 ? `<div class="mechanism-up">↑</div><div>${esc(c)}</div>` : `<div>${esc(c)}</div>`
  ).join("");
  const topics = MECH_DATA.topics.map(t => `<div>${esc(t)}</div>`).join("");
  el.innerHTML = `
    <div class="mechanism-chain">${chain}</div>
    <div class="mechanism-next" aria-hidden="true">⇨</div>
    <div class="mechanism-topics">${topics}</div>
    <div class="mechanism-level">${esc(MECH_DATA.paradigm)}</div>
  `;
}

// ── 渲染任务抽屉 ────────────────────────────────────────
function renderTasks() {
  const rows = document.getElementById("taskRows");
  if (!rows) return;

  const params = new URLSearchParams(location.search);
  const dim = params.get("dim") || "";
  const owner = params.get("owner") || "";
  const search = params.get("search") || "";

  let list = TASKS.slice();
  if (dim) list = list.filter(t => t.dimension === dim);
  if (owner) list = list.filter(t => t.owner.indexOf(owner) > -1);
  if (search) list = list.filter(t =>
    t.task.indexOf(search) > -1 || t.category.indexOf(search) > -1
  );

  // 按 category → group 分组
  const groups = {};
  list.forEach(t => {
    const k = t.category + "||" + t.group;
    if (!groups[k]) groups[k] = [];
    groups[k].push(t);
  });

  if (Object.keys(groups).length === 0) {
    rows.innerHTML = '<div class="empty">没有符合条件的任务</div>';
    return;
  }

  rows.innerHTML = Object.entries(groups).map(([key, ts]) => {
    const [cat, grp] = key.split("||");
    return `<article class="task-group">
      <div class="group-head"><strong>${esc(cat)}</strong><span>${esc(grp)}</span></div>
      ${ts.map(t => `<div class="task" data-id="${t.id}">
        <div class="task-summary">
          <span class="task-id">#${t.id}</span>
          <span class="task-text">${esc(t.task)}</span>
          <span class="task-dim">[${esc(t.dimension)}]</span>
        </div>
        <div class="task-meta">
          <span>${esc(t.owner)}</span>
          <span>${esc(t.co || "无")}</span>
          <span class="task-time">${esc(t.time)}</span>
        </div>
        <div class="task-progress-wrap" id="progress-${t.id}"></div>
        <button class="add-progress" data-id="${t.id}">+ 填报月度进展</button>
      </div>`).join("")}
    </article>`;
  }).join("");

  list.forEach(t => renderTaskProgress(t.id));
}

function renderTaskProgress(id) {
  const el = document.getElementById("progress-" + id);
  if (!el) return;
  const store = JSON.parse(localStorage.getItem("progressStore") || "{}");
  const records = store[id] || [];
  if (!records.length) return;
  el.innerHTML = '<div class="progress-list">' +
    records.map(p => `<div class="progress-item">
      <span class="p-month">${esc(p.month)}</span>
      <span class="p-status">${esc(p.status)}</span>
      <span class="p-text">${esc(p.progress)}</span>
    </div>`).join("") + '</div>';
}

// ── 抽屉开关 ────────────────────────────────────────────
function openDrawer(dim) {
  const drawer = document.getElementById("taskDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const title = document.getElementById("drawerTitle");
  if (!drawer) return;
  if (title) title.textContent = dim && dim !== "all"
    ? dim + "重点任务清单"
    : "重点任务清单";
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  if (backdrop) backdrop.style.display = "block";
  const params = new URLSearchParams();
  if (dim && dim !== "all") params.set("dim", dim);
  history.replaceState(null, "", "?" + params.toString());
  renderTasks();
}

function closeDrawer() {
  const drawer = document.getElementById("taskDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  if (drawer) { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); }
  if (backdrop) backdrop.style.display = "none";
  history.replaceState(null, "", location.pathname);
}

// ── 初始化抽屉事件 ──────────────────────────────────────
function initDrawer() {
  // 矩阵单元格点击
  document.querySelectorAll("[data-dimension]").forEach(el =>
    el.addEventListener("click", () => openDrawer(el.dataset.dimension))
  );
  // 关闭按钮
  document.getElementById("drawerClose")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);
  // 筛选
  ["#groupFilter","#ownerFilter","#timeFilter"].forEach(s =>
    document.querySelector(s)?.addEventListener("change", renderTasks)
  );
  document.getElementById("taskSearch")?.addEventListener("input", renderTasks);
  populateFilters();
}

function populateFilters() {
  const dims = DIMS;
  const owners = [...new Set(TASKS.map(t => t.owner))].sort();
  const gf = document.getElementById("groupFilter");
  const of = document.getElementById("ownerFilter");
  dims.forEach(d => {
    const o = document.createElement("option");
    o.value = d; o.textContent = d;
    gf?.appendChild(o);
  });
  owners.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o; opt.textContent = o;
    of?.appendChild(opt);
  });
  const p = new URLSearchParams(location.search);
  if (p.get("dim") && gf) gf.value = p.get("dim");
}

// ── 月度进展填报 ───────────────────────────────────────
let activeTask = null;

function initProgress() {
  document.addEventListener("click", e => {
    const add = e.target.closest(".add-progress");
    if (add) {
      e.stopPropagation();
      activeTask = add.dataset.id;
      document.getElementById("progressModal")?.classList.add("open");
    }
  });
  document.getElementById("modalCancel")?.addEventListener("click", () =>
    document.getElementById("progressModal")?.classList.remove("open")
  );
  document.getElementById("progressForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const store = JSON.parse(localStorage.getItem("progressStore") || "{}");
    const item = {
      month: document.getElementById("month")?.value,
      status: document.getElementById("status")?.value,
      progress: document.getElementById("progress")?.value,
      result: document.getElementById("result")?.value,
      problem: document.getElementById("problem")?.value,
      coordination: document.getElementById("coordination")?.value,
      next: document.getElementById("next")?.value,
    };
    (store[activeTask] || (store[activeTask] = [])).unshift(item);
    localStorage.setItem("progressStore", JSON.stringify(store));
    e.target.reset();
    document.getElementById("progressModal")?.classList.remove("open");
    renderTasks();
    const toast = document.getElementById("toast");
    if (toast) { toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1800); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.getElementById("progressModal")?.classList.remove("open");
      closeDrawer();
    }
  });
}

// ── 资讯滚动 ───────────────────────────────────────────
const NEWS_DATA = [
  "浙江省算力券申领通道开放，首批额度 2 亿元",
  "之江实验室发布「之江璇玑」多模态大模型 v2.0",
  "杭州获批国家人工智能创新高地先行区",
  "《浙江省人工智能高质量发展行动方案（2026版）》正式印发",
];

function initTicker() {
  const track = document.getElementById("tickerTrack");
  const dateEl = document.getElementById("tickerDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("zh-CN",
      {year:"numeric",month:"2-digit",day:"2-digit"}
    );
  }
  if (track) {
    track.innerHTML = NEWS_DATA
      .map(n => '<span class="ticker-item">' + esc(n) + '</span>')
      .join('<span class="ticker-sep">｜</span>');
  }
}

// ── 总体初始化 ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildMatrix();   // 动态生成矩阵内容
  buildRails();    // 动态生成侧栏
  buildMechanism(); // 动态生成机制专题
  initDrawer();
  initProgress();
  initTicker();
  if (location.search) renderTasks();
});
