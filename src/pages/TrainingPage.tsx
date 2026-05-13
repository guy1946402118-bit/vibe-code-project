﻿﻿﻿﻿﻿import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { usePomodoroStore } from '../stores/pomodoroStore';
import * as db from '../lib/db';

const GAMES = [
  { id: 'schulte', name: '舒尔特表格', icon: '🎯', description: '提升注意力与视觉搜索速度', color: '#00f0ff', points: 50 },
  { id: 'nbak', name: 'N-Back脑训练', icon: '🧠', description: '工作记忆与认知控制训练', color: '#ff00aa', points: 80 },
  { id: 'memory', name: '记忆卡片', icon: '🃏', description: '短期记忆与模式识别', color: '#ffaa00', points: 40 },
  { id: 'stroop', name: '斯特鲁普效应', icon: '🎨', description: '抑制控制与注意力训练', color: '#00ff88', points: 60 },
  { id: 'chess', name: '象棋残局', icon: '♟️', description: '策略思维与推演能力', color: '#aa00ff', points: 100 },
];

const MEDITATION_TYPES = [
  { id: 'breathing', name: '呼吸冥想', duration: '5-30分钟', icon: '🌬️', points: 20 },
  { id: 'body-scan', name: '身体扫描', duration: '10-20分钟', icon: '🧘', points: 30 },
  { id: 'focus', name: '专注冥想', duration: '5-15分钟', icon: '🎯', points: 15 },
  { id: 'sleep', name: '睡眠冥想', duration: '20-40分钟', icon: '😴', points: 40 },
];

type ActiveTab = 'meditation' | 'games' | 'pomodoro';
type ActiveGame = 'schulte' | 'nbak' | 'memory' | 'stroop' | 'chess' | null;

const STROOP_WORDS = ['红', '蓝', '绿', '黄'];
const STROOP_COLORS = ['#ff4444', '#4444ff', '#44ff44', '#ffff44'];

const CHESS_PIECES: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const CHESS_PUZZLES = [
  {
    id: 1,
    name: '单车杀王',
    board: [
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', 'K', '.', 'R', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', 'k', '.', '.', '.'],
    ],
    hint: '把王走到角落，然后用将军将死',
    solution: '用白车控制线路',
  },
  {
    id: 2,
    name: '马杀王',
    board: [
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', 'N', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', 'k', '.', '.', '.'],
    ],
    hint: '马走日字，控制国王移动',
    solution: '用马限制黑王活动范围',
  },
];

