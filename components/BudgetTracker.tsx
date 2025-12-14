import React, { useState } from 'react';
import { BudgetTransaction } from '../types';
import { Plus, Wallet, TrendingDown, TrendingUp, Settings, Trash2, Edit2, X, Check, Calendar, RefreshCw, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DEFAULT_CATEGORIES, COLORS } from '../constants';
import useLocalStorage from '../hooks/useLocalStorage';

interface BudgetTrackerProps {
  transactions: BudgetTransaction[];
  setTransactions: (t: BudgetTransaction[]) => void;
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ transactions, setTransactions }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Category Management State
  const [categories, setCategories] = useLocalStorage<string[]>('budget_categories', DEFAULT_CATEGORIES);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  const handleSaveTransaction = () => {
    if (!amount || !category || !date) return;

    if (editingTransactionId) {
      // Update existing
      const updatedTransactions = transactions.map(t => 
        t.id === editingTransactionId 
          ? { ...t, amount: parseFloat(amount), category, type, date, description } 
          : t
      );
      setTransactions(updatedTransactions);
      setEditingTransactionId(null);
    } else {
      // Add new
      const newTrans: BudgetTransaction = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        category,
        type,
        date: date,
        description: description
      };
      setTransactions([newTrans, ...transactions]);
    }
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const handleEditTransaction = (t: BudgetTransaction) => {
    setEditingTransactionId(t.id);
    setAmount(t.amount.toString());
    
    // If category was deleted, ensure it's temporarily available or select first default
    if (!categories.includes(t.category)) {
        setCategories([...categories, t.category]);
    }
    setCategory(t.category);
    
    setType(t.type);
    setDate(t.date);
    setDescription(t.description || '');
    setShowCategoryManager(false); // Ensure form is visible
  };

  const handleCancelEdit = () => {
    setEditingTransactionId(null);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    // Reset to default category if needed, or keep last selected
    if (categories.length > 0) setCategory(categories[0]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    if (editingTransactionId === id) {
      handleCancelEdit();
    }
  };

  const handleAddCategory = () => {
    if (newCategoryInput.trim()) {
      const trimmed = newCategoryInput.trim();
      if (!categories.includes(trimmed)) {
        setCategories([...categories, trimmed]);
        setCategory(trimmed); // Auto select new category
      }
      setNewCategoryInput('');
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const newCats = categories.filter(c => c !== catToDelete);
    setCategories(newCats);
    if (category === catToDelete) {
        if (newCats.length > 0) setCategory(newCats[0]);
        else setCategory('');
    }
  };

  const startEditingCategory = (index: number) => {
    setEditingIndex(index);
    setEditInputValue(categories[index]);
  };

  const saveEditCategory = (index: number) => {
    const trimmed = editInputValue.trim();
    if (trimmed) {
      const oldName = categories[index];
      
      // Update categories list
      const newCategories = [...categories];
      newCategories[index] = trimmed;
      setCategories(newCategories);

      // Update transactions with old category name to keep consistency
      if (oldName !== trimmed) {
        const updatedTransactions = transactions.map(t => 
          t.category === oldName ? { ...t, category: trimmed } : t
        );
        setTransactions(updatedTransactions);
      }

      if (category === oldName) setCategory(trimmed);
    }
    setEditingIndex(null);
    setEditInputValue('');
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const csvRows = [headers.join(',')];

    for (const t of transactions) {
      const row = [
        t.date,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `budget_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const expenseData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(a => a.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats & Add */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h2 className="text-slate-400 text-sm font-medium mb-1">Total Balance</h2>
          <div className="text-4xl font-bold text-white mb-6">₹{balance.toLocaleString('en-IN')}</div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center text-green-400 text-sm mb-1">
                    <TrendingUp size={16} className="mr-1" /> Income
                </div>
                <div className="text-lg font-semibold">₹{income}</div>
             </div>
             <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center text-red-400 text-sm mb-1">
                    <TrendingDown size={16} className="mr-1" /> Expense
                </div>
                <div className="text-lg font-semibold">₹{expense}</div>
             </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{showCategoryManager ? 'Manage Categories' : (editingTransactionId ? 'Edit Transaction' : 'Add Transaction')}</h3>
            {!editingTransactionId && (
              <button 
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Manage Categories"
              >
                {showCategoryManager ? <X size={18} /> : <Settings size={18} />}
              </button>
            )}
          </div>

          {showCategoryManager ? (
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newCategoryInput} 
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="New Category..." 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {categories.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 group">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          type="text" 
                          value={editInputValue}
                          onChange={(e) => setEditInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditCategory(index)}
                          className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={() => saveEditCategory(index)} className="text-green-400 hover:text-green-300"><Check size={16} /></button>
                        <button onClick={() => setEditingIndex(null)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-slate-300">{cat}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditingCategory(index)} className="p-1 text-slate-400 hover:text-blue-400"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
               <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
                  <button onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}>Expense</button>
                  <button onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'income' ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>Income</button>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-slate-500" />
                      </div>
                      <input 
                          type="date" 
                          value={date} 
                          onChange={(e) => setDate(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-blue-500 [color-scheme:dark]" 
                      />
                   </div>
                   <input 
                      type="number" 
                      placeholder="Amount" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" 
                   />
               </div>

               <input 
                  type="text" 
                  placeholder="Description (e.g. Lunch with friends)" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" 
               />
               
               <div className="relative">
                 <select 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 appearance-none text-slate-200"
                 >
                   <option value="" disabled>Select Category</option>
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                 </div>
               </div>

               <div className="flex gap-2">
                 <button onClick={handleSaveTransaction} className={`flex-1 ${editingTransactionId ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium`}>
                   {editingTransactionId ? <RefreshCw size={18} /> : <Plus size={18} />} 
                   {editingTransactionId ? 'Update' : 'Add'}
                 </button>
                 
                 {editingTransactionId && (
                   <button onClick={handleCancelEdit} className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center">
                     <X size={18} />
                   </button>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* History & Chart */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h3 className="font-bold mb-4">Spending Breakdown</h3>
             {expenseData.length > 0 ? (
               <>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                             {expenseData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-wrap gap-3 justify-center mt-2">
                     {expenseData.map((e: any, i: number) => (
                         <div key={e.name} className="flex items-center text-xs text-slate-400">
                            <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            {e.name}
                         </div>
                     ))}
                 </div>
               </>
             ) : (
               <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                 No expenses recorded yet.
               </div>
             )}
         </div>

         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Recent Transactions</h3>
              <button 
                onClick={handleExportCSV}
                disabled={transactions.length === 0}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to CSV"
              >
                <Download size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-2 custom-scrollbar">
                {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border border-slate-700/50 group ${editingTransactionId === t.id ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-slate-900/50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <Wallet size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-sm">{t.category}</div>
                                {t.description && <div className="text-xs text-slate-400 italic line-clamp-1">{t.description}</div>}
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Calendar size={12} />
                                    {t.date}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                               {t.type === 'income' ? '+' : '-'} ₹{t.amount}
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditTransaction(t)} 
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)} 
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                    </div>
                )) : (
                  <div className="text-center text-slate-500 text-sm mt-10">
                    No transactions found.
                  </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default BudgetTracker;