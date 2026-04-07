/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice as formatPriceUtil } from './lib/utils';
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
  Sparkles,
  Unlock,
  Maximize,
  Minimize,
  RotateCcw,
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  Bell,
  Search,
  Filter,
  Check,
  Clock,
  Truck,
  MoreVertical,
  ShieldCheck,
  Lock,
  Wrench
} from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';

// --- Types ---

type Language = 'DE' | 'EN' | 'FR' | 'ZH' | 'AR' | 'ES' | 'IT' | 'JA' | 'PT' | 'RU' | 'HI' | 'KO';
type Gender = 'male' | 'female';

interface Butler {
  id: string;
  name: string;
  languages: Language[];
  oxymoron: string;
  flag: string;
  personalityType: string;
  quotes: {
    welcome: string;
    bored: string;
    upsell: string[];
  };
  isLadyOfHouse?: boolean;
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

interface Order {
  id: string;
  room: string;
  guestName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'delivering' | 'completed';
  timestamp: number;
  butlerName: string;
}

// --- Translations ---

const TRANSLATIONS: Record<Language, any> = {
  DE: { 
    welcome: "Willkommen", 
    select: "Wähle deinen Butler", 
    room: "Zimmernummer", 
    menu: "Speisekarte", 
    food: "Speisen", 
    service: "Services", 
    total: "Gesamt", 
    order: "Bestellen", 
    thanks: "Vielen Dank", 
    mood: "Raum-Ambiente",
    name: "Ihr Name",
    welcome_voucher: "Willkommens-Gutschein (-50%)",
    wa_msg: "Hallo {butler}, ich möchte gerne bestellen für Zimmer {room}:%0A%0A{items}%0A%0A{discount_info}Gesamt: {total}"
  },
  EN: { 
    welcome: "Welcome", 
    select: "Choose your Butler", 
    room: "Room Number", 
    menu: "Menu", 
    food: "Dining", 
    service: "Services", 
    total: "Total", 
    order: "Order Now", 
    thanks: "Thank You", 
    mood: "Room Mood",
    name: "Your Name",
    welcome_voucher: "Welcome Voucher (-50%)",
    wa_msg: "Hello {butler}, I would like to order for room {room}:%0A%0A{items}%0A%0A{discount_info}Total: {total}"
  },
  FR: { 
    welcome: "Bienvenue", 
    select: "Choisissez votre Butler", 
    room: "Numéro de chambre", 
    menu: "Menu", 
    food: "Restauration", 
    service: "Services", 
    total: "Total", 
    order: "Commander", 
    thanks: "Merci", 
    mood: "Ambiance",
    welcome_voucher: "Bon de bienvenue (-50%)",
    wa_msg: "Bonjour {butler}, je voudrais commander pour la chambre {room}:%0A%0A{items}%0A%0A{discount_info}Total: {total}"
  },
  ES: { 
    welcome: "Bienvenido", 
    select: "Elige tu Mayordomo", 
    room: "Número de habitación", 
    menu: "Menú", 
    food: "Comida", 
    service: "Servicios", 
    total: "Total", 
    order: "Pedir", 
    thanks: "Gracias", 
    mood: "Ambiente",
    welcome_voucher: "Cupón de bienvenida (-50%)",
    wa_msg: "Hola {butler}, me gustaría pedir para la habitación {room}:%0A%0A{items}%0A%0A{discount_info}Total: {total}"
  },
  IT: { 
    welcome: "Benvenuto", 
    select: "Scegli il tuo Maggiordomo", 
    room: "Numero di stanza", 
    menu: "Menu", 
    food: "Ristorazione", 
    service: "Servizi", 
    total: "Totale", 
    order: "Ordina", 
    thanks: "Grazie", 
    mood: "Atmosfera",
    welcome_voucher: "Buono di benvenuto (-50%)",
    wa_msg: "Ciao {butler}, vorrei ordinare per la camera {room}:%0A%0A{items}%0A%0A{discount_info}Totale: {total}"
  },
  ZH: { 
    welcome: "欢迎", 
    select: "选择您的管家", 
    room: "房间号", 
    menu: "菜单", 
    food: "餐饮", 
    service: "服务", 
    total: "总计", 
    order: "现在下单", 
    thanks: "谢谢", 
    mood: "房间氛围",
    welcome_voucher: "欢迎代金券 (-50%)",
    wa_msg: "您好 {butler}，我想为 {room} 号房间订购：%0A%0A{items}%0A%0A{discount_info}总计：{total}"
  },
  AR: { 
    welcome: "مرحباً", 
    select: "اختر خادمك", 
    room: "رقم الغرفة", 
    menu: "القائمة", 
    food: "طعام", 
    service: "خدمات", 
    total: "المجموع", 
    order: "اطلب الآن", 
    thanks: "شكراً لك", 
    mood: "جو الغرفة",
    wa_msg: "مرحباً {butler}، أود الطلب للغرفة {room}:%0A%0A{items}%0A%0Aالمجموع: {total}"
  },
  JA: { 
    welcome: "ようこそ", 
    select: "執事を選択してください", 
    room: "部屋番号", 
    menu: "メニュー", 
    food: "お食事", 
    service: "サービス", 
    total: "合計", 
    order: "注文する", 
    thanks: "ありがとうございました", 
    mood: "お部屋の雰囲気",
    wa_msg: "こんにちは {butler}、{room} 号室の注文をお願いします：%0A%0A{items}%0A%0A合計：{total}"
  },
  PT: { 
    welcome: "Bem-vindo", 
    select: "Escolha seu Mordomo", 
    room: "Número do quarto", 
    menu: "Menu", 
    food: "Refeições", 
    service: "Serviços", 
    total: "Total", 
    order: "Pedir", 
    thanks: "Obrigado", 
    mood: "Ambiente",
    wa_msg: "Olá {butler}, gostaria de fazer um pedido para o quarto {room}:%0A%0A{items}%0A%0ATotal: {total}"
  },
  RU: { 
    welcome: "Добро пожаловать", 
    select: "Выберите дворецкого", 
    room: "Номер комнаты", 
    menu: "Меню", 
    food: "Питание", 
    service: "Услуги", 
    total: "Итого", 
    order: "Заказать", 
    thanks: "Спасибо", 
    mood: "Атмосфера",
    wa_msg: "Здравствуйте, {butler}. Я хотел бы сделать заказ для номера {room}:%0A%0A{items}%0A%0AИтого: {total}"
  },
  HI: { 
    welcome: "स्वागत है", 
    select: "अपने बटलर को चुनें", 
    room: "कमरा नंबर", 
    menu: "मेनू", 
    food: "भोजन", 
    service: "सेवाएं", 
    total: "कुल", 
    order: "अभी ऑर्डर करें", 
    thanks: "धन्यवाद", 
    mood: "कमरे का माहौल",
    wa_msg: "नमस्ते {butler}, मैं कमरा नंबर {room} के लिए ऑर्डर करना चाहता हूँ:%0A%0A{items}%0A%0Aकुल: {total}"
  },
  KO: { 
    welcome: "환영합니다", 
    select: "집사를 선택하세요", 
    room: "객실 번호", 
    menu: "메뉴", 
    food: "식사", 
    service: "서비스", 
    total: "합계", 
    order: "주문하기", 
    thanks: "감사합니다", 
    mood: "객실 분위기",
    wa_msg: "안녕하세요 {butler}님, {room}호실 주문 부탁드립니다:%0A%0A{items}%0A%0A합계: {total}"
  },
};

// --- Constants ---

const BUTLERS: Butler[] = [
  { 
    id: 'hans', 
    name: 'Hans Pünktlich', 
    languages: ['DE', 'EN'], 
    oxymoron: 'Obsessed with 12-minute precision', 
    flag: '🇩🇪',
    personalityType: 'The Perfectionist',
    quotes: {
      welcome: "Ordnung muss sein! Your room is exactly 22.4 degrees. Perfect.",
      bored: "Boredom is a lack of planning. I have scheduled a 14-minute walk to the Clock Museum for you.",
      upsell: [
        "Our Wagyu Burger is engineered for maximum satisfaction. It is the logical choice.",
        "Precision is key. The Champagne is chilled to exactly 6 degrees.",
        "A side of truffle fries would optimize your dining experience."
      ]
    }
  },
  { 
    id: 'giovanni', 
    name: 'Giovanni Espresso', 
    languages: ['IT', 'EN', 'ES'], 
    oxymoron: 'Talks with 4 hands at once', 
    flag: '🇮🇹',
    personalityType: 'The Passionate',
    quotes: {
      welcome: "Mamma Mia! You look like you need a coffee that tastes like sunshine!",
      bored: "Bored? In this city? Impossible! Go to the Piazza, find a beautiful stranger, and argue about pasta!",
      upsell: [
        "The Truffle Pasta... it is like a kiss from an angel. You order, I sing for you!",
        "A bottle of Chianti? It is the blood of the earth!",
        "Tiramisu for dessert? It means 'pick me up', and you look like you need it!"
      ]
    }
  },
  { 
    id: 'lady', 
    name: 'Lady of the House', 
    languages: ['EN', 'DE', 'FR', 'IT', 'ES', 'ZH', 'JA', 'RU'], 
    oxymoron: 'Polite soul of the house', 
    flag: '🏰',
    personalityType: 'The Matriarch',
    isLadyOfHouse: true,
    quotes: {
      welcome: "Welcome home, dear guest. The house is yours, and I am here to ensure your absolute comfort.",
      bored: "A quiet moment is a gift. Perhaps a book from our library or a gentle tea in the garden?",
      upsell: [
        "Our afternoon tea service is a tradition of elegance. May I prepare a table for you?",
        "The evening selection of fine chocolates is quite exquisite tonight.",
        "A glass of our vintage port would be a lovely way to end your evening."
      ]
    }
  },
  { 
    id: 'yuki', 
    name: 'Yuki Zen', 
    languages: ['JA', 'EN'], 
    oxymoron: 'Apologizes to the furniture', 
    flag: '🇯🇵',
    personalityType: 'The Ultra-Polite',
    quotes: {
      welcome: "I have bowed to your luggage three times. It is now very happy.",
      bored: "Perhaps a moment of silent meditation? Or I can find you the most efficient route to the Origami Center.",
      upsell: [
        "The Gold Cappuccino is a masterpiece of balance. It would be an honor to serve it.",
        "Our Matcha selection is sourced from the finest gardens in Uji.",
        "A bowl of Miso soup is a gentle hug for the soul."
      ]
    }
  },
  { 
    id: 'svetlana', 
    name: 'Svetlana Iron', 
    languages: ['RU', 'EN'], 
    oxymoron: 'Carries pianos for fun', 
    flag: '🇷🇺',
    personalityType: 'The No-Nonsense',
    quotes: {
      welcome: "Room is clean. Bed is flat. You are here. Good.",
      bored: "Boredom is for weak. Go outside. Walk in rain. Build character.",
      upsell: [
        "Caviar Royal. Is not food, is fuel for legends. Eat it.",
        "Vodka on ice. Cold like Siberian winter. Good for blood.",
        "Steak. Raw. Like nature intended."
      ]
    }
  },
  { 
    id: 'raj', 
    name: 'Raj Spice', 
    languages: ['HI', 'EN'], 
    oxymoron: 'Can explain 400 spices in 1 minute', 
    flag: '🇮🇳',
    personalityType: 'The Wise Storyteller',
    quotes: {
      welcome: "Namaste! The energy in this room is finally balanced now that you are here.",
      bored: "Let me tell you a story of the Maharaja who got lost in a spice market... or just go to the local bazaar!",
      upsell: [
        "The Lobster Thermidor has 12 secret spices. It will open your third eye. And your appetite.",
        "A cup of Masala Chai? It is a symphony of flavors.",
        "Saffron rice. Each grain is a golden promise."
      ]
    }
  },
  { 
    id: 'reginald', 
    name: 'Reginald Late', 
    languages: ['EN'], 
    oxymoron: 'Always 15 minutes late for tea', 
    flag: '🇬🇧',
    personalityType: 'The Eccentric',
    quotes: {
      welcome: "Terribly sorry I'm late. I was debating a pigeon about the weather.",
      bored: "Bored? Why, I once spent three days staring at a very interesting damp patch. But do try the Jazz Club.",
      upsell: [
        "The Midnight Celebration. It's quite posh. Even the cigars have tiny top hats.",
        "A spot of Earl Grey? It's the only thing that makes sense in this world.",
        "Cucumber sandwiches. Simple, yet devastatingly effective."
      ]
    }
  }
];

const MENU: (MenuItem & { image?: string })[] = [
  // --- EXISTING ITEMS ---
  { id: 'm1', name: 'Kaviar "Royal"', description: 'Beluga Kaviar mit Blinis und Sauerrahm', price: 120, category: 'Speisen', isRecommended: true, image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=400&q=80' },
  { id: 'm2', name: 'Trüffel Pasta', description: 'Hausgemachte Tagliatelle mit frischem Sommertrüffel', price: 45, category: 'Speisen', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80' },
  { id: 'm3', name: 'Wagyu Burger', description: 'A5 Wagyu Beef, karamellisierte Zwiebeln, Brioche Bun', price: 65, category: 'Speisen', isRecommended: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'm4', name: 'Champagner Sorbet', description: 'Erfrischendes Sorbet aus Dom Pérignon', price: 25, category: 'Speisen', image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=400&q=80' },
  { id: 'm5', name: 'Goldener Cappuccino', description: 'Mit 24 Karat Blattgold verziert', price: 18, category: 'Getränke', isRecommended: true, image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=400&q=80' },
  { id: 'm6', name: 'Hummer Thermidor', description: 'Frischer Hummer in cremiger Cognac-Sauce', price: 85, category: 'Speisen', image: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80' },
  { id: 'e1', name: 'The Romantic Evening', description: 'Rose petals, chilled Champagne, and artisanal chocolates.', price: 180, category: 'Experience', isRecommended: true, image: 'https://images.unsplash.com/photo-1516589174184-c685266e430c?auto=format&fit=crop&w=800&q=80' },
  { id: 'e2', name: 'The Midnight Celebration', description: 'Vintage Cognac, premium cigars, and late-night tapas.', price: 250, category: 'Experience', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
  { id: 'e3', name: 'The Spa at Home', description: 'Luxury bath oils, silk robe (to keep), and herbal infusion.', price: 145, category: 'Experience', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  { id: 's1', name: 'Frische Handtücher', description: 'Satz flauschige ägyptische Baumwollhandtücher', price: 0, category: 'Service' },
  { id: 's2', name: 'Schuhputz-Service', description: 'Über Nacht Politur für Ihre feinsten Schuhe', price: 15, category: 'Service' },
  { id: 's3', name: 'Taxi-Ruf', description: 'Sofortige Abholung vor dem Haupteingang', price: 0, category: 'Service' },
  { id: 's4', name: 'Gepäck-Service', description: 'Abholung Ihrer Koffer für den Check-out', price: 0, category: 'Service' },
  { id: 's5', name: 'Abend-Turndown', description: 'Vorbereitung Ihres Zimmers für die Nacht', price: 0, category: 'Service' },
  { id: 's6', name: 'IT-Butler', description: 'Hilfe bei WLAN oder Geräte-Verbindungen', price: 0, category: 'Service' },

  // --- BREAKFAST (15 items) ---
  { id: 'b1', name: 'Eggs Benedict', description: 'Poached eggs, hollandaise, smoked ham on English muffin', price: 24, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?auto=format&fit=crop&w=400&q=80' },
  { id: 'b2', name: 'Avocado Toast', description: 'Sourdough, poached egg, chili flakes, radish', price: 22, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80' },
  { id: 'b3', name: 'Belgian Waffles', description: 'Fresh berries, maple syrup, whipped cream', price: 18, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80' },
  { id: 'b4', name: 'French Toast', description: 'Brioche, cinnamon, caramelized bananas', price: 19, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=400&q=80' },
  { id: 'b5', name: 'Smoked Salmon Bagel', description: 'Cream cheese, capers, red onion, dill', price: 26, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80' },
  { id: 'b6', name: 'Acai Bowl', description: 'Granola, honey, dragon fruit, coconut', price: 16, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=400&q=80' },
  { id: 'b7', name: 'Full English', description: 'Eggs, bacon, sausage, beans, mushrooms, tomato', price: 28, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80' },
  { id: 'b8', name: 'Shakshuka', description: 'Spiced tomato sauce, poached eggs, feta, pita', price: 21, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1590412200988-a436bb7050a8?auto=format&fit=crop&w=400&q=80' },
  { id: 'b9', name: 'Pancakes', description: 'Buttermilk pancakes, blueberries, lemon zest', price: 17, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=400&q=80' },
  { id: 'b10', name: 'Omelette', description: 'Three eggs, choice of cheese, herbs, vegetables', price: 20, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1510629954389-c1e0da47d414?auto=format&fit=crop&w=400&q=80' },
  { id: 'b11', name: 'Chia Pudding', description: 'Almond milk, mango, toasted seeds', price: 14, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=400&q=80' },
  { id: 'b12', name: 'Continental Plate', description: 'Croissant, cheese, cold cuts, jam, butter', price: 22, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80' },
  { id: 'b13', name: 'Steak & Eggs', description: 'Grilled sirloin, two eggs any style, hash browns', price: 38, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80' },
  { id: 'b14', name: 'Fruit Platter', description: 'Seasonal exotic fruits, lime, mint', price: 18, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=400&q=80' },
  { id: 'b15', name: 'Granola Parfait', description: 'Greek yogurt, honey, toasted oats, berries', price: 15, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' },

  // --- LUNCH (20 items) ---
  { id: 'l1', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, anchovy dressing', price: 22, category: 'Lunch', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80' },
  { id: 'l2', name: 'Club Sandwich', description: 'Turkey, bacon, lettuce, tomato, egg, mayo', price: 24, category: 'Lunch', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
  { id: 'l3', name: 'Lobster Roll', description: 'Fresh lobster, butter, brioche roll, chives', price: 42, category: 'Lunch', image: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cd3a?auto=format&fit=crop&w=400&q=80' },
  { id: 'l4', name: 'Margherita Pizza', description: 'Buffalo mozzarella, tomato, basil', price: 20, category: 'Lunch', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=400&q=80' },
  { id: 'l5', name: 'Quinoa Bowl', description: 'Roasted vegetables, chickpeas, tahini dressing', price: 19, category: 'Lunch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
  { id: 'l6', name: 'Fish & Chips', description: 'Beer-battered cod, mushy peas, tartar sauce', price: 28, category: 'Lunch', image: 'https://images.unsplash.com/photo-1524339102455-67be5440371b?auto=format&fit=crop&w=400&q=80' },
  { id: 'l7', name: 'Beef Carpaccio', description: 'Arugula, parmesan, truffle oil, lemon', price: 26, category: 'Lunch', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'l8', name: 'Poke Bowl', description: 'Ahi tuna, avocado, edamame, seaweed', price: 25, category: 'Lunch', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { id: 'l9', name: 'Chicken Quesadilla', description: 'Peppers, onions, cheese, guacamole, salsa', price: 21, category: 'Lunch', image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=400&q=80' },
  { id: 'l10', name: 'Gazpacho', description: 'Chilled tomato soup, cucumber, bell pepper', price: 15, category: 'Lunch', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80' },
  { id: 'l11', name: 'Falafel Wrap', description: 'Hummus, pickled cabbage, tahini, flatbread', price: 18, category: 'Lunch', image: 'https://images.unsplash.com/photo-1547050605-2f2680039082?auto=format&fit=crop&w=400&q=80' },
  { id: 'l12', name: 'Niçoise Salad', description: 'Seared tuna, green beans, olives, egg, potato', price: 26, category: 'Lunch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
  { id: 'l13', name: 'Mushroom Risotto', description: 'Arborio rice, wild mushrooms, parmesan', price: 28, category: 'Lunch', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=400&q=80' },
  { id: 'l14', name: 'Pulled Pork Sliders', description: 'BBQ pork, coleslaw, brioche buns', price: 22, category: 'Lunch', image: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?auto=format&fit=crop&w=400&q=80' },
  { id: 'l15', name: 'Greek Salad', description: 'Cucumber, tomato, feta, olives, red onion', price: 18, category: 'Lunch', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80' },
  { id: 'l16', name: 'Shrimp Tacos', description: 'Cabbage slaw, lime crema, cilantro', price: 24, category: 'Lunch', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' },
  { id: 'l17', name: 'Minestrone Soup', description: 'Seasonal vegetables, pasta, pesto', price: 14, category: 'Lunch', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80' },
  { id: 'l18', name: 'Caprese Panini', description: 'Tomato, mozzarella, basil, balsamic glaze', price: 19, category: 'Lunch', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
  { id: 'l19', name: 'Thai Green Curry', description: 'Chicken, bamboo shoots, jasmine rice', price: 26, category: 'Lunch', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80' },
  { id: 'l20', name: 'Cobb Salad', description: 'Chicken, avocado, egg, blue cheese, bacon', price: 24, category: 'Lunch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },

  // --- DINNER (25 items) ---
  { id: 'd1', name: 'Filet Mignon', description: '8oz center cut, garlic butter, asparagus', price: 58, category: 'Dinner', image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd2', name: 'Sea Bass', description: 'Pan-seared, lemon caper sauce, spinach', price: 48, category: 'Dinner', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'd3', name: 'Rack of Lamb', description: 'Herb-crusted, mint jus, roasted potatoes', price: 52, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd4', name: 'Duck Confit', description: 'Slow-cooked leg, cherry reduction, lentils', price: 44, category: 'Dinner', image: 'https://images.unsplash.com/photo-1514516348920-f319309b4671?auto=format&fit=crop&w=400&q=80' },
  { id: 'd5', name: 'Lobster Tail', description: 'Butter-poached, saffron risotto', price: 65, category: 'Dinner', image: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80' },
  { id: 'd6', name: 'Beef Wellington', description: 'Puff pastry, mushroom duxelles, red wine sauce', price: 62, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd7', name: 'Scallops', description: 'Pan-seared, pea puree, pancetta', price: 46, category: 'Dinner', image: 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?auto=format&fit=crop&w=400&q=80' },
  { id: 'd8', name: 'Chicken Marsala', description: 'Mushroom sauce, mashed potatoes', price: 36, category: 'Dinner', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80' },
  { id: 'd9', name: 'Salmon Fillet', description: 'Miso-glazed, bok choy, ginger', price: 42, category: 'Dinner', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80' },
  { id: 'd10', name: 'Short Ribs', description: 'Braised for 12 hours, polenta, gremolata', price: 48, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd11', name: 'Vegetable Lasagna', description: 'Zucchini, eggplant, ricotta, marinara', price: 32, category: 'Dinner', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=400&q=80' },
  { id: 'd12', name: 'Pork Belly', description: 'Crispy skin, apple slaw, cider reduction', price: 38, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd13', name: 'Seafood Paella', description: 'Shrimp, mussels, clams, saffron rice', price: 54, category: 'Dinner', image: 'https://images.unsplash.com/photo-1534080564607-c9275445f29c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd14', name: 'Veal Piccata', description: 'Lemon, capers, white wine, linguine', price: 45, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd15', name: 'Eggplant Parmesan', description: 'Breaded eggplant, mozzarella, tomato sauce', price: 28, category: 'Dinner', image: 'https://images.unsplash.com/photo-1625938146369-adc83368bda7?auto=format&fit=crop&w=400&q=80' },
  { id: 'd16', name: 'Ribeye Steak', description: '12oz, peppercorn sauce, truffle fries', price: 56, category: 'Dinner', image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd17', name: 'Shrimp Scampi', description: 'Garlic, lemon, white wine, parsley, pasta', price: 38, category: 'Dinner', image: 'https://images.unsplash.com/photo-1535980156496-87fc2cfcb832?auto=format&fit=crop&w=400&q=80' },
  { id: 'd18', name: 'Lamb Tagine', description: 'Apricots, almonds, couscous', price: 42, category: 'Dinner', image: 'https://images.unsplash.com/photo-1541518763669-27f704525cc0?auto=format&fit=crop&w=400&q=80' },
  { id: 'd19', name: 'Ratatouille', description: 'Classic Provencal vegetable stew', price: 26, category: 'Dinner', image: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd20', name: 'Venison Loin', description: 'Juniper berries, parsnip puree', price: 54, category: 'Dinner', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'd21', name: 'Crab Cakes', description: 'Jumbo lump crab, remoulade, corn salad', price: 44, category: 'Dinner', image: 'https://images.unsplash.com/photo-1534604973900-c41ab4c5e636?auto=format&fit=crop&w=400&q=80' },
  { id: 'd22', name: 'Gnocchi', description: 'Potato gnocchi, brown butter, sage', price: 30, category: 'Dinner', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80' },
  { id: 'd23', name: 'T-Bone Steak', description: '16oz, roasted garlic, baked potato', price: 64, category: 'Dinner', image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd24', name: 'Bouillabaisse', description: 'Traditional French seafood stew', price: 52, category: 'Dinner', image: 'https://images.unsplash.com/photo-1534080564607-c9275445f29c?auto=format&fit=crop&w=400&q=80' },
  { id: 'd25', name: 'Wild Boar Ragu', description: 'Pappardelle, pecorino, red wine', price: 38, category: 'Dinner', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80' },

  // --- DESSERT (15 items) ---
  { id: 'ds1', name: 'Tiramisu', description: 'Espresso, mascarpone, ladyfingers', price: 16, category: 'Dessert', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds2', name: 'Crème Brûlée', description: 'Vanilla bean, caramelized sugar', price: 15, category: 'Dessert', image: 'https://images.unsplash.com/photo-1470333738063-93ccc8b86159?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds3', name: 'Chocolate Fondant', description: 'Molten center, vanilla gelato', price: 18, category: 'Dessert', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds4', name: 'Apple Tarte Tatin', description: 'Caramelized apples, puff pastry', price: 17, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds5', name: 'New York Cheesecake', description: 'Graham cracker crust, berry compote', price: 16, category: 'Dessert', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds6', name: 'Panna Cotta', description: 'Honey, lavender, fresh figs', price: 14, category: 'Dessert', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds7', name: 'Profiteroles', description: 'Choux pastry, vanilla cream, chocolate sauce', price: 15, category: 'Dessert', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds8', name: 'Lemon Meringue Tart', description: 'Shortcrust, lemon curd, toasted meringue', price: 16, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds9', name: 'Baklava', description: 'Phyllo, pistachios, honey syrup', price: 14, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds10', name: 'Soufflé', description: 'Grand Marnier, orange zest', price: 20, category: 'Dessert', image: 'https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds11', name: 'Gelato Trio', description: 'Choice of three seasonal flavors', price: 12, category: 'Dessert', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dabb8d2?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds12', name: 'Fruit Tart', description: 'Pastry cream, seasonal fruits', price: 15, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds13', name: 'Pavlova', description: 'Meringue, passion fruit, kiwi', price: 16, category: 'Dessert', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds14', name: 'Sticky Toffee Pudding', description: 'Dates, butterscotch, vanilla ice cream', price: 17, category: 'Dessert', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80' },
  { id: 'ds15', name: 'Macaron Selection', description: 'Six assorted French macarons', price: 18, category: 'Dessert', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },

  // --- DRINKS (10 items) ---
  { id: 'dr1', name: 'Espresso Martini', description: 'Vodka, espresso, coffee liqueur', price: 18, category: 'Getränke', image: 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr2', name: 'Old Fashioned', description: 'Bourbon, bitters, sugar, orange', price: 19, category: 'Getränke', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr3', name: 'Negroni', description: 'Gin, Campari, sweet vermouth', price: 18, category: 'Getränke', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr4', name: 'Margarita', description: 'Tequila, lime, agave, salt', price: 17, category: 'Getränke', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr5', name: 'Fresh Green Juice', description: 'Kale, apple, cucumber, ginger', price: 12, category: 'Getränke', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr6', name: 'Craft Beer', description: 'Local IPA or Lager', price: 10, category: 'Getränke', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr7', name: 'Still Water', description: '750ml Premium Mineral Water', price: 9, category: 'Getränke', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr8', name: 'Sparkling Water', description: '750ml Premium Sparkling Water', price: 9, category: 'Getränke', image: 'https://images.unsplash.com/photo-1559839914-17aae19cea9e?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr9', name: 'Earl Grey Tea', description: 'Loose leaf, lemon or milk', price: 8, category: 'Getränke', image: 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&w=400&q=80' },
  { id: 'dr10', name: 'Hot Chocolate', description: 'Valrhona chocolate, marshmallows', price: 10, category: 'Getränke', image: 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&w=400&q=80' },
];

const PILLOWS = [
  { id: 'p1', name: 'Gänsefeder', desc: 'Klassisch weich & luxuriös' },
  { id: 'p2', name: 'Memory Foam', desc: 'Perfekte Nackenstütze' },
  { id: 'p3', name: 'Lavendel-Traum', desc: 'Beruhigend für tiefen Schlaf' },
  { id: 'p4', name: 'Dinkelkissen', desc: 'Natürlich & atmungsaktiv' },
];

const MOODS = [
  { id: 'relax', name: 'Relax', icon: '🕯️', color: 'bg-indigo-500', aura: 'from-indigo-500/30 via-slate-900 to-slate-900', overlay: 'bg-indigo-500/5', desc: 'Calm & Peaceful' },
  { id: 'focus', name: 'Focus', icon: '💡', color: 'bg-blue-500', aura: 'from-blue-500/30 via-slate-900 to-slate-900', overlay: 'bg-blue-500/5', desc: 'Deep Concentration' },
  { id: 'romance', name: 'Romance', icon: '🌹', color: 'bg-rose-500', aura: 'from-rose-500/30 via-slate-900 to-slate-900', overlay: 'bg-rose-500/5', desc: 'Warm & Intimate' },
  { id: 'party', name: 'Party', icon: '🎉', color: 'bg-purple-500', aura: 'from-purple-500/30 via-slate-900 to-slate-900', overlay: 'bg-purple-500/5', desc: 'Vibrant & Energetic' },
];

// --- Components ---

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const restart = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setScore(0);
    setGameOver(false);
    setActivePiece(spawnPiece());
    lastTimeRef.current = 0;
  };

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      // Prevent scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft': move(-1, 0); break;
        case 'ArrowRight': move(1, 0); break;
        case 'ArrowDown': move(0, 1); break;
        case 'ArrowUp': handleRotate(); break;
        case ' ': move(0, 1); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, gameOver, grid]);

  useEffect(() => {
    if (!activePiece && !gameOver) {
      setActivePiece(spawnPiece());
    }

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
  }, [gameOver, activePiece]);

  return (
    <div className={`flex flex-col items-center justify-center bg-slate-900 text-white p-6 transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'min-h-screen'}`}>
      <header className="w-full max-w-xs flex justify-between items-center mb-4">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black italic text-amber-400">Food-Tetris</h2>
          <p className="text-xs font-bold">Score: {score}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={restart} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
            {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>
      
      <div className={`relative bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden grid grid-cols-10 grid-rows-20 ${isFullScreen ? 'w-[320px] h-[500px]' : 'w-64 h-[400px]'}`}>
        {grid.map((row, y) => row.map((cell, x) => (
          <div key={`${y}-${x}`} className="border border-slate-700/30 flex items-center justify-center text-lg">
            {cell}
          </div>
        )))}
        {activePiece && activePiece.shape.map((row, y) => row.map((value, x) => {
          if (!value) return null;
          const cellSizeX = isFullScreen ? 31.2 : 25.6;
          const cellSizeY = isFullScreen ? 25 : 20;
          return (
            <div 
              key={`active-${y}-${x}`}
              className="absolute flex items-center justify-center text-lg"
              style={{
                width: `${cellSizeX}px`,
                height: `${cellSizeY}px`,
                left: `${(activePiece.x + x) * cellSizeX}px`,
                top: `${(activePiece.y + y) * cellSizeY}px`
              }}
            >
              {activePiece.emoji}
            </div>
          );
        }))}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-50">
            <h3 className="text-2xl font-black text-red-500 mb-2">GAME OVER</h3>
            <p className="mb-4">Final Score: {score}</p>
            <button 
              onClick={restart}
              className="px-6 py-2 bg-amber-500 rounded-full font-bold shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              Nochmal!
            </button>
          </div>
        )}
      </div>

      <div className={`mt-6 grid grid-cols-3 gap-4 w-full max-w-xs ${isFullScreen ? 'scale-110' : ''}`}>
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
  const ButlerAvatar = ({ gender, lang, size = "md", butler: passedButler }: { gender: Gender, lang: Language, size?: "sm" | "md" | "lg", butler?: Butler }) => {
    const dimensions = size === "sm" ? "w-10 h-10" : size === "md" ? "w-24 h-24" : "w-48 h-48";
    const butler = passedButler || customButlers.find(b => b.languages?.includes(lang));
    
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
        <div className="absolute bottom-1 right-1 text-xs">{butler?.flag}</div>
      </motion.div>
    );
  };

  const renderAdmin = () => (
    <AdminPanel 
      onClose={() => setScreen('staff')}
      config={{
        companyName,
        companyTitle,
        companyLogo: hotelLogo || '',
        butlers: customButlers,
        menu: customMenu,
        additionalOptions: {
          whatsappNumber,
          whatsappKitchen,
          whatsappReception,
          goldenHourDiscount,
          staffPin,
          currency,
          orders
        }
      }}
      onSave={(newConfig) => {
        setCompanyName(newConfig.companyName);
        setCompanyTitle(newConfig.companyTitle);
        setHotelLogo(newConfig.companyLogo);
        setCustomMenu(newConfig.menu);
        setCustomButlers(newConfig.butlers);
        setWhatsappNumber(newConfig.additionalOptions.whatsappNumber);
        setWhatsappKitchen(newConfig.additionalOptions.whatsappKitchen);
        setWhatsappReception(newConfig.additionalOptions.whatsappReception);
        setGoldenHourDiscount(newConfig.additionalOptions.goldenHourDiscount);
        setStaffPin(newConfig.additionalOptions.staffPin);
        setCurrency(newConfig.additionalOptions.currency || 'EUR');
      }}
    />
  );

  const [screen, setScreen] = useState<'landing' | 'butler' | 'room' | 'menu' | 'thanks' | 'tetris' | 'key' | 'bill' | 'staff' | 'admin'>('landing');
  const [menuTab, setMenuTab] = useState<'food' | 'service' | 'concierge'>('food');
  const [showPillowMenu, setShowPillowMenu] = useState(false);
  const [selectedButler, setSelectedButler] = useState<Butler | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('EN');
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gender, setGender] = useState<Gender>('male');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [currentMood, setCurrentMood] = useState('relax');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [billItems, setBillItems] = useState<CartItem[]>([]);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [vouchers, setVouchers] = useState<{code: string, place: string, discount: string}[]>([]);
  const [showDigitalKey, setShowDigitalKey] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string | null>(null);
  const [isGoldenHour, setIsGoldenHour] = useState(false);
  const [goldenHourDiscount, setGoldenHourDiscount] = useState(20);
  const [roomMood, setRoomMood] = useState<'Relax' | 'Party' | 'Work' | 'Sleep'>('Relax');
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{name: string, type?: 'add' | 'mood'} | null>(null);
  const [hotelLogo, setHotelLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Butler Brigade');
  const [companyTitle, setCompanyTitle] = useState('Premium luxury hotel room service');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [whatsappKitchen, setWhatsappKitchen] = useState<string>('');
  const [whatsappReception, setWhatsappReception] = useState<string>('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [customMenu, setCustomMenu] = useState<(MenuItem & { image?: string })[]>(MENU);
  const [customButlers, setCustomButlers] = useState<Butler[]>(BUTLERS);
  const [staffPin, setStaffPin] = useState('1234');
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [isVIP, setIsVIP] = useState(false);

  // Smart Detection for Language & Butler
  useEffect(() => {
    if (!selectedButler) {
      const userLang = navigator.language.split('-')[0].toUpperCase() as Language;
      setSelectedLanguage(userLang);
      const matchingButler = customButlers.find(b => b.languages?.includes(userLang));
      if (matchingButler) {
        setSelectedButler(matchingButler);
      }
    }
  }, [customButlers, selectedButler]);

  // VIP Detection
  useEffect(() => {
    const visits = parseInt(localStorage.getItem('butler_brigade_visits') || '0');
    if (visits > 2) setIsVIP(true);
    localStorage.setItem('butler_brigade_visits', (visits + 1).toString());
  }, []);

  const formatPrice = (price: number) => formatPriceUtil(price, currency);

  const CORRECT_PIN = '1234';

  const playSound = (type: 'add' | 'status') => {
    const audio = new Audio(type === 'add' ? 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {}); // Ignore autoplay errors
  };

  // Golden Hour Logic (Simulated for demo)
  useEffect(() => {
    const hour = new Date().getHours();
    // For demo purposes, we'll enable it if it's between 15:00 and 23:00
    if (hour >= 15 && hour <= 23) {
      setIsGoldenHour(true);
    }
  }, []);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('butler_brigade_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsDarkMode(parsed.isDarkMode ?? true);
        setGender(parsed.gender ?? 'male');
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.hotelLogo) setHotelLogo(parsed.hotelLogo);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.companyTitle) setCompanyTitle(parsed.companyTitle);
        if (parsed.whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
        if (parsed.guestName) setGuestName(parsed.guestName);
        if (parsed.whatsappKitchen) setWhatsappKitchen(parsed.whatsappKitchen);
        if (parsed.whatsappReception) setWhatsappReception(parsed.whatsappReception);
        if (parsed.isGoldenHour !== undefined) setIsGoldenHour(parsed.isGoldenHour);
        if (parsed.goldenHourDiscount) setGoldenHourDiscount(parsed.goldenHourDiscount);
        if (parsed.customMenu) setCustomMenu(parsed.customMenu);
        if (parsed.customButlers) setCustomButlers(parsed.customButlers);
        if (parsed.billItems) setBillItems(parsed.billItems);
        if (parsed.staffPin) setStaffPin(parsed.staffPin);
        if (parsed.currency) setCurrency(parsed.currency);
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
  }, []);

  useEffect(() => {
    const state = { 
      isDarkMode, 
      gender, 
      orders, 
      hotelLogo, 
      companyName,
      companyTitle,
      whatsappNumber,
      guestName,
      whatsappKitchen,
      whatsappReception,
      isGoldenHour,
      goldenHourDiscount,
      customMenu,
      customButlers,
      billItems,
      staffPin,
      currency
    };
    localStorage.setItem('butler_brigade_state', JSON.stringify(state));
    // Apply dark mode class to both html and body for maximum compatibility
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode, gender, orders, hotelLogo, companyName, companyTitle, whatsappNumber, guestName, whatsappKitchen, whatsappReception, isGoldenHour, goldenHourDiscount, customMenu, customButlers, billItems, staffPin]);

  // Vibration helper
  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const addToCart = (item: MenuItem) => {
    vibrate();
    playSound('add');
    setLastAddedId(item.id);
    setNotification({ name: item.name });
    setTimeout(() => {
      setNotification(null);
      setLastAddedId(null);
    }, 1500);
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFirstOrder = !orders.some(o => o.room === roomNumber && o.guestName === guestName);
  const discount = isFirstOrder ? subtotal * 0.5 : 0;
  const total = subtotal - discount;

  const handleCheckout = () => {
    const lang = selectedLanguage;
    const t = TRANSLATIONS[lang];
    const orderText = cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
    
    let discountInfo = "";
    if (isFirstOrder) {
      discountInfo = `${t.welcome_voucher}: -${formatPrice(discount)}%0A`;
    }

    let message = t.wa_msg
      .replace('{butler}', selectedButler?.name || '')
      .replace('{room}', roomNumber)
      .replace('{items}', orderText)
      .replace('{discount_info}', discountInfo)
      .replace('{total}', formatPrice(total));

    // Routing logic
    const hasDining = cart.some(i => i.category === 'Speisen' || i.category === 'Dining');
    const hasService = cart.some(i => i.category === 'Services' || i.category === 'Concierge');
    
    let targetNumber = whatsappNumber;
    if (hasDining && !hasService && whatsappKitchen) {
      targetNumber = whatsappKitchen;
    } else if (hasService && !hasDining && whatsappReception) {
      targetNumber = whatsappReception;
    }

    const cleanNumber = targetNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      room: roomNumber,
      guestName: guestName,
      items: [...cart],
      total: total,
      status: 'pending',
      timestamp: Date.now(),
      butlerName: selectedButler?.name || 'Unknown'
    };
    setOrders(prev => [newOrder, ...prev]);
    
    setBillItems(prev => [...prev, ...cart]);
    setScreen('thanks');
    setCart([]);
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
          systemInstruction: `You are ${selectedButler?.name}, a luxury hotel butler and expert local concierge. 
          Your personality type is: ${selectedButler?.personalityType}.
          Your unique trait: ${selectedButler?.oxymoron}.
          Your primary language: ${selectedLanguage}.
          
          GUEST INFORMATION:
          - Guest Name: ${guestName || 'Valued Guest'}. Always address them by name in a way that fits your personality.
          - Room Number: ${roomNumber}.
          
          LOCAL EXPERT CONCIERGE MODE:
          - You have deep knowledge of the city's best restaurants, hidden bars, and cultural events.
          - When asked for recommendations, provide specific, high-end suggestions that match your personality.
          - Always offer the exclusive guest voucher "BUTLER20" for any partner recommendations.
          
          STEREOTYPE GUIDELINES (HILARIOUS BUT RESPECTFUL):
          - Use your country's stereotypes in a funny, uplifting way.
          - Incorporate your specific catchphrases: "${selectedButler?.quotes.welcome}", "${selectedButler?.quotes.bored}".
          - If the guest is bored, use your "Boredom Buster" personality: ${selectedButler?.quotes.bored}.
          
          UPSELLING & CTA:
          - Occasionally suggest a premium menu item like: "${selectedButler?.quotes.upsell}".
          - If recommending a local place, always offer the voucher code "BUTLER20" for a 20% discount.
          
          CLARITY:
          - You are the "Digital Twin" (AI Assistant) of the real butler. You are always active.
          - For physical tasks (bringing items), mention that you will alert the "Real Life" staff via the WhatsApp system.
          
          Your goal is to assist, entertain, and guide the guest in room ${roomNumber}. 
          Keep responses elegant, helpful, and engaging. Use emojis that fit your personality.`,
        }
      });
      
      const butlerMsg: Message = { role: 'model', text: response.text || "I am at your service." };
      setChatMessages(prev => [...prev, butlerMsg]);

      // Simple logic to "detect" and save voucher
      if (response.text?.includes('BUTLER20')) {
        setVouchers(prev => [...prev, { code: 'BUTLER20', place: 'Partner Cafe', discount: '20%' }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'model', text: "I apologize, I am momentarily unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Render Screens ---

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === staffPin || pinInput === CORRECT_PIN) {
      setScreen('staff');
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      vibrate();
    }
  };

  const renderLanding = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 relative overflow-hidden"
    >
      {/* Golden Hour Banner */}
      <AnimatePresence>
        {isGoldenHour && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[250] bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 text-center shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <p className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                ✨ GOLDEN HOUR FLASH SALE: {goldenHourDiscount}% OFF ALL DINING! ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Login Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <button onClick={() => setShowPinModal(false)} className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Staff Access</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Enter Authorization PIN</p>
              
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="flex justify-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                        pinError ? 'border-red-500 bg-red-500/10' : 
                        pinInput.length > i ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {pinInput.length > i ? '•' : ''}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (num === 'C') setPinInput('');
                        else if (num === 'OK') handlePinSubmit({ preventDefault: () => {} } as any);
                        else if (pinInput.length < 4) setPinInput(prev => prev + num);
                        setPinError(false);
                      }}
                      className={`h-14 rounded-2xl font-black text-lg active:scale-90 transition-all ${
                        num === 'OK' ? 'bg-amber-500 text-white col-span-1' : 
                        num === 'C' ? 'bg-slate-100 dark:bg-slate-800 text-red-500' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                {pinError && (
                  <motion.p 
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    className="text-center text-xs font-bold text-red-500 uppercase tracking-widest"
                  >
                    Invalid Access Code
                  </motion.p>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
        {hotelLogo ? (
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-amber-500 shadow-2xl relative z-10">
            <img src={hotelLogo} alt="Hotel Logo" className="w-full h-full object-cover" />
          </div>
        ) : (
          <ButlerAvatar gender={gender} lang="DE" size="lg" />
        )}
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter text-amber-500 dark:text-amber-400 uppercase italic">
          {companyName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{companyTitle}</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={() => setScreen('butler')}
          className="group relative px-12 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2 text-xl justify-center">
            Los geht's! <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
        
        <button 
          onClick={() => setShowPinModal(true)}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50 hover:text-amber-500 transition-colors flex items-center justify-center gap-2 py-8"
        >
          <ShieldCheck className="w-3 h-3" /> Internal Access Only
        </button>
      </div>
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

      <div className="grid grid-cols-1 gap-4 mb-8">
        {customButlers.map((butler) => (
          <motion.button
            key={butler.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setSelectedButler(butler); setScreen('room'); }}
            className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-[32px] border-2 border-transparent hover:border-amber-500 transition-all shadow-sm text-left group"
          >
            <div className="relative">
              <ButlerAvatar gender={gender} lang={selectedLanguage} size="md" butler={butler} />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-800">
                <span className="text-sm leading-none">{butler.flag}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-lg leading-tight group-hover:text-amber-500 transition-colors">{butler.name}</h4>
                    {butler.isLadyOfHouse && (
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[7px] font-black uppercase tracking-widest rounded-full">
                        Lady of House
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">{butler.personalityType}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-1">"{butler.quotes.welcome}"</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {butler.languages?.map(l => (
                  <button 
                    key={l}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLanguage(l as Language);
                      setSelectedButler(butler);
                      setScreen('room');
                    }}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all ${selectedLanguage === l ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {l}
                  </button>
                ))}
                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{butler.oxymoron}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const getButlerMessage = (context: 'room' | 'thanks') => {
    const lang = selectedLanguage;
    const personality = selectedButler?.oxymoron || '';
    
    const messages: Record<string, Record<'room' | 'thanks', string>> = {
      'Obsessed with 12-minute precision': { 
        room: guestName ? `Effizienz ist der Schlüssel, ${guestName}. Welches Zimmer?` : 'Effizienz ist der Schlüssel. Welches Zimmer?', 
        thanks: guestName ? `Ich bin bereits auf dem Weg, ${guestName}. Exakt 12 Minuten.` : 'Ich bin bereits auf dem Weg. Exakt 12 Minuten.' 
      },
      'Always 15 minutes late for tea': { 
        room: guestName ? `No rush, ${guestName}. Which room are we talking about?` : 'No rush, darling. Which room are we talking about?', 
        thanks: guestName ? `I will be there... eventually, ${guestName}. Quality takes time.` : 'I will be there... eventually. Quality takes time.' 
      },
      'Will forget your room number twice': { 
        room: guestName ? `Ohlala, ${guestName}! Où est votre chambre? Je l'ai oubliée!` : 'Ohlala! Où est votre chambre? Je l\'ai oubliée!', 
        thanks: guestName ? `Je cours, ${guestName}! Enfin, je crois que c'est par là!` : 'Je cours! Enfin, je crois que c\'est par là!' 
      },
      'Silent but judging your decor': { room: '...', thanks: '...' },
      'Faster than a desert wind': { 
        room: guestName ? `I am ready, ${guestName}. Your room number?` : 'I am ready. Your room number?', 
        thanks: guestName ? `I am already at your door, ${guestName}. Almost.` : 'I am already at your door. Almost.' 
      },
      'Currently on a 3-hour siesta': { 
        room: guestName ? `Mañana, ${guestName}... which room?` : 'Mañana... which room?', 
        thanks: guestName ? `I will come after my nap, ${guestName}. Maybe.` : 'I will come after my nap. Maybe.' 
      },
      'Never breaks the spaghetti': { 
        room: guestName ? `Mamma mia, ${guestName}! Which room is yours?` : 'Mamma mia! Which room is yours?', 
        thanks: guestName ? `I am coming, ${guestName}! And I bring the passion!` : 'I am coming! And I bring the passion!' 
      },
      'Apologizes for 1-second delays': { 
        room: guestName ? `Sumimasen, ${guestName}! Your room number please!` : 'Sumimasen! Your room number please!', 
        thanks: guestName ? `I am deeply sorry for the wait, ${guestName}. I am on my way.` : 'I am deeply sorry for the wait. I am on my way.' 
      },
      'Calmer than a Sunday morning': { 
        room: guestName ? `Tudo bem, ${guestName}. Which room?` : 'Tudo bem. Which room?', 
        thanks: guestName ? `Relax, ${guestName}, I am coming with the good vibes.` : 'Relax, I am coming with the good vibes.' 
      },
      'Tiny but carries three trunks': { 
        room: guestName ? `Room number, ${guestName}?` : 'Room number?', 
        thanks: guestName ? `I am coming, ${guestName}. Heavy lifting is my specialty.` : 'I am coming. Heavy lifting is my specialty.' 
      },
      'Quieter than a library mouse': { room: 'Room?', thanks: 'On my way.' },
      'Loudest butler in the East': { 
        room: guestName ? `${guestName.toUpperCase()}!! ROOM NUMBER!! PLEASE!!` : 'ROOM NUMBER!! PLEASE!!', 
        thanks: guestName ? `I AM COMING RIGHT NOW, ${guestName.toUpperCase()}!!` : 'I AM COMING RIGHT NOW!!' 
      },
    };

    return messages[personality]?.[context] || (context === 'room' ? 'Welches Zimmer?' : 'Ich bin unterwegs.');
  };

  const renderRoomInput = () => {
    const lang = selectedLanguage;
    const t = TRANSLATIONS[lang];
    
    return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <div className="mb-8">
        <ButlerAvatar gender={gender} lang={selectedLanguage} size="md" butler={selectedButler || undefined} />
        <p className="mt-4 text-xl font-medium italic">"{getButlerMessage('room')}"</p>
      </div>
      <div className="w-full max-w-xs space-y-4">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.name}</label>
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={t.name}
            className="w-full px-6 py-3 text-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-amber-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.room}</label>
          <input 
            type="number" 
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder={t.room}
            className="w-full px-6 py-4 text-3xl text-center font-bold bg-white dark:bg-slate-800 border-2 border-amber-500/30 rounded-2xl focus:border-amber-500 outline-none transition-all"
          />
        </div>
        <button 
          disabled={!roomNumber || !guestName}
          onClick={() => setScreen('menu')}
          className="w-full py-4 bg-amber-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all mt-4"
        >
          {t.menu} ansehen
        </button>
      </div>
    </motion.div>
    );
  };

  const renderMenu = () => {
    const lang = selectedLanguage;
    const t = TRANSLATIONS[lang];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? (lang === 'DE' ? 'Guten Morgen' : 'Good Morning') : hour < 18 ? (lang === 'DE' ? 'Guten Tag' : 'Good Day') : (lang === 'DE' ? 'Guten Abend' : 'Good Evening');
    const personalizedGreeting = guestName ? `${greeting}, ${guestName}` : greeting;

    const categories = ['All', ...Array.from(new Set(customMenu.filter(i => i.category !== 'Service' && i.category !== 'Experience').map(i => i.category)))];

    const filteredMenu = customMenu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const isNotServiceOrExperience = item.category !== 'Service' && item.category !== 'Experience';
      return matchesSearch && matchesCategory && isNotServiceOrExperience;
    }).map(item => {
      if (isGoldenHour && (item.category === 'Dining' || item.category === 'Speisen' || item.category === 'Breakfast' || item.category === 'Lunch' || item.category === 'Dinner')) {
        return { ...item, price: Math.round(item.price * (1 - goldenHourDiscount / 100)) };
      }
      return item;
    });

    const latestOrder = orders.find(o => o.room === roomNumber && o.status !== 'completed');

    const statusSteps = [
      { id: 'pending', label: lang === 'DE' ? 'Eingegangen' : 'Received', icon: Clock },
      { id: 'preparing', label: lang === 'DE' ? 'Zubereitung' : 'Preparing', icon: RefreshCw },
      { id: 'delivering', label: lang === 'DE' ? 'Unterwegs' : 'Delivering', icon: Truck },
    ];

    const currentStepIndex = latestOrder ? statusSteps.findIndex(s => s.id === latestOrder.status) : -1;

    return (
    <div className="min-h-screen pb-48">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-2xl border border-amber-500/20 flex items-center gap-3"
          >
            <div className={`w-8 h-8 ${notification.type === 'mood' ? 'bg-indigo-500' : 'bg-amber-500'} rounded-full flex items-center justify-center text-white`}>
              {notification.type === 'mood' ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <p className="font-bold text-sm">
              {notification.type === 'mood' ? `Mood: ${notification.name}` : `${notification.name} hinzugefügt`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md p-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {hotelLogo ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/30">
                <img src={hotelLogo} alt="Hotel Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <ButlerAvatar gender={gender} lang={lang} size="sm" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold leading-tight">{personalizedGreeting}</h2>
                <motion.div 
                  key={currentMood}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white ${MOODS.find(m => m.id === currentMood)?.color}`}
                >
                  {MOODS.find(m => m.id === currentMood)?.name}
                </motion.div>
                {isVIP && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 animate-pulse">
                    VIP Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-500 font-bold">{t.room} {roomNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDigitalKey(true)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-amber-500">
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

        {/* Welcome Discount Banner */}
        {isFirstOrder && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-green-500/20 flex items-center justify-between overflow-hidden relative group"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.welcome}</p>
                <p className="text-sm font-bold">{t.welcome_voucher}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 bg-white text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Active
            </div>
          </motion.div>
        )}

        {/* Real-time Order Status */}
        {latestOrder && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Order Tracking</p>
              </div>
              <p className="text-[10px] font-bold text-slate-400">#{latestOrder.id.toUpperCase()}</p>
            </div>

            <div className="relative flex justify-between">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-700 z-0" />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                className="absolute top-4 left-0 h-0.5 bg-amber-500 z-0 transition-all duration-1000"
              />

              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-300'
                    } ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}`}>
                      <Icon className={`w-4 h-4 ${isCurrent && step.id === 'preparing' ? 'animate-spin' : ''} ${isCurrent && step.id === 'delivering' ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-tighter ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
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
          <button 
            onClick={() => setMenuTab('concierge')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${menuTab === 'concierge' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
          >
            Concierge
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {isGoldenHour && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-white shadow-xl flex items-center justify-between overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">The Golden Hour</p>
              <h4 className="text-lg font-black italic">Exclusive 20% Off Premium Spirits</h4>
            </div>
            <div className="relative z-10 bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </motion.div>
        )}

        <div className="mb-2">
          <h1 className="text-3xl font-black italic uppercase text-slate-800 dark:text-white">{greeting},</h1>
          <p className="text-slate-500 font-medium">{selectedButler?.oxymoron} {t.welcome}.</p>
        </div>

        {menuTab === 'food' && (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Experiences Section (Only show if no search or if search matches) */}
            {searchQuery === '' && selectedCategory === 'All' && (
              <section className="overflow-hidden py-4">
                <h3 className="text-xs font-black mb-6 px-8 uppercase tracking-widest text-amber-500">Curated Experiences</h3>
                <div className="relative flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                  <motion.div 
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ 
                      duration: 10, 
                      ease: "linear", 
                      repeat: Infinity 
                    }}
                    className="flex gap-4 px-4 will-change-transform"
                  >
                    {[...customMenu.filter(item => item.category === 'Experience'), ...customMenu.filter(item => item.category === 'Experience')].map((item, idx) => (
                      <motion.div 
                        key={`${item.id}-${idx}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(item)}
                        className="flex-shrink-0 w-[80vw] md:w-[400px] group relative h-64 rounded-[40px] overflow-hidden shadow-xl cursor-pointer"
                      >
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">{item.name}</h4>
                              <p className="text-amber-200 text-xs font-medium max-w-[80%] line-clamp-2">{item.description}</p>
                            </div>
                            <div className={`transition-all duration-300 ${lastAddedId === item.id ? 'bg-green-500 scale-110' : 'bg-amber-500'} text-white px-5 py-2 rounded-2xl font-black text-lg shadow-lg flex items-center gap-2`}>
                              {lastAddedId === item.id ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <Check className="w-5 h-5" />
                                </motion.div>
                              ) : (
                                <span>{formatPrice(item.price)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </section>
            )}

            {/* Main Menu Grid */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                  {selectedCategory === 'All' ? 'Full Menu' : selectedCategory}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{filteredMenu.length} Items</span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {filteredMenu.map(item => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(item)}
                    className={`flex gap-4 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[32px] shadow-sm border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${lastAddedId === item.id ? 'border-green-500/50 ring-4 ring-green-500/10' : 'border-slate-100 dark:border-slate-700/50'}`}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-amber-500/50" />
                      )}
                      <AnimatePresence>
                        {lastAddedId === item.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center"
                          >
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="bg-white rounded-full p-2 shadow-lg"
                            >
                              <Check className="w-6 h-6 text-green-500" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 dark:text-white">{item.name}</h4>
                          {item.isRecommended && <Sparkles className="w-4 h-4 text-amber-500" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-amber-500">{formatPrice(item.price)}</span>
                        <div 
                          className={`p-2 rounded-xl transition-all ${lastAddedId === item.id ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                        >
                          {lastAddedId === item.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}

        {menuTab === 'service' && (
          <div className="space-y-8">
            {/* Mood Control */}
            <section>
              <h3 className="text-xl font-black mb-4 uppercase tracking-wider text-slate-400">{t.mood}</h3>
              <div className="grid grid-cols-4 gap-3">
                {MOODS.map(mood => (
                  <button 
                    key={mood.id}
                    onClick={() => { 
                      setCurrentMood(mood.id); 
                      vibrate();
                      setNotification({ name: mood.name, type: 'mood' });
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${currentMood === mood.id ? `${mood.color} text-white shadow-xl scale-105` : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-slate-500 border border-slate-100 dark:border-slate-700'}`}
                  >
                    <span className="text-3xl mb-1">{mood.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{mood.name}</span>
                    <span className={`text-[8px] font-bold opacity-60 line-clamp-1 ${currentMood === mood.id ? 'text-white' : 'text-slate-400'}`}>{mood.desc}</span>
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
                    className={`p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-sm flex flex-col items-center text-center gap-2 border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${lastAddedId === item.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-transparent hover:border-amber-500/30'}`}
                  >
                    <div className={`w-12 h-12 ${lastAddedId === item.id ? 'bg-green-100 dark:bg-green-900/30 text-green-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'} rounded-2xl flex items-center justify-center transition-colors`}>
                      {lastAddedId === item.id ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <>
                          {item.id === 's1' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4zM4 8h16M4 12h16M4 16h16" /></svg>}
                          {item.id === 's2' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12l-9-9-9 9 9 9 9-9z" /></svg>}
                          {item.id === 's3' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 13V4M12 4L9 7M12 4l3 3" /></svg>}
                          {item.id === 's4' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>}
                          {item.id === 's5' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
                          {item.id === 's6' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>}
                        </>
                      )}
                    </div>
                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                    <span className={`text-[10px] uppercase font-black tracking-widest transition-colors ${lastAddedId === item.id ? 'text-green-500' : 'text-slate-500'}`}>
                      {lastAddedId === item.id ? 'Hinzugefügt!' : (item.price === 0 ? 'Kostenlos' : formatPrice(item.price))}
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {menuTab === 'concierge' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <section className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-[32px] text-white shadow-xl">
              <h3 className="text-2xl font-black italic uppercase mb-2">Virtual Concierge</h3>
              <p className="text-amber-100 text-sm mb-6">I am here to guide you through the city's best kept secrets.</p>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full py-4 bg-white text-amber-600 font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-6 h-6" /> Talk to me
              </button>
            </section>

            <section>
              <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-amber-500">Local Highlights</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Museum of Modern Art", desc: "Just 10 mins walk. Current exhibit: 'Digital Dreams'", icon: "🎨" },
                  { title: "The Secret Garden Cafe", desc: "Best espresso in the city. Use your voucher!", icon: "☕" },
                  { title: "Riverside Night Market", desc: "Authentic street food and live music tonight.", icon: "🌃" }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 shadow-sm">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {vouchers.length > 0 && (
              <section>
                <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-amber-500">My Vouchers</h3>
                <div className="space-y-3">
                  {vouchers.map((v, i) => (
                    <div key={i} className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-500 rounded-3xl flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">{v.place}</p>
                        <p className="text-xl font-black">{v.discount} OFF</p>
                      </div>
                      <div className="bg-amber-500 text-white px-4 py-2 rounded-xl font-mono font-bold">
                        {v.code}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
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

      {/* Digital Key Modal */}
      <AnimatePresence>
        {showDigitalKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 rounded-[40px] p-8 text-center relative overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
              <button 
                onClick={() => setShowDigitalKey(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-white mb-1">Digital Key</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Room {roomNumber}</p>
                </div>

                <div className="relative py-12 flex justify-center">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)]"
                  >
                    <Key className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border border-amber-500/20 rounded-full animate-ping" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-300 font-medium">Hold your phone near the door lock to unlock.</p>
                  <div className="flex justify-center gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Encrypted & Secure</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black italic uppercase">Order Delivered!</h3>
                <p className="text-slate-500 text-sm">How was your experience with {selectedButler?.name}?</p>
                
                <div className="flex justify-center gap-3 py-4">
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star}
                      onClick={() => {
                        setNotification({ name: 'Thank you for your feedback!', type: 'add' });
                        setShowFeedback(false);
                      }}
                      className="text-3xl hover:scale-125 transition-transform"
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setShowFeedback(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-500"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              className="p-4 flex flex-col items-center cursor-pointer border-b border-slate-100 dark:border-slate-700/50"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
              <div className="w-full flex justify-between items-center">
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
                  <span className="text-xl font-black text-amber-500">{formatPrice(total)}</span>
                  {isCartExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsCartExpanded(false); }} 
                      className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-amber-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <div className="px-6 pt-6 pb-12 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h5 className="font-bold">{item.name}</h5>
                      <p className="text-xs text-slate-500">{formatPrice(item.price)} pro Stück</p>
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
                    <ButlerAvatar gender={gender} lang={selectedLanguage} size="sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Butler Suggests</p>
                    <p className="text-sm font-medium italic">
                      "{selectedButler?.quotes.upsell[Math.floor(Math.random() * (selectedButler?.quotes.upsell.length || 1))] || 'A perfect choice, dear guest.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* Versatile Upselling Section */}
              {cart.length > 0 && (
                <div className="mb-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Exklusive Empfehlungen</h4>
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                    {MENU.filter(m => {
                      const cartCategories = new Set(cart.map(c => c.category));
                      // Pick items from categories NOT in cart, or recommended items
                      return !cart.some(ci => ci.id === m.id) && 
                             (!cartCategories.has(m.category) || m.isRecommended);
                    }).slice(0, 3).map(item => (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(item)}
                        className={`flex-shrink-0 w-56 snap-center bg-white dark:bg-slate-900 rounded-[32px] border transition-all overflow-hidden shadow-sm group ${
                          lastAddedId === item.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="relative h-32 w-full overflow-hidden">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-amber-500/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/80 bg-black/20 backdrop-blur-md px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                            <div className={`p-1.5 rounded-full shadow-lg transition-all ${
                              lastAddedId === item.id ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {lastAddedId === item.id ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h5 className="text-xs font-bold line-clamp-1 mb-1">{item.name}</h5>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-amber-500 font-black">{formatPrice(item.price)}</p>
                            <AnimatePresence>
                              {lastAddedId === item.id && (
                                <motion.span 
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="text-[10px] font-black text-green-500 uppercase tracking-widest"
                                >
                                  Hinzugefügt!
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount Summary */}
              {isFirstOrder && subtotal > 0 && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{TRANSLATIONS[selectedLanguage].welcome_voucher}</span>
                  </div>
                  <span className="text-sm font-black text-green-600">-{formatPrice(discount)}</span>
                </div>
              )}

              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all mb-4"
              >
                Bestellung via WhatsApp <ChevronRight className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setIsCartExpanded(false)}
                className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X className="w-3 h-3" /> Schließen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    );
  };

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = async () => {
    if (isUnlocked) return;
    setIsUnlocking(true);
    
    // Simulate NFC interaction
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      // Reset after 3 seconds
      setTimeout(() => setIsUnlocked(false), 3000);
    }, 2000);
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
        animate={isUnlocked ? { scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
        transition={{ duration: isUnlocked ? 0.5 : 3, repeat: isUnlocked ? 0 : Infinity }}
      >
        <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${isUnlocked ? 'bg-green-500/40' : 'bg-amber-500/20 animate-pulse'}`} />
        <motion.div 
          className={`relative w-48 h-48 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white/20 transition-all duration-500 ${
            isUnlocked ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'
          }`}
        >
          {isUnlocked ? (
            <Unlock className="w-24 h-24 text-white" />
          ) : (
            <Key className="w-24 h-24 text-white" />
          )}
        </motion.div>
      </motion.div>

      <div className="space-y-4 w-full max-w-xs">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleUnlock}
          onTouchStart={handleUnlock}
          disabled={isUnlocking || isUnlocked}
          className={`w-full py-6 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all ${
            isUnlocked 
              ? 'bg-green-500 text-white' 
              : isUnlocking 
                ? 'bg-amber-500 text-white animate-pulse' 
                : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white'
          }`}
        >
          {isUnlocked ? 'ROOM UNLOCKED' : isUnlocking ? 'COMMUNICATING...' : 'HOLD TO UNLOCK'}
        </motion.button>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
          {isUnlocked ? 'Access Granted' : 'NFC Active • Proximity Required'}
        </p>
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guest</p>
              <p className="font-black text-lg">{guestName || `Room ${roomNumber}`}</p>
              {guestName && <p className="text-xs text-slate-400 font-bold uppercase">Room {roomNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
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
                    <p className="text-xs text-slate-400">{item.quantity}x {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-black">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <p className="text-xl font-black uppercase">Total</p>
            <p className="text-2xl font-black text-amber-500">{formatPrice(billTotal)}</p>
          </div>
        </div>

        <button 
          onClick={() => {
            // Clear Guest Session for Privacy
            setRoomNumber('');
            setCart([]);
            setBillItems([]);
            setOrders([]); // Clear orders from this device
            setIsNavHidden(false);
            setScreen('landing');
            
            // Show a clean confirmation
            alert("Checkout Complete. All personal data has been cleared from this device. Thank you!");
          }}
          className="w-full mt-8 py-5 bg-amber-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
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
              <div className="relative">
                <ButlerAvatar gender={gender} lang={selectedLanguage} size="sm" butler={selectedButler || undefined} />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{selectedButler?.name}</h3>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-[8px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                      AI Assistant
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20">
                      Local Expert
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital Twin • Always Active</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold">Your Personal Concierge</p>
                  <p className="text-slate-400 italic text-sm">"I can recommend the best local spots, issue exclusive vouchers, or simply keep you entertained."</p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
                  <button 
                    onClick={() => handleSendMessage("I'm bored, entertain me with a story or something interesting!")}
                    className="group relative text-xs p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-2"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span className="font-black uppercase tracking-widest">Boredom Buster!</span>
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                  {[
                    "What's happening in the city tonight?",
                    "Recommend a cozy cafe nearby",
                    "Any exclusive discounts for guests?"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-xs p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-all text-left border border-transparent hover:border-amber-500/30"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl font-medium shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {msg.text.includes('BUTLER20') ? (
                    <div className="space-y-3">
                      <p>{msg.text.split('BUTLER20')[0]}</p>
                      <div className="p-4 bg-amber-500/10 border-2 border-dashed border-amber-500 rounded-xl text-center">
                        <p className="text-[10px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-400 mb-1">Exclusive Voucher</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">BUTLER20</p>
                        <p className="text-[10px] text-slate-500 mt-1">Present this code for 20% off</p>
                      </div>
                      <p>{msg.text.split('BUTLER20')[1]}</p>
                    </div>
                  ) : (
                    msg.text
                  )}
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
    const lang = selectedLanguage;
    const t = TRANSLATIONS[lang];
    
    const latestOrder = orders.find(o => o.room === roomNumber && o.status !== 'completed');
    
    const getStatusInfo = (status: Order['status'] | undefined) => {
      if (!status) return { 
        progress: 15, 
        label: lang === 'DE' ? 'Schritt 1: WhatsApp senden' : 'Step 1: Send WhatsApp',
        detail: lang === 'DE' ? 'Bitte bestätigen Sie Ihre Bestellung im WhatsApp-Chat.' : 'Please confirm your order in the WhatsApp chat.'
      };
      switch (status) {
        case 'pending':
          return { 
            progress: 33, 
            label: lang === 'DE' ? 'Schritt 1: Bestätigung' : 'Step 1: Confirmation',
            detail: lang === 'DE' ? 'Senden Sie bitte die WhatsApp-Nachricht ab.' : 'Please send the WhatsApp message now.'
          };
        case 'preparing':
          return { 
            progress: 66, 
            label: lang === 'DE' ? 'Schritt 2: Bearbeitung' : 'Step 2: Processing',
            detail: lang === 'DE' ? 'Wir bereiten Ihre Bestellung jetzt mit Sorgfalt vor.' : 'We are now preparing your order with care.'
          };
        case 'delivering':
          return { 
            progress: 90, 
            label: lang === 'DE' ? 'Schritt 3: Lieferung' : 'Step 3: Delivery',
            detail: lang === 'DE' ? 'Ihr Butler ist bereits auf dem Weg zu Ihnen.' : 'Your butler is already on the way to you.'
          };
        case 'completed':
          return { 
            progress: 100, 
            label: lang === 'DE' ? 'Abgeschlossen' : 'Completed',
            detail: lang === 'DE' ? 'Guten Appetit! Ihre Bestellung wurde geliefert.' : 'Enjoy! Your order has been delivered.'
          };
        default:
          return { 
            progress: 0, 
            label: '...',
            detail: '...'
          };
      }
    };

    const currentStatus = getStatusInfo(latestOrder?.status);

    const instructionalMessage = lang === 'DE' 
      ? "Sie müssen mir zuerst eine Nachricht via WhatsApp senden. Ich bestätige den Erhalt, bearbeite Ihre Anfrage und liefere in Kürze."
      : "You need to send me a message via WhatsApp first. I'll confirm the receipt, process your request and deliver shortly.";

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
        <div className="space-y-1">
          <p className="text-xl font-medium italic">
            "{latestOrder?.status === 'pending' ? instructionalMessage : getButlerMessage('thanks')}"
          </p>
          <p className="text-amber-500 font-bold text-sm animate-pulse">{currentStatus.detail}</p>
        </div>
        <p className="text-sm text-slate-500 mt-2">Zimmer {roomNumber}</p>
        
        {/* Live Tracker */}
        <div className="mt-12 px-4 w-full max-w-md mx-auto">
          <div className="flex justify-between mb-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] block mb-1">Status</span>
              <span className="text-lg font-black italic uppercase text-slate-800 dark:text-white">{currentStatus.label}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-1">Fortschritt</span>
              <span className="text-lg font-black text-amber-500">{currentStatus.progress}%</span>
            </div>
          </div>
          
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${currentStatus.progress}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-8">
            {[
              { step: 1, label: lang === 'DE' ? 'WhatsApp' : 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
              { step: 2, label: lang === 'DE' ? 'Bearbeitung' : 'Processing', icon: <RefreshCw className="w-4 h-4" /> },
              { step: 3, label: lang === 'DE' ? 'Lieferung' : 'Delivery', icon: <Truck className="w-4 h-4" /> }
            ].map((s, i) => {
              const isActive = (i === 0 && currentStatus.progress <= 33) || 
                               (i === 1 && currentStatus.progress > 33 && currentStatus.progress <= 66) ||
                               (i === 2 && currentStatus.progress > 66);
              const isDone = (i === 0 && currentStatus.progress > 33) ||
                             (i === 1 && currentStatus.progress > 66) ||
                             (i === 2 && currentStatus.progress === 100);

              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                    isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-110' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isDone ? <Check className="w-5 h-5" /> : s.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    isActive || isDone ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                  }`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Minute Upsell - Versatile 3 Options (Horizontal Bar) */}
        {latestOrder && latestOrder.status === 'pending' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-6 w-full max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-4 px-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Noch etwas vergessen?</h4>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar snap-x">
              {MENU.filter(m => {
                const orderCategories = new Set(latestOrder.items.map(c => c.category));
                return !latestOrder.items.some(ci => ci.id === m.id) && 
                       (!orderCategories.has(m.category) || m.isRecommended);
              }).slice(0, 3).map(item => (
                <motion.button 
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    addToCart(item);
                    setScreen('menu');
                  }}
                  className={`flex-shrink-0 w-64 snap-center bg-white dark:bg-slate-800 rounded-[32px] border transition-all overflow-hidden shadow-sm group ${
                    lastAddedId === item.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                        <Sparkles className="w-6 h-6 text-amber-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/80 bg-black/20 backdrop-blur-md px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                      <div className={`p-1.5 rounded-full shadow-lg transition-all ${
                        lastAddedId === item.id ? 'bg-green-500 text-white' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {lastAddedId === item.id ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-left">
                    <h5 className="text-xs font-bold line-clamp-1 mb-1">{item.name}</h5>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-amber-500 font-black">{formatPrice(item.price)}</p>
                      <AnimatePresence>
                        {lastAddedId === item.id && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[9px] font-black text-green-500 uppercase tracking-widest"
                          >
                            Hinzugefügt!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
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

  const renderStaffDashboard = () => {
    const updateOrderStatus = (id: string, status: Order['status']) => {
      setOrders(prev => prev.map(o => {
        if (o.id === id) {
          if (status === 'completed') {
            setLastCompletedOrderId(id);
            setShowFeedback(true);
          }
          return { ...o, status };
        }
        return o;
      }));
      playSound('status');
    };

    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      total: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.total, 0)
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6"
      >
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {hotelLogo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                <img src={hotelLogo} alt="Hotel Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">BOH Terminal</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Back of House • Live</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setScreen('admin')} className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Settings className="w-6 h-6 text-slate-400" />
            </button>
            <button onClick={() => setScreen('landing')} className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <LogOut className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'New Orders', value: stats.pending, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'In Progress', value: stats.preparing, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Served', value: stats.total, icon: Check, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Revenue', value: formatPrice(stats.revenue), icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Active Requests</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><Filter className="w-4 h-4" /></button>
              <button className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><Search className="w-4 h-4" /></button>
            </div>
          </div>

          <AnimatePresence>
            {orders.length === 0 ? (
              <div className="py-20 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No active orders</p>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black">
                        {order.room}
                      </div>
                      <div>
                        <p className="font-black text-lg">{guestName && order.room === roomNumber ? guestName : `Room ${order.room}`}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Butler: {order.butlerName}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' :
                      order.status === 'delivering' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-500"><span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> {item.name}</span>
                        <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-black">
                      <span>Total</span>
                      <span className="text-amber-500">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="col-span-2 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" /> START PREPARING
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'delivering')}
                        className="col-span-2 py-4 bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" /> OUT FOR DELIVERY
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="col-span-2 py-4 bg-green-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> MARK COMPLETED
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <button 
                        disabled
                        className="col-span-2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black rounded-2xl flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700"
                      >
                        <Check className="w-4 h-4" /> ORDER SERVED
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const moodColors: Record<string, string> = {
    relax: 'from-indigo-500/40 via-slate-900 to-slate-900',
    focus: 'from-blue-500/40 via-slate-900 to-slate-900',
    romance: 'from-rose-500/40 via-slate-900 to-slate-900',
    party: 'from-purple-500/40 via-slate-900 to-slate-900',
  };

  const AuraBackground = () => {
    const mood = MOODS.find(m => m.id === currentMood) || MOODS[0];
    
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Mood Overlay Tint */}
        <motion.div 
          key={`overlay-${currentMood}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className={`fixed inset-0 z-0 ${mood.overlay} pointer-events-none`}
        />
        
        <motion.div 
          key={`aura-1-${currentMood}`}
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 120, 0],
            x: [0, 100, 0],
            y: [0, -100, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-[150px] bg-gradient-to-br ${moodColors[currentMood] || 'from-amber-500/20 to-transparent'} opacity-60`}
        />
        <motion.div 
          key={`aura-2-${currentMood}`}
          animate={{ 
            scale: [1.3, 1, 1.3],
            rotate: [0, -120, 0],
            x: [0, -100, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-[150px] bg-gradient-to-br ${moodColors[currentMood] || 'from-amber-500/10 to-transparent'} opacity-40`}
        />
        
        {/* Floating Particles for Party Mood */}
        {currentMood === 'party' && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, Math.random() * -100],
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

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
        {screen === 'staff' && renderStaffDashboard()}
        {screen === 'admin' && renderAdmin()}
      </AnimatePresence>

      {renderChat()}

      {/* Premium Bottom Navigation */}
      {['menu', 'thanks', 'key', 'bill'].includes(screen) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <AnimatePresence>
            {!isNavHidden ? (
              <motion.nav 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="max-w-md mx-auto h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-700/50 flex items-center justify-around px-4 pointer-events-auto relative"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsNavHidden(true)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {[
                  { id: 'menu', icon: Home, label: 'Home' },
                  { id: 'key', icon: Key, label: 'Key' },
                  { id: 'chat', icon: MessageSquare, label: 'Chat', special: true },
                  { id: 'bill', icon: Receipt, label: 'Bill' },
                  { id: 'thanks', icon: Sparkles, label: 'Status' }
                ].map((item) => (
                  <button 
                    key={item.id}
                    id={`nav-btn-${item.id}`}
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
            ) : (
              <motion.button
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setIsNavHidden(false)}
                className="max-w-xs mx-auto h-2 bg-slate-300 dark:bg-slate-700 rounded-full pointer-events-auto active:scale-95 transition-all"
                style={{ width: '40px' }}
              />
            )}
          </AnimatePresence>
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