export function TrainingPage() {
  const { currentUser, updateUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('meditation');
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  
  const [schulteGrid, setSchulteGrid] = useState<number[]>([]);
  const [schulteStartTime, setSchulteStartTime] = useState(0);
  const [schulteClicked, setSchulteClicked] = useState<number[]>([]);
  const [schulteComplete, setSchulteComplete] = useState(false);
  
  const [nbakLevel, setNbakLevel] = useState(2);
  const [nbakSequence, setNbakSequence] = useState<string[]>([]);
  const [nbakCurrent, setNbakCurrent] = useState<string>('');
  const [nbakInput, setNbakInput] = useState<string[]>([]);
  const [nbakPhase, setNbakPhase] = useState<'watch' | 'input' | 'result'>('watch');
  const [nbakScore, setNbakScore] = useState(0);
  const [nbakRound, setNbakRound] = useState(0);
  const [nbakInterval, setNbakInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  const [memoryCards, setMemoryCards] = useState<string[]>([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryScore, setMemoryScore] = useState(0);
  
  const [stroopWord, setStroopWord] = useState('');
  const [stroopColor, setStroopColor] = useState('');
  const [stroopScore, setStroopScore] = useState(0);
  const [stroopCount, setStroopCount] = useState(0);
  const [stroopPhase, setStroopPhase] = useState<'playing' | 'result'>('playing');

  const [chessPuzzle, setChessPuzzle] = useState(CHESS_PUZZLES[0]);
  const [chessSelected, setChessSelected] = useState<{row: number; col: number} | null>(null);
  const [chessStep, setChessStep] = useState(0);

  const nbakScoreRef = useRef(0);
  const stroopScoreRef = useRef(0);
  const meditationDoneToday = useRef<Set<string>>(new Set());

  const addPoints = useCallback(async (points: number, type: db.TrainingLog['type'], detail?: string) => {
    if (currentUser) {
      await updateUser(currentUser.id, { points: (currentUser.points || 0) + points });
      await db.addTrainingLog(currentUser.id, type, points, detail);
    }
  }, [currentUser, updateUser]);

  const initSchulte = useCallback(() => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setSchulteGrid(nums);
    setSchulteStartTime(Date.now());
    setSchulteClicked([]);
    setSchulteComplete(false);
  }, []);

  const handleSchulteClick = (num: number) => {
    if (schulteComplete) return;
    const next = schulteClicked.length + 1;
    if (num === next) {
      const newClicked = [...schulteClicked, num];
      setSchulteClicked(newClicked);
      if (num === 25) {
        setSchulteComplete(true);
        const time = (Date.now() - schulteStartTime) / 1000;
        const points = time < 30 ? 50 : time < 60 ? 30 : 10;
        addPoints(points, 'schulte', `用时${time.toFixed(1)}秒`);
      }
    }
  };

  const startNback = useCallback((level: number) => {
    if (nbakInterval) clearInterval(nbakInterval);
    setNbakLevel(level);
    setNbakRound(1);
    setNbakScore(0);
    playNbackRound(level, 1);
  }, [nbakInterval]);

  const playNbackRound = (level: number, round: number) => {
    const seq = Array.from({ length: round + level }, () => Math.random() > 0.5 ? '●' : '○');
    setNbakSequence(seq);
    setNbakInput([]);
    setNbakPhase('watch');
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setNbakCurrent(seq[i]);
        i++;
      } else {
        clearInterval(interval);
        setNbakCurrent('');
        setTimeout(() => setNbakPhase('input'), 500);
      }
    }, 800);
    setNbakInterval(interval);
  };

  const handleNbackAnswer = (isMatch: boolean) => {
    const targetIdx = nbakSequence.length - nbakLevel;
    const currentIdx = nbakSequence.length - 1;
    const actualMatch = targetIdx >= 0 && nbakSequence[targetIdx] === nbakSequence[currentIdx];
    
    const isCorrect = isMatch === actualMatch;
    
    const newInput = [...nbakInput, isMatch ? 'yes' : 'no'];
    setNbakInput(newInput);
    
    if (isCorrect) {
      setNbakScore(s => s + 10);
      nbakScoreRef.current += 10;
    } else {
      setNbakScore(s => s - 5);
      nbakScoreRef.current -= 5;
    }
    
    setNbakPhase('result');
    setTimeout(() => {
      if (nbakRound < 5) {
        setNbakRound(r => r + 1);
        playNbackRound(nbakLevel, nbakRound + 1);
      } else {
        setNbakPhase('result');
        const finalPoints = Math.max(0, Math.floor(nbakScoreRef.current / 10));
        addPoints(finalPoints, 'nbak', `5轮得分${nbakScoreRef.current}`);
      }
    }, 1000);
  };

  const initMemory = useCallback(() => {
    const emojis = ['🍎', '🍌', '🍇', '🍊', '🥝', '🍓', '🥭', '🍑'];
    const pairs = [...emojis, ...emojis];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setMemoryCards(pairs);
    setMemoryFlipped([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryScore(0);
  }, []);

  const handleMemoryClick = (idx: number) => {
    if (memoryFlipped.length === 2 || memoryMatched.includes(idx) || memoryFlipped.includes(idx)) return;
    
    const newFlipped = [...memoryFlipped, idx];
    setMemoryFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMemoryMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (memoryCards[first] === memoryCards[second]) {
        setMemoryMatched(prev => [...prev, first, second]);
        setMemoryFlipped([]);
        const newScore = memoryScore + 10;
        setMemoryScore(newScore);
        if (memoryMatched.length + 2 === memoryCards.length) {
          addPoints(Math.max(0, 50 - memoryMoves * 2), 'memory', `${memoryMoves}步`);
        }
      } else {
        setTimeout(() => setMemoryFlipped([]), 800);
      }
    }
  };

  const startStroop = useCallback(() => {
    setStroopScore(0);
    setStroopCount(0);
    setStroopPhase('playing');
    nextStroop();
  }, []);

  const nextStroop = useCallback(() => {
    const word = STROOP_WORDS[Math.floor(Math.random() * STROOP_WORDS.length)];
    const color = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    setStroopWord(word);
    setStroopColor(color);
  }, []);

  const handleStroopAnswer = (isMatch: boolean) => {
    const colorName = STROOP_COLORS.indexOf(stroopColor);
    const wordIndex = STROOP_WORDS.indexOf(stroopWord);
    const actualMatch = colorName === wordIndex;
    
    if (isMatch === actualMatch) {
      setStroopScore(s => s + 1);
      stroopScoreRef.current += 1;
    } else {
      setStroopScore(s => Math.max(0, s - 1));
      stroopScoreRef.current = Math.max(0, stroopScoreRef.current - 1);
    }
    
    const newCount = stroopCount + 1;
    setStroopCount(newCount);
    
    if (newCount >= 20) {
      setStroopPhase('result');
      const points = Math.floor(stroopScoreRef.current * 3);
      addPoints(points, 'stroop', `${stroopScoreRef.current}/20正确`);
    } else {
      nextStroop();
    }
  };

  const handleChessClick = (row: number, col: number) => {
    if (!chessSelected) {
      const piece = chessPuzzle.board[row][col];
      if (piece !== '.') {
        setChessSelected({ row, col });
      }
    } else {
      setChessSelected(null);
      const newStep = chessStep + 1;
      setChessStep(newStep);
      if (newStep >= 3) {
        addPoints(20, 'chess', chessPuzzle.name);
        alert('🎉 恭喜完成残局练习！获得20积分！');
      }
    }
  };

  useEffect(() => {
    if (activeGame === 'schulte') initSchulte();
    if (activeGame === 'memory') initMemory();
    if (activeGame === 'nbak') startNback(2);
    if (activeGame === 'stroop') startStroop();
    return () => {
      if (nbakInterval) clearInterval(nbakInterval);
    };
  }, [activeGame, initSchulte, initMemory, startNback, startStroop, nbakInterval]);

  const renderGame = () => {
    if (activeGame === 'schulte') {
      return (
        <div className="game-container">
          <div className="game-header">
            <h3>🎯 舒尔特表格</h3>
            <p>按顺序点击1-25</p>
            <div className="game-stats">已点击: {schulteClicked.length}/25</div>
          </div>
          <div className="schulte-grid">
            {schulteGrid.map((num, idx) => (
              <button
                key={idx}
                onClick={() => handleSchulteClick(num)}
                className={`schulte-cell ${schulteClicked.includes(num) ? 'clicked' : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
          {schulteComplete && (
            <div className="game-result">
              <h4>🎉 完成！</h4>
              <p>用时: {((Date.now() - schulteStartTime) / 1000).toFixed(2)}秒</p>
              <p>奖励: {((Date.now() - schulteStartTime) / 1000) < 30 ? 50 : ((Date.now() - schulteStartTime) / 1000) < 60 ? 30 : 10} 积分</p>
              <button onClick={initSchulte}>再来一次</button>
            </div>
          )}
          <button className="close-btn" onClick={() => setActiveGame(null)}>关闭</button>
        </div>
      );
    }

    if (activeGame === 'nbak') {
      return (
        <div className="game-container">
          <div className="game-header">
            <h3>🧠 N-Back脑训练</h3>
            <div className="game-stats">
              <span>关卡: {nbakLevel}-Back</span>
              <span>得分: {nbakScore}</span>
              <span>轮次: {nbakRound}/5</span>
            </div>
          </div>
          <div className="nbak-display">
            {nbakPhase === 'watch' ? (
              <div className="nbak-show">{nbakCurrent || '⏳'}</div>
            ) : (
              <div className="nbak-question">与{nbakLevel}个前的一样吗？</div>
            )}
          </div>
          {nbakPhase === 'input' && (
            <div className="nbak-buttons">
              <button onClick={() => handleNbackAnswer(true)}>是</button>
              <button onClick={() => handleNbackAnswer(false)}>否</button>
            </div>
          )}
          {nbakPhase === 'result' && nbakRound >= 5 && (
            <div className="game-result">
              <h4>🏁 本轮结束</h4>
              <p>最终得分: {nbakScore}</p>
              <p>奖励: {Math.max(0, Math.floor(nbakScore / 10))} 积分</p>
              <button onClick={() => startNback(nbakLevel)}>再来一轮</button>
            </div>
          )}
          <button className="close-btn" onClick={() => setActiveGame(null)}>关闭</button>
        </div>
      );
    }

    if (activeGame === 'memory') {
      const isWin = memoryMatched.length === memoryCards.length;
      return (
        <div className="game-container">
          <div className="game-header">
            <h3>🃏 记忆卡片</h3>
            <div className="game-stats">
              <span>步数: {memoryMoves}</span>
              <span>得分: {memoryScore}</span>
            </div>
          </div>
          <div className="memory-grid">
            {memoryCards.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleMemoryClick(idx)}
                className={`memory-card ${memoryFlipped.includes(idx) || memoryMatched.includes(idx) ? 'flipped' : ''} ${memoryMatched.includes(idx) ? 'matched' : ''}`}
              >
                {memoryFlipped.includes(idx) || memoryMatched.includes(idx) ? emoji : '?'}
              </button>
            ))}
          </div>
          {isWin && (
            <div className="game-result">
              <h4>🎉 全部配对成功！</h4>
              <p>共用 {memoryMoves} 步</p>
              <p>奖励: {Math.max(0, 50 - memoryMoves * 2)} 积分</p>
              <button onClick={initMemory}>再来一局</button>
            </div>
          )}
          <button className="close-btn" onClick={() => setActiveGame(null)}>关闭</button>
        </div>
      );
    }

    if (activeGame === 'stroop') {
      return (
        <div className="game-container">
          <div className="game-header">
            <h3>🎨 斯特鲁普效应</h3>
            <div className="game-stats">
              <span>进度: {stroopCount}/20</span>
              <span>得分: {stroopScore}</span>
            </div>
          </div>
          {stroopPhase === 'playing' ? (
            <>
              <div className="stroop-word" style={{ color: stroopColor }}>{stroopWord}</div>
              <div className="stroop-buttons">
                <button onClick={() => handleStroopAnswer(true)}>匹配</button>
                <button onClick={() => handleStroopAnswer(false)}>不匹配</button>
              </div>
            </>
          ) : (
            <div className="game-result">
              <h4>🏁 测试结束</h4>
              <p>正确数: {stroopScore}/20</p>
              <p>奖励: {Math.floor(stroopScore * 3)} 积分</p>
              <button onClick={startStroop}>再来一轮</button>
            </div>
          )}
          <button className="close-btn" onClick={() => setActiveGame(null)}>关闭</button>
        </div>
      );
    }

    if (activeGame === 'chess') {
      return (
        <div className="game-container">
          <div className="game-header">
            <h3>♟️ 象棋残局</h3>
            <p>{chessPuzzle.name}</p>
            <div className="game-stats">
              <span>步数: {chessStep}/3</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', background: '#1a1a2e', padding: '8px', borderRadius: '12px', border: '2px solid rgba(170,0,255,0.3)' }}>
              {chessPuzzle.board.map((row, rowIdx) => (
                <div key={rowIdx} style={{ display: 'contents' }}>
                  {row.map((cell, colIdx) => {
                    const isBlack = (rowIdx + colIdx) % 2 === 1;
                    const isSelected = chessSelected?.row === rowIdx && chessSelected?.col === colIdx;
                    return (
                      <button
                        key={colIdx}
                        onClick={() => handleChessClick(rowIdx, colIdx)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '4px',
                          border: isSelected ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                          background: isSelected ? 'rgba(0,255,136,0.2)' : isBlack ? 'rgba(60,60,80,0.8)' : 'rgba(30,30,50,0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          cursor: cell !== '.' ? 'pointer' : 'default',
                          color: cell === cell.toUpperCase() ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {cell !== '.' ? CHESS_PIECES[cell] : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '12px', background: 'rgba(170,0,255,0.1)', borderRadius: '12px', border: '1px solid rgba(170,0,255,0.3)' }}>
            <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>💡 提示</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{chessPuzzle.hint}</div>
          </div>

          {chessStep >= 3 && (
            <div className="game-result">
              <h4>🎉 完成残局！</h4>
              <p>奖励: 20 积分</p>
              <button onClick={() => { setChessStep(0); setChessPuzzle(CHESS_PUZZLES[Math.floor(Math.random() * CHESS_PUZZLES.length)]); }}>
                下一题
              </button>
            </div>
          )}

          <button className="close-btn" onClick={() => { setActiveGame(null); setChessStep(0); }}>关闭</button>
        </div>
      );
    }

    return null;
  };

  const gameStyles = `
    .game-container { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; overflow: auto; }
    .game-header { text-align: center; margin-bottom: 20px; }
    .game-header h3 { color: #00f0ff; font-size: 24px; margin: 0 0 8px; text-shadow: 0 0 10px rgba(0,240,255,0.5); }
    .game-header p { color: rgba(255,255,255,0.6); margin: 0 0 12px; }
    .game-stats { display: flex; gap: 20px; justify-content: center; color: #fff; font-size: 14px; }
    .schulte-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
    .schulte-cell { width: 56px; height: 56px; border-radius: 12px; border: 1px solid rgba(0,240,255,0.4); background: rgba(0,0,0,0.5); color: #fff; font-size: 22px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .schulte-cell.clicked { background: rgba(0,255,136,0.2); border-color: #00ff88; color: #00ff88; }
    .nbak-display { margin: 30px 0; }
    .nbak-show { width: 140px; height: 140px; border-radius: 24px; background: rgba(255,0,170,0.15); border: 2px solid #ff00aa; display: flex; align-items: center; justify-content: center; font-size: 72px; color: #ff00aa; margin: 0 auto; }
    .nbak-question { color: #fff; font-size: 18px; text-align: center; }
    .nbak-buttons { display: flex; gap: 20px; margin: 20px 0; }
    .nbak-buttons button { width: 100px; height: 100px; border-radius: 20px; border: 2px solid #ff00aa; background: rgba(255,0,170,0.2); color: #fff; font-size: 32px; cursor: pointer; }
    .memory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .memory-card { width: 70px; height: 70px; border-radius: 12px; border: 1px solid rgba(255,170,0,0.4); background: rgba(255,170,0,0.1); color: #fff; font-size: 32px; cursor: pointer; transition: all 0.3s; }
    .memory-card.flipped { background: rgba(255,170,0,0.3); border-color: #ffaa00; }
    .memory-card.matched { background: rgba(0,255,136,0.2); border-color: #00ff88; opacity: 0.6; }
    .stroop-word { font-size: 72px; font-weight: bold; margin: 30px 0; text-shadow: 0 0 20px currentColor; }
    .stroop-buttons { display: flex; gap: 20px; }
    .stroop-buttons button { width: 120px; height: 60px; border-radius: 12px; border: 2px solid #00ff88; background: rgba(0,255,136,0.2); color: #fff; font-size: 18px; cursor: pointer; }
    .game-result { text-align: center; margin: 20px 0; padding: 20px; background: rgba(0,240,255,0.1); border-radius: 16px; border: 1px solid rgba(0,240,255,0.3); }
    .game-result h4 { color: #00ff88; margin: 0 0 8px; }
    .game-result p { color: #fff; margin: 0 0 12px; }
    .game-result button { padding: 12px 24px; background: #00f0ff; color: #000; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .close-btn { margin-top: 16px; padding: 12px 32px; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; cursor: pointer; }
  `;

  return (
    <div style={{ padding: '0 0 80px' }}>
      <style>{gameStyles}</style>
      <div>
        <div style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(255,0,170,0.1) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,240,255,0.3)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 4px', fontWeight: '600', color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>🧠 脑力训练</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>冥想放松 + 认知游戏</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {(['meditation', 'games', 'pomodoro'] as ActiveTab[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setActiveGame(null); }}
              style={{ flex: 1, padding: '14px', background: activeTab === tab ? (tab === 'pomodoro' ? 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' : 'linear-gradient(135deg, var(--matrix-green) 0%, #00ff88 100%)') : 'rgba(0,0,0,0.4)', color: activeTab === tab ? '#000' : 'var(--text-primary)', border: `1px solid ${tab === 'pomodoro' ? 'rgba(255,107,107,0.3)' : 'var(--matrix-green-dim)'}`, borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Courier New', monospace", transition: 'all 0.15s' }}>
              {tab === 'meditation' ? '🧘 冥想' : tab === 'games' ? '🎮 游戏' : '🍅 番茄钟'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'meditation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MEDITATION_TYPES.map(med => (
            <div key={med.id}
              onClick={() => {
                if (meditationDoneToday.current.has(med.id)) {
                  alert(`今天已经完成过${med.name}了，明天再来吧！`);
                  return;
                }
                meditationDoneToday.current.add(med.id);
                addPoints(med.points, 'meditation', med.name);
                alert(`🧘 完成${med.name}，获得${med.points}积分！`);
              }}
              style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,240,255,0.3)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ fontSize: '36px' }}>{med.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{med.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{med.duration} · +{med.points}积分</div>
              </div>
              <div style={{ color: '#00f0ff', fontSize: '20px' }}>▶</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'games' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {GAMES.map(game => (
            <div key={game.id} onClick={() => setActiveGame(game.id as ActiveGame)}
              style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '20px', border: `1px solid ${game.color}40`, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${game.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{game.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{game.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{game.description} · 最高+{game.points}</div>
              </div>
              <div style={{ color: game.color, fontSize: '20px' }}>▶</div>
            </div>
          ))}
        </div>
      )}

      {activeGame && renderGame()}

      {activeTab === 'pomodoro' && <PomodoroTimer addPoints={addPoints} />}
    </div>
  );
}

function PomodoroTimer({ addPoints }: { addPoints: (points: number, type: any, detail?: string) => Promise<void> }) {
  const {
    mode,
    seconds,
    isRunning,
    completedPomodoros,
    setIsRunning,
    setStartTime,
    pauseTimer,
    resetTimer,
    switchMode,
  } = usePomodoroStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const tick = useCallback(() => {
    const state = usePomodoroStore.getState();
    if (state.seconds <= 1) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (state.mode === 'work') {
        state.completePomodoro();
        addPointsRef.current(15, 'pomodoro', '完成1个番茄钟');
        state.setMode('break');
        state.setSeconds(5 * 60);
      } else {
        state.setMode('work');
        state.setSeconds(25 * 60);
      }
      state.setIsRunning(false);
      state.setStartTime(null);
    } else {
      state.setSeconds(state.seconds - 1);
    }
  }, []);

  const ensureTimerRunning = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    }
  }, [tick]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      ensureTimerRunning();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, ensureTimerRunning, clearTimer]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const handleSwitchMode = () => {
    switchMode();
  };

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const totalSeconds = mode === 'work' ? 25 * 60 : 5 * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          margin: '0 auto 24px',
          background: `conic-gradient(${mode === 'work' ? '#ff6b6b' : '#4ecdc4'} ${progress}%, rgba(255,255,255,0.05) ${progress}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.3s ease',
        }}>
          <div style={{ width: '170px', height: '170px', borderRadius: '50%', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
              {isRunning ? (mode === 'work' ? '专注中...' : '休息中...') : '准备就绪'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
          {['work', 'break'].map(m => (
            <button key={m}
              onClick={handleSwitchMode}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: `1px solid ${mode === m ? (m === 'work' ? '#ff6b6b' : '#4ecdc4') : 'rgba(255,255,255,0.08)'}`,
                background: mode === m ? (m === 'work' ? '#ff6b6b15' : '#4ecdc415') : 'transparent',
                color: mode === m ? (m === 'work' ? '#ff6b6b' : '#4ecdc4') : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
            >
              {m === 'work' ? '🍅 工作' : '☕ 休息'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {!isRunning ? (
            <button onClick={handleStart}
              style={{ padding: '14px 40px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #00f0ff, #a855f7)', color: '#000', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,240,255,0.2)', transition: 'transform 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ▶ 开始
            </button>
          ) : (
            <>
              <button onClick={handlePause} style={{ padding: '14px 32px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>⏸ 暂停</button>
              <button onClick={handleReset} style={{ padding: '14px 32px', borderRadius: '30px', border: '1px solid rgba(255,107,107,0.2)', background: 'rgba(255,107,107,0.05)', color: '#ff6b6b', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>↺ 重置</button>
            </>
          )}
        </div>

        <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          今日已完成 <span style={{ color: '#ff6b6b', fontWeight: '600' }}>{completedPomodoros}</span> 个番茄钟 · 获得积分 <span style={{ color: '#ffd700' }}>{completedPomodoros * 15}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '18px' }}>
        <h4 style={{ fontSize: '14px', color: '#fff', marginBottom: '12px' }}>📋 番茄工作法说明</h4>
        <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '2' }}>
          <li>选择一个任务开始专注（25分钟）</li>
          <li>直到计时器响起，中途不切换任务</li>
          <li>短暂休息 5 分钟，每4个番茄钟后休息 15-30 分钟</li>
          <li>每个番茄钟完成后获得 15 积分奖励</li>
        </ul>
      </div>
    </div>
  );
}