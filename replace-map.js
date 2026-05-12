const fs = require('fs');
let f = fs.readFileSync('D:\\GrowthDashboard\\src\\pages\\DashboardBlogPage.tsx', 'utf8');

const startMark = '{/* CENTER: Dual Map - Learning + IP Probe */}';
const endMarkBefore = '<div className="hfish-info-item" style={{ \'--info-color\': \'var(--accent-purple)\' }}>';

const startIdx = f.indexOf(startMark);
const endIdx = f.indexOf(endMarkBefore);

if (startIdx === -1 || endIdx === -1) {
  console.log('NOT FOUND: start=' + startIdx + ' end=' + endIdx);
  process.exit(1);
}

console.log('Found: start=' + startIdx + ' end=' + endIdx + ' length=' + (endIdx - startIdx));

// Keep everything before and after, replace the middle
const before = f.substring(0, startIdx);
const after = f.substring(endIdx);

const newMap = `          {/* CENTER: Dual Map - Learning + IP Probe */}
          <Panel title="态势感知总览" style={{ minHeight: '520px' }}>
            <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: '10px' }}>

              {/* 上：学习态势图 - 精细中国地图 */}
              <div style={{ position: 'relative', height: '260px', background: 'linear-gradient(135deg, rgba(8,15,8,0.95) 0%, rgba(5,12,5,0.98) 100%)', borderRadius: '4px', overflow: 'hidden' }}>
                <svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <pattern id="chinaGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(57,255,20,0.04)" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="chinaGridLarge" width="60" height="60" patternUnits="userSpaceOnUse">
                      <rect width="60" height="60" fill="none" stroke="rgba(57,255,20,0.07)" strokeWidth="0.8" />
                    </pattern>
                    <filter id="chinaGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="chinaStrongGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <radialGradient id="pulseGreen"><stop offset="0%" stopColor="#39ff14" stopOpacity="0.7"/><stop offset="100%" stopColor="#39ff14" stopOpacity="0"/></radialGradient>
                    <radialGradient id="pulseYellow"><stop offset="0%" stopColor="#ffbd2e" stopOpacity="0.6"/><stop offset="100%" stopColor="#ffbd2e" stopOpacity="0"/></radialGradient>
                    <radialGradient id="pulseCyan"><stop offset="0%" stopColor="#00ffc8" stopOpacity="0.55"/><stop offset="100%" stopColor="#00ffc8" stopOpacity="0"/></radialGradient>
                    <linearGradient id="chinaBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#39ff14" stopOpacity="0.5"/>
                      <stop offset="50%" stopColor="#00ffc8" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#39ff14" stopOpacity="0.5"/>
                    </linearGradient>
                    <clipPath id="chinaClip">
                      <path d="M185,48 C195,44 210,42 225,43 L245,46 C260,45 275,47 290,50 L310,54 C325,56 340,58 355,62 L370,68 C382,74 392,82 400,92 L406,105 C412,118 416,132 418,148 L419,165 C418,180 415,195 410,208 L402,222 C394,234 384,244 372,252 L358,260 C344,266 328,270 312,272 L296,273 C280,273 264,271 250,268 L236,264 C222,259 210,252 200,244 L188,234 C178,224 170,212 164,198 L160,182 C156,166 155,150 156,134 L158,118 C162,102 168,88 177,75 L181,61 Z"/>
                    </clipPath>
                  </defs>

                  {/* 背景网格 */}
                  <rect x="0" y="0" width="600" height="320" fill="url(#chinaGrid)" />
                  <rect x="0" y="0" width="600" height="320" fill="url(#chinaGridLarge)" />

                  {/* 中国轮廓 */}
                  <g clipPath="url(#chinaClip)">
                    <path d="M185,48 C195,44 210,42 225,43 L245,46 C260,45 275,47 290,50 L310,54 C325,56 340,58 355,62 L370,68 C382,74 392,82 400,92 L406,105 C412,118 416,132 418,148 L419,165 C418,180 415,195 410,208 L402,222 C394,234 384,244 372,252 L358,260 C344,266 328,270 312,272 L296,273 C280,273 264,271 250,268 L236,264 C222,259 210,252 200,244 L188,234 C178,224 170,212 164,198 L160,182 C156,166 155,150 156,134 L158,118 C162,102 168,88 177,75 L181,61 Z"
                      fill="rgba(20,60,20,0.25)" stroke="url(#chinaBorderGrad)" strokeWidth="1.5" />

                    {/* 内部省份分界线 */}
                    <path d="M220,70 L260,85 L280,80" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M260,85 L275,110 L300,105" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M230,130 L270,140 L290,135" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M190,160 L240,175 L260,170" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M280,150 L330,165 L350,160" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M310,180 L340,210 L360,205" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M250,200 L290,225 L310,220" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />
                    <path d="M200,190 L235,215 L255,210" stroke="rgba(57,255,20,0.08)" strokeWidth="0.6" fill="none" />

                    {/* 省份填充色块 */}
                    <path d="M340,58 L380,65 L395,82 L385,100 L365,95 L345,90 L330,78 Z" fill="rgba(57,255,20,0.04)" opacity="0.6" />
                    <path d="M280,68 L330,72 L345,90 L335,115 L305,120 L275,108 L270,85 Z" fill="rgba(0,255,200,0.03)" opacity="0.6" />
                    <path d="M185,48 L240,52 L260,68 L250,95 L220,100 L195,85 L180,65 Z" fill="rgba(255,189,46,0.03)" opacity="0.6" />
                    <path d="M355,115 L390,125 L398,150 L385,175 L355,170 L340,145 Z" fill="rgba(57,255,20,0.04)" opacity="0.6" />
                    <path d="M290,175 L340,180 L360,210 L340,245 L300,255 L270,240 L265,210 Z" fill="rgba(0,255,200,0.03)" opacity="0.6" />
                    <path d="M195,175 L250,180 L270,210 L255,245 L220,250 L195,230 L185,200 Z" fill="rgba(255,189,46,0.03)" opacity="0.6" />
                  </g>

                  {/* 外边框发光 */}
                  <path d="M185,48 C195,44 210,42 225,43 L245,46 C260,45 275,47 290,50 L310,54 C325,56 340,58 355,62 L370,68 C382,74 392,82 400,92 L406,105 C412,118 416,132 418,148 L419,165 C418,180 415,195 410,208 L402,222 C394,234 384,244 372,252 L358,260 C344,266 328,270 312,272 L296,273 C280,273 264,271 250,268 L236,264 C222,259 210,252 200,244 L188,234 C178,224 170,212 164,198 L160,182 C156,166 155,150 156,134 L158,118 C162,102 168,88 177,75 L181,61 Z"
                    fill="none" stroke="#39ff14" strokeWidth="1" opacity="0.3" filter="url(#chinaGlow)" />

                  {/* 连接线动画 */}
                  <line x1="308" y1="105" x2="378" y2="148" stroke="rgba(57,255,20,0.25)" strokeWidth="1.2" strokeDasharray="5,5">
                    <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
                  </line>
                  <line x1="378" y1="148" x2="390" y2="138" stroke="rgba(0,255,200,0.2)" strokeWidth="1" strokeDasharray="4,4">
                    <animate attributeName="stroke-dashoffset" values="0;-16" dur="2.5s" repeatCount="indefinite" />
                  </line>
                  <line x1="308" y1="105" x2="256" y2="172" stroke="rgba(255,189,46,0.2)" strokeWidth="1" strokeDasharray="4,4">
                    <animate attributeName="stroke-dashoffset" values="0;-16" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="378" y1="148" x2="338" y2="218" stroke="rgba(0,255,200,0.15)" strokeWidth="0.8" strokeDasharray="3,4">
                    <animate attributeName="stroke-dashoffset" values="0;-14" dur="3.5s" repeatCount="indefinite" />
                  </line>

                  {/* 北京 - 学习区 */}
                  <circle cx="308" cy="105" r="14" fill="url(#pulseGreen)">
                    <animate attributeName="r" values="9;18;9" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="308" cy="105" r="5" fill="#39ff14" filter="url(#chinaStrongGlow)" />
                  <text x="308" y="88" fill="#39ff14" fontSize="11" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">学习区</text>
                  <text x="308" y="124" fill="rgba(57,255,20,0.6)" fontSize="9" textAnchor="middle" fontFamily="'Courier New',monospace">核心节点</text>

                  {/* 上海 - 创作区 */}
                  <circle cx="378" cy="148" r="12" fill="url(#pulseYellow)">
                    <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0.18;0.55" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="378" cy="148" r="4.5" fill="#ffbd2e" filter="url(#chinaStrongGlow)" />
                  <text x="378" y="133" fill="#ffbd2e" fontSize="11" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">创作区</text>

                  {/* 深圳/广东 - 分享 */}
                  <circle cx="338" cy="218" r="10" fill="url(#pulseCyan)">
                    <animate attributeName="r" values="6;14;6" dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="338" cy="218" r="3.8" fill="#00ffc8" filter="url(#chinaGlow)" />
                  <text x="338" y="236" fill="#00ffc8" fontSize="10" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">分享</text>

                  {/* 成都、西安 */}
                  <circle cx="256" cy="172" r="9" fill="url(#pulseGreen)"><animate attributeName="r" values="6;13;6" dur="2.2s" repeatCount="indefinite" /></circle>
                  <circle cx="256" cy="172" r="3.5" fill="#39ff14" filter="url(#chinaGlow)" />
                  <circle cx="272" cy="128" r="7" fill="url(#pulseYellow)"><animate attributeName="r" values="4;11;4" dur="3.2s" repeatCount="indefinite" /></circle>
                  <circle cx="272" cy="128" r="2.8" fill="#ffbd2e" filter="url(#chinaGlow)" />

                  {/* 信息面板 */}
                  <g transform="translate(470, 20)">
                    <rect x="0" y="0" width="115" height="58" rx="4" fill="rgba(5,8,5,0.8)" stroke="rgba(57,255,20,0.2)" strokeWidth="0.8" />
                    <text x="10" y="18" fill="#39ff14" fontSize="10" fontFamily="'Courier New',monospace" fontWeight="bold">◆ 学习态势</text>
                    <line x1="10" y1="26" x2="105" y2="26" stroke="rgba(57,255,20,0.15)" strokeWidth="0.5" />
                    <circle cx="14" cy="38" r="3" fill="#39ff14" /><text x="22" y="41" fill="rgba(176,176,176,0.7)" fontSize="9" fontFamily="'Courier New',monospace">活跃节点</text>
                    <text x="85" y="41" fill="#39ff14" fontSize="10" fontFamily="'Courier New',monospace" fontWeight="bold">4</text>
                    <circle cx="14" cy="51" r="3" fill="#ffbd2e" /><text x="22" y="54" fill="rgba(176,176,176,0.7)" fontSize="9" fontFamily="'Courier New',monospace">连接线路</text>
                    <text x="85" y="54" fill="#ffbd2e" fontSize="10" fontFamily="'Courier New',monospace" fontWeight="bold">5</text>
                  </g>

                  {/* 角落装饰 */}
                  <path d="M10,10 L30,10 M10,10 L10,30" stroke="rgba(57,255,20,0.3)" strokeWidth="1.5" fill="none" />
                  <path d="M590,10 L570,10 M590,10 L590,30" stroke="rgba(57,255,20,0.3)" strokeWidth="1.5" fill="none" />
                  <path d="M10,310 L30,310 M10,310 L10,290" stroke="rgba(57,255,20,0.3)" strokeWidth="1.5" fill="none" />
                </svg>
              </div>

              {/* 分隔线 */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.25) 30%, rgba(57,255,20,0.25) 70%, transparent 100%)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '-4px',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '8px',
                  background: '#39ff14',
                  borderRadius: '50%',
                  opacity: 0.4,
                  boxShadow: '0 0 8px rgba(57,255,20,0.5)',
                }} />
              </div>

              {/* 下：IP探针地图 */}
              <div className="hfish-ip-probe-map" style={{ height: '220px' }}>
                <svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <pattern id="ipProbeGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                      <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(57,255,20,0.035)" strokeWidth="0.4" />
                    </pattern>
                    <filter id="ipProbeGlow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <radialGradient id="ipPulseG"><stop offset="0%" stopColor="#39ff14" stopOpacity="0.6"/><stop offset="100%" stopColor="#39ff14" stopOpacity="0"/></radialGradient>
                    <radialGradient id="ipPulseY"><stop offset="0%" stopColor="#ffbd2e" stopOpacity="0.55"/><stop offset="100%" stopColor="#ffbd2e" stopOpacity="0"/></radialGradient>
                    <radialGradient id="ipPulseC"><stop offset="0%" stopColor="#00ffc8" stopOpacity="0.5"/><stop offset="100%" stopColor="#00ffc8" stopOpacity="0"/></radialGradient>
                  </defs>

                  <rect x="0" y="0" width="600" height="260" fill="url(#ipProbeGrid)" />

                  {/* IP探针中国轮廓 */}
                  <g>
                    <path d="M175,42 C187,38 204,36 221,37 L243,40 C260,39 277,41 294,45 L316,49 C333,52 350,55 367,59 L384,66 C398,73 409,83 418,94 L425,109 C432,124 437,140 439,158 L440,177 C439,194 435,211 429,226 L420,242 C410,256 398,267 384,276 L368,285 C352,292 334,297 316,299 L298,300 C280,300 262,298 246,294 L230,289 C214,283 201,275 190,266 L176,254 C164,242 155,228 148,212 L144,194 C139,176 138,158 139,140 L141,122 C146,104 153,88 163,73 L167,56 Z"
                      fill="rgba(15,40,15,0.2)" stroke="rgba(57,255,20,0.18)" strokeWidth="1.2" transform="scale(0.95) translate(15,5)" />
                  </g>

                  {/* 北京 */}
                  <circle cx="315" cy="82" r="9" fill="url(#ipPulseG)"><animate attributeName="r" values="5;13;5" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" /></circle>
                  <circle cx="315" cy="82" r="3.5" fill="#39ff14" filter="url(#ipProbeGlow)" />
                  <text x="315" y="69" fill="#39ff14" fontSize="9" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">北京</text>
                  <text x="315" y="96" fill="rgba(57,255,20,0.55)" fontSize="8" textAnchor="middle" fontFamily="'Courier New',monospace">\${visitorStats.todayCount}</text>

                  {/* 上海 */}
                  <circle cx="390" cy="142" r="7.5" fill="url(#ipPulseY)"><animate attributeName="r" values="4.5;11;4.5" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0.17;0.5" dur="2.5s" repeatCount="indefinite" /></circle>
                  <circle cx="390" cy="142" r="3" fill="#ffbd2e" filter="url(#ipProbeGlow)" />
                  <text x="390" y="131" fill="#ffbd2e" fontSize="9" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">上海</text>

                  {/* 广东 */}
                  <circle cx="352" cy="210" r="7" fill="url(#ipPulseG)"><animate attributeName="r" values="4;10;4" dur="2.2s" repeatCount="indefinite" /></circle>
                  <circle cx="352" cy="210" r="2.8" fill="#00ffc8" filter="url(#ipProbeGlow)" />
                  <text x="352" y="226" fill="#00ffc8" fontSize="9" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">广东</text>

                  {/* 成都 */}
                  <circle cx="232" cy="170" r="6" fill="url(#ipPulseY)"><animate attributeName="r" values="3.5;9;3.5" dur="2.8s" repeatCount="indefinite" /></circle>
                  <circle cx="232" cy="170" r="2.3" fill="#ffbd2e" filter="url(#ipProbeGlow)" />
                  <text x="232" y="186" fill="#ffbd2e" fontSize="8" textAnchor="middle" fontFamily="'Courier New',monospace" fontWeight="bold">成都</text>

                  {/* 杭州 武汉 西安 南京 重庆 */}
                  <circle cx="375" cy="123" r="5" fill="url(#ipPulseG)"><animate attributeName="r" values="3;8;3" dur="3s" repeatCount="indefinite" /></circle>
                  <circle cx="375" cy="123" r="2" fill="#39ff14" filter="url(#ipProbeGlow)" />
                  <text x="388" y="121" fill="#39ff14" fontSize="8" textAnchor="middle" fontFamily="'Courier New',monospace">杭州</text>

                  <circle cx="304" cy="138" r="5" fill="url(#ipPulseG)"><animate attributeName="r" values="3;8;3" dur="2.6s" repeatCount="indefinite" /></circle>
                  <circle cx="304" cy="138" r="2" fill="#39ff14" filter="url(#ipProbeGlow)" />
                  <text x="304" y="152" fill="#39ff14" fontSize="8" textAnchor="middle" fontFamily="'Courier New',monospace">武汉</text>

                  <circle cx="268" cy="116" r="4.5" fill="url(#ipPulseY)"><animate attributeName="r" values="3;7;3" dur="3.2s" repeatCount="indefinite" /></circle>
                  <circle cx="268" cy="116" r="1.8" fill="#ffbd2e" filter="url(#ipProbeGlow)" />
                  <text x="268" y="106" fill="#ffbd2e" fontSize="8" textAnchor="middle" fontFamily="'Courier New',monospace">西安</text>

                  <circle cx="362" cy="128" r="4.5" fill="url(#ipPulseG)"><animate attributeName="r" values="3;7;3" dur="2.7s" repeatCount="indefinite" /></circle>
                  <circle cx="362" cy="128" r="1.8" fill="#39ff14" filter="url(#ipProbeGlow)" />
                  <text x="350" y="126" fill="#39ff14" fontSize="7" textAnchor="middle" fontFamily="'Courier New',monospace">南京</text>

                  <circle cx="265" cy="152" r="4.5" fill="url(#ipPulseY)"><animate attributeName="r" values="3;7;3" dur="2.9s" repeatCount="indefinite" /></circle>
                  <circle cx="265" cy="152" r="1.8" fill="#ffbd2e" filter="url(#ipProbeGlow)" />
                  <text x="248" y="154" fill="#ffbd2e" fontSize="7" textAnchor="middle" fontFamily="'Courier New',monospace">重庆</text>

                  {/* 连接线 */}
                  <line x1="315" y1="82" x2="390" y2="142" stroke="rgba(57,255,20,0.18)" strokeWidth="0.8" strokeDasharray="3,3">
                    <animate attributeName="stroke-dashoffset" values="0;-12" dur="2s" repeatCount="indefinite" />
                  </line>
                  <line x1="390" y1="142" x2="352" y2="210" stroke="rgba(0,255,200,0.13)" strokeWidth="0.8" strokeDasharray="3,3">
                    <animate attributeName="stroke-dashoffset" values="0;-12" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="315" y1="82" x2="268" y2="116" stroke="rgba(255,189,46,0.13)" strokeWidth="0.8" strokeDasharray="3,3">
                    <animate attributeName="stroke-dashoffset" values="0;-12" dur="2.5s" repeatCount="indefinite" />
                  </line>

                  {/* 图例 */}
                  <g transform="translate(12, 210)">
                    <rect x="0" y="0" width="118" height="40" rx="3" fill="rgba(5,5,5,0.7)" stroke="rgba(57,255,20,0.12)" strokeWidth="0.6" />
                    <circle cx="12" cy="11" r="2.5" fill="#39ff14" /><text x="19" y="14" fill="rgba(176,176,176,0.6)" fontSize="7" fontFamile="'Courier New',monospace">热点</text>
                    <circle cx="58" cy="11" r="2.5" fill="#ffbd2e" /><text x="65" y="14" fill="rgba(176,176,176,0.6)" fontSize="7" fontFamile="'Courier New',monospace">活跃</text>
                    <text x="12" y="30" fill="rgba(57,255,20,0.4)" fontSize="7" fontFamile="'Courier New',monospace">IP NODES: \${visitorStats.totalCount || visitorStats.weekCount}</text>
                  </g>

                  <path d="M8,8 L22,8 M8,8 L8,22" stroke="rgba(57,255,20,0.25)" strokeWidth="1" fill="none" />
                  <path d="M592,8 L578,8 M592,8 L592,22" stroke="rgba(57,255,20,0.25)" strokeWidth="1" fill="none" />
                </svg>
              </div>
            </div>`;

fs.writeFileSync('D:\\GrowthDashboard\\src\\pages\\DashboardBlogPage.tsx', before + newMap + after, 'utf8');
console.log('DONE! File written successfully.');
"