/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  ChevronRight, 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  CheckCircle2,
  Gamepad2,
  ArrowLeft,
  Key,
  MessageSquare,
  Send,
  Receipt,
  LogOut,
  Home,
  Sparkles
} from 'lucide-react';

// --- Types ---

type Language = 'DE' | 'EN' | 'FR' | 'ZH' | 'AR' | 'ES' | 'IT' | 'JA' | 'PT' | 'RU' | 'HI' | 'KO';
type Gender = 'male' | 'female';

interface Butler {
  id: string;
  name: string;
  lang: Language;
  oxymoron: string;
  flag: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isRecommended?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// --- Translations ---

const TRANSLATIONS: Record<Language, any> = {
  DE: { welcome: "Willkommen", select: "Wähle deinen Butler", room: "Zimmernummer", menu: "Speisekarte", food: "Speisen", service: "Services", total: "Gesamt", order: "Bestellen", thanks: "Vieslen Dank", mood: "Raum-Ambiente" },
  EN: { welcome: "Welcome", select: "Choose your Butler", room: "Room Number", menu: "Menu", food: "Dining", service: "Services", total: "Total", order: "Order Now", thanks: "Thank You", mood: "Room Mood" },
  FR: { welcome: "Bienvenue", select: "Choisissez votre Butler", room: "Numéro de chambre", menu: "Menu", food: "Restauration", service: "Services", total: "Total", order: "Commander", thanks: "Merci", mood: "Ambiance" },
  ES: { welcome: "Bienvenido", select: "Elige tu Mayordomo", room: "Número de habitación", menu: "Menú", food: "Comida", service: "Servicios", total: "Total", order: "Pedir", thanks: "Gracias", mood: "Ambiente" },
  IT: { welcome: "Benvenuto", select: "Scegli il tuo Maggiordomo", room: "Numero di stanza", menu: "Menu", food: "Ristorazione", service: "Servizi", total: "Totale", order: "Ordina", thanks: "Grazie", mood: "Atmosfera" },
  ZH: { welcome: "欢迎", select: "选择您的管家", room: "房间号", menu: "菜单", food: "餐饮", service: "服务", total: "总计", order: "现在下单", thanks: "谢谢", mood: "房间氛围" },
  AR: { welcome: "مرحباً", select: "اختر خادمك", room: "رقم الغرفة", menu: "القائمة", food: "طعام", service: "خدمات", total: "المجموع", order: "اطلب الآن", thanks: "شكراً لك", mood: "جو الغرفة" },
  JA: { welcome: "ようこそ", select: "執事を選択してください", room: "部屋番号", menu: "メニュー", food: "お食事", service: "サービス", total: "合計", order: "注文する", thanks: "ありがとうございました", mood: "お部屋の雰囲気" },
  PT: { welcome: "Bem-vindo", select: "Escolha seu Mordomo", room: "Número do quarto", menu: "Menu", food: "Refeições", service: "Serviços", total: "Total", order: "Pedir", thanks: "Obrigado", mood: "Ambiente" },
  RU: { welcome: "Добро пожаловать", select: "Выберите дворецкого", room: "Номер комнаты", menu: "Меню", food: "Питание", service: "Услуги", total: "Итого", order: "Заказать", thanks: "Спасибо", mood: "Атмосфера" },
  HI: { welcome: "स्वागत है", select: "अपने बटलर को चुनें", room: "कमरा नंबर", menu: "मेनू", food: "भोजन", service: "सेवाएं", total: "कुल", order: "अभी ऑर्डर करें", thanks: "धन्यवाद", mood: "कमरे का माहौल" },
  KO: { welcome: "환영합니다", select: "집사를 선택하세요", room: "객실 번호", menu: "메뉴", food: "식사", service: "서비스", total: "합계", order: "주문하기", thanks: "감사합니다", mood: "객실 분위기" },
};

// --- Constants ---

const BUTLERS: Butler[] = [
  { id: 'hans', name: 'Hans Pünktlich', lang: 'DE', oxymoron: 'Pünktlich', flag: '🇩🇪' },
  { id: 'reginald', name: 'Reginald Late', lang: 'EN', oxymoron: 'Late', flag: '🇬🇧' },
  { id: 'pierre', name: 'Pierre Chaotique', lang: 'FR', oxymoron: 'Chaotique', flag: '🇫🇷' },
  { id: 'wei', name: 'Wei Silent', lang: 'ZH', oxymoron: 'Silent', flag: '🇨🇳' },
  { id: 'ahmed', name: 'Ahmed Rush', lang: 'AR', oxymoron: 'Rush', flag: '🇸🇦' },
  { id: 'carlos', name: 'Carlos Siesta', lang: 'ES', oxymoron: 'Siesta', flag: '🇪🇸' },
  { id: 'luigi', name: 'Luigi Hastig', lang: 'IT', oxymoron: 'Hastig', flag: '🇮🇹' },
  { id: 'kenji', name: 'Kenji Imperfekt', lang: 'JA', oxymoron: 'Imperfekt', flag: '🇯🇵' },
  { id: 'joao', name: 'João Calm', lang: 'PT', oxymoron: 'Calm', flag: '🇧🇷' },
  { id: 'ivan', name: 'Ivan Tiny', lang: 'RU', oxymoron: 'Tiny', flag: '🇷🇺' },
  { id: 'raj', name: 'Raj Quiet', lang: 'HI', oxymoron: 'Quiet', flag: '🇮🇳' },
  { id: 'jihoon', name: 'Ji-Hoon Loud', lang: 'KO', oxymoron: 'Loud', flag: '🇰🇷' },
];

const MENU: (MenuItem & { image?: string })[] = [
  // Food
  { id: 'm1', name: 'Kaviar "Royal"', description: 'Beluga Kaviar mit Blinis und Sauerrahm', price: 120, category: 'Speisen', isRecommended: true, image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=400&q=80' },
  { id: 'm2', name: 'Trüffel Pasta', description: 'Hausgemachte Tagliatelle mit frischem Sommertrüffel', price: 45, category: 'Speisen', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80' },
  { id: 'm3', name: 'Wagyu Burger', description: 'A5 Wagyu Beef, karamellisierte Zwiebeln, Brioche Bun', price: 65, category: 'Speisen', isRecommended: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'm4', name: 'Champagner Sorbet', description: 'Erfrischendes Sorbet aus Dom Pérignon', price: 25, category: 'Speisen', image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=400&q=80' },
  { id: 'm5', name: 'Goldener Cappuccino', description: 'Mit 24 Karat Blattgold verziert', price: 18, category: 'Getränke', isRecommended: true, image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=400&q=80' },
  { id: 'm6', name: 'Hummer Thermidor', description: 'Frischer Hummer in cremiger Cognac-Sauce', price: 85, category: 'Speisen', image: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80' },
  // Services
  { id: 's1', name: 'Frische Handtücher', description: 'Satz flauschige ägyptische Baumwollhandtücher', price: 0, category: 'Service' },
  { id: 's2', name: 'Schuhputz-Service', description: 'Über Nacht Politur für Ihre feinsten Schuhe', price: 15, category: 'Service' },
  { id: 's3', name: 'Taxi-Ruf', description: 'Sofortige Abholung vor dem Haupteingang', price: 0, category: 'Service' },
  { id: 's4', name: 'Gepäck-Service', description: 'Abholung Ihrer Koffer für den Check-out', price: 0, category: 'Service' },
  { id: 's5', name: 'Abend-Turndown', description: 'Vorbereitung Ihres Zimmers für die Nacht', price: 0, category: 'Service' },
  { id: 's6', name: 'IT-Butler', description: 'Hilfe bei WLAN oder Geräte-Verbindungen', price: 0, category: 'Service' },
];

const PILLOWS = [
  { id: 'p1', name: 'Gänsefeder', desc: 'Klassisch weich & luxuriös' },
  { id: 'p2', name: 'Memory Foam', desc: 'Perfekte Nackenstütze' },
  { id: 'p3', name: 'Lavendel-Traum', desc: 'Beruhigend für tiefen Schlaf' },
  { id: 'p4', name: 'Dinkelkissen', desc: 'Natürlich & atmungsaktiv' },
];

const MOODS = [
  { id: 'relax', name: 'Relax', icon: '🕯️', color: 'bg-indigo-500' },
  { id: 'focus', name: 'Focus', icon: '💡', color: 'bg-blue-500' },
  { id: 'romance', name: 'Romance', icon: '🌹', color: 'bg-rose-500' },
  { id: 'party', name: 'Party', icon: '🎉', color: 'bg-purple-500' },
];

// --- Components ---

const ButlerAvatar = ({ gender, lang, size = "md" }: { gender: Gender, lang: Language, size?: "sm" | "md" | "lg" }) => {
  const dimensions = size === "sm" ? "w-10 h-10" : size === "md" ? "w-24 h-24" : "w-48 h-48";
  
  return (
    <motion.div 
      animate={{ 
        y: [0, -4, 0],
        scale: [1, 1.02, 1]
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={`${dimensions} relative flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full border-2 border-amber-500/30 overflow-hidden shadow-inner`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Head */}
        <circle cx="50" cy="40" r="25" fill={gender === 'male' ? "#fcd34d" : "#fbbf24"} />
        {/* Hair/Hat */}
        {gender === 'male' ? (
          <path d="M25 40 Q25 15 50 15 Q75 15 75 40" fill="#451a03" />
        ) : (
          <path d="M25 40 Q25 10 50 10 Q75 10 75 40 L80 50 Q80 60 50 60 Q20 60 20 50 Z" fill="#78350f" />
        )}
        {/* Eyes */}
        <circle cx="40" cy="40" r="2" fill="#000" />
        <circle cx="60" cy="40" r="2" fill="#000" />
        {/* Smile */}
        <path d="M40 50 Q50 55 60 50" stroke="#000" strokeWidth="1" fill="none" />
        {/* Butler Outfit */}
        <path d="M20 80 Q50 70 80 80 L85 100 L15 100 Z" fill="#1e293b" />
        <path d="M50 75 L40 100 L60 100 Z" fill="#fff" />
        <rect x="48" y="85" width="4" height="4" rx="1" fill="#000" />
        <rect x="48" y="92" width="4" height="4" rx="1" fill="#000" />
      </svg>
      <div className="absolute bottom-1 right-1 text-xs">{BUTLERS.find(b => b.lang === lang)?.flag}</div>
    </motion.div>
  );
};

// --- Tetris Logic ---

const COLS = 10;
const ROWS = 20;
const FOOD_EMOJIS = ['🍔', '🍕', '🍣', '🍩', '🌮', '🍦', '🍰'];

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
];

const TetrisGame = ({ onBack }: { onBack: () => void }) => {
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ shape: number[][], x: number, y: number, emoji: string } | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const spawnPiece = () => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const emoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
    const shape = SHAPES[shapeIndex];
    const piece = {
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
      emoji
    };

    if (checkCollision(piece.x, piece.y, shape)) {
      setGameOver(true);
      return null;
    }
    return piece;
  };

  const checkCollision = (x: number, y: number, shape: number[][], currentGrid = grid) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (shape: number[][]) => {
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    return newShape;
  };

  const handleRotate = () => {
    if (!activePiece || gameOver) return;
    const newShape = rotate(activePiece.shape);
    if (!checkCollision(activePiece.x, activePiece.y, newShape)) {
      setActivePiece({ ...activePiece, shape: newShape });
    }
  };

  const move = (dx: number, dy: number) => {
    if (!activePiece || gameOver) return;
    if (!checkCollision(activePiece.x + dx, activePiece.y + dy, activePiece.shape)) {
      setActivePiece({ ...activePiece, x: activePiece.x + dx, y: activePiece.y + dy });
      return true;
    }
    if (dy > 0) {
      lockPiece();
    }
    return false;
  };

  const lockPiece = () => {
    if (!activePiece) return;
    const newGrid = grid.map(row => [...row]);
    activePiece.shape.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value) {
          const gridY = activePiece.y + rowIndex;
          const gridX = activePiece.x + colIndex;
          if (gridY >= 0) newGrid[gridY][gridX] = activePiece.emoji;
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    setGrid(filteredGrid);
    setScore(s => s + (linesCleared * 100));
    setActivePiece(spawnPiece());
  };

  useEffect(() => {
    setActivePiece(spawnPiece());
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;

      if (deltaTime > 800 && !gameOver) {
        move(0, 1);
        lastTimeRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(animate);
    };
    gameLoopRef.current = requestAnimationFrame(animate);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <header className="w-full max-w-xs flex justify-between items-center mb-4">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black italic text-amber-400">Food-Tetris</h2>
          <p className="text-xs font-bold">Score: {score}</p>
        </div>
        <div className="w-10" />
      </header>
      
      <div className="relative w-64 h-[400px] bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden grid grid-cols-10 grid-rows-20">
        {grid.map((row, y) => row.map((cell, x) => (
          <div key={`${y}-${x}`} className="border border-slate-700/30 flex items-center justify-center text-lg">
            {cell}
          </div>
        )))}
        {activePiece && activePiece.shape.map((row, y) => row.map((value, x) => {
          if (!value) return null;
          return (
            <div 
              key={`active-${y}-${x}`}
              className="absolute flex items-center justify-center text-lg"
              style={{
                width: '25.6px',
                height: '20px',
                left: `${(activePiece.x + x) * 25.6}px`,
                top: `${(activePiece.y + y) * 20}px`
              }}
            >
              {activePiece.emoji}
            </div>
          );
        }))}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
            <h3 className="text-2xl font-black text-red-500 mb-2">GAME OVER</h3>
            <p className="mb-4">Final Score: {score}</p>
            <button 
              onClick={() => { setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(''))); setScore(0); setGameOver(false); setActivePiece(spawnPiece()); }}
              className="px-6 py-2 bg-amber-500 rounded-full font-bold"
            >
              Nochmal!
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-xs">
        <button onClick={() => move(-1, 0)} className="p-4 bg-slate-800 rounded-xl active:bg-slate-700 flex justify-center"><ChevronRight className="rotate-180" /></button>
        <button onClick={handleRotate} className="p-4 bg-amber-500 rounded-xl active:bg-amber-600 flex justify-center"><RefreshCw /></button>
        <button onClick={() => move(1, 0)} className="p-4 bg-slate-800 rounded-xl active:bg-slate-700 flex justify-center"><ChevronRight /></button>
        <div />
        <button onClick={() => move(0, 1)} className="p-4 bg-slate-800 rounded-xl active:bg-slate-700 flex justify-center"><ChevronRight className="rotate-90" /></button>
        <div />
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'butler' | 'room' | 'menu' | 'thanks' | 'tetris' | 'key' | 'bill'>('landing');
  const [menuTab, setMenuTab] = useState<'food' | 'service'>('food');
  const [showPillowMenu, setShowPillowMenu] = useState(false);
  const [selectedButler, setSelectedButler] = useState<Butler | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gender, setGender] = useState<Gender>('male');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [orderProgress, setOrderProgress] = useState(0);
  const [currentMood, setCurrentMood] = useState('relax');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [billItems, setBillItems] = useState<CartItem[]>([]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('butler_brigade_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsDarkMode(parsed.isDarkMode ?? true);
        setGender(parsed.gender ?? 'male');
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('butler_brigade_state', JSON.stringify({ isDarkMode, gender }));
    // Apply dark mode class to both html and body for maximum compatibility
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode, gender]);

  // Vibration helper
  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const addToCart = (item: MenuItem) => {
    vibrate();
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Auto-expand only if it was empty before
    if (cart.length === 0) setIsCartExpanded(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    const orderText = cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
    const message = `Hallo ${selectedButler?.name}, ich möchte gerne bestellen für Zimmer ${roomNumber}:%0A%0A${orderText}%0A%0AGesamt: ${total}€`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setBillItems(prev => [...prev, ...cart]);
    setScreen('thanks');
    setCart([]);
    setOrderProgress(0);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: text,
        config: {
          systemInstruction: `You are ${selectedButler?.name}, a luxury hotel butler. Your personality is ${selectedButler?.oxymoron}. You speak ${selectedButler?.lang}. Keep responses short, elegant, and helpful. You are assisting guest in room ${roomNumber}.`,
        }
      });
      
      const butlerMsg: Message = { role: 'model', text: response.text || "I am at your service." };
      setChatMessages(prev => [...prev, butlerMsg]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'model', text: "I apologize, I am momentarily unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Order Progress Simulation
  useEffect(() => {
    if (screen !== 'thanks' || orderProgress >= 100) return;

    const interval = setInterval(() => {
      setOrderProgress(prev => Math.min(prev + 1, 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, orderProgress]);

  // --- Render Screens ---

  const renderLanding = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8"
    >
      <div className="relative">
        <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
        <ButlerAvatar gender={gender} lang="DE" size="lg" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter text-amber-500 dark:text-amber-400 uppercase italic">
          Butler Brigade
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Exzellenz auf Knopfdruck.</p>
      </div>
      <button 
        onClick={() => setScreen('butler')}
        className="group relative px-12 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2 text-xl">
          Los geht's! <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </button>
    </motion.div>
  );

  const renderButlerSelection = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 pb-32"
    >
      <header className="flex justify-between items-center mb-8">
        <button onClick={() => setScreen('landing')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Wähle deinen Butler</h2>
        <div className="flex gap-2">
          <button onClick={() => setGender(g => g === 'male' ? 'female' : 'male')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {BUTLERS.slice(0, 5).map((butler, index) => (
          <motion.button
            key={butler.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectedButler(butler); setScreen('room'); }}
            className={`flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-3xl border-2 border-transparent hover:border-amber-500 transition-colors shadow-sm ${index === 4 ? 'col-span-2' : ''}`}
          >
            <ButlerAvatar gender={gender} lang={butler.lang} size="md" />
            <span className="mt-3 font-bold text-sm">{butler.name}</span>
            <span className="text-xs text-slate-500">{butler.oxymoron}</span>
          </motion.button>
        ))}
      </div>

      <h3 className="text-lg font-bold mb-4 px-2">Weitere Butler</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {BUTLERS.slice(5).map(butler => (
          <motion.button
            key={butler.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectedButler(butler); setScreen('room'); }}
            className="flex-shrink-0 w-40 flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm snap-center"
          >
            <ButlerAvatar gender={gender} lang={butler.lang} size="md" />
            <span className="mt-3 font-bold text-sm text-center">{butler.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const getButlerMessage = (context: 'room' | 'thanks') => {
    const lang = selectedButler?.lang || 'DE';
    const personality = selectedButler?.oxymoron || '';
    
    const messages: Record<string, Record<'room' | 'thanks', string>> = {
      Pünktlich: { room: 'Effizienz ist der Schlüssel. Welches Zimmer?', thanks: 'Ich bin bereits auf dem Weg. Exakt 12 Minuten.' },
      Late: { room: 'No rush, darling. Which room are we talking about?', thanks: 'I will be there... eventually. Quality takes time.' },
      Chaotique: { room: 'Ohlala! Où est votre chambre? Je l\'ai oubliée!', thanks: 'Je cours! Enfin, je crois que c\'est par là!' },
      Silent: { room: '...', thanks: '...' },
      Rush: { room: 'Fast! Fast! Room number?!', thanks: 'I am already at your door! Open up!' },
      Siesta: { room: '¿Qué? Ah, sí... ¿qué habitación?', thanks: 'Después de mi siesta, estaré allí. Despacio.' },
      Hastig: { room: 'Presto! Presto! Numero di stanza?', thanks: 'Sto volando! Arrivo subito!' },
      Imperfekt: { room: 'Room... number? Hope I get it right.', thanks: 'I am coming. I might take a wrong turn, but I am coming.' },
      Calm: { room: 'Respire... qual é o seu quarto?', thanks: 'Tudo bem. Estarei lá com calma e paz.' },
      Tiny: { room: 'Small room? Big room? Number?', thanks: 'I am coming. I am small, but I am fast.' },
      Quiet: { room: 'Shhh... room number?', thanks: 'I will be there as quiet as a mouse.' },
      Loud: { room: 'HELLO! WHAT IS YOUR ROOM NUMBER?!', thanks: 'I AM COMING! YOU WILL HEAR ME!' },
    };

    return messages[personality]?.[context] || (context === 'room' ? 'Welches Zimmer?' : 'Ich bin unterwegs.');
  };

  const renderRoomInput = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <div className="mb-8">
        <ButlerAvatar gender={gender} lang={selectedButler?.lang || 'DE'} size="md" />
        <p className="mt-4 text-xl font-medium italic">"{getButlerMessage('room')}"</p>
      </div>
      <div className="w-full max-w-xs space-y-6">
        <input 
          type="number" 
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="Zimmernummer"
          className="w-full px-6 py-4 text-3xl text-center font-bold bg-white dark:bg-slate-800 border-2 border-amber-500/30 rounded-2xl focus:border-amber-500 outline-none transition-all"
          autoFocus
        />
        <button 
          disabled={!roomNumber}
          onClick={() => setScreen('menu')}
          className="w-full py-4 bg-amber-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          Speisekarte ansehen
        </button>
      </div>
    </motion.div>
  );

  const renderMenu = () => {
    const lang = selectedButler?.lang || 'DE';
    const t = TRANSLATIONS[lang];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? (lang === 'DE' ? 'Guten Morgen' : 'Good Morning') : hour < 18 ? (lang === 'DE' ? 'Guten Tag' : 'Good Day') : (lang === 'DE' ? 'Guten Abend' : 'Good Evening');

    return (
    <div className="min-h-screen pb-48">
      <header className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md p-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ButlerAvatar gender={gender} lang={lang} size="sm" />
            <div>
              <h2 className="font-bold leading-tight">{selectedButler?.name}</h2>
              <p className="text-xs text-amber-500 font-bold">{t.room} {roomNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen('key')} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-amber-500">
              <Key className="w-5 h-5" />
            </button>
            <button onClick={() => setScreen('bill')} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500">
              <Receipt className="w-5 h-5" />
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
          <button 
            onClick={() => setMenuTab('food')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${menuTab === 'food' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
          >
            {t.food}
          </button>
          <button 
            onClick={() => setMenuTab('service')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${menuTab === 'service' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
          >
            {t.service}
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8">
        <div className="mb-2">
          <h1 className="text-3xl font-black italic uppercase text-slate-800 dark:text-white">{greeting},</h1>
          <p className="text-slate-500 font-medium">{selectedButler?.oxymoron} {t.welcome}.</p>
        </div>

        {menuTab === 'food' ? (
          <>
            {/* Butler's Choice */}
            <section>
              <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-amber-500">Butler's Choice</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {MENU.filter(item => item.isRecommended).map(item => (
                  <motion.div 
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item)}
                    className="flex-shrink-0 w-72 h-48 rounded-[32px] shadow-xl relative overflow-hidden cursor-pointer group"
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-amber-600 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h4 className="font-bold text-lg leading-tight mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xl">{item.price}€</span>
                        <div className="p-2 bg-amber-500 rounded-full">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {['Speisen', 'Getränke'].map(cat => (
              <section key={cat}>
                <h3 className="text-xl font-black mb-4 uppercase tracking-wider text-slate-400">{cat}</h3>
                <div className="space-y-4">
                  {MENU.filter(item => item.category === cat).map(item => (
                    <motion.div 
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(item)}
                      className="flex gap-4 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/20 dark:border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Sparkles className="w-8 h-8 text-amber-500/50" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-base leading-tight">{item.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                        <span className="font-black text-amber-500 mt-1">{item.price}€</span>
                      </div>
                      <div className="flex items-center pr-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="space-y-8">
            {/* Mood Control */}
            <section>
              <h3 className="text-xl font-black mb-4 uppercase tracking-wider text-slate-400">{t.mood}</h3>
              <div className="grid grid-cols-4 gap-3">
                {MOODS.map(mood => (
                  <button 
                    key={mood.id}
                    onClick={() => { setCurrentMood(mood.id); vibrate(); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${currentMood === mood.id ? `${mood.color} text-white shadow-lg scale-105` : 'bg-white dark:bg-slate-800 text-slate-500'}`}
                  >
                    <span className="text-2xl">{mood.icon}</span>
                    <span className="text-[10px] font-bold uppercase">{mood.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Pillow Menu Special Card */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPillowMenu(true)}
              className="relative p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-[32px] text-white shadow-xl overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-black italic uppercase mb-1">Kissen-Menü</h3>
                <p className="text-amber-100 text-sm mb-4">Wählen Sie Ihren perfekten Schlafkomfort.</p>
                <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">Jetzt auswählen</span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,18H4V6H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" />
                </svg>
              </div>
            </motion.div>

            <section>
              <h3 className="text-xl font-black mb-4 uppercase tracking-wider text-slate-400">Butler Concierge</h3>
              <div className="grid grid-cols-2 gap-4">
                {MENU.filter(item => item.category === 'Service').map(item => (
                  <motion.div 
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(item)}
                    className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex flex-col items-center text-center gap-2 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500">
                      {item.id === 's1' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4zM4 8h16M4 12h16M4 16h16" /></svg>}
                      {item.id === 's2' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12l-9-9-9 9 9 9 9-9z" /></svg>}
                      {item.id === 's3' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 13V4M12 4L9 7M12 4l3 3" /></svg>}
                      {item.id === 's4' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>}
                      {item.id === 's5' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
                      {item.id === 's6' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>}
                    </div>
                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.price === 0 ? 'Kostenlos' : `${item.price}€`}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Pillow Menu Modal */}
      <AnimatePresence>
        {showPillowMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPillowMenu(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-black italic uppercase mb-6 text-amber-500">Kissen-Menü</h3>
              <div className="space-y-4">
                {PILLOWS.map(pillow => (
                  <button 
                    key={pillow.id}
                    onClick={() => {
                      addToCart({ id: pillow.id, name: `Kissen: ${pillow.name}`, description: pillow.desc, price: 0, category: 'Service' });
                      setShowPillowMenu(false);
                    }}
                    className="w-full p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:border-amber-500 border border-transparent transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500">
                      ☁️
                    </div>
                    <div>
                      <h4 className="font-bold">{pillow.name}</h4>
                      <p className="text-xs text-slate-500">{pillow.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimizable Bottom Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: isCartExpanded ? 0 : 'calc(100% - 80px)' }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-[32px] shadow-2xl border-t border-amber-500/20 overflow-hidden"
          >
            {/* Handle/Header */}
            <div 
              onClick={() => setIsCartExpanded(!isCartExpanded)}
              className="p-4 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-amber-500" />
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <span className="font-bold">Deine Bestellung</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-amber-500">{total}€</span>
                {isCartExpanded ? (
                  <button onClick={(e) => { e.stopPropagation(); setIsCartExpanded(false); }} className="p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-8 h-1 bg-slate-300 rounded-full" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <div className="px-6 pb-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h5 className="font-bold">{item.name}</h5>
                      <p className="text-xs text-slate-500">{item.price}€ pro Stück</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                      <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-amber-500 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="p-1 hover:text-amber-500 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Butler Suggestion */}
              {cart.length > 0 && (
                <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <ButlerAvatar gender={gender} lang={selectedButler?.lang || 'DE'} size="sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Butler Suggests</p>
                    <p className="text-sm font-medium italic">"A glass of Champagne would pair perfectly with your selection."</p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
              >
                Bestellung via WhatsApp <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    );
  };

  const renderKey = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12"
    >
      <header className="fixed top-0 left-0 right-0 p-6 flex items-center">
        <button onClick={() => setScreen('menu')} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>
      
      <div className="space-y-4">
        <h2 className="text-3xl font-black italic uppercase text-amber-500">Digital Key</h2>
        <p className="text-slate-500">Room {roomNumber}</p>
      </div>

      <motion.div 
        className="relative w-64 h-64 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-48 h-48 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white/20">
          <Key className="w-24 h-24 text-white" />
        </div>
      </motion.div>

      <div className="space-y-4 w-full max-w-xs">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          className="w-full py-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3"
        >
          HOLD TO UNLOCK
        </motion.button>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">NFC Active</p>
      </div>
    </motion.div>
  );

  const renderBill = () => {
    const billTotal = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6"
      >
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => setScreen('menu')} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tight">Your Folio</h2>
          <div className="w-10" />
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl space-y-6 border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Guest</p>
              <p className="font-bold">Room {roomNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
              <p className="font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            {billItems.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">No charges yet.</p>
            ) : (
              billItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.quantity}x {item.price}€</p>
                  </div>
                  <p className="font-black">{item.price * item.quantity}€</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <p className="text-xl font-black uppercase">Total</p>
            <p className="text-2xl font-black text-amber-500">{billTotal}€</p>
          </div>
        </div>

        <button 
          onClick={() => {
            alert("Express Checkout initiated. Thank you for staying with us!");
            setScreen('landing');
          }}
          className="w-full mt-8 py-5 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3"
        >
          <LogOut className="w-6 h-6" />
          EXPRESS CHECKOUT
        </button>
      </motion.div>
    );
  };

  const renderChat = () => (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col"
        >
          <header className="p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ButlerAvatar gender={gender} lang={selectedButler?.lang || 'DE'} size="sm" />
              <div>
                <h3 className="font-bold">{selectedButler?.name}</h3>
                <p className="text-xs text-green-500 font-bold">Online</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-slate-400 italic">How can I assist you today?</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl font-medium ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 shadow-sm rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as any).message;
                handleSendMessage(input.value);
                input.value = '';
              }}
              className="flex gap-2"
            >
              <input 
                name="message"
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <button type="submit" className="p-3 bg-amber-500 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderThanks = () => {
    const lang = selectedButler?.lang || 'DE';
    const t = TRANSLATIONS[lang];
    
    const statusSteps = [
      { label: lang === 'DE' ? 'Bestellung erhalten' : 'Order Received', min: 0 },
      { label: lang === 'DE' ? 'In Vorbereitung' : 'Preparing', min: 25 },
      { label: lang === 'DE' ? 'Qualitätskontrolle' : 'Quality Check', min: 50 },
      { label: lang === 'DE' ? 'Auf dem Weg' : 'On the Way', min: 75 },
      { label: lang === 'DE' ? 'Ankunft' : 'Arrived', min: 100 },
    ];

    const currentStep = [...statusSteps].reverse().find(s => orderProgress >= s.min) || statusSteps[0];

    return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8"
    >
      <div className="relative">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full z-10"
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>
        <ButlerAvatar gender={gender} lang={lang} size="lg" />
      </div>
      <div className="space-y-4 w-full">
        <h2 className="text-3xl font-black italic uppercase text-amber-500">{t.thanks}!</h2>
        <p className="text-xl font-medium italic">
          "{getButlerMessage('thanks')}"
        </p>
        <p className="text-sm text-slate-500 mt-2">Zimmer {roomNumber}</p>
        
        {/* Live Tracker */}
        <div className="mt-12 px-4 w-full max-w-md mx-auto">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-black uppercase text-amber-500 tracking-widest">{currentStep.label}</span>
            <span className="text-xs font-bold text-slate-400">{orderProgress}%</span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${orderProgress}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            />
          </div>
          <div className="flex justify-between mt-4">
            {statusSteps.map((s, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${orderProgress >= s.min ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="pt-8 space-y-4 w-full max-w-xs">
        <p className="text-sm text-slate-500">{lang === 'DE' ? 'Möchtest du dir die Wartezeit verkürzen?' : 'Want to pass the time?'}</p>
        <button 
          onClick={() => setScreen('tetris')}
          className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
        >
          <Gamepad2 className="w-6 h-6 text-amber-400" /> Food-Tetris spielen
        </button>
        <button 
          onClick={() => setScreen('landing')}
          className="text-amber-500 font-bold"
        >
          {lang === 'DE' ? 'Zurück zum Start' : 'Back to Start'}
        </button>
      </div>
    </motion.div>
  );
  };

  const renderTetris = () => {
    return <TetrisGame onBack={() => setScreen('thanks')} />;
  };

  const moodColors: Record<string, string> = {
    relax: 'from-indigo-500/20 via-slate-900 to-slate-900',
    focus: 'from-blue-500/20 via-slate-900 to-slate-900',
    romance: 'from-rose-500/20 via-slate-900 to-slate-900',
    party: 'from-purple-500/20 via-slate-900 to-slate-900',
  };

  const AuraBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-[120px] bg-gradient-to-br ${moodColors[currentMood] || 'from-amber-500/20 to-transparent'} opacity-50`}
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
          x: [0, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-[120px] bg-gradient-to-br ${moodColors[currentMood] || 'from-amber-500/10 to-transparent'} opacity-30`}
      />
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500/30 transition-colors duration-1000 relative`}>
      <AuraBackground />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
        {screen === 'landing' && renderLanding()}
        {screen === 'butler' && renderButlerSelection()}
        {screen === 'room' && renderRoomInput()}
        {screen === 'menu' && renderMenu()}
        {screen === 'thanks' && renderThanks()}
        {screen === 'tetris' && renderTetris()}
        {screen === 'key' && renderKey()}
        {screen === 'bill' && renderBill()}
      </AnimatePresence>

      {renderChat()}

      {/* Premium Bottom Navigation */}
      {['menu', 'thanks', 'key', 'bill'].includes(screen) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <motion.nav 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="max-w-md mx-auto h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-700/50 flex items-center justify-around px-4 pointer-events-auto"
          >
            {[
              { id: 'menu', icon: Home, label: 'Home' },
              { id: 'key', icon: Key, label: 'Key' },
              { id: 'chat', icon: MessageSquare, label: 'Chat', special: true },
              { id: 'bill', icon: Receipt, label: 'Bill' },
              { id: 'thanks', icon: Sparkles, label: 'Status' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  if (item.id === 'chat') {
                    setIsChatOpen(true);
                  } else {
                    setScreen(item.id as any);
                  }
                  vibrate();
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  (screen === item.id || (item.id === 'chat' && isChatOpen)) 
                    ? 'text-amber-500 scale-110' 
                    : 'text-slate-400'
                }`}
              >
                <div className={`p-2 rounded-2xl ${item.special ? 'bg-amber-500 text-white shadow-lg -mt-8' : ''}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                {!item.special && <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>}
              </button>
            ))}
          </motion.nav>
        </div>
      )}

      {/* Global Theme Toggle (only on some screens) */}
      {['landing', 'butler', 'room', 'thanks'].includes(screen) && (
        <div className="fixed top-6 right-6 z-50">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 active:scale-90 transition-all"
          >
            {isDarkMode ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-slate-600" />}
          </button>
        </div>
      )}
    </div>
  </div>
  );
}
