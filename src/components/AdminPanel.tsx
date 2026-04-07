import React, { useState } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  FileJson, 
  User, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  Settings as SettingsIcon,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../lib/utils';

interface Butler {
  id: string;
  name: string;
  lang: string;
  oxymoron: string;
  flag: string;
  personalityType: string;
  quotes: {
    welcome: string;
    bored: string;
    upsell: string;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

interface AdminPanelProps {
  onClose: () => void;
  config: {
    companyName: string;
    companyTitle: string;
    companyLogo: string;
    butlers: Butler[];
    menu: MenuItem[];
    additionalOptions: Record<string, any>;
  };
  onSave: (newConfig: any) => void;
}

const PREFILLED_PERSONAS = [
  {
    name: "The Perfectionist",
    oxymoron: "Obsessed with 12-minute precision",
    personalityType: "The Perfectionist",
    quotes: {
      welcome: "Ordnung muss sein! Your room is exactly 22.4 degrees. Perfect.",
      bored: "Boredom is a lack of planning. I have scheduled a 14-minute walk to the Clock Museum for you.",
      upsell: "Our Wagyu Burger is engineered for maximum satisfaction. It is the logical choice."
    }
  },
  {
    name: "The Passionate",
    oxymoron: "Talks with 4 hands at once",
    personalityType: "The Passionate",
    quotes: {
      welcome: "Mamma Mia! You look like you need a coffee that tastes like sunshine!",
      bored: "Bored? In this city? Impossible! Go to the Piazza, find a beautiful stranger, and argue about pasta!",
      upsell: "The Truffle Pasta... it is like a kiss from an angel. You order, I sing for you!"
    }
  },
  {
    name: "The Zen Master",
    oxymoron: "Apologizes to the furniture",
    personalityType: "The Ultra-Polite",
    quotes: {
      welcome: "I have bowed to your luggage three times. It is now very happy.",
      bored: "Perhaps a moment of silent meditation? Or I can find you the most efficient route to the Origami Center.",
      upsell: "The Gold Cappuccino is a masterpiece of balance. It would be an honor to serve it."
    }
  }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, config, onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'menu' | 'workers' | 'options' | 'analytics'>('general');
  const [localConfig, setLocalConfig] = useState(config);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Analytics Logic
  const currency = localConfig.additionalOptions.currency || 'EUR';
  const orders = localConfig.additionalOptions.orders || [];
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const popularItems = orders.reduce((acc: any, o: any) => {
    o.items.forEach((i: any) => {
      acc[i.name] = (acc[i.name] || 0) + i.quantity;
    });
    return acc;
  }, {});
  const topItems = Object.entries(popularItems)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  const handleSave = () => {
    setSaveStatus('saving');
    onSave(localConfig);
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setLocalConfig({ ...localConfig, menu: parsed });
        setJsonError(null);
        setJsonInput('');
      } else {
        setJsonError('JSON must be an array of menu items.');
      }
    } catch (e) {
      setJsonError('Invalid JSON format.');
    }
  };

