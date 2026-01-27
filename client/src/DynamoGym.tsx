
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * DynamoGym ERP - Version 51.0
 * النظام المحاسبي المتكامل - إدارة النادي الرياضي الاحترافية
 */

const getEnv = () => {
  try { return (import.meta as any).env || {}; } catch (e) { return {}; }
};

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const isConfigValid = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.startsWith('http');
const supabase = isConfigValid ? createClient(supabaseUrl, supabaseAnonKey) : null;

// دالة فحص اتصال قاعدة البيانات
const requireSupabase = () => {
  if (!supabase) {
    alert('⚠️ قاعدة البيانات غير متصلة!\n\nيرجى تكوين Supabase أولاً لتفعيل هذه الميزة.\n\nأضف متغيرات البيئة:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
};

// بيانات تجريبية للعرض
const DEMO_MEMBERS: Member[] = [
  { id: 'demo-1', name: 'أحمد محمد', phone: '0501234567', subscription_plan: 'شهر واحد', plan_price: 130, discount: 0, total_debt: 0, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], weight: 75, height: 175, photo: null, status: 'active', created_at: new Date().toISOString() },
  { id: 'demo-2', name: 'محمد علي', phone: '0509876543', subscription_plan: '3 شهور', plan_price: 350, discount: 50, total_debt: 100, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0], weight: 80, height: 180, photo: null, status: 'active', created_at: new Date().toISOString() },
  { id: 'demo-3', name: 'خالد سعيد', phone: '0551112222', subscription_plan: 'شهرين', plan_price: 240, discount: 0, total_debt: 50, start_date: new Date(Date.now() - 60*24*60*60*1000).toISOString().split('T')[0], end_date: new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0], weight: 70, height: 170, photo: null, status: 'frozen', created_at: new Date().toISOString() }
];

const DEMO_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'بروتين واي', quantity: 25, sale_price: 150, barcode: '6281100000001' },
  { id: 'prod-2', name: 'كرياتين', quantity: 30, sale_price: 80, barcode: '6281100000002' },
  { id: 'prod-3', name: 'شيكر', quantity: 50, sale_price: 25, barcode: '6281100000003' },
  { id: 'prod-4', name: 'قفازات تدريب', quantity: 20, sale_price: 45, barcode: '6281100000004' }
];

const DEMO_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'عبدالله الشمري', phone: '0551234567', job_title: 'مدرب كمال أجسام', salary: 4000 },
  { id: 'emp-2', name: 'فهد العتيبي', phone: '0559876543', job_title: 'موظف استقبال', salary: 3000 }
];

const DEMO_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'شركة المكملات الغذائية', phone: '0112223344', category: 'مكملات', total_debt: 500 },
  { id: 'sup-2', name: 'مؤسسة الأجهزة الرياضية', phone: '0115556666', category: 'أجهزة', total_debt: 0 }
];

const DEMO_TRANSACTIONS: TransactionRecord[] = [
  { id: 'trans-1', type: 'MEMBERSHIP', amount: 130, discount: 0, label: 'اشتراك: أحمد محمد', metadata: { member_id: 'demo-1' }, created_at: new Date().toISOString() },
  { id: 'trans-2', type: 'SALE', amount: 175, discount: 0, label: 'مبيعات نقدية', metadata: {}, created_at: new Date().toISOString() },
  { id: 'trans-3', type: 'EXPENSE', amount: 500, discount: 0, label: 'إيجار الشهر', metadata: { category: 'إيجار' }, created_at: new Date().toISOString() },
  { id: 'trans-4', type: 'EXPENSE', amount: 150, discount: 0, label: 'فاتورة الكهرباء', metadata: { category: 'كهرباء' }, created_at: new Date().toISOString() },
  { id: 'trans-5', type: 'PURCHASE', amount: 1000, discount: 0, label: 'شراء مكملات', metadata: { supplier_id: 'sup-1' }, created_at: new Date().toISOString() }
];

// --- دالات مساعدة ---
const getWhatsAppLink = (phone: string) => `https://wa.me/${phone?.replace(/[^0-9]/g, '')}`;
const handleAutoSelect = (e: any) => e.target.select();
const formatNum = (num: number) => Number(num || 0).toFixed(2);

const getDaysRemaining = (endDate: string) => {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// --- الثوابت ---
const PLANS = [
  { label: 'شهر واحد', months: 1, defaultPrice: 130, color: 'primary' },
  { label: 'شهرين', months: 2, defaultPrice: 240, color: 'success' },
  { label: '3 شهور', months: 3, defaultPrice: 350, color: 'info' },
  { label: '6 شهور', months: 6, defaultPrice: 600, color: 'warning' },
  { label: 'سنة كاملة', months: 12, defaultPrice: 1100, color: 'danger' }
];

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const YEARS = [2024, 2025, 2026, 2027];
const JOB_TITLES = ['مدرب كمال أجسام', 'مدرب لياقة', 'موظف استقبال', 'إداري', 'عامل بار', 'عامل نظافة'];

// --- الواجهات ---
interface Member {
  id: string; name: string; phone: string; subscription_plan: string; plan_price: number; 
  discount: number; total_debt: number; start_date: string; end_date: string; 
  weight: number | null; height: number | null; photo: string | null; status: 'active' | 'frozen';
  created_at: string;
}

interface Customer {
  id: string; full_name: string; phone_number: string; total_debt: number;
}

interface Product {
  id: string; name: string; quantity: number; sale_price: number; barcode?: string;
}

interface Supplier {
  id: string; name: string; phone: string; category: string; total_debt: number;
}

interface Employee {
  id: string; name: string; phone: string; job_title: string; salary: number;
}

interface TransactionRecord {
  id: string; type: 'MEMBERSHIP' | 'PURCHASE' | 'SALE' | 'EXPENSE' | 'DEBT_PAYMENT' | 'SUPPLIER_PAYMENT' | 'ADVANCE' | 'SALARY_PAYMENT' | 'PERSONAL_WITHDRAWAL' | 'OPENING_BALANCE';
  amount: number; discount: number; label: string; metadata: any; created_at: string;
}

const DynamoGymApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('dynamogym_auth') === 'true');
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubLogo, setClubLogo] = useState<string | null>(localStorage.getItem('dynamogym_logo'));

  // حالات البيانات الأساسية
  const [members, setMembers] = useState<Member[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // الفلاتر
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // نماذج الإدخال
  const [memberForm, setMemberForm] = useState({ id:'', name:'', phone:'', plan:'شهر واحد', price:'130', discount:'0', paid:'0', start:new Date().toISOString().split('T')[0], weight:'', height:'', photo:'', mode:'CASH', isRenew: false, isEditOnly: false });
  const [productForm, setProductForm] = useState({ id:'', name:'', price:'0', barcode:'' });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<'inventory'|'pos'|'purchase'|null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [employeeForm, setEmployeeForm] = useState({ id:'', name:'', phone:'', job:'مدرب لياقة', salary:'0' });
  const [supplierForm, setSupplierForm] = useState({ id:'', name:'', phone:'', category:'' });
  const [passForm, setPassForm] = useState({ old: '', newP: '', conf: '' });
  const [expenseForm, setExpenseForm] = useState({ id: '', label: '', amount: '0', category: 'عامة' });

  // السلال
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posForm, setPosForm] = useState({ personId: '', discount: '0', paid: '0', mode: 'CASH' as 'CASH' | 'CREDIT' });
  const [purchaseCart, setPurchaseCart] = useState<any[]>([]);
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', discount: '0', paid: '0', mode: 'CASH' as 'CASH' | 'CREDIT', editId: '' });

  // النوافذ المنبثقة
  const [memberDetails, setMemberDetails] = useState<Member | null>(null);
  const [repayingPerson, setRepayingPerson] = useState<any | null>(null);
  const [statementPerson, setStatementPerson] = useState<any | null>(null);

  const navigateTo = (v: string) => { setView(v); setSidebarOpen(false); setSearchTerm(''); };

  const fetchData = useCallback(async () => {
    if (!supabase) {
      // تحميل البيانات التجريبية في وضع العرض
      setMembers(DEMO_MEMBERS);
      setInventory(DEMO_PRODUCTS);
      setEmployees(DEMO_EMPLOYEES);
      setSuppliers(DEMO_SUPPLIERS);
      setTransactions(DEMO_TRANSACTIONS);
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [m, c, i, s, e, t] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('full_name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('employees').select('*').order('name'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false })
      ]);
      if(m.data) setMembers(m.data);
      if(c.data) setCustomers(c.data);
      if(i.data) {
        setInventory(i.data);
        // Debug: show products with barcodes
        const withBarcodes = i.data.filter((p: Product) => p.barcode);
        console.log('📦 Products loaded:', i.data.length, '| With barcodes:', withBarcodes.length);
        if(withBarcodes.length > 0) {
          console.table(withBarcodes.map((p: Product) => ({name: p.name, barcode: p.barcode})));
        } else {
          console.warn('⚠️ No products have barcodes! Make sure the barcode column exists in Supabase.');
        }
      }
      if(s.data) setSuppliers(s.data);
      if(e.data) setEmployees(e.data);
      if(t.data) setTransactions(t.data);
    } catch (err) { console.error("Fetch data error:", err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if(isLoggedIn) fetchData(); }, [isLoggedIn, fetchData]);

  const handleLogout = () => { 
    localStorage.removeItem('dynamogym_auth'); 
    setIsLoggedIn(false); 
    setLoginForm({user:'', pass:''}); 
    setView('dashboard');
  };

  // --- ماسح الباركود بالكاميرا ---
  const startBarcodeScanner = useCallback(async (context: 'inventory'|'pos'|'purchase') => {
    setShowBarcodeScanner(context);
    setTimeout(async () => {
      try {
        const scannerId = 'barcode-scanner-container';
        if (scannerRef.current) {
          try { await scannerRef.current.stop(); } catch(e) {}
        }
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (decodedText) => {
            handleBarcodeScanned(decodedText, context);
            stopBarcodeScanner();
          },
          () => {}
        );
      } catch (err: any) {
        alert('خطأ في تشغيل الكاميرا: ' + err.message);
        setShowBarcodeScanner(null);
      }
    }, 300);
  }, []);

  const stopBarcodeScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch(e) {}
      scannerRef.current = null;
    }
    setShowBarcodeScanner(null);
  }, []);

  const handleBarcodeScanned = useCallback((barcode: string, context: 'inventory'|'pos'|'purchase') => {
    // البحث بالباركود - تجاهل المسافات والأحرف الزائدة
    const cleanBarcode = barcode.trim();
    const product = inventory.find(p => p.barcode && p.barcode.trim() === cleanBarcode);
    
    console.log('Barcode scanned:', cleanBarcode, 'Context:', context, 'Found product:', product?.name || 'NONE');
    console.log('Products with barcodes:', inventory.filter(p => p.barcode).map(p => ({name: p.name, barcode: p.barcode})));
    
    if (context === 'inventory') {
      if (product) {
        setProductForm({ id: product.id, name: product.name, price: String(product.sale_price), barcode: product.barcode || '' });
        alert(`✅ تم العثور على: ${product.name}`);
      } else {
        setProductForm({ id: '', name: '', price: '0', barcode: cleanBarcode });
        alert(`📦 باركود جديد: ${cleanBarcode}\nأدخل اسم الصنف والسعر ثم اضغط حفظ`);
      }
    } else if (context === 'pos') {
      if (product) {
        if (product.quantity <= 0) { alert(`⚠️ ${product.name} - الكمية صفر!`); return; }
        const ex = posCart.find(i => i.product.id === product.id);
        if (ex) setPosCart(posCart.map(i => i.product.id === product.id ? {...i, qty: i.qty+1} : i));
        else setPosCart([...posCart, {product, qty: 1}]);
        // لا نحتاج alert عند الإضافة للسلة - الصنف يظهر في السلة
      } else { 
        alert(`❌ الباركود: ${cleanBarcode}\nغير موجود في المخزون!\n\nاذهب لصفحة المخزون أولاً وأضف الصنف مع هذا الباركود`); 
      }
    } else if (context === 'purchase') {
      if (product) {
        const ex = purchaseCart.find(i => i.product.id === product.id);
        if (ex) setPurchaseCart(purchaseCart.map(i => i.product.id === product.id ? {...i, qty: i.qty+1} : i));
        else setPurchaseCart([...purchaseCart, {product, qty: 1, cost: 0}]);
      } else { 
        alert(`❌ الباركود: ${cleanBarcode}\nغير موجود في المخزون!\n\nاذهب لصفحة المخزون أولاً وأضف الصنف مع هذا الباركود`); 
      }
    }
  }, [inventory, posCart, purchaseCart]);

  // --- حسابات الربط المالي للموظفين ---
  const getEmployeeBalance = useCallback((empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return 0;
    
    // الديون المرتبطة بالموظف (كلاعب أو مشتريات)
    const linkedDebts = [...members, ...customers]
      .filter(p => (p.name || (p as any).full_name) === emp.name || (p.phone || (p as any).phone_number) === emp.phone)
      .reduce((s, p) => s + (p.total_debt || 0), 0);

    const relatedTrans = transactions.filter(t => t.metadata?.employee_id === empId);
    const advances = relatedTrans.filter(t => t.type === 'ADVANCE').reduce((s, t) => s + t.amount, 0);
    const paidSalary = relatedTrans.filter(t => t.type === 'SALARY_PAYMENT').reduce((s, t) => s + t.amount, 0);

    // الرصيد = الراتب - السلف - الرواتب المدفوعة - الديون
    return emp.salary - advances - paidSalary - linkedDebts;
  }, [employees, members, customers, transactions]);

  const reportData = useMemo(() => {
    const tList = transactions;
    const mRev = tList.filter(t => t.type === 'MEMBERSHIP').reduce((s,t) => s + t.amount + (t.metadata?.debt_added || 0), 0);
    const pRev = tList.filter(t => t.type === 'SALE').reduce((s,t) => s + t.amount + (t.metadata?.debt_added || 0), 0);
    const sal = tList.filter(t => ['SALARY_PAYMENT', 'ADVANCE'].includes(t.type)).reduce((s,t) => s + t.amount, 0);
    const pur = tList.filter(t => t.type === 'PURCHASE').reduce((s,t) => s + t.amount + (t.metadata?.debt_added || 0), 0);
    const exp = tList.filter(t => t.type === 'EXPENSE').reduce((s,t) => s + t.amount, 0);
    const personalWithdrawals = tList.filter(t => t.type === 'PERSONAL_WITHDRAWAL').reduce((s,t) => s + t.amount, 0);
    const dOnO = members.reduce((s, m) => s + (m.total_debt || 0), 0) + customers.reduce((s, c) => s + (c.total_debt || 0), 0);
    
    return {
      membershipRev: mRev,
      posRev: pRev,
      purchases: pur,
      salaries: sal,
      expenses: exp,
      personalWithdrawals,
      totalIncome: mRev + pRev,
      totalOutcome: sal + pur + exp,
      net: (mRev + pRev) - (sal + pur + exp),
      debtsOnOthers: dOnO
    };
  }, [transactions, members, customers]);

  // الصندوق اليومي - يعرض فقط معاملات اليوم الحالي + الرصيد الافتتاحي
  const cashBalance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.created_at.split('T')[0] === today);
    // الرصيد الافتتاحي (يُحسب دائماً وليس فقط اليوم)
    const openingBalance = transactions.filter(t => t.type === 'OPENING_BALANCE').reduce((s, t) => s + t.amount, 0);
    
    return openingBalance + todayTransactions.reduce((acc, t) => {
      // إضافة: مبيعات مقبوضة، اشتراكات مقبوضة، ديون محصلة
      if(['SALE', 'MEMBERSHIP', 'DEBT_PAYMENT'].includes(t.type)) return acc + t.amount;
      // خصم: مشتريات، مصروفات، مسحوبات شخصية، رواتب، سلف، سداد موردين
      if(['PURCHASE', 'EXPENSE', 'PERSONAL_WITHDRAWAL', 'SALARY_PAYMENT', 'ADVANCE', 'SUPPLIER_PAYMENT'].includes(t.type)) return acc - t.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const checkDuplicate = (name: string, phone: string, excludeId?: string) => {
    const all = [...members, ...customers, ...employees, ...suppliers];
    return all.some(p => {
      if (p.id === excludeId) return false;
      const n = (p as any).name || (p as any).full_name;
      const ph = (p as any).phone || (p as any).phone_number;
      return n?.trim() === name?.trim() || ph?.trim() === phone?.trim();
    });
  };

  // --- المعالجات ---
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSupabase()) return;
    if (!memberForm.id && checkDuplicate(memberForm.name, memberForm.phone)) return alert('الاسم أو الرقم مسجل مسبقاً!');
    
    setLoading(true);
    try {
      const net = Number(memberForm.price) - Number(memberForm.discount);
      const paid = memberForm.mode === 'CASH' ? net : Number(memberForm.paid);
      const debt = net - paid;
      const end = new Date(memberForm.start);
      const planMonths = PLANS.find(p => p.label === memberForm.plan)?.months || 1;
      end.setMonth(end.getMonth() + planMonths);

      const payload = { 
        name: memberForm.name, phone: memberForm.phone, subscription_plan: memberForm.plan, 
        plan_price: Number(memberForm.price), discount: Number(memberForm.discount), 
        start_date: memberForm.start, end_date: end.toISOString().split('T')[0], 
        weight: Number(memberForm.weight), height: Number(memberForm.height), photo: memberForm.photo, status: 'active' 
      };

      if (memberForm.isEditOnly) {
        await supabase!.from('members').update(payload).eq('id', memberForm.id);
      } else {
        let memberId = memberForm.id;
        if (memberForm.id) {
          const current = members.find(m => m.id === memberForm.id);
          await supabase!.from('members').update({ ...payload, total_debt: (current?.total_debt || 0) + debt }).eq('id', memberForm.id);
        } else {
          const { data, error } = await supabase!.from('members').insert({ ...payload, total_debt: debt }).select().single();
          if (error) throw error;
          memberId = data.id;
        }

        const emp = employees.find(ev => ev.name === memberForm.name || ev.phone === memberForm.phone);
        await supabase!.from('transactions').insert({
          type: 'MEMBERSHIP', amount: paid, label: `${memberForm.isRenew ? 'تجديد' : 'اشتراك'}: ${memberForm.name}`,
          metadata: { member_id: memberId, debt_added: debt, employee_id: emp?.id || null }
        });

        if (debt > 0) {
          const custExists = customers.some(c => c.full_name === memberForm.name || c.phone_number === memberForm.phone);
          if (!custExists) await supabase!.from('customers').insert([{ full_name: memberForm.name, phone_number: memberForm.phone, total_debt: 0 }]);
        }
      }
      await fetchData(); navigateTo('members'); alert('تم الحفظ بنجاح ✅');
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const processSale = async () => {
    if (!requireSupabase()) return;
    if (!posCart.length) return;
    if (posForm.mode === 'CREDIT' && !posForm.personId) return alert('يجب اختيار الشخص للبيع الآجل!');
    
    for (const item of posCart) {
      if ((item.product.quantity || 0) < item.qty) return alert(`الكمية غير كافية لـ ${item.product.name}`);
    }

    setLoading(true);
    try {
      const subtotal = posCart.reduce((s, i) => s + (i.product.sale_price * i.qty), 0);
      const net = subtotal - Number(posForm.discount);
      const paid = posForm.mode === 'CASH' ? net : Number(posForm.paid);
      const debt = net - paid;
      
      const person = [...members, ...customers, ...employees].find(p => p.id === posForm.personId);
      const emp = employees.find(e => e.id === posForm.personId);

      await supabase!.from('transactions').insert({ 
        type: 'SALE', amount: paid, label: `مبيعات: ${person?.name || (person as any)?.full_name || 'نقدي'}`, 
        metadata: { person_id: posForm.personId, debt_added: debt, employee_id: emp?.id || null } 
      });

      if (debt > 0 && person) {
        const table = members.some(m => m.id === person.id) ? 'members' : 'customers';
        const { data } = await supabase!.from(table).select('total_debt').eq('id', person.id).single();
        await supabase!.from(table).update({ total_debt: (data?.total_debt || 0) + debt }).eq('id', person.id);
      }

      for (const item of posCart) {
        await supabase!.from('products').update({ quantity: (item.product.quantity || 0) - item.qty }).eq('id', item.product.id);
      }

      setPosCart([]); setPosForm({ personId:'', discount:'0', paid:'0', mode:'CASH' });
      await fetchData(); alert('تمت العملية ✅');
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const processPurchase = async () => {
    if (!requireSupabase()) return;
    if (!purchaseCart.length) return;
    if (purchaseForm.mode === 'CREDIT' && !purchaseForm.supplierId) return alert('يجب اختيار المورد للآجل!');
    setLoading(true);
    try {
      const subtotal = purchaseCart.reduce((s, i) => s + (i.cost * i.qty), 0);
      const net = subtotal - Number(purchaseForm.discount);
      const paid = purchaseForm.mode === 'CASH' ? net : Number(purchaseForm.paid);
      const debt = net - paid;
      const supplier = suppliers.find(s => s.id === purchaseForm.supplierId);

      const transData = { 
        type: 'PURCHASE', amount: paid, label: `مشتريات: ${supplier?.name || 'نقدي'}`, 
        metadata: { supplier_id: purchaseForm.supplierId, debt_added: debt } 
      };

      if (purchaseForm.editId) {
        await supabase!.from('transactions').update(transData).eq('id', purchaseForm.editId);
      } else {
        await supabase!.from('transactions').insert(transData);
      }

      if (debt > 0 && supplier) {
        const { data } = await supabase!.from('suppliers').select('total_debt').eq('id', supplier.id).single();
        await supabase!.from('suppliers').update({ total_debt: (data?.total_debt || 0) + debt }).eq('id', supplier.id);
      }

      for (const item of purchaseCart) {
        await supabase!.from('products').update({ quantity: (item.product.quantity || 0) + item.qty }).eq('id', item.product.id);
      }
      setPurchaseCart([]); setPurchaseForm({ supplierId:'', discount:'0', paid:'0', mode:'CASH', editId:'' });
      await fetchData(); alert('تم الحفظ ✅');
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  // --- واجهة تسجيل الدخول ---
  if (!isLoggedIn) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark w-100 p-3">
        <div className="card p-4 shadow-lg text-center bg-white" style={{maxWidth: '400px', width: '100%', borderRadius: '30px'}}>
          <div className="mb-3">{clubLogo ? <img src={clubLogo} style={{maxHeight: 100}} alt="Logo" /> : <i className="fas fa-dumbbell fa-4x text-danger"></i>}</div>
          <h3 className="fw-800 mb-4 text-dark">نظام <span className="text-danger">DynamoGym</span></h3>
          <form onSubmit={(e)=>{ e.preventDefault(); if (loginForm.user === 'admin' && loginForm.pass === (localStorage.getItem('dynamogym_pass') || 'admin')) { localStorage.setItem('dynamogym_auth', 'true'); setIsLoggedIn(true); } else alert('بيانات الدخول خاطئة'); }} className="row g-3">
            <div className="col-12"><input className="form-control rounded-pill text-center shadow-sm" placeholder="اسم المستخدم" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} /></div>
            <div className="col-12"><input className="form-control rounded-pill text-center shadow-sm" type="password" placeholder="كلمة المرور" value={loginForm.pass} onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} /></div>
            <div className="col-12"><button className="btn btn-danger w-100 rounded-pill py-2 fw-bold shadow">دخول للنظام</button></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex min-vh-100" dir="rtl" onClick={() => { if(sidebarOpen) setSidebarOpen(false); }}>
      {loading && <div className="loading-screen"><div className="spinner-border text-danger"></div></div>}
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}></div>
      
      <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="p-4 text-center bg-dark border-bottom border-secondary border-opacity-25">
          {clubLogo ? <img src={clubLogo} style={{maxWidth: '80px'}} className="rounded border border-danger p-1" /> : <i className="fas fa-dumbbell text-danger fa-2x"></i>}
          <h5 className="fw-800 text-white mt-2 mb-0">Dynamo<span className="text-danger">Gym</span></h5>
        </div>
        <nav className="mt-3 overflow-y-auto" style={{maxHeight: 'calc(100vh - 140px)'}}>
          <button className={`nav-link ${view==='dashboard'?'active':''}`} onClick={()=>navigateTo('dashboard')}><i className="fas fa-home me-2"></i>الرئيسية</button>
          <button className={`nav-link ${view==='members'?'active':''}`} onClick={()=>navigateTo('members')}><i className="fas fa-users me-2"></i>الأعضاء</button>
          <button className={`nav-link ${view==='register'?'active':''}`} onClick={()=>{ setMemberForm({id:'', name:'', phone:'', plan:'شهر واحد', price:'130', discount:'0', paid:'0', start:new Date().toISOString().split('T')[0], weight:'', height:'', photo:'', mode:'CASH', isRenew: false, isEditOnly: false}); navigateTo('register'); }}><i className="fas fa-user-plus me-2"></i>تسجيل عضو</button>
          <button className={`nav-link ${view==='pos'?'active':''}`} onClick={()=>navigateTo('pos')}><i className="fas fa-cash-register me-2"></i>نقطة البيع</button>
          <button className={`nav-link ${view==='inventory'?'active':''}`} onClick={()=>navigateTo('inventory')}><i className="fas fa-boxes me-2"></i>المخزون</button>
          <button className={`nav-link ${view==='purchases'?'active':''}`} onClick={()=>navigateTo('purchases')}><i className="fas fa-shopping-cart me-2"></i>المشتريات</button>
          <button className={`nav-link ${view==='suppliers'?'active':''}`} onClick={()=>navigateTo('suppliers')}><i className="fas fa-truck me-2"></i>الموردين</button>
          <button className={`nav-link ${view==='customers'?'active':''}`} onClick={()=>navigateTo('customers')}><i className="fas fa-hand-holding-usd me-2"></i>العملاء</button>
          <button className={`nav-link ${view==='employees'?'active':''}`} onClick={()=>navigateTo('employees')}><i className="fas fa-user-tie me-2"></i>الموظفين</button>
          <button className={`nav-link ${view==='expenses'?'active':''}`} onClick={()=>navigateTo('expenses')}><i className="fas fa-money-bill-wave me-2"></i>المصروفات</button>
          <button className={`nav-link ${view==='reports'?'active':''}`} onClick={()=>navigateTo('reports')}><i className="fas fa-chart-line me-2"></i>التقارير</button>
          <button className={`nav-link ${view==='opening'?'active':''}`} onClick={()=>navigateTo('opening')}><i className="fas fa-balance-scale me-2"></i>أرصدة افتتاحية</button>
          <button className={`nav-link ${view==='settings'?'active':''}`} onClick={()=>navigateTo('settings')}><i className="fas fa-cog me-2"></i>الإعدادات</button>
          <button className="nav-link text-danger mt-4" onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>خروج</button>
        </nav>
      </aside>

      <main className="main-content flex-grow-1">
        <header className="glass-header px-4 d-flex justify-content-between align-items-center bg-white shadow-sm border-bottom">
          <div className="d-flex align-items-center gap-2">
            <button className="btn d-lg-none p-0" onClick={(e)=>{ e.stopPropagation(); setSidebarOpen(true); }}><i className="fas fa-bars fs-4"></i></button>
            <h5 className="mb-0 fw-800 text-dark">صندوق اليوم: <span className={cashBalance >= 0 ? "text-success" : "text-danger"}>{formatNum(cashBalance)} ₪</span></h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="d-none d-lg-block fw-bold text-muted small">{new Date().toLocaleDateString('ar-EG')}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </header>

        <div className="p-3 p-md-4">
          {view === 'dashboard' && (
            <div className="row g-3">
              <div className="col-md-3 col-6"><div className="card p-3 text-center border-0 shadow-sm border-top border-4 border-primary h-100"><small className="text-muted fw-bold">الأعضاء</small><h3 className="fw-800 text-primary">{members.filter(m=>m.status==='active').length}</h3></div></div>
              <div className="col-md-3 col-6"><div className="card p-3 text-center border-0 shadow-sm border-top border-4 border-danger h-100"><small className="text-muted fw-bold">ديون لنا</small><h3 className="fw-800 text-danger">{formatNum(reportData.debtsOnOthers)}</h3></div></div>
              <div className="col-md-3 col-6"><div className="card p-3 text-center border-0 shadow-sm border-top border-4 border-info h-100"><small className="text-muted fw-bold">الأصناف</small><h3 className="fw-800 text-info">{inventory.length}</h3></div></div>
              <div className="col-md-3 col-6"><div className={`card p-3 text-center border-0 shadow-sm border-top border-4 h-100 ${reportData.net >= 0 ? 'border-success' : 'border-danger'}`}><small className="text-muted fw-bold">الربح الصافي</small><h3 className={`fw-800 ${reportData.net >= 0 ? 'text-success' : 'text-danger'}`}>{formatNum(reportData.net)}</h3></div></div>
              
              <div className="col-12 mt-4 bg-white p-3 rounded-4 shadow-sm border border-danger border-opacity-25">
                <h6 className="fw-800 text-danger mb-3 border-bottom pb-2"><i className="fas fa-bell me-2"></i>تنبيهات انتهاء الاشتراك (7 أيام فأقل)</h6>
                <div className="row g-2">
                  {members.filter(m => getDaysRemaining(m.end_date) <= 7 && m.status === 'active').map(m => (
                    <div className="col-md-4" key={m.id}>
                      <div className="card p-2 border-start border-4 border-danger bg-danger bg-opacity-10 d-flex justify-content-between align-items-center shadow-sm">
                        <div className="text-start"><div className="fw-bold extra-small text-truncate" style={{maxWidth:120}}>{m.name}</div><div className="text-danger fw-800 small">{getDaysRemaining(m.end_date)} يوم متبقي</div></div>
                        <a href={getWhatsAppLink(m.phone)} className="btn btn-sm btn-success rounded-pill px-3 shadow-sm"><i className="fab fa-whatsapp"></i></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'members' && (
            <div className="row g-2">
              {/* تنبيه الاشتراكات المنتهية اليوم */}
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const expiringToday = members.filter(m => m.end_date === today);
                const sendWhatsApp = (member: Member) => {
                  const phone = member.phone.replace(/^0/, '972');
                  const message = encodeURIComponent(
`مرحباً ${member.name} 👋

نتمنى لك يوماً سعيداً! نود إعلامك بأن اشتراكك في النادي ينتهي اليوم.

يسعدنا استمرارك معنا 💪 ونتطلع لرؤيتك قريباً لتجديد اشتراكك.

مع أطيب التحيات،
إدارة النادي 🏋️`
                  );
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                };
                if (expiringToday.length === 0) return null;
                return (
                  <div className="col-12 mb-3">
                    <div className="card p-3 border-0 bg-warning bg-opacity-10 border-top border-4 border-warning shadow-sm rounded-4">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-bell text-warning me-2 fa-lg"></i>
                        <h6 className="fw-800 text-warning mb-0">اشتراكات تنتهي اليوم ({expiringToday.length})</h6>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {expiringToday.map(m => (
                          <div key={m.id} className="d-flex align-items-center bg-white rounded-pill px-3 py-2 shadow-sm border">
                            <span className="fw-bold me-2">{m.name}</span>
                            <button 
                              className="btn btn-success btn-sm rounded-pill px-3 shadow-sm"
                              onClick={() => sendWhatsApp(m)}
                              title="إرسال تذكير واتساب"
                            >
                              <i className="fab fa-whatsapp me-1"></i>
                              تذكير
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="col-12 d-flex flex-wrap justify-content-between mb-3 align-items-center bg-white p-3 rounded-4 shadow-sm border">
                <h5 className="fw-800 mb-0">قائمة المشتركين</h5>
                <input className="form-control rounded-pill shadow-sm extra-small mt-2 mt-md-0" style={{maxWidth: '300px'}} placeholder="بحث..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              </div>
              <div className="row g-2">
                {members.filter(m=>m.name.includes(searchTerm)||m.phone.includes(searchTerm)).map(m=>(
                  <div className="col-6 col-md-3" key={m.id}>
                    <div className="card h-100 shadow-sm text-center p-2 border-0 bg-white" onClick={()=>setMemberDetails(m)}>
                      <div className="bg-light rounded-circle overflow-hidden mb-2 mx-auto border position-relative" style={{width:85, height:85}}>
                        {m.photo ? <img src={m.photo} className="w-100 h-100 object-fit-cover" /> : <i className="fas fa-user fa-2x mt-4 text-muted"></i>}
                        <div className={`position-absolute top-0 end-0 badge rounded-pill ${getDaysRemaining(m.end_date) <= 7 ? 'bg-danger shadow':'bg-success shadow'}`} style={{fontSize:'0.6rem'}}>{getDaysRemaining(m.end_date)} يوم</div>
                      </div>
                      <h6 className="fw-bold mb-0 extra-small text-truncate px-1">{m.name}</h6>
                      <div className="mt-auto d-flex flex-wrap gap-1 justify-content-center pt-2">
                        <button className="btn btn-xs btn-primary extra-small px-3 rounded-pill shadow-sm" onClick={(e)=>{
                          e.stopPropagation();
                          setMemberForm({ id:m.id, name:m.name, phone:m.phone, plan:m.subscription_plan, price:String(m.plan_price), discount:String(m.discount), paid:'0', start:m.start_date, weight:String(m.weight||''), height:String(m.height||''), photo:m.photo||'', mode:'CASH', isRenew: false, isEditOnly: true });
                          navigateTo('register');
                        }}>تعديل</button>
                        <button className="btn btn-xs btn-outline-danger extra-small px-2 rounded-pill" onClick={async(e)=>{
                          e.stopPropagation();
                          if(!requireSupabase()) return;
                          if(m.total_debt > 0) return alert('لا يمكن حذف العضو لوجود دين مستحق!');
                          if(confirm('هل أنت متأكد من الحذف؟')){ await supabase!.from('members').delete().eq('id', m.id); await fetchData(); }
                        }}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="card p-4 rounded-4 shadow-lg border-0 mx-auto bg-white" style={{maxWidth: '800px'}}>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
                <h5 className="fw-800 text-primary mb-0">{memberForm.isRenew ? 'تجديد الاشتراك' : memberForm.isEditOnly ? 'تعديل بيانات العضو' : 'تسجيل عضو جديد'}</h5>
                <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={()=>navigateTo('members')}><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleMemberSubmit} className="row g-3">
                <div className="col-12 text-center mb-3 order-first order-md-first">
                  <div className="bg-light rounded-4 mb-2 mx-auto overflow-hidden border d-flex align-items-center justify-content-center shadow-inner" style={{width: 140, height: 160}}>
                    {memberForm.photo ? <img src={memberForm.photo} className="w-100 h-100 object-fit-cover" /> : <i className="fas fa-camera fa-2x text-muted"></i>}
                  </div>
                  <label className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold shadow-sm">تحميل صورة <input type="file" className="d-none" accept="image/*" onChange={(e)=>{
                    const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend=()=>setMemberForm({...memberForm, photo: r.result as string}); r.readAsDataURL(f); }
                  }} /></label>
                </div>
                
                <div className="col-md-6"><label className="small fw-bold mb-1">الاسم الكامل</label><input className="form-control rounded-pill shadow-sm" onFocus={handleAutoSelect} value={memberForm.name} onChange={e=>setMemberForm({...memberForm, name: e.target.value})} required /></div>
                <div className="col-md-6"><label className="small fw-bold mb-1">رقم الهاتف</label><input className="form-control rounded-pill shadow-sm" onFocus={handleAutoSelect} value={memberForm.phone} onChange={e=>setMemberForm({...memberForm, phone: e.target.value})} required /></div>
                
                <div className="col-12"><label className="small fw-bold mb-2">اختر الباقة</label>
                  <div className="row g-2">{PLANS.map(p=>(<div className="col-6 col-md" key={p.label}><button type="button" className={`btn btn-sm w-100 rounded-pill shadow-sm ${memberForm.plan===p.label ? 'btn-'+p.color : 'btn-outline-secondary'}`} onClick={()=>setMemberForm({...memberForm, plan:p.label, price:String(p.defaultPrice)})}>{p.label}</button></div>))}</div>
                </div>

                <div className="col-md-4 col-6"><label className="small fw-bold mb-1">السعر (₪)</label><input type="number" step="0.01" className="form-control rounded-pill shadow-sm text-center" onFocus={handleAutoSelect} value={memberForm.price} onChange={e=>setMemberForm({...memberForm, price:e.target.value})} /></div>
                <div className="col-md-4 col-6"><label className="small fw-bold mb-1 text-danger">خصم (₪)</label><input type="number" step="0.01" className="form-control rounded-pill shadow-sm text-center border-danger" onFocus={handleAutoSelect} value={memberForm.discount} onChange={e=>setMemberForm({...memberForm, discount:e.target.value})} /></div>
                <div className="col-md-4 col-12"><label className="small fw-bold mb-1">تاريخ البدء</label><input type="date" className="form-control rounded-pill shadow-sm" value={memberForm.start} onChange={e=>setMemberForm({...memberForm, start:e.target.value})} /></div>
                
                {!memberForm.isEditOnly ? (
                  <>
                    <div className="col-12 p-3 bg-light rounded-4 d-flex flex-wrap justify-content-between align-items-center border shadow-sm">
                      <div className="fw-800 text-dark fs-5 mb-2 mb-md-0">المطلوب: <span className="text-primary">{formatNum(Number(memberForm.price) - Number(memberForm.discount))} ₪</span></div>
                      <div className="btn-group rounded-pill overflow-hidden shadow-sm border">
                        <button type="button" className={`btn btn-sm px-4 fw-bold ${memberForm.mode==='CASH'?'btn-primary':'btn-light'}`} onClick={()=>setMemberForm({...memberForm, mode:'CASH', paid:'0'})}>كاش</button>
                        <button type="button" className={`btn btn-sm px-4 fw-bold ${memberForm.mode==='CREDIT'?'btn-danger':'btn-light'}`} onClick={()=>setMemberForm({...memberForm, mode:'CREDIT'})}>آجل</button>
                      </div>
                    </div>
                    {memberForm.mode==='CREDIT' && (
                      <div className="col-12 row g-2">
                        <div className="col-md-6"><label className="small fw-bold mb-1">المدفوع</label><input type="number" step="0.01" className="form-control rounded-pill border-danger text-center fw-bold shadow-sm" onFocus={handleAutoSelect} value={memberForm.paid} onChange={e=>setMemberForm({...memberForm, paid:e.target.value})} /></div>
                        <div className="col-md-6"><label className="small fw-bold mb-1">الدين المترحل</label><input disabled className="form-control rounded-pill text-center shadow-sm" value={formatNum((Number(memberForm.price) - Number(memberForm.discount)) - Number(memberForm.paid))} /></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="col-12 p-2 bg-info bg-opacity-10 text-info rounded-3 text-center small fw-bold d-flex justify-content-between align-items-center">
                    <span>تعديل بيانات أساسية فقط (لن يتم تسجيل دفع جديد)</span>
                    <button type="button" className="btn btn-sm btn-outline-info rounded-pill" onClick={()=>navigateTo('members')}>الغاء X</button>
                  </div>
                )}
                
                <div className="d-flex gap-2 mt-4">
                  <button className="btn btn-primary flex-grow-1 rounded-pill py-3 fw-bold shadow-lg">حفظ البيانات ✅</button>
                </div>
              </form>
            </div>
          )}

          {view === 'pos' && (
            <div className="row g-3">
               <div className="col-12">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                    <h5 className="fw-800 text-dark mb-0">نقطة البيع (POS)</h5>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <div className="input-group" style={{maxWidth: '200px'}}>
                        <input 
                          type="text" 
                          className="form-control form-control-sm rounded-start-pill" 
                          placeholder="أدخل الباركود..."
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if(input.value.trim()) {
                                handleBarcodeScanned(input.value.trim(), 'pos');
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <span className="input-group-text bg-dark text-white rounded-end-pill"><i className="fas fa-barcode"></i></span>
                      </div>
                      <button type="button" className="btn btn-dark rounded-pill px-3 shadow btn-sm" onClick={()=>startBarcodeScanner('pos')}>
                        <i className="fas fa-camera me-1"></i> كاميرا
                      </button>
                    </div>
                  </div>
                  {/* Debug: عدد الأصناف بباركود */}
                  <div className="alert alert-info py-1 px-3 small mb-2">
                    <i className="fas fa-info-circle me-1"></i>
                    أصناف بباركود: <strong>{inventory.filter(p => p.barcode).length}</strong> من {inventory.length}
                    {inventory.filter(p => p.barcode).length === 0 && <span className="text-danger ms-2">⚠️ لا يوجد أي أصناف بباركود!</span>}
                  </div>
                  <div className="card p-3 shadow-sm border-0 bg-white mb-3">
                    <input className="form-control rounded-pill shadow-sm mb-3 px-4 border extra-small" placeholder="بحث عن صنف..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                    <div className="row g-2 overflow-auto" style={{maxHeight: '30vh'}}>
                      {inventory.filter(p=>p.name.includes(searchTerm)).map(p=>(
                        <div className="col-6 col-md-3" key={p.id}>
                          <div className={`card p-2 text-center pos-item border-0 bg-light shadow-sm h-100 ${p.quantity <= 0 ? 'opacity-50 border-danger' : ''}`} onClick={()=>{
                            if(p.quantity <= 0) return alert('الكمية صفر!');
                            const ex = posCart.find(i=>i.product.id===p.id);
                            if(ex) setPosCart(posCart.map(i=>i.product.id===p.id?{...i, qty: i.qty+1}:i));
                            else setPosCart([...posCart, {product:p, qty:1}]);
                          }}>
                            <div className="fw-bold extra-small text-truncate mb-1">{p.name}</div>
                            <div className="text-success fw-800 small">{formatNum(p.sale_price)} ₪</div>
                            <div className={`extra-small fw-bold ${p.quantity <= 5 ? 'text-danger' : 'text-muted'}`}>المتاح: {p.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-3 shadow-lg border-0 bg-white mb-3 border-top border-4 border-primary">
                     <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                        <h6 className="fw-800 text-primary mb-0">طريقة الدفع</h6>
                        <div className="btn-group rounded-pill overflow-hidden shadow-sm border mt-2 mt-md-0">
                          <button className={`btn btn-sm px-4 fw-bold ${posForm.mode==='CASH'?'btn-primary':'btn-light'}`} onClick={()=>setPosForm({...posForm, mode:'CASH', personId: ''})}>نقداً</button>
                          <button className={`btn btn-sm px-4 fw-bold ${posForm.mode==='CREDIT'?'btn-danger':'btn-light'}`} onClick={()=>setPosForm({...posForm, mode:'CREDIT'})}>آجل</button>
                        </div>
                     </div>
                     {posForm.mode === 'CREDIT' && (
                        <div className="col-12 mb-2">
                           <label className="extra-small fw-bold mb-1">اختر المستفيد (موظف/عضو/عميل)</label>
                           <select className="form-select form-select-sm rounded-pill shadow-sm" value={posForm.personId} onChange={e=>setPosForm({...posForm, personId:e.target.value})}>
                              <option value="">-- اختر --</option>
                              <optgroup label="الموظفين">{employees.map(e => <option key={e.id} value={e.id}>{e.name} (موظف)</option>)}</optgroup>
                              <optgroup label="الأعضاء">{members.map(m => <option key={m.id} value={m.id}>{m.name} (عضو)</option>)}</optgroup>
                              <optgroup label="العملاء">{customers.map(c => <option key={c.id} value={c.id}>{c.full_name} (عميل)</option>)}</optgroup>
                           </select>
                        </div>
                     )}
                     <div className="row g-2 align-items-end">
                        <div className="col-6 col-md-3"><label className="extra-small fw-bold mb-1">خصم (₪)</label><input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center shadow-sm" onFocus={handleAutoSelect} value={posForm.discount} onChange={e=>setPosForm({...posForm, discount:e.target.value})} /></div>
                        <div className="col-6 col-md-3"><label className="extra-small fw-bold mb-1">المدفوع (₪)</label><input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center shadow-sm border-danger" disabled={posForm.mode==='CASH'} onFocus={handleAutoSelect} value={posForm.paid} onChange={e=>setPosForm({...posForm, paid:e.target.value})} /></div>
                     </div>
                  </div>

                  <div className="card p-3 shadow-sm border-0 bg-white mb-4">
                     <h6 className="fw-800 text-dark mb-3 small">سلة المبيعات</h6>
                     <div className="table-responsive border rounded-3 mb-3 shadow-sm">
                        <table className="table table-sm extra-small text-end mb-0 align-middle">
                           <thead><tr className="table-light"><th>الصنف</th><th>الكمية</th><th>الإجمالي</th><th></th></tr></thead>
                           <tbody>
                              {posCart.map((item, idx)=>(
                                 <tr key={idx}>
                                    <td className="fw-bold">{item.product.name}</td>
                                    <td><div className="d-flex align-items-center gap-2 justify-content-end"><button className="btn btn-xs btn-light border shadow-sm" onClick={()=>setPosCart(posCart.map((c,i)=>i===idx?{...c, qty: Math.max(1, c.qty-1)}:c))}><i className="fas fa-minus"></i></button><span className="fw-800 px-2">{item.qty}</span><button className="btn btn-xs btn-light border shadow-sm" onClick={()=>setPosCart(posCart.map((c,i)=>i===idx?{...c, qty: c.qty+1}:c))}><i className="fas fa-plus"></i></button></div></td>
                                    <td className="fw-bold text-primary">{formatNum(item.qty * item.product.sale_price)} ₪</td>
                                    <td><button className="btn btn-xs text-danger" onClick={()=>setPosCart(posCart.filter((_,i)=>i!==idx))}><i className="fas fa-trash"></i></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     <div className="d-flex gap-2 mb-3">
                        <div className="bg-dark text-white rounded-pill px-4 py-2 flex-grow-1 text-center shadow-lg border-2 border-primary"><h4 className="fw-800 text-success mb-0">{formatNum(posCart.reduce((s,i)=>s+(i.qty*i.product.sale_price), 0) - Number(posForm.discount))} ₪</h4></div>
                        <button className="btn btn-primary rounded-pill px-5 fw-800 shadow-lg" disabled={!posCart.length} onClick={processSale}>تأكيد الفاتورة ✅</button>
                     </div>

                     <h6 className="fw-800 border-bottom pb-2 mt-4 text-muted small">سجل فواتير المبيعات</h6>
                     <div className="table-responsive bg-white rounded-4 p-2 shadow-sm border overflow-auto" style={{maxHeight: '30vh'}}>
                        <table className="table table-sm extra-small align-middle text-end mb-0">
                          <thead><tr className="table-light"><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th>إجراء</th></tr></thead>
                          <tbody>{transactions.filter(t=>t.type==='SALE').map(t=>(
                            <tr key={t.id}>
                              <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                              <td className="fw-bold">{t.label}</td>
                              <td className="fw-bold text-success">{formatNum(t.amount)} ₪</td>
                              <td><div className="d-flex gap-1">
                                <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm">تعديل</button>
                                <button className="btn btn-xs btn-outline-danger rounded-pill shadow-sm" onClick={async()=>{ if(!requireSupabase()) return; if(confirm('حذف الفاتورة؟')){ await supabase!.from('transactions').delete().eq('id', t.id); await fetchData(); } }}><i className="fas fa-trash"></i></button>
                              </div></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="card p-3 shadow-sm rounded-4 border-0 bg-white border-top border-4 border-info">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-800 text-info mb-0">{productForm.id ? 'تعديل صنف':'إضافة صنف جديد'}</h6>
                    <button type="button" className="btn btn-dark btn-sm rounded-pill px-3 shadow" onClick={()=>startBarcodeScanner('inventory')}>
                      <i className="fas fa-barcode me-1"></i> مسح الباركود
                    </button>
                  </div>
                  <form onSubmit={async(e)=>{
                    e.preventDefault(); if(!requireSupabase()) return; setLoading(true); try{ 
                      const payload = { name: productForm.name, sale_price: Number(productForm.price), barcode: productForm.barcode || null };
                      console.log('💾 Saving product:', payload);
                      let result;
                      if(productForm.id) {
                        result = await supabase!.from('products').update(payload).eq('id', productForm.id).select();
                      } else {
                        result = await supabase!.from('products').insert([{...payload, quantity: 0}]).select();
                      }
                      console.log('💾 Save result:', result);
                      if(result.error) throw result.error;
                      // تحقق من حفظ الباركود
                      if(payload.barcode && result.data?.[0]?.barcode !== payload.barcode) {
                        console.error('⚠️ Barcode was NOT saved! Column might not exist in Supabase.');
                        alert('⚠️ تحذير: الباركود لم يُحفظ!\n\nتأكد من إضافة عمود barcode في Supabase:\nALTER TABLE products ADD COLUMN barcode TEXT;');
                      }
                      setProductForm({id:'', name:'', price:'0', barcode:''}); await fetchData(); 
                      alert('تم الحفظ ✅' + (payload.barcode ? `\nالباركود: ${payload.barcode}` : ''));
                    }catch(err:any){alert('خطأ: ' + err.message);}finally{setLoading(false);}
                  }} className="row g-2">
                    <div className="col-12">
                      <div className="input-group">
                        <input className="form-control rounded-start-pill shadow-sm" placeholder="الباركود (اختياري)" value={productForm.barcode} onChange={e=>setProductForm({...productForm, barcode:e.target.value})} />
                        <span className="input-group-text bg-light"><i className="fas fa-barcode"></i></span>
                      </div>
                    </div>
                    <input className="form-control rounded-pill shadow-sm" onFocus={handleAutoSelect} placeholder="اسم الصنف" value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} required />
                    <div className="small text-muted mb-1 ms-2">سعر البيع</div>
                    <input type="number" step="0.01" className="form-control rounded-pill shadow-sm text-center" onFocus={handleAutoSelect} placeholder="سعر البيع" value={productForm.price} onChange={e=>setProductForm({...productForm, price:e.target.value})} required />
                    <button className="btn btn-info w-100 rounded-pill py-2 fw-bold text-white mt-2 shadow">حفظ ✅</button>
                    {productForm.id && <button type="button" className="btn btn-link text-muted extra-small" onClick={()=>setProductForm({id:'', name:'', price:'0', barcode:''})}>إلغاء</button>}
                  </form>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="card p-3 shadow-sm border-0 bg-white shadow-lg h-100">
                  <h6 className="fw-800 border-bottom pb-2">الأصناف (الكميات تدخل عبر المشتريات فقط)</h6>
                  <div className="table-responsive">
                    <table className="table table-hover extra-small align-middle text-end mb-0">
                      <thead><tr className="table-light"><th>الباركود</th><th>الاسم</th><th>سعر البيع</th><th>الكمية</th><th>إجراء</th></tr></thead>
                      <tbody>{inventory.map(p=>(
                        <tr key={p.id}>
                          <td className="text-muted small">{p.barcode || '-'}</td>
                          <td className="fw-bold">{p.name}</td>
                          <td className="fw-bold text-success">{formatNum(p.sale_price)} ₪</td>
                          <td className={`fw-bold ${p.quantity <= 0 ? 'text-danger' : 'text-primary'}`}>{p.quantity}</td>
                          <td><div className="d-flex gap-1">
                            <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm" onClick={()=>setProductForm({id:p.id, name:p.name, price:String(p.sale_price), barcode: p.barcode || ''})}><i className="fas fa-edit"></i></button>
                            <button className="btn btn-xs btn-outline-danger rounded-pill shadow-sm" onClick={async()=>{
                            if(!requireSupabase()) return; if(confirm('حذف الصنف؟')){ await supabase!.from('products').delete().eq('id', p.id); await fetchData(); }
                          }}><i className="fas fa-trash"></i></button></div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'purchases' && (
            <div className="row g-3">
               <div className="col-12">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                    <h5 className="fw-800 text-dark mb-0">إدارة المشتريات</h5>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <div className="input-group" style={{maxWidth: '200px'}}>
                        <input 
                          type="text" 
                          className="form-control form-control-sm rounded-start-pill" 
                          placeholder="أدخل الباركود..."
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if(input.value.trim()) {
                                handleBarcodeScanned(input.value.trim(), 'purchase');
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <span className="input-group-text bg-dark text-white rounded-end-pill"><i className="fas fa-barcode"></i></span>
                      </div>
                      <button type="button" className="btn btn-dark rounded-pill px-3 shadow btn-sm" onClick={()=>startBarcodeScanner('purchase')}>
                        <i className="fas fa-camera me-1"></i> كاميرا
                      </button>
                    </div>
                  </div>
                  {/* Debug: عدد الأصناف بباركود */}
                  <div className="alert alert-info py-1 px-3 small mb-2">
                    <i className="fas fa-info-circle me-1"></i>
                    أصناف بباركود: <strong>{inventory.filter(p => p.barcode).length}</strong> من {inventory.length}
                    {inventory.filter(p => p.barcode).length === 0 && <span className="text-danger ms-2">⚠️ لا يوجد أي أصناف بباركود!</span>}
                  </div>
                  <div className="card p-3 shadow-sm bg-white mb-3 shadow-lg">
                    <h6 className="fw-800 mb-2 small text-muted">اختر الأصناف</h6>
                    <div className="row g-2 overflow-auto mb-3" style={{maxHeight: '30vh'}}>
                      {inventory.map(p=>(
                        <div className="col-6 col-md-3" key={p.id}>
                          <div className="card p-2 text-center pos-item border-0 bg-light shadow-sm h-100" onClick={()=>{
                            const ex = purchaseCart.find(i=>i.product.id===p.id);
                            if(ex) setPurchaseCart(purchaseCart.map(i=>i.product.id===p.id?{...i, qty: i.qty+1}:i));
                            else setPurchaseCart([...purchaseCart, {product:p, qty:1, cost: 0}]);
                          }}>
                            <div className="fw-bold extra-small text-truncate mb-1">{p.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="card p-3 shadow-sm border-0 bg-light mb-3">
                       <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                          <h6 className="fw-800 mb-0">بيانات الفاتورة</h6>
                          <div className="btn-group rounded-pill overflow-hidden shadow-sm border mt-2 mt-md-0">
                            <button className={`btn btn-sm px-4 fw-bold ${purchaseForm.mode==='CASH'?'btn-primary':'btn-light'}`} onClick={()=>setPurchaseForm({...purchaseForm, mode:'CASH', supplierId: ''})}>نقدي</button>
                            <button className={`btn btn-sm px-4 fw-bold ${purchaseForm.mode==='CREDIT'?'btn-danger':'btn-light'}`} onClick={()=>setPurchaseForm({...purchaseForm, mode:'CREDIT'})}>آجل</button>
                          </div>
                       </div>
                       <div className="row g-2 align-items-end">
                          <div className="col-md-6">
                             <label className="extra-small fw-bold mb-1">المورد {purchaseForm.mode==='CREDIT' && '*'}</label>
                             <select className="form-select form-select-sm rounded-pill shadow-sm" value={purchaseForm.supplierId} onChange={e=>setPurchaseForm({...purchaseForm, supplierId:e.target.value})}>
                                <option value="">-- اختياري للنقدي --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                          </div>
                          <div className="col-6 col-md-3"><label className="extra-small fw-bold mb-1">خصم (₪)</label><input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center shadow-sm" onFocus={handleAutoSelect} value={purchaseForm.discount} onChange={e=>setPurchaseForm({...purchaseForm, discount:e.target.value})} /></div>
                          <div className="col-6 col-md-3"><label className="extra-small fw-bold mb-1">المدفوع (₪)</label><input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center shadow-sm border-danger" disabled={purchaseForm.mode==='CASH'} onFocus={handleAutoSelect} value={purchaseForm.paid} onChange={e=>setPurchaseForm({...purchaseForm, paid:e.target.value})} /></div>
                       </div>
                    </div>

                    <h6 className="fw-800 text-dark mb-2 small">سلة المشتريات</h6>
                    <div className="table-responsive border rounded-3 mb-3 shadow-sm">
                        <table className="table table-sm extra-small text-end mb-0 align-middle">
                           <thead><tr className="table-light"><th>الصنف</th><th>الكمية</th><th>سعر التكلفة</th><th>الإجمالي</th><th></th></tr></thead>
                           <tbody>
                              {purchaseCart.map((item, idx)=>(
                                 <tr key={idx}>
                                    <td className="fw-bold">{item.product.name}</td>
                                    <td><input type="number" className="form-control form-control-sm rounded-pill text-center w-75 mx-auto" onFocus={handleAutoSelect} value={item.qty} onChange={e=>setPurchaseCart(purchaseCart.map((c,i)=>i===idx?{...c, qty: Number(e.target.value)}:c))} /></td>
                                    <td><input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center w-75 mx-auto border-info" onFocus={handleAutoSelect} value={item.cost} onChange={e=>setPurchaseCart(purchaseCart.map((c,i)=>i===idx?{...c, cost: Number(e.target.value)}:c))} /></td>
                                    <td className="fw-bold text-info">{formatNum(item.qty * item.cost)} ₪</td>
                                    <td><button className="btn btn-xs text-danger" onClick={()=>setPurchaseCart(purchaseCart.filter((_,i)=>i!==idx))}><i className="fas fa-trash"></i></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    </div>
                    <div className="d-flex gap-2">
                        <div className="bg-dark text-white rounded-pill px-4 py-2 flex-grow-1 text-center shadow-lg border-2 border-info"><h4 className="fw-800 text-warning mb-0">{formatNum(purchaseCart.reduce((s,i)=>s+(i.qty*i.cost), 0) - Number(purchaseForm.discount))} ₪</h4></div>
                        <button className="btn btn-dark rounded-pill px-5 fw-800 shadow-lg" disabled={!purchaseCart.length} onClick={processPurchase}>تأكيد الشراء ✅</button>
                    </div>

                    <h6 className="fw-800 border-bottom pb-2 mt-4 text-muted small">سجل فواتير المشتريات</h6>
                    <div className="table-responsive bg-white rounded-4 p-2 shadow-sm border overflow-auto" style={{maxHeight: '30vh'}}>
                      <table className="table table-sm extra-small align-middle text-end mb-0">
                        <thead><tr className="table-light"><th>التاريخ</th><th>المورد</th><th>الصافي</th><th>إجراء</th></tr></thead>
                        <tbody>{transactions.filter(t=>t.type==='PURCHASE').map(t=>(
                          <tr key={t.id}>
                            <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                            <td className="fw-bold">{t.label}</td>
                            <td className="fw-bold text-primary">{formatNum(t.amount)} ₪</td>
                            <td><div className="d-flex gap-1">
                              <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm">تعديل</button>
                              <button className="btn btn-xs btn-outline-danger rounded-pill shadow-sm" onClick={async()=>{ if(!requireSupabase()) return; if(confirm('حذف؟')){ await supabase!.from('transactions').delete().eq('id', t.id); await fetchData(); } }}><i className="fas fa-trash"></i></button>
                            </div></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'employees' && (
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="card p-3 rounded-4 border-0 bg-white border-top border-4 border-primary shadow-sm mb-3">
                  <h6 className="fw-800 text-primary mb-3">{employeeForm.id ? 'تعديل موظف':'إضافة موظف جديد'}</h6>
                  <form onSubmit={async(e)=>{
                    e.preventDefault();
                    if(!requireSupabase()) return;
                    if(!employeeForm.id && checkDuplicate(employeeForm.name, employeeForm.phone)) return alert('الموظف موجود مسبقاً!');
                    setLoading(true); try{ 
                      const p = {name:employeeForm.name, phone:employeeForm.phone, job_title:employeeForm.job, salary:Number(employeeForm.salary)};
                      if(employeeForm.id) await supabase!.from('employees').update(p).eq('id', employeeForm.id);
                      else await supabase!.from('employees').insert([p]);
                      setEmployeeForm({id:'', name:'', phone:'', job:'مدرب لياقة', salary:'0'}); await fetchData(); alert('تم الحفظ ✅');
                    } catch(err:any){alert(err.message);} finally{setLoading(false);}
                  }} className="row g-2">
                    <input className="form-control rounded-pill shadow-sm" placeholder="الاسم" value={employeeForm.name} onChange={e=>setEmployeeForm({...employeeForm, name:e.target.value})} required />
                    <input className="form-control rounded-pill shadow-sm" placeholder="رقم واتساب" value={employeeForm.phone} onChange={e=>setEmployeeForm({...employeeForm, phone:e.target.value})} required />
                    <select className="form-select rounded-pill shadow-sm" value={employeeForm.job} onChange={e=>setEmployeeForm({...employeeForm, job:e.target.value})}>{JOB_TITLES.map(j=><option key={j} value={j}>{j}</option>)}</select>
                    <div className="small text-muted ms-2">الراتب</div>
                    <input type="number" step="0.01" className="form-control rounded-pill text-center shadow-sm fw-bold border-primary" onFocus={handleAutoSelect} value={employeeForm.salary} onChange={e=>setEmployeeForm({...employeeForm, salary:e.target.value})} placeholder="راتب" />
                    <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow mt-2">حفظ ✅</button>
                    {employeeForm.id && <button type="button" className="btn btn-link text-muted extra-small" onClick={()=>setEmployeeForm({id:'', name:'', phone:'', job:'مدرب لياقة', salary:'0'})}>إلغاء</button>}
                  </form>
                </div>
                <div className="card p-3 rounded-4 border-0 bg-white border-top border-4 border-success shadow-sm">
                   <h6 className="fw-800 text-success mb-3">صرف راتب / سلفة</h6>
                   <form onSubmit={async (e) => {
                      e.preventDefault(); if(!requireSupabase()) return; const f = e.target as any; const amt = Number(f.amt.value); const empId = f.eid.value; const bal = getEmployeeBalance(empId);
                      if (amt > bal) return alert(`الرصيد المتاح ${formatNum(bal)} ₪ فقط! (الراتب - السلف - الديون)`);
                      setLoading(true); try {
                        await supabase!.from('transactions').insert({ type: f.type.value, amount: amt, label: `${f.type.value==='SALARY_PAYMENT'?'راتب':'سلفة'} لـ: ${employees.find(ev=>ev.id===empId)?.name}`, metadata: { employee_id: empId, month: f.month.value, year: f.year.value } });
                        f.reset(); await fetchData(); alert('تم الصرف ✅');
                      } catch(err: any){ alert(err.message); } finally { setLoading(false); }
                   }} className="row g-2">
                      <select name="eid" className="form-select rounded-pill shadow-sm" required><option value="">-- اختر الموظف --</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} (المتاح: {formatNum(getEmployeeBalance(e.id))} ₪)</option>)}</select>
                      <select name="type" className="form-select rounded-pill shadow-sm"><option value="SALARY_PAYMENT">راتب</option><option value="ADVANCE">سلفة</option></select>
                      <div className="d-flex gap-1">
                        <select name="month" className="form-select rounded-pill shadow-sm" required defaultValue={new Date().getMonth()+1}>{MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
                        <select name="year" className="form-select rounded-pill shadow-sm" required defaultValue={new Date().getFullYear()}>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
                      </div>
                      <input name="amt" type="number" step="0.01" onFocus={handleAutoSelect} className="form-control rounded-pill text-center border-success fw-bold" placeholder="المبلغ (₪)" required />
                      <button className="btn btn-success w-100 rounded-pill py-2 shadow fw-bold mt-2">تأكيد ✅</button>
                   </form>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="card p-3 shadow-sm border-0 bg-white h-100 shadow-lg">
                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                     <h6 className="fw-800 mb-0">سجل الرواتب والموظفين</h6>
                     <div className="d-flex gap-1">
                        <select className="form-select form-select-sm rounded-pill shadow-sm" style={{width: 100}} value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))}>{MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
                        <select className="form-select form-select-sm rounded-pill shadow-sm" style={{width: 85}} value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))}>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
                     </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover extra-small align-middle text-end mb-0">
                      <thead><tr className="table-light"><th>الاسم</th><th>الراتب الأساسي</th><th>الرصيد المتاح</th><th>إجراء</th></tr></thead>
                      <tbody>{employees.filter(e => {
                         const hasTr = transactions.some(t => t.metadata?.employee_id === e.id && Number(t.metadata?.month) === selectedMonth && Number(t.metadata?.year) === selectedYear);
                         return hasTr || (selectedMonth === (new Date().getMonth()+1));
                      }).map(e=>(
                        <tr key={e.id}>
                          <td className="fw-bold">{e.name}</td>
                          <td className="fw-bold">{formatNum(e.salary)} ₪</td>
                          <td className={`fw-bold ${getEmployeeBalance(e.id) > 0 ? 'text-success' : 'text-danger'}`}>{formatNum(getEmployeeBalance(e.id))} ₪</td>
                          <td><div className="d-flex gap-1">
                            <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm" onClick={()=>setEmployeeForm({id:e.id, name:e.name, phone:e.phone, job:e.job_title, salary:String(e.salary)})}><i className="fas fa-edit"></i></button>
                            <button className="btn btn-xs btn-outline-dark rounded-pill px-3" onClick={()=>setStatementPerson({...e, type:'employee'})}>كشف</button>
                            <a href={getWhatsAppLink(e.phone)} className="btn btn-xs btn-outline-success rounded-circle shadow-sm"><i className="fab fa-whatsapp"></i></a>
                          </div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'customers' && (
            <div className="row g-3">
              <div className="col-12">
                <div className="card p-3 shadow-sm border-0 bg-white shadow-lg mb-3">
                   <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-start border-4 border-danger ps-3">
                    <h5 className="fw-800 mb-0 text-danger">العملاء والمديونيات</h5>
                    <div className="d-flex gap-2 mt-3 mt-md-0 align-items-center flex-wrap">
                      <input className="form-control form-control-sm rounded-pill shadow-sm border px-3 extra-small" style={{maxWidth: '200px'}} placeholder="بحث..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                      <button className="btn btn-danger btn-sm rounded-pill px-4 shadow-sm fw-bold" onClick={()=>{
                         if(!requireSupabase()) return;
                         const n = prompt('اسم العميل:'); const ph = prompt('رقم الجوال:');
                         if(n && ph){
                           if(checkDuplicate(n, ph)) return alert('البيانات موجودة مسبقاً!');
                           supabase!.from('customers').insert([{full_name: n, phone_number: ph, total_debt: 0}]).then(()=>fetchData());
                         }
                      }}>إضافة عميل +</button>
                      <select className="form-select form-select-sm rounded-pill shadow-sm border" style={{width:130}} value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))}>
                        {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                      </select>
                      <div className="bg-light p-2 rounded-pill px-3 border shadow-sm small fw-bold">دين شهر {MONTHS_AR[selectedMonth-1]}: <span className="text-danger fw-800 ms-1">{formatNum(transactions.filter(t=> (new Date(t.created_at).getMonth()+1 === selectedMonth) && (t.metadata?.debt_added > 0)).reduce((s,t)=> s + (t.metadata.debt_added || 0), 0))} ₪</span></div>
                    </div>
                  </div>
                  
                  <h6 className="fw-800 text-danger mb-2 border-bottom pb-2">المديونين فقط</h6>
                  <div className="table-responsive mb-4">
                    <table className="table table-hover extra-small align-middle text-end mb-0">
                      <thead className="table-light text-danger"><tr><th>الاسم</th><th>إجمالي الدين</th><th>إجراء</th></tr></thead>
                      <tbody>
                        {[...members, ...customers, ...employees].filter(c => {
                          const d = (c as any).total_debt || ( (c as any).salary ? (getEmployeeBalance(c.id) < 0 ? Math.abs(getEmployeeBalance(c.id)) : 0) : 0);
                          return d > 0.01 && ((c as any).full_name || (c as any).name)?.includes(searchTerm);
                        }).map(c => (
                          <tr key={c.id} className="bg-danger bg-opacity-10">
                            <td className="fw-bold">{(c as any).full_name || (c as any).name}</td>
                            <td className="text-danger fw-800">{formatNum((c as any).total_debt || Math.abs(getEmployeeBalance(c.id)))} ₪</td>
                            <td><div className="d-flex gap-1">
                               <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm" onClick={()=>setRepayingPerson({...c, type: 'customer'})}>تسديد</button>
                               <button className="btn btn-sm btn-outline-dark rounded-pill px-3 shadow-sm" onClick={()=>setStatementPerson({...c, type: 'customer'})}>كشف</button>
                               <button className="btn btn-sm btn-outline-primary rounded-pill shadow-sm" onClick={async()=>{
                                 const tableName = (c as any).full_name ? 'customers' : (c as any).salary ? 'employees' : 'members';
                                 const currentName = (c as any).full_name || (c as any).name;
                                 const currentPhone = (c as any).phone_number || (c as any).phone;
                                 const newName = prompt('الاسم:', currentName);
                                 if(!newName) return;
                                 const newPhone = prompt('رقم الجوال:', currentPhone);
                                 if(!newPhone) return;
                                 if(!requireSupabase()) return;
                                 const updateData = tableName === 'customers' ? {full_name: newName, phone_number: newPhone} : {name: newName, phone: newPhone};
                                 await supabase!.from(tableName).update(updateData).eq('id', c.id);
                                 await fetchData();
                                 alert('تم التعديل ✅');
                               }}><i className="fas fa-edit"></i></button>
                               <a href={getWhatsAppLink((c as any).phone_number || (c as any).phone)} className="btn btn-sm btn-outline-success rounded-circle shadow-sm"><i className="fab fa-whatsapp"></i></a>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h6 className="fw-800 text-muted mb-2 border-bottom pb-2">جميع المسجلين</h6>
                  <div className="table-responsive">
                    <table className="table table-hover extra-small align-middle text-end mb-0">
                      <thead><tr className="table-light"><th>الاسم</th><th>واتساب</th><th>إجراء</th></tr></thead>
                      <tbody>
                        {[...members, ...customers, ...employees].filter(c => ((c as any).full_name || (c as any).name)?.includes(searchTerm)).map(c => (
                          <tr key={c.id}>
                            <td className="fw-bold">{(c as any).full_name || (c as any).name}</td>
                            <td><a href={getWhatsAppLink((c as any).phone_number || (c as any).phone)} className="text-success fs-5"><i className="fab fa-whatsapp"></i></a></td>
                            <td><div className="d-flex gap-1">
                               <button className="btn btn-sm btn-outline-dark rounded-pill px-3 shadow-sm" onClick={()=>setStatementPerson({...c, type: 'customer'})}>كشف</button>
                               <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm" onClick={async()=>{
                                 const tableName = (c as any).full_name ? 'customers' : (c as any).salary ? 'employees' : 'members';
                                 const currentName = (c as any).full_name || (c as any).name;
                                 const currentPhone = (c as any).phone_number || (c as any).phone;
                                 const newName = prompt('الاسم:', currentName);
                                 if(!newName) return;
                                 const newPhone = prompt('رقم الجوال:', currentPhone);
                                 if(!newPhone) return;
                                 if(!requireSupabase()) return;
                                 const updateData = tableName === 'customers' ? {full_name: newName, phone_number: newPhone} : {name: newName, phone: newPhone};
                                 await supabase!.from(tableName).update(updateData).eq('id', c.id);
                                 await fetchData();
                                 alert('تم التعديل ✅');
                               }}><i className="fas fa-edit"></i></button>
                               <button className="btn btn-xs btn-outline-danger rounded-pill shadow-sm" onClick={async()=>{
                                 if(!requireSupabase()) return;
                                 if(((c as any).total_debt || 0) > 0) return alert('لا يمكن الحذف وعليه دين!');
                                 if(confirm('حذف البيانات؟')){ await supabase!.from((c as any).full_name ? 'customers' : (c as any).salary ? 'employees' : 'members').delete().eq('id', c.id); fetchData(); }
                               }}><i className="fas fa-trash"></i></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'expenses' && (
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="card p-3 shadow-sm rounded-4 border-0 bg-white border-top border-4 border-danger shadow-lg">
                  <h6 className="fw-800 text-danger mb-3">{expenseForm.id ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h6>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!requireSupabase()) return;
                    if (!expenseForm.label || Number(expenseForm.amount) <= 0) return alert('يرجى ملء جميع الحقول بشكل صحيح!');
                    setLoading(true);
                    try {
                      const payload = {
                        type: 'EXPENSE' as const,
                        amount: Number(expenseForm.amount),
                        label: expenseForm.label,
                        metadata: { category: expenseForm.category }
                      };
                      if (expenseForm.id) {
                        await supabase!.from('transactions').update(payload).eq('id', expenseForm.id);
                      } else {
                        await supabase!.from('transactions').insert([payload]);
                      }
                      setExpenseForm({ id: '', label: '', amount: '0', category: 'عامة' });
                      await fetchData();
                      alert('تم الحفظ بنجاح ✅');
                    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
                  }} className="row g-2">
                    <input className="form-control rounded-pill shadow-sm" placeholder="وصف المصروف" value={expenseForm.label} onChange={e => setExpenseForm({ ...expenseForm, label: e.target.value })} required />
                    <select className="form-select rounded-pill shadow-sm" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                      <option value="عامة">عامة</option>
                      <option value="إيجار">إيجار</option>
                      <option value="كهرباء">كهرباء</option>
                      <option value="مياه">مياه</option>
                      <option value="صيانة">صيانة</option>
                      <option value="نظافة">نظافة</option>
                      <option value="تسويق">تسويق</option>
                      <option value="مستلزمات">مستلزمات</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                    <div className="small text-muted ms-2">المبلغ (₪)</div>
                    <input type="number" step="0.01" className="form-control rounded-pill shadow-sm text-center fw-bold border-danger" onFocus={handleAutoSelect} placeholder="المبلغ" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                    <button className="btn btn-danger w-100 rounded-pill py-2 fw-bold shadow mt-2">حفظ ✅</button>
                    {expenseForm.id && <button type="button" className="btn btn-link text-muted extra-small" onClick={() => setExpenseForm({ id: '', label: '', amount: '0', category: 'عامة' })}>إلغاء</button>}
                  </form>
                </div>
                <div className="card p-3 shadow-sm rounded-4 border-0 bg-danger bg-opacity-10 border-top border-4 border-danger mt-3">
                  <div className="text-center">
                    <small className="text-muted fw-bold">إجمالي المصروفات</small>
                    <h3 className="fw-800 text-danger mb-0">{formatNum(transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0))} ₪</h3>
                  </div>
                </div>
                
                {/* المسحوبات الشخصية */}
                <div className="card p-3 shadow-sm rounded-4 border-0 bg-white border-top border-4 border-dark mt-3 shadow-lg">
                  <h6 className="fw-800 text-dark mb-3"><i className="fas fa-hand-holding-usd me-2"></i>مسحوبات شخصية</h6>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!requireSupabase()) return;
                    const form = e.target as any;
                    const amt = Number(form.withdrawalAmount.value);
                    const note = form.withdrawalNote.value || 'مسحوبات شخصية';
                    if (amt <= 0) return alert('يرجى إدخال مبلغ صحيح!');
                    setLoading(true);
                    try {
                      await supabase!.from('transactions').insert([{
                        type: 'PERSONAL_WITHDRAWAL',
                        amount: amt,
                        label: note,
                        metadata: {}
                      }]);
                      form.reset();
                      await fetchData();
                      alert('تم تسجيل المسحوبات ✅');
                    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
                  }} className="row g-2">
                    <input name="withdrawalNote" className="form-control rounded-pill shadow-sm" placeholder="ملاحظة (اختياري)" />
                    <input name="withdrawalAmount" type="number" step="0.01" className="form-control rounded-pill shadow-sm text-center fw-bold border-dark" onFocus={handleAutoSelect} placeholder="المبلغ (₪)" required />
                    <button className="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow mt-2">سحب من الصندوق 💰</button>
                  </form>
                  <div className="mt-3 p-2 bg-dark bg-opacity-10 rounded-3 text-center">
                    <small className="text-muted fw-bold">إجمالي المسحوبات: </small>
                    <span className="fw-800 text-dark">{formatNum(transactions.filter(t => t.type === 'PERSONAL_WITHDRAWAL').reduce((s, t) => s + t.amount, 0))} ₪</span>
                  </div>
                </div>
                
                {/* كشف المسحوبات الشهري */}
                <div className="card p-3 shadow-sm rounded-4 border-0 bg-white border-top border-4 border-secondary mt-3 shadow-lg">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                    <h6 className="fw-800 text-secondary mb-0"><i className="fas fa-list-alt me-2"></i>كشف المسحوبات</h6>
                    <div className="d-flex gap-1 mt-2 mt-md-0">
                      <select className="form-select form-select-sm rounded-pill shadow-sm" style={{ width: 90 }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{MONTHS_AR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
                      <select className="form-select form-select-sm rounded-pill shadow-sm" style={{ width: 80 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                  </div>
                  <div className="mb-2 p-2 bg-secondary bg-opacity-10 rounded-3 text-center">
                    <small className="text-muted fw-bold">مسحوبات {MONTHS_AR[selectedMonth - 1]} {selectedYear}: </small>
                    <span className="fw-800 text-dark">{formatNum(transactions.filter(t => t.type === 'PERSONAL_WITHDRAWAL' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).reduce((s, t) => s + t.amount, 0))} ₪</span>
                  </div>
                  <div className="table-responsive" style={{maxHeight: '200px', overflowY: 'auto'}}>
                    <table className="table table-sm table-hover extra-small align-middle text-end mb-0">
                      <thead className="table-light sticky-top"><tr><th>التاريخ</th><th>الملاحظة</th><th>المبلغ</th><th></th></tr></thead>
                      <tbody>
                        {transactions.filter(t => t.type === 'PERSONAL_WITHDRAWAL' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).map(t => (
                          <tr key={t.id}>
                            <td className="text-muted">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="fw-bold">{t.label}</td>
                            <td className="fw-800 text-dark">{formatNum(t.amount)} ₪</td>
                            <td>
                              <button className="btn btn-xs btn-outline-danger rounded-pill" onClick={async () => {
                                if (!requireSupabase()) return;
                                if (confirm('هل تريد حذف هذه المسحوبات؟')) {
                                  await supabase!.from('transactions').delete().eq('id', t.id);
                                  await fetchData();
                                }
                              }}><i className="fas fa-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.filter(t => t.type === 'PERSONAL_WITHDRAWAL' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).length === 0 && (
                      <div className="text-center text-muted py-3">
                        <i className="fas fa-inbox mb-1"></i>
                        <p className="mb-0 extra-small">لا توجد مسحوبات لهذا الشهر</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="card p-3 shadow-sm border-0 bg-white h-100 shadow-lg">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <h6 className="fw-800 mb-0">سجل المصروفات</h6>
                    <div className="d-flex gap-1 mt-2 mt-md-0">
                      <select className="form-select form-select-sm rounded-pill shadow-sm" style={{ width: 100 }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{MONTHS_AR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
                      <select className="form-select form-select-sm rounded-pill shadow-sm" style={{ width: 85 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                  </div>
                  <div className="mb-3 p-2 bg-light rounded-3 text-center">
                    <small className="text-muted fw-bold">مصروفات شهر {MONTHS_AR[selectedMonth - 1]} {selectedYear}: </small>
                    <span className="fw-800 text-danger">{formatNum(transactions.filter(t => t.type === 'EXPENSE' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).reduce((s, t) => s + t.amount, 0))} ₪</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover extra-small align-middle text-end mb-0">
                      <thead><tr className="table-light"><th>التاريخ</th><th>الوصف</th><th>الفئة</th><th>المبلغ</th><th>إجراء</th></tr></thead>
                      <tbody>
                        {transactions.filter(t => t.type === 'EXPENSE' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).map(t => (
                          <tr key={t.id}>
                            <td className="text-muted">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="fw-bold">{t.label}</td>
                            <td><span className="badge bg-danger bg-opacity-25 text-danger rounded-pill px-3">{t.metadata?.category || 'عامة'}</span></td>
                            <td className="fw-800 text-danger">{formatNum(t.amount)} ₪</td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm" onClick={() => setExpenseForm({ id: t.id, label: t.label, amount: String(t.amount), category: t.metadata?.category || 'عامة' })}><i className="fas fa-edit"></i></button>
                                <button className="btn btn-xs btn-outline-danger rounded-pill shadow-sm" onClick={async () => {
                                  if (!requireSupabase()) return;
                                  if (confirm('هل تريد حذف هذا المصروف؟')) {
                                    await supabase!.from('transactions').delete().eq('id', t.id);
                                    await fetchData();
                                  }
                                }}><i className="fas fa-trash"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.filter(t => t.type === 'EXPENSE' && new Date(t.created_at).getMonth() + 1 === selectedMonth && new Date(t.created_at).getFullYear() === selectedYear).length === 0 && (
                      <div className="text-center text-muted py-4">
                        <i className="fas fa-inbox fa-2x mb-2"></i>
                        <p className="mb-0">لا توجد مصروفات لهذا الشهر</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'reports' && (
            <div className="row g-3 text-center">
               <div className="col-12 bg-white p-4 rounded-4 shadow-sm mb-2 d-flex flex-wrap align-items-center justify-content-between border shadow-lg">
                  <h5 className="fw-800 mb-0">التقرير المالي المحاسبي</h5>
               </div>
               {reportData && (
                 <>
                    <div className="col-md-4 col-6"><div className="card p-3 border-0 bg-primary text-white shadow-lg"><small className="fw-bold opacity-75">إيرادات الاشتراكات (+دين)</small><h3 className="fw-800">{formatNum(reportData.membershipRev)} ₪</h3></div></div>
                    <div className="col-md-4 col-6"><div className="card p-3 border-0 bg-info text-white shadow-lg"><small className="fw-bold opacity-75">إيرادات المبيعات (+دين)</small><h3 className="fw-800">{formatNum(reportData.posRev)} ₪</h3></div></div>
                    <div className="col-md-4 col-12"><div className="card p-3 border-0 bg-success text-white shadow-lg"><small className="fw-bold opacity-75">الإيرادات الكلية</small><h3 className="fw-800">{formatNum(reportData.totalIncome)} ₪</h3></div></div>
                    <div className="col-md-3 col-6"><div className="card p-3 border-0 bg-white text-danger shadow-sm border-top border-4 border-danger h-100"><small className="fw-bold text-muted">الرواتب والمصروفات</small><h3>{formatNum(reportData.salaries + reportData.expenses)} ₪</h3></div></div>
                    <div className="col-md-3 col-6"><div className="card p-3 border-0 bg-white text-warning shadow-sm border-top border-4 border-warning h-100"><small className="fw-bold text-muted">المشتريات</small><h3>{formatNum(reportData.purchases)} ₪</h3></div></div>
                    <div className="col-md-3 col-6"><div className="card p-3 border-0 bg-white text-dark shadow-sm border-top border-4 border-dark h-100"><small className="fw-bold text-muted">مسحوبات شخصية</small><h3>{formatNum(reportData.personalWithdrawals)} ₪</h3></div></div>
                    <div className="col-md-3 col-6"><div className="card p-4 border-0 bg-danger bg-opacity-10 rounded-4 shadow-sm d-flex flex-column align-items-center"><h6 className="fw-800 text-danger mb-1">الديون لنا</h6><h2 className="fw-800 text-danger mb-0 fs-2">{formatNum(reportData.debtsOnOthers)} ₪</h2></div></div>
                    <div className="col-md-12 mt-4"><div className={`card p-5 bg-dark text-white rounded-5 shadow-2xl border-0 border-top border-5 ${reportData.net >= 0 ? 'border-success' : 'border-danger'}`}><h5 className="opacity-75 fw-bold">الربح الصافي</h5><h1 className={`fw-800 ${reportData.net >= 0 ? 'text-success' : 'text-danger'}`} style={{fontSize: '4.5rem'}}>{formatNum(reportData.net)} ₪</h1></div></div>
                 </>
               )}
            </div>
          )}

          {view === 'opening' && (
            <div className="row g-3">
              <div className="col-12">
                <div className="card p-4 shadow-lg border-0 bg-white border-top border-4 border-info">
                  <h5 className="fw-800 mb-4 text-info"><i className="fas fa-balance-scale me-2"></i>الأرصدة الافتتاحية</h5>
                  <p className="text-muted small mb-4">استخدم هذه الصفحة لإدخال البيانات الموجودة قبل بدء استخدام النظام.</p>
                  
                  {/* رصيد الصندوق الافتتاحي */}
                  <div className="card p-3 border-0 bg-dark text-white rounded-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                      <div>
                        <h6 className="fw-800 mb-1"><i className="fas fa-cash-register me-2"></i>رصيد الصندوق الافتتاحي</h6>
                        <small className="opacity-75">المبلغ النقدي الموجود عند بدء استخدام النظام (رأس المال + البضاعة)</small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-800 fs-4">{formatNum(transactions.filter(t => t.type === 'OPENING_BALANCE').reduce((s, t) => s + t.amount, 0))} ₪</span>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!requireSupabase()) return;
                          const form = e.target as any;
                          const amt = Number(form.openingAmount.value);
                          if (amt <= 0) return alert('يرجى إدخال مبلغ صحيح!');
                          setLoading(true);
                          try {
                            await supabase!.from('transactions').insert([{
                              type: 'OPENING_BALANCE',
                              amount: amt,
                              label: 'رصيد افتتاحي',
                              metadata: {}
                            }]);
                            form.reset();
                            await fetchData();
                            alert('تم إضافة الرصيد الافتتاحي ✅');
                          } catch (err: any) { alert(err.message); } finally { setLoading(false); }
                        }} className="d-flex gap-2">
                          <input name="openingAmount" type="number" step="0.01" className="form-control rounded-pill text-center fw-bold" style={{width: '120px'}} placeholder="المبلغ" required />
                          <button className="btn btn-success rounded-pill px-3 fw-bold">+ إضافة</button>
                        </form>
                      </div>
                    </div>
                    {transactions.filter(t => t.type === 'OPENING_BALANCE').length > 0 && (
                      <div className="mt-3 pt-3 border-top border-secondary">
                        <small className="text-muted">سجل الأرصدة الافتتاحية:</small>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {transactions.filter(t => t.type === 'OPENING_BALANCE').map(t => (
                            <span key={t.id} className="badge bg-light text-dark rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                              {formatNum(t.amount)} ₪
                              <button className="btn btn-sm p-0 text-danger" onClick={async () => {
                                if (!requireSupabase()) return;
                                if (confirm('حذف هذا الرصيد؟')) {
                                  await supabase!.from('transactions').delete().eq('id', t.id);
                                  await fetchData();
                                }
                              }}><i className="fas fa-times"></i></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="row g-4">
                    {/* ديون الأعضاء */}
                    <div className="col-md-6">
                      <div className="card p-3 border-0 bg-primary bg-opacity-10 rounded-4 h-100">
                        <h6 className="fw-800 text-primary mb-3"><i className="fas fa-users me-2"></i>ديون الأعضاء (لنا)</h6>
                        <div className="table-responsive" style={{maxHeight: '250px', overflowY: 'auto'}}>
                          <table className="table table-sm extra-small text-end mb-0">
                            <thead className="table-light sticky-top"><tr><th>العضو</th><th>الدين الحالي</th><th>تعديل</th></tr></thead>
                            <tbody>
                              {members.map(m => (
                                <tr key={m.id}>
                                  <td className="fw-bold">{m.name}</td>
                                  <td className="text-danger fw-800">{formatNum(m.total_debt)} ₪</td>
                                  <td>
                                    <input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center" style={{width: '100px'}} 
                                      defaultValue={m.total_debt} 
                                      onBlur={async (e) => {
                                        if (!requireSupabase()) return;
                                        const newDebt = Number(e.target.value) || 0;
                                        if (newDebt !== m.total_debt) {
                                          await supabase!.from('members').update({ total_debt: newDebt }).eq('id', m.id);
                                          await fetchData();
                                        }
                                      }} 
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {members.length === 0 && <p className="text-muted text-center py-3 mb-0">لا يوجد أعضاء</p>}
                        </div>
                      </div>
                    </div>

                    {/* ديون العملاء */}
                    <div className="col-md-6">
                      <div className="card p-3 border-0 bg-success bg-opacity-10 rounded-4 h-100">
                        <h6 className="fw-800 text-success mb-3"><i className="fas fa-hand-holding-usd me-2"></i>ديون العملاء (لنا)</h6>
                        <div className="table-responsive" style={{maxHeight: '250px', overflowY: 'auto'}}>
                          <table className="table table-sm extra-small text-end mb-0">
                            <thead className="table-light sticky-top"><tr><th>العميل</th><th>الدين الحالي</th><th>تعديل</th></tr></thead>
                            <tbody>
                              {customers.map(c => (
                                <tr key={c.id}>
                                  <td className="fw-bold">{c.full_name}</td>
                                  <td className="text-danger fw-800">{formatNum(c.total_debt)} ₪</td>
                                  <td>
                                    <input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center" style={{width: '100px'}} 
                                      defaultValue={c.total_debt} 
                                      onBlur={async (e) => {
                                        if (!requireSupabase()) return;
                                        const newDebt = Number(e.target.value) || 0;
                                        if (newDebt !== c.total_debt) {
                                          await supabase!.from('customers').update({ total_debt: newDebt }).eq('id', c.id);
                                          await fetchData();
                                        }
                                      }} 
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {customers.length === 0 && <p className="text-muted text-center py-3 mb-0">لا يوجد عملاء</p>}
                        </div>
                      </div>
                    </div>

                    {/* ديون الموردين */}
                    <div className="col-md-6">
                      <div className="card p-3 border-0 bg-danger bg-opacity-10 rounded-4 h-100">
                        <h6 className="fw-800 text-danger mb-3"><i className="fas fa-truck me-2"></i>ديون الموردين (علينا)</h6>
                        <div className="table-responsive" style={{maxHeight: '250px', overflowY: 'auto'}}>
                          <table className="table table-sm extra-small text-end mb-0">
                            <thead className="table-light sticky-top"><tr><th>المورد</th><th>الدين الحالي</th><th>تعديل</th></tr></thead>
                            <tbody>
                              {suppliers.map(s => (
                                <tr key={s.id}>
                                  <td className="fw-bold">{s.name}</td>
                                  <td className="text-danger fw-800">{formatNum(s.total_debt)} ₪</td>
                                  <td>
                                    <input type="number" step="0.01" className="form-control form-control-sm rounded-pill text-center" style={{width: '100px'}} 
                                      defaultValue={s.total_debt} 
                                      onBlur={async (e) => {
                                        if (!requireSupabase()) return;
                                        const newDebt = Number(e.target.value) || 0;
                                        if (newDebt !== s.total_debt) {
                                          await supabase!.from('suppliers').update({ total_debt: newDebt }).eq('id', s.id);
                                          await fetchData();
                                        }
                                      }} 
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {suppliers.length === 0 && <p className="text-muted text-center py-3 mb-0">لا يوجد موردين</p>}
                        </div>
                      </div>
                    </div>

                    {/* المخزون */}
                    <div className="col-md-6">
                      <div className="card p-3 border-0 bg-warning bg-opacity-10 rounded-4 h-100">
                        <h6 className="fw-800 text-warning mb-3"><i className="fas fa-boxes me-2"></i>مخزون المنتجات</h6>
                        <div className="table-responsive" style={{maxHeight: '250px', overflowY: 'auto'}}>
                          <table className="table table-sm extra-small text-end mb-0">
                            <thead className="table-light sticky-top"><tr><th>المنتج</th><th>الكمية</th><th>تعديل</th></tr></thead>
                            <tbody>
                              {inventory.map(p => (
                                <tr key={p.id}>
                                  <td className="fw-bold">{p.name}</td>
                                  <td className="fw-800">{p.quantity || 0}</td>
                                  <td>
                                    <input type="number" className="form-control form-control-sm rounded-pill text-center" style={{width: '80px'}} 
                                      defaultValue={p.quantity || 0} 
                                      onBlur={async (e) => {
                                        if (!requireSupabase()) return;
                                        const newStock = Number(e.target.value) || 0;
                                        if (newStock !== (p.quantity || 0)) {
                                          await supabase!.from('products').update({ quantity: newStock }).eq('id', p.id);
                                          await fetchData();
                                        }
                                      }} 
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {inventory.length === 0 && <p className="text-muted text-center py-3 mb-0">لا يوجد منتجات</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-4 mb-0 rounded-4">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>ملاحظة:</strong> التعديلات تُحفظ تلقائياً عند مغادرة الحقل. هذه الأرصدة لا تُسجّل كمعاملات جديدة.
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="row g-3">
              <div className="col-md-6 mx-auto text-center">
                <div className="card p-4 shadow-lg border-0 bg-white mb-3 border-top border-4 border-primary shadow-lg">
                  <h5 className="fw-800 mb-4 border-bottom pb-2 text-primary">تغيير كلمة المرور</h5>
                  <form onSubmit={async(e)=>{
                    e.preventDefault();
                    if(passForm.old !== (localStorage.getItem('dynamogym_pass') || 'admin')) return alert('كلمة المرور الحالية خاطئة');
                    if(passForm.newP !== passForm.conf) return alert('الجديدة غير متطابقة');
                    localStorage.setItem('dynamogym_pass', passForm.newP); alert('تم التحديث بنجاح ✅'); setPassForm({old:'', newP:'', conf:''});
                  }} className="row g-3">
                    <input className="form-control rounded-pill text-center shadow-sm" type="password" placeholder="القديمة" value={passForm.old} onChange={e=>setPassForm({...passForm, old:e.target.value})} />
                    <input className="form-control rounded-pill text-center shadow-sm" type="password" placeholder="الجديدة" value={passForm.newP} onChange={e=>setPassForm({...passForm, newP:e.target.value})} />
                    <input className="form-control rounded-pill text-center shadow-sm" type="password" placeholder="تأكيد" value={passForm.conf} onChange={e=>setPassForm({...passForm, conf:e.target.value})} />
                    <button className="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow">تحديث 🔐</button>
                  </form>
                </div>
                <div className="card p-4 shadow-lg border-0 bg-white mb-3 text-center border-top border-4 border-info shadow-lg">
                  <h5 className="fw-800 mb-3 border-bottom pb-2 text-info">اللوجو والهوية</h5>
                  {clubLogo && <img src={clubLogo} style={{maxHeight: 120}} className="rounded mb-3 mx-auto shadow-sm border p-1" />}
                  <label className="btn btn-outline-primary btn-sm rounded-pill w-100 fw-bold shadow-sm">تغيير اللوجو <input type="file" className="d-none" accept="image/*" onChange={(e)=>{
                    const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend=()=>{ const b = r.result as string; setClubLogo(b); localStorage.setItem('dynamogym_logo', b); }; r.readAsDataURL(f); }
                  }} /></label>
                </div>
              </div>
            </div>
          )}

          {view === 'suppliers' && (
             <div className="row g-3">
                <div className="col-lg-4">
                  <div className="card p-3 shadow-sm rounded-4 bg-white border-top border-4 border-primary shadow-lg">
                    <h6 className="fw-800 text-primary mb-3">إدارة الموردين</h6>
                    <form onSubmit={async(e)=>{
                      e.preventDefault(); if(!requireSupabase()) return; setLoading(true); try{ 
                        const p = {name:supplierForm.name, phone:supplierForm.phone, category:supplierForm.category};
                        if(supplierForm.id) await supabase!.from('suppliers').update(p).eq('id', supplierForm.id);
                        else await supabase!.from('suppliers').insert([{...p, total_debt: 0}]);
                        setSupplierForm({id:'', name:'', phone:'', category:''}); await fetchData(); alert('تم الحفظ ✅');
                      } catch(err:any){alert(err.message);} finally{setLoading(false);}
                    }} className="row g-2">
                      <input className="form-control rounded-pill shadow-sm" placeholder="الاسم" value={supplierForm.name} onChange={e=>setSupplierForm({...supplierForm, name:e.target.value})} required />
                      <input className="form-control rounded-pill shadow-sm" placeholder="واتساب" value={supplierForm.phone} onChange={e=>setSupplierForm({...supplierForm, phone:e.target.value})} required />
                      <input className="form-control rounded-pill shadow-sm" placeholder="الفئة" value={supplierForm.category} onChange={e=>setSupplierForm({...supplierForm, category:e.target.value})} />
                      <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow mt-2">حفظ ✅</button>
                    </form>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="card p-3 shadow-sm border-0 bg-white h-100 shadow-lg">
                    <h6 className="fw-800 border-bottom pb-2">سجل الموردين</h6>
                    <div className="table-responsive">
                      <table className="table table-hover extra-small align-middle text-end mb-0">
                        <thead><tr className="table-light"><th>الاسم</th><th>الدين</th><th>تواصل</th><th>إجراء</th></tr></thead>
                        <tbody>{suppliers.map(s=>(<tr key={s.id}><td className="fw-bold">{s.name}</td><td className="text-danger fw-800">{formatNum(s.total_debt)} ₪</td><td><a href={getWhatsAppLink(s.phone)} className="text-success fs-5"><i className="fab fa-whatsapp"></i></a></td><td><div className="d-flex gap-1">
                           <button className="btn btn-xs btn-outline-primary rounded-pill shadow-sm" onClick={()=>setSupplierForm({id:s.id, name:s.name, phone:s.phone, category:s.category})}><i className="fas fa-edit"></i></button>
                           <button className="btn btn-xs btn-success px-3 fw-bold rounded-pill shadow-sm" onClick={()=>setRepayingPerson({...s, type:'supplier'})}>تسديد</button>
                           <button className="btn btn-xs btn-outline-dark rounded-pill px-3 shadow-sm" onClick={()=>setStatementPerson({...s, type:'supplier'})}>كشف</button>
                        </div></td></tr>))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* --- النوافذ المنبثقة --- */}
        {memberDetails && (
          <div className="modal-custom" onClick={()=>setMemberDetails(null)}>
            <div className="card w-100 shadow-2xl border-0 bg-white rounded-5 p-4 text-center border-top border-4 border-danger shadow-lg" style={{maxWidth: '450px'}} onClick={e=>e.stopPropagation()}>
               <div className="d-flex justify-content-end mb-2"><button className="btn-close shadow-sm rounded-circle p-2" onClick={()=>setMemberDetails(null)}></button></div>
               <div className="bg-light rounded-4 overflow-hidden mb-3 border border-4 border-danger mx-auto shadow-sm" style={{width: 140, height: 160}}>
                  {memberDetails.photo ? <img src={memberDetails.photo} className="w-100 h-100 object-fit-cover" alt="Member" /> : <i className="fas fa-user fa-3x text-muted mt-4 d-block"></i>}
               </div>
               <h4 className="fw-800 mb-1">{memberDetails.name}</h4>
               <div className="badge bg-danger rounded-pill px-4 mb-3 fs-6 shadow-sm">الدين: {formatNum(memberDetails.total_debt)} ₪</div>
               <div className="row g-2 text-start small mb-4 px-2">
                 <div className="col-6 bg-light p-2 rounded border shadow-sm"><b>الباقة:</b> {memberDetails.subscription_plan}</div>
                 <div className="col-6 bg-light p-2 rounded border text-danger fw-bold shadow-sm"><b>المتبقي:</b> {getDaysRemaining(memberDetails.end_date)} يوم</div>
                 <div className="col-6 bg-light p-2 rounded border shadow-sm"><b>البداية:</b> {memberDetails.start_date}</div>
                 <div className="col-6 bg-light p-2 rounded border shadow-sm"><b>النهاية:</b> {memberDetails.end_date}</div>
               </div>
               <div className="d-flex flex-wrap gap-2 justify-content-center">
                 <button className="btn btn-success flex-grow-1 rounded-pill fw-bold shadow-lg py-2" onClick={()=>{
                    setMemberForm({ id:memberDetails.id, name:memberDetails.name, phone:memberDetails.phone, plan:memberDetails.subscription_plan, price:String(memberDetails.plan_price), discount:String(memberDetails.discount), paid:'0', start:new Date().toISOString().substring(0,10), weight:String(memberDetails.weight||''), height:String(memberDetails.height||''), photo:memberDetails.photo||'', mode:'CASH', isRenew: true, isEditOnly: false });
                    navigateTo('register'); setMemberDetails(null);
                 }}>تجديد الاشتراك 🔄</button>
                 <button className={`btn rounded-pill px-4 fw-bold shadow-sm py-2 ${memberDetails.status==='frozen'?'btn-success':'btn-warning'}`} onClick={async ()=>{
                    if(!requireSupabase()) return;
                    await supabase!.from('members').update({status: memberDetails.status==='frozen'?'active':'frozen'}).eq('id', memberDetails.id); 
                    fetchData(); setMemberDetails(null);
                 }}>{memberDetails.status==='frozen'?'تنشيط':'تجميد'}</button>
                 <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm py-2" onClick={()=>{
                    setMemberForm({ id:memberDetails.id, name:memberDetails.name, phone:memberDetails.phone, plan:memberDetails.subscription_plan, price:String(memberDetails.plan_price), discount:String(memberDetails.discount), paid:'0', start:memberDetails.start_date, weight:String(memberDetails.weight||''), height:String(memberDetails.height||''), photo:memberDetails.photo||'', mode:'CASH', isRenew: false, isEditOnly: true });
                    navigateTo('register'); setMemberDetails(null);
                 }}>تعديل</button>
                 <a href={getWhatsAppLink(memberDetails.phone)} className="btn btn-outline-success rounded-circle p-3 shadow-sm transition-all hover-scale"><i className="fab fa-whatsapp"></i></a>
               </div>
            </div>
          </div>
        )}

        {showBarcodeScanner && (
          <div className="modal-custom" onClick={()=>stopBarcodeScanner()}>
            <div className="card p-4 shadow-2xl bg-dark text-white rounded-4 border-0" style={{maxWidth: '400px', width: '95%'}} onClick={e=>e.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-800 mb-0"><i className="fas fa-barcode me-2"></i>ماسح الباركود</h5>
                <button className="btn btn-outline-light btn-sm rounded-pill" onClick={stopBarcodeScanner}><i className="fas fa-times"></i></button>
              </div>
              <p className="text-muted small mb-2">وجّه الكاميرا نحو الباركود</p>
              <div id="barcode-scanner-container" style={{width: '100%', minHeight: '250px', borderRadius: '12px', overflow: 'hidden', background: '#000'}}></div>
              <div className="mt-3 text-center">
                <small className="text-muted">
                  {showBarcodeScanner === 'inventory' && 'سيتم تعبئة بيانات الصنف تلقائياً'}
                  {showBarcodeScanner === 'pos' && 'سيتم إضافة الصنف للسلة تلقائياً'}
                  {showBarcodeScanner === 'purchase' && 'سيتم إضافة الصنف للفاتورة تلقائياً'}
                </small>
              </div>
            </div>
          </div>
        )}

        {repayingPerson && (
          <div className="modal-custom" onClick={()=>setRepayingPerson(null)}>
            <div className="card p-4 shadow-2xl bg-white rounded-4 border-0 border-top border-4 border-success shadow-lg" style={{maxWidth: '400px', width: '90%'}} onClick={e=>e.stopPropagation()}>
              <h5 className="fw-800 text-center text-success mb-3">سند قبض تسوية</h5>
              <form onSubmit={async(e)=>{
                e.preventDefault(); if(!requireSupabase()) return; const amt = Number((e.target as any).amt.value); setLoading(true);
                try {
                  // تحديد نوع الشخص باستخدام الـ type المرسل مباشرة
                  const isSupplier = (repayingPerson as any).type === 'supplier';
                  const table = (repayingPerson as any).full_name ? 'customers' : ((repayingPerson as any).salary ? 'employees' : (isSupplier ? 'suppliers' : 'members'));
                  const { data } = await supabase!.from(table).select('total_debt').eq('id', repayingPerson.id).single();
                  await supabase!.from(table).update({ total_debt: Math.max(0, (data?.total_debt || 0) - amt) }).eq('id', repayingPerson.id);
                  
                  const pKey = (repayingPerson as any).full_name ? 'customer_id' : ((repayingPerson as any).salary ? 'employee_id' : (isSupplier ? 'supplier_id' : 'member_id'));
                  // سداد دين المورد = SUPPLIER_PAYMENT (خصم من الصندوق)
                  // تحصيل دين من عضو/عميل = DEBT_PAYMENT (إضافة للصندوق)
                  const transactionType = isSupplier ? 'SUPPLIER_PAYMENT' : 'DEBT_PAYMENT';
                  await supabase!.from('transactions').insert({ type: transactionType, amount: amt, label: `تسوية: ${(repayingPerson as any).full_name || repayingPerson.name}`, metadata: { [pKey]: repayingPerson.id } });
                  setRepayingPerson(null); fetchData();
                } catch(err:any){alert(err.message);} finally{setLoading(false);}
              }}>
                <label className="extra-small fw-bold mb-1">المبلغ (₪)</label>
                <input name="amt" type="number" step="0.01" onFocus={handleAutoSelect} defaultValue={Math.abs((repayingPerson as any).total_debt || getEmployeeBalance(repayingPerson.id))} className="form-control mb-3 rounded-pill text-center fs-3 fw-bold border-success shadow-sm" required />
                <button type="submit" className="btn btn-success w-100 fw-bold rounded-pill py-3 shadow-lg">تأكيد السداد ✅</button>
              </form>
            </div>
          </div>
        )}

        {statementPerson && (
          <div className="modal-custom" onClick={()=>setStatementPerson(null)}>
            <div className="card w-100 shadow-2xl border-0 bg-white rounded-5 p-4 border-top border-4 border-primary shadow-lg" style={{maxWidth: '780px'}} onClick={e=>e.stopPropagation()}>
               <div className="d-flex justify-content-between mb-4 align-items-center border-bottom pb-3 statement-header">
                  <div className="d-flex align-items-center gap-3">
                    {clubLogo && <img src={clubLogo} style={{height: 75, width: 75}} className="rounded shadow-sm p-1 border border-primary" alt="Gym" />}
                    <div><h3 className="fw-800 mb-0">Dynamo<span className="text-danger">Gym</span></h3><small className="text-muted fw-bold">كشف حساب رسمي</small></div>
                  </div>
                  <div className="text-end">
                    <h5 className="fw-800 text-primary mb-1">{(statementPerson as any).full_name || (statementPerson as any).name}</h5>
                    <small className="text-muted d-block fw-bold">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</small>
                  </div>
                  <button className="btn-close d-print-none shadow-sm rounded-circle p-2" onClick={()=>setStatementPerson(null)}></button>
               </div>
               <div className="table-responsive border rounded-4 overflow-hidden shadow-sm" style={{maxHeight: '400px'}}>
                  <table className="table table-sm extra-small align-middle text-end table-hover mb-0">
                    <thead className="table-dark"><tr><th>التاريخ</th><th>البيان</th><th>المدفوع</th><th>دين مضاف</th></tr></thead>
                    <tbody>
                      {transactions.filter(t => t.metadata?.person_id === statementPerson.id || t.metadata?.member_id === statementPerson.id || t.metadata?.employee_id === statementPerson.id || t.metadata?.customer_id === statementPerson.id || t.metadata?.supplier_id === statementPerson.id).map(t=>(
                        <tr key={t.id}><td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td><td className="fw-bold">{t.label}</td><td className="text-success fw-bold">{formatNum(t.amount)} ₪</td><td className="text-danger fw-bold">{formatNum(t.metadata?.debt_added || 0)} ₪</td></tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               <div className="mt-4 p-4 bg-light rounded-4 text-center border-4 border-start border-primary shadow-inner">
                 <div className="small text-muted mb-2 fw-bold">الرصيد المستحق حالياً</div>
                 <h1 className="fw-800 text-primary mb-0" style={{fontSize: '3.5rem'}}>{formatNum((statementPerson as any).total_debt || ((statementPerson as any).salary ? Math.abs(getEmployeeBalance(statementPerson.id)) : 0))} ₪</h1>
               </div>
               <div className="d-flex gap-2 mt-4 d-print-none">
                 <button className="btn btn-dark flex-grow-1 rounded-pill py-3 fw-bold shadow-lg" onClick={()=>window.print()}>طباعة <i className="fas fa-print ms-2"></i></button>
                 <a href={getWhatsAppLink((statementPerson as any).phone_number || (statementPerson as any).phone)} className="btn btn-success rounded-pill px-5 shadow-lg d-flex align-items-center transition-all hover-scale"><i className="fab fa-whatsapp fa-lg"></i></a>
               </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .sidebar { width: 260px; height: 100vh; position: fixed; right: 0; top: 0; background: #0f172a; z-index: 1100; transition: 0.3s; transform: translateX(0); }
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1050; }
        .sidebar-overlay.show { display: block; }
        .main-content { margin-right: 260px; min-height: 100vh; background: #f8fafc; transition: 0.3s; width: 100%; }
        @media (max-width: 991px) { .sidebar { transform: translateX(100%); } .sidebar.show { transform: translateX(0); } .main-content { margin-right: 0 !important; } }
        .nav-link { color: #94a3b8; padding: 12px 18px; border-radius: 10px; margin: 4px 10px; font-weight: 600; display: flex; align-items: center; text-decoration: none; border: none; background: transparent; width: calc(100% - 20px); text-align: right; font-size: 0.9rem; transition: all 0.2s ease; cursor: pointer; }
        .nav-link.active { color: #fff; background: #e31e24 !important; box-shadow: 0 4px 12px rgba(227, 30, 36, 0.3); }
        .card { border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .glass-header { position: sticky; top: 0; z-index: 1000; height: 65px; border-bottom: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px); }
        .loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-custom { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 15px; backdrop-filter: blur(5px); overflow-y: auto; }
        .extra-small { font-size: 0.8rem; }
        .fw-800 { font-weight: 800; }
        .pos-item { cursor: pointer; transition: 0.2s; border: 2px solid transparent; }
        .pos-item:hover { border-color: #e31e24; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .hover-scale:hover { transform: scale(1.02); }
        @media print {
          .sidebar, .glass-header, .btn, .d-print-none, .sidebar-overlay, .nav-link { display: none !important; }
          .modal-custom { position: absolute; background: none; backdrop-filter: none; padding: 0; width: 100%; height: auto; top: 0; left: 0; }
          .modal-custom .card { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; }
          .main-content { margin: 0 !important; background: white !important; }
          .statement-header { border-bottom: 3px solid #000 !important; }
        }
      `}</style>
    </div>
  );
};

export default DynamoGymApp;

// const rootElement = document.getElementById('root');
// if (rootElement) createRoot(rootElement).render(<App />);