  const updateButler = (id: string, field: string, value: any) => {
    const updatedButlers = localConfig.butlers.map(b => {
      if (b.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return { ...b, [parent]: { ...(b as any)[parent], [child]: value } };
        }
        return { ...b, [field]: value };
      }
      return b;
    });
    setLocalConfig({ ...localConfig, butlers: updatedButlers });
  };

  const applyPersonaTemplate = (butlerId: string, template: typeof PREFILLED_PERSONAS[0]) => {
    const updatedButlers = localConfig.butlers.map(b => {
      if (b.id === butlerId) {
        return { 
          ...b, 
          personalityType: template.personalityType,
          oxymoron: template.oxymoron,
          quotes: { ...template.quotes }
        };
      }
      return b;
    });
    setLocalConfig({ ...localConfig, butlers: updatedButlers });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
            <SettingsIcon size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Control Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50"
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'success' ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/20">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={<Layout size={18} />} 
            label="General Settings" 
          />
          <TabButton 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')} 
            icon={<FileJson size={18} />} 
            label="Menu & Services" 
          />
          <TabButton 
            active={activeTab === 'workers'} 
            onClick={() => setActiveTab('workers')} 
            icon={<User size={18} />} 
            label="Service Workers" 
          />
          <TabButton 
            active={activeTab === 'options'} 
            onClick={() => setActiveTab('options')} 
            icon={<SettingsIcon size={18} />} 
            label="Additional Options" 
          />
          <TabButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            icon={<Receipt size={18} />} 
            label="Business Analytics" 
          />
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl space-y-8"
              >
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Type className="text-amber-500" size={20} />
                    Branding
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                      <input 
                        type="text" 
                        value={localConfig.companyName}
                        onChange={(e) => setLocalConfig({...localConfig, companyName: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        placeholder="e.g. Butler Brigade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title / Slogan</label>
                      <input 
                        type="text" 
                        value={localConfig.companyTitle}
                        onChange={(e) => setLocalConfig({...localConfig, companyTitle: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        placeholder="e.g. Premium Room Service"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="text-amber-500" size={20} />
                    Logo & Visuals
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo URL</label>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={localConfig.companyLogo}
                          onChange={(e) => setLocalConfig({...localConfig, companyLogo: e.target.value})}
                          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          placeholder="https://example.com/logo.png"
                        />
                        {localConfig.companyLogo && (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100">
                            <img src={localConfig.companyLogo} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-8"
              >
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileJson className="text-amber-500" size={20} />
                      Import Menu (JSON)
                    </h2>
                    <span className="text-xs text-slate-500 font-mono">Current items: {localConfig.menu.length}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea 
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full h-64 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                        placeholder='[{"id": "m1", "name": "Item Name", "description": "...", "price": 10, "category": "..."}]'
                      />
                      {jsonError && (
                        <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertCircle size={16} />
                          {jsonError}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleJsonImport}
                      className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:opacity-90 transition-all active:scale-95"
                    >
                      Update Menu from JSON
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localConfig.menu.slice(0, 4).map(item => (
                      <div key={item.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                        {item.image && <img src={item.image} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                          <p className="text-sm font-bold text-amber-500 mt-1">{formatPrice(item.price, currency)}</p>
                        </div>
                      </div>
                    ))}
                    {localConfig.menu.length > 4 && (
                      <div className="col-span-full text-center py-2 text-slate-400 text-sm italic">
                        ... and {localConfig.menu.length - 4} more items
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'workers' && (
              <motion.div 
                key="workers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="text-amber-500" size={20} />
                    Service Workers & Personas
                  </h2>
                  <button 
                    onClick={() => {
                      const newId = Math.random().toString(36).substr(2, 9);
                      setLocalConfig({
                        ...localConfig,
                        butlers: [...localConfig.butlers, {
                          id: newId,
                          name: "New Worker",
                          lang: "EN",
                          oxymoron: "New Trait",
                          flag: "🌐",
                          personalityType: "The Professional",
                          quotes: { welcome: "Hello!", bored: "How can I help?", upsell: "Try this!" }
                        }]
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus size={16} /> Add Worker
                  </button>
                </div>

                <div className="space-y-6">
                  {localConfig.butlers.map((butler) => (
                    <div key={butler.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-2xl">
                            {butler.flag}
                          </div>
                          <div>
                            <input 
                              type="text" 
                              value={butler.name}
                              onChange={(e) => updateButler(butler.id, 'name', e.target.value)}
                              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 outline-none transition-all px-1"
                            />
                            <p className="text-xs text-slate-500 px-1">ID: {butler.id}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setLocalConfig({
                              ...localConfig,
                              butlers: localConfig.butlers.filter(b => b.id !== butler.id)
                            });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Personality Type</label>
                            <input 
                              type="text" 
                              value={butler.personalityType}
                              onChange={(e) => updateButler(butler.id, 'personalityType', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unique Trait (Oxymoron)</label>
                            <input 
                              type="text" 
                              value={butler.oxymoron}
                              onChange={(e) => updateButler(butler.id, 'oxymoron', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Language Code / Flag</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={butler.lang}
                                onChange={(e) => updateButler(butler.id, 'lang', e.target.value)}
                                className="w-16 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                                placeholder="EN"
                              />
                              <input 
                                type="text" 
                                value={butler.flag}
                                onChange={(e) => updateButler(butler.id, 'flag', e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                                placeholder="🇺🇸"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quick Templates</label>
                            <div className="flex flex-wrap gap-2">
                              {PREFILLED_PERSONAS.map((p, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => applyPersonaTemplate(butler.id, p)}
                                  className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors"
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Welcome Quote</label>
                            <textarea 
                              value={butler.quotes.welcome}
                              onChange={(e) => updateButler(butler.id, 'quotes.welcome', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm h-16 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Upsell Quote</label>
                            <textarea 
                              value={butler.quotes.upsell}
                              onChange={(e) => updateButler(butler.id, 'quotes.upsell', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm h-16 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'options' && (
              <motion.div 
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl space-y-8"
              >
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <SettingsIcon className="text-amber-500" size={20} />
                    App Configuration
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Golden Hour Discount</h4>
                        <p className="text-xs text-slate-500">Enable automated happy hour pricing</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={localConfig.additionalOptions.goldenHourDiscount || 20}
                          onChange={(e) => setLocalConfig({
                            ...localConfig, 
                            additionalOptions: { ...localConfig.additionalOptions, goldenHourDiscount: parseInt(e.target.value) }
                          })}
                          className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center"
                        />
                        <span className="text-sm font-bold">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Currency</h4>
                        <p className="text-xs text-slate-500">Select display currency</p>
                      </div>
                      <select 
                        value={localConfig.additionalOptions.currency || 'EUR'}
                        onChange={(e) => setLocalConfig({
                          ...localConfig, 
                          additionalOptions: { ...localConfig.additionalOptions, currency: e.target.value }
                        })}
                        className="w-32 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CHF">CHF (Fr.)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">WhatsApp (General)</h4>
                        <p className="text-xs text-slate-500">Default order notifications</p>
                      </div>
                      <input 
                        type="text" 
                        value={localConfig.additionalOptions.whatsappNumber || ''}
                        onChange={(e) => setLocalConfig({
                          ...localConfig, 
                          additionalOptions: { ...localConfig.additionalOptions, whatsappNumber: e.target.value }
                        })}
                        className="w-48 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        placeholder="+49123456789"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">WhatsApp (Kitchen)</h4>
                        <p className="text-xs text-slate-500">For food orders</p>
                      </div>
                      <input 
                        type="text" 
                        value={localConfig.additionalOptions.whatsappKitchen || ''}
                        onChange={(e) => setLocalConfig({
                          ...localConfig, 
                          additionalOptions: { ...localConfig.additionalOptions, whatsappKitchen: e.target.value }
                        })}
                        className="w-48 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        placeholder="+49123456789"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">WhatsApp (Reception)</h4>
                        <p className="text-xs text-slate-500">For concierge services</p>
                      </div>
                      <input 
                        type="text" 
                        value={localConfig.additionalOptions.whatsappReception || ''}
                        onChange={(e) => setLocalConfig({
                          ...localConfig, 
                          additionalOptions: { ...localConfig.additionalOptions, whatsappReception: e.target.value }
                        })}
                        className="w-48 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        placeholder="+49123456789"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Staff PIN</h4>
                        <p className="text-xs text-slate-500">Access code for staff areas</p>
                      </div>
                      <input 
                        type="text" 
                        value={localConfig.additionalOptions.staffPin || '1234'}
                        onChange={(e) => setLocalConfig({
                          ...localConfig, 
                          additionalOptions: { ...localConfig.additionalOptions, staffPin: e.target.value }
                        })}
                        className="w-24 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center font-mono"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </section>

                <section className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl">
                  <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Data Storage
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mb-4">
                    All changes are stored locally in your browser's <strong>localStorage</strong>. 
                    Clearing browser data will reset these settings to defaults.
                  </p>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all settings to factory defaults?')) {
                        localStorage.removeItem('butler_brigade_state');
                        window.location.reload();
                      }
                    }}
                    className="text-xs font-bold text-red-600 dark:text-red-400 underline hover:no-underline"
                  >
                    Reset to Defaults
                  </button>
                </section>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-3xl font-black text-amber-500">{formatPrice(totalRevenue, currency)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {totalOrders > 0 ? formatPrice(totalRevenue / totalOrders, currency) : formatPrice(0, currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                      <Sparkles className="text-amber-500" size={18} />
                      Top Selling Items
                    </h3>
                    <div className="space-y-4">
                      {topItems.length > 0 ? topItems.map(([name, count]: any, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                            <span className="text-sm font-medium">{name}</span>
                          </div>
                          <span className="text-sm font-bold text-amber-500">{count}x</span>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400 italic py-4">No data available yet.</p>
                      )}
                    </div>
                  </section>

                  <section className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                      <Clock className="text-amber-500" size={18} />
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {orders.slice(-5).reverse().map((order: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-bold">Room {order.room}</p>
                            <p className="text-[10px] text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <span className="font-bold text-green-500">+{formatPrice(order.total, currency)}</span>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <p className="text-sm text-slate-400 italic py-4">No recent activity.</p>
                      )}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);
